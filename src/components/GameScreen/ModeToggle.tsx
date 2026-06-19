import type { Mode } from "../../types/types";

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const isGame = mode === "game";

  return (
    <div className="flex items-center gap-3">
      {/* Game label */}
      <span
        className={`text-sm font-medium transition-colors duration-200 ${
          isGame ? "text-white" : "text-white/35"
        }`}
      >
        Game
      </span>

      {/* 3D toggle track */}
      <button
        role="switch"
        aria-checked={!isGame}
        onClick={() => onChange(isGame ? "freewrite" : "game")}
        className="relative h-8 w-14 shrink-0 cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
        style={{
          background: "linear-gradient(180deg, #3a3f7a 0%, #5660c0 100%)",
          boxShadow:
            "inset 0 2px 5px rgba(0,0,0,0.45), inset 0 -1px 2px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Knob */}
        <span
          className="absolute top-1 h-6 w-6 rounded-full transition-transform duration-200 ease-in-out"
          style={{
            left: "4px",
            transform: isGame ? "translateX(0)" : "translateX(22px)",
            background:
              "radial-gradient(circle at 35% 35%, #c8caff, #7c82e8 55%, #4a50c8)",
            boxShadow:
              "0 2px 6px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 1px rgba(255,255,255,0.35)",
          }}
        />
      </button>

      {/* Free Write label */}
      <span
        className={`text-sm font-medium transition-colors duration-200 ${
          !isGame ? "text-white" : "text-white/35"
        }`}
      >
        Free Write
      </span>
    </div>
  );
}
