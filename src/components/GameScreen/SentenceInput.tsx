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
}

export function SentenceInput({
  mode,
  value,
  onChange,
  onFocus,
  isGameOver,
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
        rows={mode === "game" ? 6 : 10}
        style={{ padding: "0.75rem" }}
        className="w-full resize-none bg-transparent font-heading text-xl leading-relaxed font-light text-white/90 transition-all duration-300 outline-none placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {mode === "game" && isGameOver && (
        <p
          className="pt-2 text-center font-mono text-sm tracking-wide"
          style={{ color: "#fcd34d" }}
        >
          time's up. this was always it.
        </p>
      )}
    </div>
  );
}
