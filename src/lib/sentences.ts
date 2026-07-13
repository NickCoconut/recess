import { supabase } from "./supabase";
import type { Mode } from "../types/types";

export interface InsertSentenceParams {
  sentence: string;
  mode: Mode;
  themeId: string | null;
  weather: string | null;
  location: string | null;
  isPublic: boolean;
}

export interface InsertSentenceResult {
  id: string | null;
  // Postgres SQLSTATE when the insert failed, e.g. "23503" (foreign-key
  // violation) when the JWT's user no longer exists. Lets callers recover.
  errorCode?: string;
  // True when the server's content moderation check forced is_public to
  // false regardless of what the caller requested.
  flagged?: boolean;
}

/**
 * Sends the sentence to /api/sentences, which moderates it server-side and
 * inserts the row (forcing is_public: false if flagged) before returning its
 * id. The insert can't happen directly from the client because moderation
 * must not be something a client can just skip.
 */
export async function insertSentence(
  params: InsertSentenceParams,
): Promise<InsertSentenceResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    console.error("Failed to insert sentence: no active session");
    return { id: null };
  }

  const response = await fetch("/api/sentences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    console.error("Failed to insert sentence:", response.status);
    return { id: null };
  }

  return (await response.json()) as InsertSentenceResult;
}

export async function saveSentenceToProfile(
  id: string,
  diagnosis: string | null,
): Promise<boolean> {
  const { error } = await supabase
    .from("sentences")
    .update({ saved_to_profile: true, diagnosis })
    .eq("id", id);

  if (error) {
    console.error("Failed to save sentence to profile:", error);
    return false;
  }
  return true;
}
