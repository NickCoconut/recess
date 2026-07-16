import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import type { Database } from "../../src/types/database.types";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseAdmin = createClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Verify this is a legitimate Vercel cron invocation.
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  try {
    // Existing DB function that purges stale anonymous data.
    const { error } = await supabaseAdmin.rpc("cleanup_anonymous_data");

    if (error) {
      console.error("cleanup_anonymous_data error:", error);
      return res.status(500).json({ status: "error", message: error.message });
    }

    console.log("Anonymous data cleanup completed");
    return res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Cleanup cron error:", error);
    const message =
      error instanceof Error ? error.message : "Cleanup cron failed";
    return res.status(500).json({ status: "error", message });
  }
}
