import { useRef } from "react";

type Mode = "game" | "freewrite";

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
  isGameOver: boolean;
  maxLength: number;
}

function charCountColor(length: number, max: number): string {
  const pct = length / max;
  if (pct >= 0.9) return "rgba(248, 113, 113, 0.7)";  // soft red
  if (pct >= 0.7) return "rgba(251, 191, 36, 0.7)";   // amber
  return "rgba(255, 255, 255, 0.2)";                   // muted gray
}

export function SentenceInput({
  mode,
  value,
  onChange,
  onFocus,
  isGameOver,
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
        disabled={mode === "game" && isGameOver}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={mode === "game" ? 6 : 10}
        style={{ padding: "0.75rem" }}
        className="w-full resize-none bg-transparent font-heading text-xl leading-relaxed font-light text-white/90 transition-all duration-300 outline-none placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="flex items-center justify-between pt-1 px-1">
        {mode === "game" && isGameOver ? (
          <p
            className="text-center font-mono text-sm tracking-wide"
            style={{ color: "#fcd34d" }}
          >
            time's up. this was always it.
          </p>
        ) : (
          <span />
        )}
        {value.length > 0 && (
          <span
            className="font-mono text-xs tabular-nums transition-colors duration-300"
            style={{ color: charCountColor(value.length, maxLength) }}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
