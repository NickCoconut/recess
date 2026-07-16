import { ChevronLeft, ChevronRight } from "lucide-react";

import type { ProfileSentence } from "../../lib/profile";
import { Tooltip } from "../common/Tooltip";

const MAX_DOTS = 6;

interface DayCellProps {
  day: number;
  isToday: boolean;
  sentences: ProfileSentence[];
  activeIndex: number;
  onNavigate: (direction: 1 | -1) => void;
  onOpenDay: () => void;
}

export function DayCell({
  day,
  isToday,
  sentences,
  activeIndex,
  onNavigate,
  onOpenDay,
}: DayCellProps) {
  const hasEntries = sentences.length > 0;
  const active = sentences[activeIndex];
  const shownDots = sentences.slice(0, MAX_DOTS);
  const overflowCount = sentences.length - shownDots.length;

  return (
    <div
      className="flex flex-col"
      style={{
        minHeight: "128px",
        background: isToday
          ? "rgba(255,255,255,0.08)"
          : "rgba(255,255,255,0.03)",
        border: isToday
          ? "1px solid rgba(255,255,255,0.28)"
          : "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        padding: "0.5rem",
      }}
    >
      <span
        className={`font-mono text-xs ${isToday ? "font-semibold text-white" : "text-white/45"}`}
      >
        {day}
      </span>

      {hasEntries ? (
        <>
          <Tooltip
            content={active.sentence}
            className="flex-1 overflow-hidden"
            style={{ marginTop: "0.6rem" }}
          >
            <p
              onClick={onOpenDay}
              className="h-full cursor-pointer text-[15px] leading-snug text-white/80 transition-colors duration-150 hover:text-white"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                paddingLeft: "0.85rem",
              }}
            >
              {active.sentence}
            </p>
          </Tooltip>

          <div
            className="flex items-center justify-between gap-1"
            style={{ marginTop: "0.6rem" }}
          >
            <button
              type="button"
              aria-label="Previous sentence"
              disabled={sentences.length < 2}
              onClick={() => onNavigate(-1)}
              className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-150 ${
                sentences.length < 2
                  ? "cursor-not-allowed text-white/15"
                  : "cursor-pointer text-white/50 hover:text-white"
              }`}
            >
              <ChevronLeft size={15} />
            </button>

            <div className="flex items-center gap-1">
              {shownDots.map((s, i) => (
                <span
                  key={s.id}
                  className="rounded-full"
                  style={{
                    width: 5,
                    height: 5,
                    background:
                      i === activeIndex
                        ? "rgba(255,255,255,0.95)"
                        : "rgba(255,255,255,0.3)",
                  }}
                />
              ))}
              {overflowCount > 0 && (
                <span className="text-[10px] leading-none text-white/50">
                  +{overflowCount}
                </span>
              )}
            </div>

            <button
              type="button"
              aria-label="Next sentence"
              disabled={sentences.length < 2}
              onClick={() => onNavigate(1)}
              className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-150 ${
                sentences.length < 2
                  ? "cursor-not-allowed text-white/15"
                  : "cursor-pointer text-white/50 hover:text-white"
              }`}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
