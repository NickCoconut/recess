import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

import { parseDiagnosis } from "../../lib/helper";
import type { ProfileSentence } from "../../lib/profile";

interface SentenceModalProps {
  sentences: ProfileSentence[];
  initialIndex: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

const MAX_DOTS = 10;

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function SentenceModal({
  sentences,
  initialIndex,
  onClose,
  onIndexChange,
}: SentenceModalProps) {
  const [index, setIndex] = useState(initialIndex);
  const [diagnosisOpen, setDiagnosisOpen] = useState(false);
  const active = sentences[index];

  if (!active) return null;

  const navigate = (direction: 1 | -1) => {
    const next = (index + direction + sentences.length) % sentences.length;
    setIndex(next);
    setDiagnosisOpen(false);
    onIndexChange?.(next);
  };

  const shownDots = sentences.slice(0, MAX_DOTS);
  const overflowCount = sentences.length - shownDots.length;

  const parsed =
    active.mode === "game" && active.diagnosis
      ? parseDiagnosis(active.diagnosis)
      : null;
  const diagnosisLabel = active.mode === "game" ? "Diagnosis" : "Reply";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full flex-col gap-6"
        style={{
          width: "640px",
          height: "520px",
          maxWidth: "100%",
          maxHeight: "85vh",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "16px",
          padding: "2.25rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 cursor-pointer text-white/40 transition-colors duration-200 hover:text-white/70"
        >
          <X size={22} strokeWidth={2.5} />
        </button>

        <p className="text-center font-mono text-sm tracking-[0.2em] text-white/40 uppercase">
          {formatDateLabel(active.date)}
        </p>

        <p
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto text-center font-heading text-3xl leading-relaxed font-light text-white"
          style={{
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {active.sentence}
        </p>

        {active.diagnosis && (
          <div
            className="shrink-0 overflow-hidden rounded-xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <button
              type="button"
              onClick={() => setDiagnosisOpen((o) => !o)}
              aria-expanded={diagnosisOpen}
              className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
              style={{ padding: "0.75rem 1rem" }}
            >
              <span className="font-mono text-sm tracking-[0.16em] text-white/55 uppercase">
                {diagnosisLabel}
              </span>
              <ChevronDown
                size={22}
                className={`text-white/55 transition-transform duration-200 ${
                  diagnosisOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {diagnosisOpen && (
              <div
                className="max-h-40 overflow-y-auto"
                style={{ padding: "0 1rem 1rem" }}
              >
                {parsed ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-base font-semibold text-amber-300">
                      {parsed.label}
                    </span>
                    <p className="text-base leading-relaxed text-white/75">
                      {parsed.observation}
                    </p>
                  </div>
                ) : (
                  <p className="text-base leading-relaxed text-white/75">
                    {active.diagnosis}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {sentences.length > 1 && (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Previous sentence"
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/50 transition-colors duration-150 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft size={28} />
            </button>

            <div className="flex items-center gap-1.5">
              {shownDots.map((s, i) => (
                <span
                  key={s.id}
                  className="rounded-full"
                  style={{
                    width: 9,
                    height: 9,
                    background:
                      i === index
                        ? "rgba(255,255,255,0.95)"
                        : "rgba(255,255,255,0.3)",
                  }}
                />
              ))}
              {overflowCount > 0 && (
                <span className="text-lg leading-none text-white/50">
                  +{overflowCount}
                </span>
              )}
            </div>

            <button
              type="button"
              aria-label="Next sentence"
              onClick={() => navigate(1)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/50 transition-colors duration-150 hover:bg-white/10 hover:text-white"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
