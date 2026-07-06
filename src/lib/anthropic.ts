import { supabase } from "./supabase";

export type ThemeData = {
  theme: string;
  words: [string, string, string];
};

export type VibeData = {
  readout: string;
};

export async function fetchVibeReadout(
  sentence: string,
  mode: "game" | "freewrite",
  theme: string,
  words: string[],
): Promise<VibeData> {
  // Forward the access token so /api/vibe can verify the user and read their
  // own recent entries for subtle pattern awareness. Absent token → the server
  // simply skips memory and returns the stateless readout.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch("/api/vibe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ sentence, mode, theme, words }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate vibe readout");
  }

  return response.json() as Promise<VibeData>;
}
