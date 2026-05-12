export type ChipColor = "amber" | "teal" | "coral";

const colorMap: Record<
  ChipColor,
  { border: string; text: string; shadow: string }
> = {
  amber: {
    border: "rgba(251, 191, 36, 0.7)",
    text: "#fcd34d",
    shadow: "rgba(251, 191, 36, 0.25)",
  },
  teal: {
    border: "rgba(45, 212, 191, 0.7)",
    text: "#5eead4",
    shadow: "rgba(45, 212, 191, 0.25)",
  },
  coral: {
    border: "rgba(251, 113, 133, 0.7)",
    text: "#fda4af",
    shadow: "rgba(251, 113, 133, 0.25)",
  },
};

interface WordChipProps {
  word: string;
  color: ChipColor;
}

export function WordChip({ word, color }: WordChipProps) {
  const { border, text, shadow } = colorMap[color];

  return (
    <span
      className="inline-flex items-center font-mono text-sm tracking-widest backdrop-blur-sm"
      style={{
        color: text,
        border: `1.5px solid ${border}`,
        boxShadow: `0 0 10px ${shadow}, 0 0 20px ${shadow}`,
        borderRadius: "20px",
        padding: "8px 28px",
      }}
    >
      {word}
    </span>
  );
}
