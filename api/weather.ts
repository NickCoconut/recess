import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      error: "lat and lon are required",
    });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENWEATHER_API_KEY not configured",
    });
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather` +
        `?lat=${lat}&lon=${lon}` +
        `&appid=${apiKey}` +
        `&units=metric`,
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: "OpenWeatherMap request failed",
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Weather proxy error:", error);
    return res.status(500).json({
      error: "Weather service unavailable",
    });
  }
}
