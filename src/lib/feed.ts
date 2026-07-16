import { getPacificDate } from "./helper";
import { supabase } from "./supabase";

export interface FeedItem {
  id: string;
  sentence: string;
  likes: number;
  likedByMe: boolean;
  location: string | null;
  weather: string | null;
  time: string; // e.g. "2:14 AM"
  isMine?: boolean;
}

export interface FeedResult {
  items: FeedItem[];
  playedToday: number;
}

function formatTime(iso: string): string {
  // e.g. "2:14 AM"
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function fetchTodayFeed(
  currentUserId: string | null,
): Promise<FeedResult> {
  const today = getPacificDate();

  const { count: playedCount } = await supabase
    .from("sentences")
    .select("*", { count: "exact", head: true })
    .eq("date", today)
    .eq("is_public", true);

  const playedToday = playedCount ?? 0;

  const { data: rows, error } = await supabase
    .from("sentences")
    .select("id, sentence, weather, location, created_at, user_id")
    .eq("date", today)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !rows || rows.length === 0) {
    if (error) console.error("Failed to load feed:", error);
    return { items: [], playedToday };
  }

  const ids = rows.map((r) => r.id);

  const { data: likeRows } = await supabase
    .from("likes")
    .select("sentence_id, user_id")
    .in("sentence_id", ids);

  const likeCounts = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const like of likeRows ?? []) {
    likeCounts.set(
      like.sentence_id,
      (likeCounts.get(like.sentence_id) ?? 0) + 1,
    );
    if (currentUserId && like.user_id === currentUserId) {
      likedByMe.add(like.sentence_id);
    }
  }

  const items: FeedItem[] = rows.map((r) => ({
    id: r.id,
    sentence: r.sentence,
    likes: likeCounts.get(r.id) ?? 0,
    likedByMe: likedByMe.has(r.id),
    location: r.location,
    weather: r.weather,
    time: formatTime(r.created_at),
    isMine: currentUserId ? r.user_id === currentUserId : false,
  }));

  return { items, playedToday };
}

export async function likeSentence(
  sentenceId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("likes")
    .insert({ sentence_id: sentenceId, user_id: userId });

  if (error) {
    // 23505 = unique_violation → already liked, which is fine.
    if (error.code === "23505") return true;
    console.error("Failed to like sentence:", error);
    return false;
  }
  return true;
}

export async function unlikeSentence(
  sentenceId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("sentence_id", sentenceId)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to unlike sentence:", error);
    return false;
  }
  return true;
}
