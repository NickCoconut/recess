import { MessageCircleWarning, X } from "lucide-react";

interface SwitchModeDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function SwitchModeDialog({
  onConfirm,
  onCancel,
}: SwitchModeDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="relative flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl text-center"
        style={{
          background: "rgba(255,255,255,0.10)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.15)",
          padding: "1.5rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 cursor-pointer text-white/30 transition-colors hover:text-white/60"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <MessageCircleWarning
          size={40}
          strokeWidth={2}
          className="text-amber-400/80"
        />

        <div className="flex flex-col gap-1.5">
          <p className="text-lg font-semibold text-white">switch modes?</p>
          <p className="text-sm leading-relaxed text-white/55">
            Your sentence will clear.
          </p>
        </div>

        <div className="flex w-full gap-4" style={{ marginTop: "0.75rem" }}>
          <button
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-xl py-3 text-base font-medium text-white/50 transition-all hover:text-white/90"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.10)",
              padding: "0.5rem",
            }}
          >
            cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 cursor-pointer rounded-xl py-3 text-base font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
            style={{
              background: "rgba(251,191,36,0.18)",
              border: "1px solid rgba(251,191,36,0.35)",
              color: "#fcd34d",
              padding: "0.5rem",
            }}
          >
            switch anyway
          </button>
        </div>
      </div>
    </div>
  );
}
