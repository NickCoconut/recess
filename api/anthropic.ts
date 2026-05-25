import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { action } = req.body;

  if (!action) {
    return res.status(400).json({
      error: "action is required",
    });
  }

  // Vibe readout will be implemented in next layer
  if (action === "generate_vibe") {
    return res.status(501).json({
      error: "Not implemented yet",
    });
  }

  return res.status(400).json({ error: "Unknown action" });
}
