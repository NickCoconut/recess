import type { LucideIcon } from "lucide-react";

interface StreakBadgeProps {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  value: number;
}

export function StreakBadge({
  icon: Icon,
  iconClassName,
  label,
  value,
}: StreakBadgeProps) {
  return (
    <div
      className="flex min-w-[150px] flex-col justify-center gap-2"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "14px",
        padding: "0.9rem 1.25rem",
      }}
    >
      <span className="text-xs tracking-wide text-white/60 uppercase">
        {label}
      </span>
      <span className="flex items-center gap-2 text-xl font-semibold text-white">
        <Icon size={20} className={iconClassName} />
        {value} {value === 1 ? "day" : "days"}
      </span>
    </div>
  );
}
