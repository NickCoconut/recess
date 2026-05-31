import { RefreshCw, Share } from "lucide-react";
import { useEffect, useState } from "react";

import { fetchVibeReadout, type ThemeData } from "../../lib/anthropic";

type Mode = "game" | "freewrite";

export interface SubmitData {
  sentence: string;
  mode: Mode;
}

interface VibeReadoutProps {
  overlayOpacity: number;
  themeData: ThemeData | null;
  submitData: SubmitData;
}

interface ParsedDiagnosis {
  label: string;
  observation: string;
}

function parseDiagnosis(readout: string): ParsedDiagnosis | null {
  // Expects "Diagnosis: label · observation"
  const match = readout.match(/^Diagnosis:\s*(.+?)\s*[·•]\s*(.+)$/i);
  if (!match) return null;
  return { label: match[1].trim(), observation: match[2].trim() };
}

function isWordUsed(word: string, sentence: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(sentence);
}

export default function VibeReadout({
  overlayOpacity,
  themeData,
  submitData,
}: VibeReadoutProps) {
  const { sentence, mode } = submitData;
  const words = themeData?.words ?? [];

  const [readout, setReadout] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const theme = themeData?.theme ?? "";
      const themeWords = themeData?.words ?? [];
      try {
        const data = await fetchVibeReadout(
          submitData.sentence,
          submitData.mode,
          theme,
          themeWords,
        );
        if (!cancelled) {
          setReadout(data.readout);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [submitData, themeData]);

  const displayReadout = error
    ? "Diagnosis: signal lost · try again later"
    : readout;

  const parsed =
    mode === "game" && displayReadout ? parseDiagnosis(displayReadout) : null;

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ position: "relative", zIndex: 1 }}
    >
      <div className="flex w-full max-w-[560px] flex-col gap-6">
        {/* Card */}
        <div
          className="flex w-full flex-col justify-between gap-6"
          style={{
            position: "relative",
            zIndex: 10,
            minHeight: "580px",
            background: `rgba(0,0,0,${overlayOpacity})`,
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "16px",
            padding: "2rem",
          }}
        >
          <div className="flex flex-col gap-6">
            <p className="text-center font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
              your sentence
            </p>

            <p className="text-center font-heading text-2xl leading-snug font-light text-white">
              &ldquo;{sentence}&rdquo;
            </p>

            <div className="flex flex-col gap-3">
              <div
                className="flex flex-col justify-center rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  minHeight: "160px",
                  padding: "1.75rem",
                }}
              >
                {loading ? (
                  <p className="animate-pulse text-center font-mono text-sm tracking-wide text-white/40">
                    reading your energy...
                  </p>
                ) : mode === "game" && parsed ? (
                  <div className="flex items-baseline gap-2">
                    <span className="shrink-0 font-mono text-xs tracking-[0.16em] text-white/40 uppercase">
                      DIAGNOSIS:
                    </span>
                    <div className="flex flex-col gap-2">
                      <span className="text-lg font-semibold text-amber-300">
                        {parsed.label}
                      </span>
                      <p className="text-base leading-relaxed text-white/75">
                        {parsed.observation}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-white/85">
                    {displayReadout}
                  </p>
                )}
              </div>

              {mode === "game" && words.length > 0 && (
                <p className="text-center font-mono text-xs tracking-[0.12em] text-white/30">
                  words used:{" "}
                  {words.map((word, i) => (
                    <span key={word}>
                      <span
                        className={
                          isWordUsed(word, sentence)
                            ? "line-through"
                            : undefined
                        }
                      >
                        {word}
                      </span>
                      {i < words.length - 1 ? " / " : ""}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white/90 text-lg font-semibold tracking-wide text-black transition-all duration-300"
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                paddingTop: "0.875rem",
                paddingBottom: "0.875rem",
              }}
            >
              <Share size={20} />
              share this →
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-full text-base font-medium tracking-wide text-white/80 transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.08)",
                paddingTop: "0.75rem",
                paddingBottom: "0.75rem",
              }}
            >
              <RefreshCw size={18} />
              play again tomorrow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
