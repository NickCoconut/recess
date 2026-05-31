import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Verify this is a legitimate Vercel cron invocation
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Gets current date in Pacific Time as YYYY-MM-DD (e.g., "2024-05-09")
    const pacificDateStr = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Los_Angeles",
    });

    // Skip Anthropic call if today already exists
    const { data: existing } = await supabaseAdmin
      .from("daily_themes")
      .select("id")
      .eq("date", pacificDateStr)
      .single();

    if (existing) {
      console.log(`Theme already exists for ${pacificDateStr}`);
      return res.status(200).json({
        status: "skipped",
        reason: "theme already exists for today",
        date: pacificDateStr,
      });
    }

    // Generate theme with Anthropic
    console.log(`Generating theme for ${pacificDateStr}...`);
    const generated = await generateThemeFromAI(pacificDateStr);

    // Insert into Supabase
    const { error: insertError } = await supabaseAdmin
      .from("daily_themes")
      .insert({
        date: pacificDateStr,
        theme: generated.theme,
        words: generated.words,
      });

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return res.status(500).json({
        error: "Failed to save theme",
        detail: insertError.message,
      });
    }

    console.log(`Theme generated and saved: "${generated.theme}"`);
    return res.status(200).json({
      status: "success",
      date: pacificDateStr,
      theme: generated.theme,
      words: generated.words,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return res.status(500).json({ error: "Cron job failed" });
  }
}

async function generateThemeFromAI(date: string) {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: `You generate daily themes and word sets for a 
creative game called Recess.

WHAT RECESS IS:
A daily creative game where users write one sentence using 
3 given words. The product tone is "chaotic with a poetic 
aftertaste." The emotional payoff for the user is 
"I said something weirdly good."

WHO THE USERS ARE:
Native English speakers. Culturally fluent. They appreciate
sarcasm, irony, dry humor, and unexpected wisdom. They watch
movies, use social media, have jobs, pay rent, own pets, 
lose sleep, and feel things they can't always name.

YOUR OUTPUT:
Return ONLY raw valid JSON. 
No explanation. No preamble. No markdown. No backticks.
Exactly this shape:
{
  "theme": "inbox anxiety",
  "words": ["deadline", "questionable", "eventually"]
}`,

    messages: [
      {
        role: "user",
        content: `Generate today's theme and word set. Date: ${date}

━━━ THEME RULES ━━━

A Recess theme is a named feeling without a word for it.
Like a living dictionary entry. Like an Urban Dictionary 
title that actually nails it.

When someone reads it they should immediately think:
→ "oh god yes, exactly that"
→ "I have FEELINGS about this"
→ "I've never seen this named but it's real"
→ "I could write something funny OR something real about this"

The theme names a place and lets the user arrive there 
themselves. It is never an instruction. Never a question.
Never a debate. Just a feeling with a label.

FORMAT — strictly enforced:
- 2 to 5 words maximum
- 3 words is the sweet spot
- Noun or noun phrase only — no verbs
- A label, not a sentence
- Works as: a chapter title, an album name, 
  a group chat name, an Urban Dictionary entry
- Instantly understood — no explanation needed

TONE:
Warm, witty, self-aware, sometimes dry.
Never preachy. Never heavy-handed. Never trying too hard.
The emotional register: not quite comedy but funny,
not quite poetry but poetic, not quite therapy but real.

CONCRETE, NOT PRECIOUS — important:
The poetic aftertaste comes from naming something REAL,
not from sounding deep. Reach for the specific, recognizable
moment — not the abstract mood word. A stranger should get it
on the first read and think "oh, THAT." If a theme sounds
profound but you can't picture the actual situation, it's too
precious — cut it and name the concrete thing instead.
→ "the 3am spiral" (concrete) not "nocturnal unease" (vague)
→ "comfort rewatch" (concrete) not "the ache of familiarity"

DRAW FROM ANYWHERE — no category limits:
daily rituals and routines, work and career, meetings,
deadlines, job hunting, hustle culture, money, budgeting,
rent and housing prices, financial anxiety, technology,
AI and algorithms, screen time, doomscrolling, 
social media behavior, relationships, friendship, dating,
family dynamics, food and eating, cooking wins and fails,
coffee culture, comfort food, travel, airports, road trips,
hometowns, pets and animals, health, sleep deprivation,
the gym, aging, nostalgia, memory, pop culture, movies,
music, sports moments, viral trends, books, wisdom,
business, small wins, embarrassing moments, internet 
culture, things everyone does but nobody admits,
that specific modern anxiety everyone shares.

HARD RULE — immediately discard any theme that:
× Is politically charged or makes people pick a side
× Targets any group by race, gender, religion, nationality
× Feels like a debate or controversy
× Could make someone feel judged, targeted, or excluded
× Involves illegal or harmful activity
× Divides people into camps

If reasonable people would argue opposite sides of the 
theme itself — it is disqualified. Cut it. Try again.

GOOD THEME EXAMPLES:
"inbox anxiety"
"the 3am spiral"
"accidental wisdom"
"Sunday night dread"
"comfort rewatch"
"parallel parking confidence"
"the landlord era"
"gym membership guilt"
"algorithmic recommendations"
"the 2am clarity"
"coffee shop productivity"
"autocorrect betrayal"
"the group chat silence"
"situational awareness"
"the almost moment"

BAD THEME EXAMPLES — never generate these:
"the immigration crisis" ← political
"why nobody can afford homes anymore" ← sentence + blame
"things the government ruined" ← political + divisive
"stress" ← too vague, one word
"the weight of unspoken things" ← abstract, precious, can't picture it
"ambient melancholy" ← mood word, sounds deep but says nothing
"that feeling when Sunday night comes
and Monday is already there" ← sentence, too long

━━━ WORD RULES ━━━

Generate exactly 3 words in this exact order.
Single words only. No phrases. No hyphenated words.

The 3 words must work as a set — not independently.
Together they should make a user think:
"I could write something funny with these"
AND "I could write something real with these"

VARIETY — IMPORTANT:
The reference lists and the example JSON are inspiration 
ONLY — do NOT default to them. In particular, avoid 
reaching for the obvious go-to words (especially "anyway", 
which is overused). Pick fresh, less predictable words each 
time so that daily sets feel different from one another. If 
a word feels like the safe/default choice, choose a more 
surprising one instead.

WORD 1 — GROUNDED:
Concrete word with cultural weight or everyday reality.
Anchors the sentence in something recognizable.
Not generic — pick words with personality and specificity.
The word should belong to the theme's world.

Strong grounded words for reference:
deadline, landlord, algorithm, receipt, voicemail,
commute, spreadsheet, inbox, swipe, budget, leftovers,
WiFi, lease, résumé, checkout, gym, sunrise, password,
notification, calendar, timeline, upgrade, download,
subscription, deposit, meeting, coffee, paycheck, 
traffic, waiting room, group chat, highlight reel

WORD 2 — TWISTED:
An ADJECTIVE that creates unexpected humor, irony, or a 
sharp perspective shift. Makes the sentence go sideways in 
the best way. Native English speakers recognize this as 
sarcastic, self-aware, or surprisingly accurate.
Adds the "wait, that's exactly right" reaction.
Must be an adjective — a describing word, not an adverb 
(no -ly words) and not a noun.

Strong twisted adjectives for reference:
suspicious, aggressive, theoretical, questionable,
professional, ironic, accidental, reluctant, dramatic,
casual, oblivious, smug, feral, ominous, wholesome,
chaotic, petty, delusional, unhinged, mild, optimistic,
sentimental, defensive, ambitious, unbothered

WORD 3 — RESONANT:
Lands with emotional weight, poetic quality, or 
unexpected depth. The aftertaste word. Makes the 
sentence feel like it means more than it says.
Lingers after the sentence ends.

Strong resonant words for reference:
eventually, almost, barely, finally, quietly, still, yet,
suddenly, again, always, never, together, apart, here,
honestly, simply, gently, deeply, softly, briefly, slowly,
clearly, once, twice, lately, recently, somehow, somewhere,
everything, nothing, anyway

CRITICAL — the 3 words cannot all pull 
in the same direction:
× All funny = no depth
× All poetic = no wit
× All serious = no play
✓ The tension between GROUNDED + TWISTED + RESONANT 
  is what creates the "weirdly good" sentence outcome

Return ONLY the JSON. Nothing else.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const clean = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const parsed = JSON.parse(clean);

  if (
    typeof parsed.theme !== "string" ||
    !Array.isArray(parsed.words) ||
    parsed.words.length !== 3 ||
    parsed.words.some((w: unknown) => typeof w !== "string")
  ) {
    throw new Error("Invalid theme and words response shape from AI");
  }

  return {
    theme: parsed.theme as string,
    words: parsed.words as [string, string, string],
  };
}
