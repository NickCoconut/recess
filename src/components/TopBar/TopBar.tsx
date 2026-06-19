import { CircleUserRound, Mail, Settings2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { AuthModal } from "../Auth/AuthModal";
import { FeedbackModal } from "../Feedback/FeedbackModal";

interface TopBarProps {
  opacity: number;
  onOpacityChange: (value: number) => void;
}

const iconButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white";

const sliderStyles = `
.opacity-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.25);
  outline: none;
  cursor: pointer;
}
.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: #ffffff;
  border: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  cursor: pointer;
}
.opacity-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: #ffffff;
  border: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  cursor: pointer;
}
`;

export function TopBar({ opacity, onOpacityChange }: TopBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isPermanent } = useAuth();

  useEffect(() => {
    if (!settingsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsOpen]);

  return (
    <div
      className="fixed top-4 right-4 flex items-center gap-1"
      style={{ zIndex: 50 }}
    >
      <style>{sliderStyles}</style>

      <button
        type="button"
        className={iconButtonClass}
        aria-label="Feedback"
        onClick={() => setFeedbackOpen(true)}
      >
        <Mail size={22} />
      </button>

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}

      <div ref={containerRef} className="relative">
        <button
          type="button"
          className={iconButtonClass}
          aria-label="Settings"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((open) => !open)}
        >
          <Settings2 size={22} />
        </button>

        {settingsOpen && (
          <div
            className="absolute top-12 right-0 flex w-64 items-center gap-3"
            style={{
              background: `rgba(0,0,0,${opacity})`,
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "16px",
              padding: "1rem",
            }}
          >
            <span className="shrink-0 text-sm font-medium tracking-wide text-white/80">
              Opacity:
            </span>
            <input
              type="range"
              className="opacity-slider"
              min={0}
              max={0.9}
              step={0.01}
              value={opacity}
              onChange={(e) => onOpacityChange(Number(e.target.value))}
            />
            <span className="shrink-0 font-mono text-xs text-white/40">
              {Math.round(opacity * 100)}%
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        className={iconButtonClass}
        aria-label="Account"
        onClick={() => {
          if (!isPermanent) setAuthOpen(true);
        }}
      >
        <CircleUserRound
          size={22}
          className={isPermanent ? "text-amber-300" : undefined}
          fill={isPermanent ? "currentColor" : "none"}
        />
      </button>

      {authOpen && (
        <AuthModal
          reason="account"
          onClose={() => setAuthOpen(false)}
          onSuccess={() => setAuthOpen(false)}
        />
      )}
    </div>
  );
}
