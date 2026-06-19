import { getPacificDate } from "./date";
import { supabase } from "./supabase";
import type { Mode } from "../types/types";

export interface InsertSentenceParams {
  sentence: string;
  mode: Mode;
  themeId: string | null;
  weather: string | null;
  location: string | null;
  isPublic: boolean;
  userId: string;
}

export interface InsertSentenceResult {
  id: string | null;
  // Postgres SQLSTATE when the insert failed, e.g. "23503" (foreign-key
  // violation) when the JWT's user no longer exists. Lets callers recover.
  errorCode?: string;
}

/**
 * Inserts one row into `sentences` and returns its id.
 */
export async function insertSentence(
  params: InsertSentenceParams,
): Promise<InsertSentenceResult> {
  const { sentence, mode, themeId, weather, location, isPublic, userId } =
    params;
  const { data, error } = await supabase
    .from("sentences")
    .insert({
      sentence,
      mode,
      date: getPacificDate(),
      theme_id: themeId,
      weather,
      location,
      is_public: isPublic,
      saved_to_profile: false,
      diagnosis: null,
      user_id: userId,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    console.error("Failed to insert sentence:", error);
    return { id: null, errorCode: error?.code };
  }
  return { id: data.id };
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
