import { getPacificDate } from "./helper";
import { supabase } from "./supabase";
import type { Mode } from "../types/types";

export interface ProfileSentence {
  id: string;
  sentence: string;
  mode: Mode;
  date: string; // YYYY-MM-DD
  diagnosis: string | null;
  createdAt: string;
}

type SentenceRow = Omit<ProfileSentence, "createdAt"> & {
  created_at: ProfileSentence["createdAt"];
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Fetches the user's saved-to-profile sentences for a given calendar month.
 * `month` is 0-indexed (0 = January), matching Date's convention.
 */
export async function fetchMonthSentences(
  userId: string,
  year: number,
  month: number,
): Promise<ProfileSentence[]> {
  const start = `${year}-${pad(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${pad(month + 1)}-${pad(lastDay)}`;

  const { data, error } = await supabase
    .from("sentences")
    .select("id, sentence, mode, date, diagnosis, created_at")
    .eq("user_id", userId)
    .eq("saved_to_profile", true)
    .gte("date", start)
    .lte("date", end)
    .order("created_at", { ascending: true })
    .returns<SentenceRow[]>();

  if (error || !data) {
    if (error) console.error("Failed to load profile sentences:", error);
    return [];
  }

  return data.map((r) => ({
    id: r.id,
    sentence: r.sentence,
    mode: r.mode,
    date: r.date,
    diagnosis: r.diagnosis,
    createdAt: r.created_at,
  }));
}

// Converts "YYYY-MM-DD" to a UTC day index.
function dayIndex(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
}

export function computeStreaks(
  dateKeys: string[],
  todayKey: string,
): { current: number; best: number } {
  const days = Array.from(new Set(dateKeys))
    .map(dayIndex)
    .sort((a, b) => a - b);

  if (days.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] === days[i - 1] + 1 ? run + 1 : 1;
    if (run > best) best = run;
  }

  const daySet = new Set(days);
  const today = dayIndex(todayKey);
  // A streak is still "alive" if the user played yesterday but hasn't
  // played yet today.
  let cursor = daySet.has(today) ? today : today - 1;
  let current = 0;
  while (daySet.has(cursor)) {
    current++;
    cursor--;
  }

  return { current, best };
}

/** Fetches every saved date for the user and derives current/best streaks. */
export async function fetchStreaks(
  userId: string,
): Promise<{ current: number; best: number }> {
  const { data, error } = await supabase
    .from("sentences")
    .select("date")
    .eq("user_id", userId)
    .eq("saved_to_profile", true)
    .returns<{ date: string }[]>();

  if (error || !data) {
    if (error) console.error("Failed to load streak data:", error);
    return { current: 0, best: 0 };
  }

  return computeStreaks(
    data.map((r) => r.date),
    getPacificDate(),
  );
}
