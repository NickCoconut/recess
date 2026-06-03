export function getPacificDate(): string {
  // Returns current date in Pacific Time as YYYY-MM-DD (e.g., "2024-05-09")
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
}
