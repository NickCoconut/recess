import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const THEME_SYSTEM_PROMPT = `You generate the daily theme and 3-word set for Recess, a game
where someone writes one sentence using the 3 words. The vibe is
funny, sharp, and grounded in everyday life — the payoff is the
user thinking "oh that's SO me." Users are culturally fluent
native English speakers who like dry humor and live normal modern
lives (jobs, dating, rent, pets, exercising, not enough sleep).

Return ONLY raw valid JSON — no preamble, markdown, or backticks.
Exactly this shape:
{
  "theme": "paycheck day",
  "words": ["paycheck", "questionable", "apparently"]
}`;

const THEME_DOMAINS = [
  "work and office life — meetings, performance reviews, one-on-ones, deadlines, hustle culture, Monday motivation",
  "job hunting and career — applications, interviews, recruiter ghosting, impostor syndrome, salary talk",
  "money and budgeting — paycheck day, broke but thriving, tax season, impulse buys, unexpected expenses",
  "dating — date night, first date recap, dating app fatigue, situationships, getting ready",
  "crushes and relationships — mutual crush, good morning text, friend zone, the read receipt",
  "friendship and social life — group chat dynamics, social battery, brunch, flaking, catch-up coffee",
  "phones and tech — low battery panic, doomscrolling, notifications, screen time, the comparison spiral",
  "home and chores — laundry, dishes, deep cleaning, the mess you keep ignoring",
  "food and routines — midnight snack, coffee habit, takeout guilt, cooking wins and fails",
  "pets — cat person vs dog person, the vet bill, pet guilt, the 6am wake-up",
  "health, sleep, and the gym — sleep debt, gym guilt, rest days, the snooze button",
  "small daily wins and lucky moments — unexpected compliment, the right song, free stuff, good news",
  "commuting and travel — traffic, the subway, airports, road trips, the parking hunt",
  "self-awareness and everyday quirks — procrastination, overthinking, little habits nobody admits",
];

export function buildThemeUserPrompt(date: string) {
  const dayNum = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  const domain =
    THEME_DOMAINS[
      ((dayNum % THEME_DOMAINS.length) + THEME_DOMAINS.length) %
        THEME_DOMAINS.length
    ];
  return `Generate today's theme and word set. Date: ${date}

TODAY'S DOMAIN — build the theme from inside this lane, don't stray:
${domain}

━━━ THEME ━━━

One concrete, recognizable slice of everyday life from this domain —
a situation, ritual, or moment people instantly picture and already
have a story about. Plain words a friend would text, never a poet.
Concrete beats clever: name the real moment ("recruiter ghosting"),
never the mood or the metaphor ("the silence of waiting").

FORMAT:
- 2 to 5 words (3 is the sweet spot)
- A noun or noun phrase — a label, not a sentence, no verbs
- Instantly understood, no explanation needed

FRESH: stay in today's domain but invent your own theme. Every
phrase written in this prompt is there to show STYLE only — NEVER
output one of them. Skip the first obvious idea; reach for a
sharper, more specific moment people rarely see named.

SAFE: never anything illegal, political, divisive, or that targets a group
or could make someone feel judged. If reasonable people would argue
opposite sides of it, cut it.

Style examples (do NOT reuse — they only show the shape):
date night · recruiter ghosting · low battery panic · first date
recap · broke but thriving · laundry mountain · rest day guilt ·
text from an old friend

Avoid these misses:
"stress" (too vague) · "the unreliable narrator" (literary) ·
"the phantom notification" (abstract) · "ambient melancholy" (mood
word) · "that feeling when Sunday hits and Monday's already there"
(a sentence, too long)

━━━ WORDS ━━━

Exactly 3 single, everyday words, in this order, that work as a SET —
together they should feel both funny AND real to write with. Plain
words people actually use, easy to drop into a sentence.

1. A GROUNDED noun — concrete, with personality, from the theme's
   world (e.g. paycheck, alarm, inbox, crush, takeout, group chat).
2. A TWISTED adjective — a describing word (no -ly adverbs) that adds
   irony or a sharp, self-aware angle (e.g. questionable, feral, smug,
   delusional, unbothered, wholesome).
3. A TURN word — a casual, conversational word that gives a small lift
   or wry button, the kind you'd say out loud, never poetic (e.g.
   barely, lately, again, technically, lowkey, instead).

The three must pull in different directions — not all funny, not all
flat — that tension is what makes the sentence land.

VARIETY: the reference words above are examples, not defaults — reach
past them, and never lean on overused fillers ("anyway", "allegedly",
"eventually", "honestly", "optimistic", "somehow"). Pick a fresh
set each day.

Return ONLY the JSON. Nothing else.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Verify this is a legitimate Vercel cron invocation
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ status: "error", error: "Unauthorized" });
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
    system: THEME_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildThemeUserPrompt(date) }],
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
