import { useEffect, useState } from "react";

import type { ThemeData } from "../../lib/anthropic";
import { getPacificDate } from "../../lib/helper";
import type { Mode } from "../../types/types";
import { ModeToggle } from "./ModeToggle";
import { SentenceInput } from "./SentenceInput";
import { ShareToggle } from "./ShareToggle";
import { SwitchModeDialog } from "./SwitchModeDialog";
import { Timer } from "./Timer";
import { WordChip, type ChipColor } from "./WordChip";

interface GameScreenProps {
  overlayOpacity: number;
  themeData: ThemeData | null;
  themeLoading: boolean;
  onSubmit: (sentence: string, mode: Mode, isPublic: boolean) => Promise<void>;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

const CHIP_COLORS: ChipColor[] = ["amber", "teal", "coral"];

const DAILY_SUBMISSION_KEY = "recess:lastSubmissionDate";

export default function GameScreen({
  overlayOpacity,
  themeData,
  themeLoading,
  onSubmit,
}: GameScreenProps) {
  const [mode, setMode] = useState<Mode>("game");
  const [sentence, setSentence] = useState("");
  const [timerStarted, setTimerStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const [shareToFeed, setShareToFeed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [alreadyPlayedToday, setAlreadyPlayedToday] = useState(
    () => localStorage.getItem(DAILY_SUBMISSION_KEY) === getPacificDate(),
  );

  useEffect(() => {
    const syncDailyLimit = () => {
      setAlreadyPlayedToday(
        localStorage.getItem(DAILY_SUBMISSION_KEY) === getPacificDate(),
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") syncDailyLimit();
    };

    window.addEventListener("focus", syncDailyLimit);
    window.addEventListener("pageshow", syncDailyLimit);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", syncDailyLimit);
      window.removeEventListener("pageshow", syncDailyLimit);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const hasTyped = sentence.length > 0;

  const applyModeSwitch = (next: Mode) => {
    setMode(next);
    setSentence("");
  };

  const handleModeChange = (next: Mode) => {
    if (hasTyped) {
      setPendingMode(next);
    } else {
      applyModeSwitch(next);
    }
  };

  const handleModeConfirm = () => {
    if (pendingMode) applyModeSwitch(pendingMode);
    setPendingMode(null);
  };

  const handleModeCancel = () => setPendingMode(null);

  const startTimer = () => {
    if (timerStarted || mode !== "game") return;
    setTimerStarted(true);
  };

  const maxLength = mode === "game" ? 200 : 500;

  const blockedByDailyLimit = alreadyPlayedToday;

  const canSubmit = !!sentence.trim() && !submitting && !blockedByDailyLimit;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    // Free Write has no public posting concept — always private.
    const isPublic = mode === "game" ? shareToFeed : false;
    setSubmitting(true);
    setSubmitError(false);
    try {
      await onSubmit(sentence, mode, isPublic);
      localStorage.setItem(DAILY_SUBMISSION_KEY, getPacificDate());
      setAlreadyPlayedToday(true);
    } catch {
      setSubmitting(false);
      setSubmitError(true);
    }
  };

  const today = formatDate(new Date());

  return (
    <>
      <div
        className="pointer-events-none flex min-h-screen items-center justify-center p-4"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div className="pointer-events-auto flex w-full max-w-[560px] flex-col gap-6">
          {/* Header row — aligns with card edges */}
          <div className="flex items-end justify-between px-1">
            <div className="flex flex-col gap-0.5">
              <p className="text-2xl font-semibold tracking-[0.18em] text-white/90 uppercase">
                Recess
              </p>
              <p className="text-base tracking-widest text-white/60 uppercase">
                {today}
              </p>
            </div>
            <span className={mode !== "game" ? "invisible" : ""}>
              <Timer
                started={timerStarted}
                mode={mode}
                onExpire={() => setIsGameOver(true)}
              />
            </span>
          </div>

          {/* Card */}
          <div
            className="flex w-full flex-col gap-8"
            style={{
              position: "relative",
              zIndex: 10,
              background: `rgba(0,0,0,${overlayOpacity})`,
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "16px",
              padding: "2rem",
            }}
          >
            <div style={{ marginTop: "-1rem" }}>
              <ModeToggle mode={mode} onChange={handleModeChange} />
            </div>

            {mode === "game" && (
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-sm tracking-widest text-white/40 uppercase">
                  today's theme
                </p>
                {themeLoading || !themeData ? (
                  <div className="h-10 w-48 animate-pulse rounded-md bg-white/10" />
                ) : (
                  <h1 className="font-heading text-4xl font-semibold text-white capitalize">
                    {themeData.theme}
                  </h1>
                )}
              </div>
            )}

            {mode === "game" && (
              <div className="flex flex-wrap justify-center gap-2.5">
                {themeLoading || !themeData ? (
                  <>
                    <div className="h-8 w-20 animate-pulse rounded-full bg-white/10" />
                    <div className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
                    <div className="h-8 w-16 animate-pulse rounded-full bg-white/10" />
                  </>
                ) : (
                  themeData.words.map((word, i) => (
                    <WordChip key={word} word={word} color={CHIP_COLORS[i]} />
                  ))
                )}
              </div>
            )}

            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <SentenceInput
                mode={mode}
                value={sentence}
                onChange={setSentence}
                onFocus={startTimer}
                onSubmitShortcut={handleSubmit}
                isGameOver={isGameOver}
                blocked={blockedByDailyLimit}
                maxLength={maxLength}
              />
            </div>

            <div className="mt-2 flex flex-col gap-4">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{ paddingTop: "1rem", paddingBottom: "1rem" }}
                className={`w-full rounded-full py-5 text-base font-semibold tracking-wide transition-all duration-300 ${
                  canSubmit
                    ? "cursor-pointer bg-white text-[#0f0f14] shadow-lg shadow-white/10 hover:bg-white/90 active:scale-[0.8]"
                    : "cursor-not-allowed bg-white/10 text-white/25"
                } `}
              >
                {blockedByDailyLimit
                  ? "See you tomorrow"
                  : mode === "game"
                    ? "That's my sentence →"
                    : "That's my free write →"}
              </button>
              {submitError && (
                <p className="text-center font-mono text-xs tracking-wide text-rose-300/90">
                  Failed to submit — please try again
                </p>
              )}
              {mode === "game" && !blockedByDailyLimit && (
                <ShareToggle checked={shareToFeed} onChange={setShareToFeed} />
              )}
            </div>
          </div>
        </div>
      </div>

      {pendingMode && (
        <SwitchModeDialog
          onConfirm={handleModeConfirm}
          onCancel={handleModeCancel}
        />
      )}
    </>
  );
}
