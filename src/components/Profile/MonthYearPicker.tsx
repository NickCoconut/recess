export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface MonthYearPickerProps {
  year: number;
  month: number; // 0-indexed
  minYear: number;
  maxYear: number;
  onSelect: (year: number, month: number) => void;
}

export function MonthYearPicker({
  year,
  month,
  minYear,
  maxYear,
  onSelect,
}: MonthYearPickerProps) {
  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  return (
    <div
      className="absolute top-15 left-1/2 z-20 flex w-72 -translate-x-1/2 overflow-hidden"
      style={{
        background: "rgba(15,15,20,0.8)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "14px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="grid max-h-56 flex-1 grid-cols-2 gap-1 overflow-y-auto"
        style={{
          padding: "0.6rem",
          borderRight: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {MONTH_NAMES.map((name, i) => {
          const active = i === month;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(year, i)}
              className={`cursor-pointer rounded-lg text-left text-sm transition-colors duration-150 ${
                active
                  ? "bg-white font-semibold text-[#0f0f14]"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
              style={{ padding: "0.4rem 0.55rem" }}
            >
              {name.slice(0, 3)}
            </button>
          );
        })}
      </div>
      <div
        className="flex max-h-56 w-20 flex-col gap-1 overflow-y-auto"
        style={{ padding: "0.6rem" }}
      >
        {years.map((y) => {
          const active = y === year;
          return (
            <button
              key={y}
              type="button"
              onClick={() => onSelect(y, month)}
              className={`cursor-pointer rounded-lg text-sm transition-colors duration-150 ${
                active
                  ? "bg-white font-semibold text-[#0f0f14]"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
              style={{ padding: "0.4rem 0.5rem" }}
            >
              {y}
            </button>
          );
        })}
      </div>
    </div>
  );
}
