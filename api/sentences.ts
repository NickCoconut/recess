import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

import { getPacificDate } from "../src/lib/helper";

interface ModerationResult {
  flagged: boolean;
  categories: string[];
}

async function moderate(sentence: string): Promise<ModerationResult> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const result = await openai.moderations.create({
      input: sentence,
    });

    const { flagged, categories } = result.results[0];
    const flaggedCategories = Object.entries(categories)
      .filter(([, isFlagged]) => isFlagged)
      .map(([category]) => category);

    return { flagged, categories: flaggedCategories };
  } catch (err) {
    // Fail safe: never block the write, but don't let an unmoderated
    // sentence go public if we couldn't classify it.
    console.error("Moderation check failed, defaulting to private:", err);
    return { flagged: true, categories: ["moderation_error"] };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token =
    req.headers.authorization?.replace(/^Bearer\s+/i, "").trim() ?? null;
  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Missing Supabase server env vars");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const supabaseAdmin = createClient(url, serviceKey);

  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid session" });
  }

  const { sentence, mode, themeId, weather, location, isPublic } = req.body as {
    sentence: string;
    mode: "game" | "freewrite";
    themeId: string | null;
    weather: string | null;
    location: string | null;
    isPublic: boolean;
  };

  if (!sentence || !mode) {
    return res.status(400).json({ error: "sentence and mode are required" });
  }

  const { flagged, categories } = await moderate(sentence);
  const finalIsPublic = isPublic && !flagged;

  const { data, error } = await supabaseAdmin
    .from("sentences")
    .insert({
      sentence,
      mode,
      date: getPacificDate(),
      theme_id: themeId,
      weather,
      location,
      is_public: finalIsPublic,
      saved_to_profile: false,
      diagnosis: null,
      user_id: user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    console.error("Failed to insert sentence:", error);
    return res.status(200).json({ id: null, errorCode: error?.code });
  }

  if (flagged) {
    console.warn(`Sentence ${data.id} flagged by moderation:`, categories);
  }

  return res.status(200).json({ id: data.id, flagged });
}
