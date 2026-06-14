import { Heart } from "lucide-react";
import { useState } from "react";

import type { FeedItem } from "../../lib/dummyFeed";

interface FeedTabProps {
  items: FeedItem[];
}

interface FeedRowProps {
  item: FeedItem;
}

function FeedRow({ item }: FeedRowProps) {
  // Optimistic local like state — toggles in-component only for now.
  // TODO: replace with Supabase — persist like toggle + count server-side.
  const [liked, setLiked] = useState(item.likedByMe);
  const [likes, setLikes] = useState(item.likes);

  const toggleLike = () => {
    setLikes((n) => (liked ? n - 1 : n + 1));
    setLiked((prev) => !prev);
  };

  const ambient = item.isMine
    ? item.time
    : `${item.location} · ${item.weather} · ${item.time}`;

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
        <p className="font-mono text-[12px] text-white/35">{ambient}</p>
      </div>

      <button
        type="button"
        onClick={toggleLike}
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

export function FeedTab({ items }: FeedTabProps) {
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
        {items.map((item) => (
          <FeedRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
