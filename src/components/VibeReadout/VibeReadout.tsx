import { Bookmark, Check, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "../../hooks/useAuth";
import { fetchVibeReadout, type ThemeData } from "../../lib/anthropic";
import { parseDiagnosis } from "../../lib/helper";
import { saveSentenceToProfile } from "../../lib/sentences";
import type { SubmitData } from "../../types/types";
import { CheckToggle } from "../common/CheckToggle";
import { Tooltip } from "../common/Tooltip";
import { FeedTab } from "./FeedTab";

type Tab = "yours" | "today";

interface VibeReadoutProps {
  overlayOpacity: number;
  themeData: ThemeData | null;
  submitData: SubmitData;
  sentenceId: string | null;
  isNewDay: boolean;
  canPlayToday: boolean;
  saved: boolean;
  onSaved: () => void;
  onPlayAgain: () => void;
}

function isWordUsed(word: string, sentence: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(sentence);
}

export default function VibeReadout({
  overlayOpacity,
  themeData,
  submitData,
  sentenceId,
  isNewDay,
  canPlayToday,
  saved,
  onSaved,
  onPlayAgain,
}: VibeReadoutProps) {
  const { sentence, mode, isPublic } = submitData;
  const words = themeData?.words ?? [];

  const { requireAuth } = useAuth();

  const [readout, setReadout] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const showTabs = mode === "game";
  const [tab, setTab] = useState<Tab>("yours");

  const [playedToday, setPlayedToday] = useState<number | null>(null);

  const [saveDiagnosis, setSaveDiagnosis] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const myFeedEntry =
    mode === "game" && isPublic ? { id: sentenceId, sentence } : null;

  const performSave = async () => {
    if (!sentenceId) {
      setSaveError(true);
      return;
    }
    setSaving(true);
    setSaveError(false);
    const diagnosisToSave = saveDiagnosis ? (readout ?? null) : null;
    const ok = await saveSentenceToProfile(sentenceId, diagnosisToSave);
    setSaving(false);
    if (ok) onSaved();
    else setSaveError(true);
  };

  const handleSave = () => {
    void requireAuth(
      "save",
      () => {
        void performSave();
      },
      sentenceId,
    );
  };

  const saveToggleLabel =
    mode === "game" ? "Keep the diagnosis" : "Keep the reply";

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
    ? mode === "game"
      ? "Diagnosis: signal lost · try again later"
      : "Signal lost. Try again later."
    : readout;

  const parsed =
    mode === "game" && displayReadout ? parseDiagnosis(displayReadout) : null;

  return (
    <div
      className="pointer-events-none flex min-h-screen items-center justify-center p-4"
      style={{ position: "relative", zIndex: 1 }}
    >
      <div className="pointer-events-auto flex w-full max-w-[560px] flex-col gap-6">
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
            {showTabs && (
              <div className="flex items-center justify-between gap-3">
                <div
                  className="inline-flex items-center gap-1 rounded-full p-1"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {(["yours", "today"] as const).map((t) => {
                    const active = tab === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={`cursor-pointer rounded-full font-mono text-sm tracking-wide uppercase transition-all duration-200 ${
                          active
                            ? "bg-white font-semibold text-[#0f0f14] shadow-sm shadow-black/20"
                            : "bg-transparent text-white/45 hover:text-white/75"
                        }`}
                        style={{
                          padding: "0.4rem 1rem",
                        }}
                      >
                        {t === "today" ? "Today's feed" : t}
                      </button>
                    );
                  })}
                </div>

                {tab === "today" && playedToday !== null && (
                  <p className="font-mono text-sm text-amber-200/85">
                    {playedToday} shared today
                  </p>
                )}
              </div>
            )}

            {showTabs && tab === "today" ? (
              <FeedTab
                mine={myFeedEntry}
                sentenceId={sentenceId}
                onPlayedToday={setPlayedToday}
              />
            ) : (
              <div className="flex flex-col gap-6">
                <p className="text-center font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
                  your sentence
                </p>

                <Tooltip content={sentence}>
                  <p
                    className="overflow-hidden text-center font-heading text-2xl leading-snug font-light text-white"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 5,
                      WebkitBoxOrient: "vertical",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {sentence}
                  </p>
                </Tooltip>

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
                      <p className="animate-pulse text-center font-mono text-base tracking-wide text-white/40">
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
                      <p className="text-lg leading-relaxed text-white/85">
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
            )}
          </div>

          {!(showTabs && tab === "today") && (
            <div className="flex flex-col gap-3">
              <CheckToggle
                checked={saveDiagnosis}
                onChange={setSaveDiagnosis}
                label={saveToggleLabel}
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || saving || saved}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white/90 text-lg font-semibold tracking-wide text-black transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70"
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  paddingTop: "0.875rem",
                  paddingBottom: "0.875rem",
                }}
              >
                {saved ? <Check size={22} /> : <Bookmark size={22} />}
                {saved ? "Saved" : saving ? "Saving..." : "Save to profile"}
              </button>
              {saveError && (
                <p className="text-center font-mono text-xs tracking-wide text-rose-300/90">
                  Couldn't save — try again
                </p>
              )}
              <button
                type="button"
                onClick={onPlayAgain}
                disabled={!canPlayToday}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full text-base font-medium tracking-wide text-white/80 transition-all duration-300 hover:text-white disabled:cursor-not-allowed disabled:text-white/35"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: "0.75rem",
                  paddingBottom: "0.75rem",
                }}
              >
                <RefreshCw size={18} />
                {canPlayToday
                  ? "Play today's recess"
                  : isNewDay
                    ? "Today's recess is getting ready"
                    : "Come back tomorrow"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
