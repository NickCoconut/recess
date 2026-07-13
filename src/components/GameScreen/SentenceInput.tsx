import { useRef } from "react";

import type { Mode } from "../../types/types";

const GAME_PLACEHOLDERS = [
  "say something. weird is fine.",
  "one sentence. no rules. go.",
  "start anywhere. land somewhere good.",
  "the clock is yours. make it count.",
];

interface SentenceInputProps {
  mode: Mode;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onSubmitShortcut?: () => void;
  isGameOver: boolean;
  blocked?: boolean;
  maxLength: number;
}

function charCountColor(length: number, max: number): string {
  const pct = length / max;
  if (pct >= 0.9) return "rgba(248, 113, 113, 0.7)"; // soft red
  if (pct >= 0.7) return "rgba(251, 191, 36, 0.7)"; // amber
  return "rgba(255, 255, 255, 0.2)"; // muted gray
}

export function SentenceInput({
  mode,
  value,
  onChange,
  onFocus,
  onSubmitShortcut,
  isGameOver,
  blocked,
  maxLength,
}: SentenceInputProps) {
  const gamePlaceholder = useRef(
    GAME_PLACEHOLDERS[Math.floor(Math.random() * GAME_PLACEHOLDERS.length)],
  );
  const placeholder =
    mode === "game" ? gamePlaceholder.current : "it's just you here.";

  return (
    <div className="flex flex-col">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmitShortcut?.();
          }
        }}
        disabled={(mode === "game" && isGameOver) || blocked}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={mode === "game" ? 6 : 10}
        style={{ padding: "0.75rem" }}
        className="w-full resize-none bg-transparent font-heading text-xl leading-relaxed font-light text-white/90 transition-all duration-300 outline-none placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="relative flex items-center justify-end px-1 pt-1">
        {mode === "game" && isGameOver && (
          <p
            className="absolute inset-x-0 text-center font-mono text-sm tracking-wide"
            style={{ color: "#fcd34d" }}
          >
            Time's up. This was always it.
          </p>
        )}
        {!(mode === "game" && isGameOver) && blocked && (
          <p
            className="absolute inset-x-0 text-center font-mono text-sm tracking-wide"
            style={{ color: "#fcd34d" }}
          >
            You already played today's recess. Come back tomorrow.
          </p>
        )}
        {value.length > 0 && (
          <span
            className="font-mono text-xs tabular-nums transition-colors duration-300"
            style={{
              marginRight: "5px",
              color: charCountColor(value.length, maxLength),
            }}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
