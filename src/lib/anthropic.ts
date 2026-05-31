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
  const response = await fetch("/api/vibe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sentence, mode, theme, words }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate vibe readout");
  }

  return response.json() as Promise<VibeData>;
}
