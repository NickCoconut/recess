import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "../../hooks/useAuth";
import {
  fetchTodayFeed,
  likeSentence,
  unlikeSentence,
  type FeedItem,
} from "../../lib/feed";

const AMBIENT_FALLBACK = "Somewhere · Unknown skies";

const clean = (v?: string | null) => v?.trim() || "";
const capitalize = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : "");
const formatAmbientLine = (loc?: string | null, wx?: string | null) => {
  const l = clean(loc),
    w = clean(wx);
  if (l && w) return `${l} · ${capitalize(w)}`;
  return l || (w && capitalize(w)) || AMBIENT_FALLBACK;
};

interface MySubmission {
  id: string | null;
  sentence: string;
}

interface FeedTabProps {
  mine?: MySubmission | null;
  onPlayedToday?: (count: number) => void;
}

interface FeedRowProps {
  item: FeedItem;
}

function FeedRow({ item }: FeedRowProps) {
  const { userId, requireAuth } = useAuth();

  const [liked, setLiked] = useState(item.likedByMe);
  const [likes, setLikes] = useState(item.likes);

  const handleLike = async () => {
    const authed = await requireAuth("like");
    if (!authed) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((n) => (nextLiked ? n + 1 : n - 1));

    const ok = nextLiked
      ? await likeSentence(item.id, userId!)
      : await unlikeSentence(item.id, userId!);

    if (!ok) {
      setLiked(!nextLiked);
      setLikes((n) => (nextLiked ? n - 1 : n + 1));
    }
  };

  const ambient = item.isMine
    ? item.time
    : `${formatAmbientLine(item.location, item.weather)} · ${item.time}`;

  return (
    <div
      className="flex items-start gap-3"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        padding: "0.35rem 0.55rem",
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          {item.isMine && (
            <span className="shrink-0 rounded-full bg-amber-300/15 px-1.5 py-0.5 font-mono text-[12px] tracking-[0.12em] text-amber-200 uppercase">
              you
            </span>
          )}
          <p className="min-w-0 text-[16px] leading-snug text-white">
            {item.sentence}
          </p>
        </div>
        {ambient && (
          <p className="font-mono text-[12px] text-white/35">{ambient}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleLike}
        aria-pressed={liked}
        aria-label={liked ? "Unlike" : "Like"}
        className="flex shrink-0 cursor-pointer flex-col items-center gap-0.5 pt-0.5 transition-colors duration-200"
      >
        <Heart
          size={20}
          className={
            liked ? "text-rose-400" : "text-white/40 hover:text-white/70"
          }
          fill={liked ? "currentColor" : "none"}
        />
        <span
          className={`font-mono text-[11px] tabular-nums ${
            liked ? "text-rose-300/90" : "text-white/40"
          }`}
        >
          {likes}
        </span>
      </button>
    </div>
  );
}

export function FeedTab({ mine, onPlayedToday }: FeedTabProps) {
  const { userId } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      const res = await fetchTodayFeed(userId);
      if (cancelled) return;
      setItems(res.items);
      onPlayedToday?.(res.playedToday);
      setLoading(false);
    }

    void loadFeed();
    return () => {
      cancelled = true;
    };
  }, [userId, onPlayedToday]);

  // Show user's entry at the top, real if present, else optimistic placeholder.
  let display = items;
  if (mine) {
    const realRow = mine.id ? items.find((it) => it.id === mine.id) : null;
    const rest = realRow ? items.filter((it) => it.id !== mine.id) : items;
    const topItem: FeedItem = realRow ?? {
      id: mine.id ?? "you",
      sentence: mine.sentence,
      likes: 0,
      likedByMe: false,
      location: null,
      weather: null,
      time: "just now",
      isMine: true,
    };
    display = [topItem, ...rest];
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="overflow-y-auto rounded-xl"
        style={{
          maxHeight: "480px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {loading && display.length === 0 ? (
          <p
            className="text-center font-mono text-sm text-white/40"
            style={{ padding: "2rem 1rem" }}
          >
            Loading today&rsquo;s feed&hellip;
          </p>
        ) : display.length === 0 ? (
          <p
            className="text-center font-mono text-sm text-white/40"
            style={{ padding: "2rem 1rem" }}
          >
            Be the first to share something today
          </p>
        ) : (
          display.map((item) => <FeedRow key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
