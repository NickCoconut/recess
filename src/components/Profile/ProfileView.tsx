import { ChevronLeft, ChevronRight, Flame, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { getPacificDate } from "../../lib/helper";
import {
  fetchMonthSentences,
  fetchStreaks,
  type ProfileSentence,
} from "../../lib/profile";
import { DayCell } from "./DayCell";
import { MONTH_NAMES, MonthYearPicker } from "./MonthYearPicker";
import { SentenceModal } from "./SentenceModal";
import { StreakBadge } from "./StreakBadge";

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

interface ProfileViewProps {
  overlayOpacity: number;
  userId: string | null;
  onClose: () => void;
}

export default function ProfileView({
  overlayOpacity,
  userId,
  onClose,
}: ProfileViewProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [sentences, setSentences] = useState<ProfileSentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaks, setStreaks] = useState({ current: 0, best: 0 });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeIndices, setActiveIndices] = useState<Record<string, number>>(
    {},
  );
  const [viewingDate, setViewingDate] = useState<string | null>(null);

  const pickerRef = useRef<HTMLDivElement>(null);

  const minYear = now.getFullYear() - 3;
  const maxYear = now.getFullYear();
  const todayKey = getPacificDate();

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchMonthSentences(userId, viewYear, viewMonth).then((data) => {
      if (cancelled) return;
      setSentences(data);
      setActiveIndices({});
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, viewYear, viewMonth]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchStreaks(userId).then((s) => {
      if (!cancelled) setStreaks(s);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!pickerOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);

  const byDate = useMemo(() => {
    const map = new Map<string, ProfileSentence[]>();
    for (const s of sentences) {
      const arr = map.get(s.date) ?? [];
      arr.push(s);
      map.set(s.date, arr);
    }
    return map;
  }, [sentences]);

  const goToMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setLoading(true);
    setViewYear(y);
    setViewMonth(m);
  };

  const handlePickerSelect = (year: number, month: number) => {
    setLoading(true);
    setViewYear(year);
    setViewMonth(month);
    setPickerOpen(false);
  };

  const navigateDay = (dateKey: string, count: number, direction: 1 | -1) => {
    setActiveIndices((prev) => {
      const current = prev[dateKey] ?? 0;
      const next = (current + direction + count) % count;
      return { ...prev, [dateKey]: next };
    });
  };

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      <div
        className="pointer-events-none flex min-h-screen items-center justify-center p-4"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div className="pointer-events-auto flex w-full max-w-[1400px] flex-col gap-4">
          <div
            className="flex w-full flex-col gap-5"
            style={{
              position: "relative",
              zIndex: 10,
              maxHeight: "92vh",
              overflowY: "auto",
              background: `rgba(0,0,0,${overlayOpacity})`,
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "16px",
              padding: "1.75rem",
            }}
          >
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex gap-2">
                <StreakBadge
                  icon={Flame}
                  iconClassName="text-orange-400"
                  label="Current Streak"
                  value={streaks.current}
                />
                <StreakBadge
                  icon={Trophy}
                  iconClassName="text-amber-300"
                  label="Best Streak"
                  value={streaks.best}
                />
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => goToMonth(-1)}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeft size={28} />
                </button>

                <div ref={pickerRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setPickerOpen((o) => !o)}
                    className="cursor-pointer font-heading text-5xl font-semibold tracking-[0.08em] text-white uppercase transition-colors duration-200 hover:text-white/80"
                  >
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </button>
                  {pickerOpen && (
                    <MonthYearPicker
                      year={viewYear}
                      month={viewMonth}
                      minYear={minYear}
                      maxYear={maxYear}
                      onSelect={handlePickerSelect}
                    />
                  )}
                </div>

                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => goToMonth(1)}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                >
                  <ChevronRight size={28} />
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close profile"
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/85 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {WEEKDAY_LABELS.map((label) => (
                <p
                  key={label}
                  className="text-center font-mono text-[13px] tracking-wide text-white/45"
                >
                  {label}
                </p>
              ))}
            </div>

            <div
              className={`grid grid-cols-7 gap-2 ${loading ? "opacity-50" : ""}`}
            >
              {cells.map((day, i) => {
                if (day === null) return <div key={`blank-${i}`} />;
                const dateKey = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
                const daySentences = byDate.get(dateKey) ?? [];
                const activeIndex = activeIndices[dateKey] ?? 0;
                return (
                  <DayCell
                    key={dateKey}
                    day={day}
                    isToday={dateKey === todayKey}
                    sentences={daySentences}
                    activeIndex={activeIndex}
                    onNavigate={(direction) =>
                      navigateDay(dateKey, daySentences.length, direction)
                    }
                    onOpenDay={() => setViewingDate(dateKey)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {viewingDate &&
        (() => {
          const daySentences = byDate.get(viewingDate) ?? [];
          if (daySentences.length === 0) return null;
          return (
            <SentenceModal
              key={viewingDate}
              sentences={daySentences}
              initialIndex={activeIndices[viewingDate] ?? 0}
              onIndexChange={(index) =>
                setActiveIndices((prev) => ({ ...prev, [viewingDate]: index }))
              }
              onClose={() => setViewingDate(null)}
            />
          );
        })()}
    </>
  );
}
