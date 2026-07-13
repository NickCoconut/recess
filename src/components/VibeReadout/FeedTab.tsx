import { Check, Funnel, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  sentenceId?: string | null;
  onPlayedToday?: (count: number) => void;
}

interface FeedRowProps {
  item: FeedItem;
  sentenceId?: string | null;
}

function FeedRow({ item, sentenceId }: FeedRowProps) {
  const { requireAuth, ensureSession } = useAuth();

  const [liked, setLiked] = useState(item.likedByMe);
  const [likes, setLikes] = useState(item.likes);

  const performLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((n) => (nextLiked ? n + 1 : n - 1));

    // Get current session user id at click time
    const currentUserId = await ensureSession();
    const ok = nextLiked
      ? await likeSentence(item.id, currentUserId)
      : await unlikeSentence(item.id, currentUserId);

    if (!ok) {
      setLiked(!nextLiked);
      setLikes((n) => (nextLiked ? n - 1 : n + 1));
    }
  };

  const handleLike = () => {
    void requireAuth(
      "like",
      () => {
        void performLike();
      },
      sentenceId,
    );
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

type SortBy = "recent" | "liked";

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: "recent", label: "Recent" },
  { key: "liked", label: "Most liked" },
];

export function FeedTab({ mine, sentenceId, onPlayedToday }: FeedTabProps) {
  const { userId } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [playedToday, setPlayedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target as Node)
      ) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sortMenuOpen]);

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      const res = await fetchTodayFeed(userId);
      if (cancelled) return;
      setItems(res.items);
      setPlayedToday(res.playedToday);
      setLoading(false);
    }

    void loadFeed();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // `items` arrives ordered most-recent-first from the query; only "liked"
  // needs a client-side re-sort.
  const sorted =
    sortBy === "liked" ? [...items].sort((a, b) => b.likes - a.likes) : items;

  // Show user's entry at the top, real if present, else optimistic placeholder.
  let display = sorted;
  if (mine) {
    const realRow = mine.id ? sorted.find((it) => it.id === mine.id) : null;
    const rest = realRow ? sorted.filter((it) => it.id !== mine.id) : sorted;
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

  const displayedPlayedToday = playedToday + (mine && !mine.id ? 1 : 0);

  useEffect(() => {
    onPlayedToday?.(displayedPlayedToday);
  }, [displayedPlayedToday, onPlayedToday]);

  return (
    <div className="flex flex-col gap-3">
      <div ref={sortMenuRef} className="relative self-end">
        <button
          type="button"
          aria-label="Sort feed"
          aria-expanded={sortMenuOpen}
          onClick={() => setSortMenuOpen((open) => !open)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-white"
        >
          <Funnel size={18} />
        </button>

        {sortMenuOpen && (
          <div
            className="absolute top-9 left-0 z-10 flex w-40 origin-top-left flex-col overflow-hidden"
            style={{
              background: "rgba(15,15,20,0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
            }}
          >
            {SORT_OPTIONS.map(({ key, label }) => {
              const active = sortBy === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSortBy(key);
                    setSortMenuOpen(false);
                  }}
                  className={`flex cursor-pointer items-center justify-between gap-2 text-sm transition-colors duration-150 hover:bg-white/10 ${
                    active ? "text-white" : "text-white/65"
                  }`}
                  style={{ padding: "0.6rem 0.85rem" }}
                >
                  {label}
                  {active && <Check size={14} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

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
          display.map((item) => (
            <FeedRow key={item.id} item={item} sentenceId={sentenceId} />
          ))
        )}
      </div>
    </div>
  );
}
