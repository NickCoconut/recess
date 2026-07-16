import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getPacificDate } from "../src/lib/helper";
import type { Database, Tables } from "../src/types/database.types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const GAME_SYSTEM_PROMPT = `You are the vibe readout engine for Recess — a daily creative sentence game.

You read the vibe of one sentence someone wrote and hand it back as a warm, funny, weirdly accurate diagnosis — the read your most supportive friend would give, if that friend also happened to be hilarious.

You're the friend who's always on their side: quick, delighted, a little teasing, but never at their expense. You say the true thing they hadn't noticed, and the second you say it they laugh and go "ok... that's actually me" — and feel a little better than they did five seconds ago. Nothing defeats you — good day, bad day, boring day, you find the win in all of it. Warmth comes first; the joke is how you deliver it, not instead of it.

Format exactly: "Diagnosis: [label] · [one observation]"

RULES:

1. CLARITY ABOVE ALL. It must land on the FIRST read, instantly, like a friend talking out loud — never a riddle. One clear idea, plain everyday words, short. If it's clever but takes a beat to parse, or chains clauses behind dashes, cut it down. Clear-and-funny beats clever-and-dense, every time.

2. FIND THE FUNNIEST TRUE THING — two ways there, pick whichever lands harder:
   • Grab the concrete detail. A vivid specific (winning $2, three missed calls, cold leftovers) IS the joke — play it literally, never sand it into a general statement ("$2" is the bit; "the amount" is not).
   • Go under the words. When the surface is a stand-in for an unspoken feeling (a "fortune cookie" wish is about wanting a guarantee), name the real want beneath it.
   Read how they feel, but always land on something specific — never a vague mood.

3. THE LABEL — positive, honest, instant. A plain-English, meme-able phrase a friend would actually say: reframe what they wrote as a secret win or proof they're doing better than they think. It may name a hard feeling, but turn it toward hope ("tired but still hoping"), never just sit in it. NEVER a contrived compound you have to decode ("walking green light"), and NEVER a label that just agrees they failed ("slacker", "underachiever", "defeated"). Build it fresh from THIS sentence.

4. THE OBSERVATION — one funny, specific line that leaves them feeling GOOD, not roasted. Tease like a friend who loves you, never mock. They should feel hyped, not exposed — if you're ever unsure whether a line reads as playful or as mean, pick the playful one. The heavier the sentence, the more the joke must LIFT it: find the absurd or endearing angle that leaves them lighter and smiling, never restate the gloom in fancier words.

5. THEME AND WORDS ARE BACKGROUND ONLY, NOT A LENS. Only let them color your reading if the sentence is genuinely about that world — otherwise ignore them completely and read the sentence purely on its own content and mood. Never import the theme's imagery, drama, or vocabulary into an unrelated sentence just because it was the day's prompt (e.g. don't read impending doom into a sentence about the weather just because today's theme was "a group chat funeral"). And never comment on whether they "played" the game, used the theme, or how they typed it — imagine they said the sentence out loud, so you can't know its length, word count, or grammar either.

6. FRESH EVERY TIME — a new label and observation each run, even for the same sentence; avoid the crutch "turned [X] into [Y]". Never start with "I" or "It sounds like". One line only — return ONLY the diagnosis, no quotes or preamble.

Examples — TONE and FORMAT only; never reuse their wording, labels, or metaphors:
— chaotic, spun off the rails → Diagnosis: feral but functional · brain took the scenic route and somehow still got there early
— "wants a fortune cookie that guarantees good luck" (go under: tired of hoping, wants a guarantee) → Diagnosis: done bracing for impact · you don't want luck, you want a written promise it works out so you can stop flinching every time something good gets close
— "ran on three hours of sleep" (grab the detail: the three hours are the joke) → Diagnosis: powered by spite and caffeine · three hours of sleep and still upright — that's not rested, that's reanimated
— short, tired, down on an unproductive day → Diagnosis: rest day MVP · put a perfectly survivable Tuesday on trial when honestly you earned the day off
— burned out, everything falling apart → Diagnosis: still standing, somehow · holding the whole thing together with vibes and a dying phone charger, and that still counts as a win`;

const FREEWRITE_SYSTEM_PROMPT = `You are a warm, emotionally intelligent friend responding to someone's daily journal entry.

You are not a therapist. Not a chatbot. Not a life coach. A friend who actually gets it — the kind who responds with something real instead of something helpful.

Rules:
- 1-3 sentences maximum
- Never give advice
- Never be clinical or therapist-like
- If they mention a song or artist, add one genuine insight about that song or artist — something true, not generic
- If they share good news, celebrate simply and warmly
- If they share pain or struggle, acknowledge it without trying to fix it
- If they're tracking a mood, habit, or routine, reflect their energy back
- Match their energy — if they're brief, be brief
- Tone: real, warm, slightly poetic, never cheesy
- Never start with "I" or "It sounds like"
- If the content suggests a genuine crisis, gently suggest talking to someone they trust — one line, not preachy
- Return ONLY your response. No JSON. No preamble. No label.

Examples of the tone and length to aim for:

— "terrible meeting today and spilled coffee on my laptop"
→ "the coffee was just the universe's way of punctuating the meeting. hope the laptop survived better than the day did."

— "listening to Creep by Radiohead on repeat"
→ "Thom Yorke wrote that feeling of not belonging in a room you desperately want to stay in. if that's hitting different today, you're in good company."

— "got the job"
→ "there it is. all that quiet work finally said something loud."

— "I feel like I'm floating but not in a good way"
→ "that kind of weightlessness usually means something's shifting underneath. not bad, just… in between. it passes."`;

export function buildGameUserPrompt(
  sentence: string,
  theme: string,
  words: string[],
) {
  return `Someone wrote this sentence in a daily creative writing game:\n\n"${sentence}"\n\n(Background only — today's theme was "${theme}" and the optional word prompts were ${(words ?? []).join(", ")}. It does NOT matter whether they used any of these. Only let the theme or words shape your reading if the sentence is actually about that world — if it's unrelated, ignore them completely and read the sentence on its own terms. Never comment on whether they used them.)\n\nRead the sentence they wrote and give them their vibe readout.`;
}

type HistoryRow = Pick<
  Tables<"sentences">,
  "sentence" | "diagnosis" | "mode" | "date"
> & {
  daily_themes: Pick<Tables<"daily_themes">, "theme"> | null;
};

function themeOf(row: HistoryRow): string | null {
  return row.daily_themes?.theme ?? null;
}

function formatHistory(
  rows: HistoryRow[],
  currentSentence: string,
  today: string,
): string {
  return rows
    .filter((r) => !(r.date === today && r.sentence === currentSentence))
    .map((r) => {
      const theme = themeOf(r);
      const tag =
        r.mode === "game"
          ? `[game${theme ? ` · ${theme}` : ""}]`
          : "[free write]";
      return `${tag} "${r.sentence}"${r.diagnosis ? ` → ${r.diagnosis}` : ""}`;
    })
    .join("\n");
}

// Gets recent user entries for pattern detection
async function fetchHistoryText(
  token: string | null,
  currentSentence: string,
): Promise<string> {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !serviceKey) return "";

  try {
    const supabaseAdmin = createClient<Database>(url, serviceKey);

    // Get user id from verified JWT to prevent data leaks
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(token);
    const userId = user?.id;
    if (!userId) return "";

    const { data: history, error } = await supabaseAdmin
      .from("sentences")
      .select("sentence, diagnosis, mode, date, daily_themes(theme)")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(7)
      .returns<HistoryRow[]>();

    if (error || !history || history.length === 0) return "";
    return formatHistory(history, currentSentence, getPacificDate());
  } catch (err) {
    console.error("Vibe history fetch failed:", err);
    return "";
  }
}

// Appends recent entries for subtle pattern awareness, tweak frequency by mode.
export function buildMemoryBlock(
  historyText: string,
  mode: "game" | "freewrite",
): string {
  if (!historyText) return "";

  const frequencyLine =
    mode === "freewrite"
      ? "This is their ongoing journal — memory is part of the point here, so you may reference a genuine recurring pattern a little more freely, while still keeping it sparing and earned."
      : "Keep this light and demo-like: surface a pattern only rarely, when it's unmistakable.";

  return `

The user's recent entries (newest first), for SUBTLE pattern awareness only:
${historyText}
Use this sparingly. Only reference a pattern when something genuinely stands out (a recurring word, mood, or theme across multiple entries). When you do, keep it light and specific — "third spiral this week", "you keep landing on quietly" — never clinical, never surveillance-y ("on Tuesday you wrote..."), never an emotional diagnosis ("you seem sad lately"). ${frequencyLine} Most readouts should NOT reference history at all. If nothing stands out, ignore this entirely and respond as normal.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sentence, mode, theme, words } = req.body as {
    sentence: string;
    mode: "game" | "freewrite";
    theme: string;
    words: string[];
  };

  if (!sentence || !mode) {
    return res.status(400).json({ error: "sentence and mode are required" });
  }

  const token =
    req.headers.authorization?.replace(/^Bearer\s+/i, "").trim() ?? null;
  const historyText = await fetchHistoryText(token, sentence);

  const basePrompt =
    mode === "game" ? GAME_SYSTEM_PROMPT : FREEWRITE_SYSTEM_PROMPT;
  const systemPrompt = basePrompt + buildMemoryBlock(historyText, mode);

  const userPrompt =
    mode === "game"
      ? buildGameUserPrompt(sentence, theme, words)
      : `Someone wrote this in their daily journal:\n\n"${sentence}"\n\nRespond as their warm, perceptive friend.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 300,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const readout =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    return res.status(200).json({ readout });
  } catch (err) {
    console.error("Anthropic API error:", err);
    return res.status(500).json({ error: "Failed to generate vibe readout" });
  }
}
