import { Check, Info } from "lucide-react";

interface ShareToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ShareToggle({ checked, onChange }: ShareToggleProps) {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="flex cursor-pointer items-center gap-2.5 select-none focus-visible:outline-none"
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] transition-colors duration-200"
          style={{
            background: checked
              ? "rgba(255,255,255,0.85)"
              : "rgba(255,255,255,0.06)",
            border: checked
              ? "1px solid rgba(255,255,255,0.85)"
              : "1px solid rgba(255,255,255,0.25)",
          }}
        >
          {checked && (
            <Check size={16} strokeWidth={4} className="text-[#0f0f14]" />
          )}
        </span>
        <span className="text-sm tracking-widest text-white/75">
          Share to today's feed
        </span>
      </button>

      <span className="group/info relative flex items-center">
        <Info
          size={18}
          className="cursor-help text-white/55 transition-colors duration-200 hover:text-white/70"
        />
        <span
          role="tooltip"
          className={`pointer-events-none absolute bottom-full left-0 mb-2 hidden rounded-lg px-3 py-2 text-left font-mono text-[11px] leading-relaxed tracking-wide text-white/90 group-hover/info:block ${checked ? "w-53" : "w-46"}`}
          style={{
            background: "rgba(15,15,20,0.55)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            padding: "0.5rem",
          }}
        >
          {checked
            ? "Your sentence joins today's public feed."
            : "Only you will see this."}
        </span>
      </span>
    </div>
  );
}
