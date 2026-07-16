export interface ParsedDiagnosis {
  label: string;
  observation: string;
}

export function getPacificDate(): string {
  // Returns current date in Pacific Time as YYYY-MM-DD (e.g., "2024-05-09")
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
}

/** Expects "Diagnosis: label · observation" — the game-mode readout format. */
export function parseDiagnosis(readout: string): ParsedDiagnosis | null {
  const match = readout.match(/^Diagnosis:\s*(.+?)\s*[·•]\s*(.+)$/i);
  if (!match) return null;
  return { label: match[1].trim(), observation: match[2].trim() };
}
