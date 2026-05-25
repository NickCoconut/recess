export type ThemeData = {
  theme: string
  words: [string, string, string]
}

export type VibeData = {
  readout: string
}

// Vibe readout will be implemented later
export async function fetchVibeReadout(
  sentence: string,
  words: string[],
  theme: string,
  mode: 'game' | 'freewrite'
): Promise<VibeData> {
  const response = await fetch('/api/anthropic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'generate_vibe',
      sentence,
      words,
      theme,
      mode
    })
  })

  if (!response.ok) {
    throw new Error('Failed to generate vibe readout')
  }

  return response.json()
}
