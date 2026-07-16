import { useState } from "react";
import { Check, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getPacificDate } from "../../lib/helper";

interface FeedbackModalProps {
  onClose: () => void;
}

type Question<T extends string> = {
  prompt: string;
  options: { value: T; label: string }[];
};

const BEST_PART_Q: Question<"sentence" | "readout" | "moment" | "theme"> = {
  prompt: "What was the best part of today's Recess?",
  options: [
    { value: "sentence", label: "Coming up with my sentence" },
    { value: "readout", label: "Reading my vibe readout" },
    { value: "moment", label: "A moment to write something down" },
    { value: "theme", label: "Seeing what today's theme was" },
  ],
};

const PMF_Q: Question<"really" | "a_little" | "wouldnt_mind"> = {
  prompt: "How would you feel if Recess disappeared tomorrow?",
  options: [
    { value: "really", label: "Really disappointed" },
    { value: "a_little", label: "A little disappointed" },
    { value: "wouldnt_mind", label: "Wouldn't really mind" },
  ],
};

const BLOCKER_Q: Question<
  "forget" | "repetitive" | "not_daily" | "coming_back"
> = {
  prompt: "What might stop you coming back?",
  options: [
    { value: "forget", label: "I'd just forget it exists" },
    { value: "repetitive", label: "It might start feeling repetitive" },
    { value: "not_daily", label: "Fun, but I don't need it every day" },
    { value: "coming_back", label: "Nothing, I'll be back" },
  ],
};

type BestPart = (typeof BEST_PART_Q.options)[number]["value"];
type Pmf = (typeof PMF_Q.options)[number]["value"];
type Blocker = (typeof BLOCKER_Q.options)[number]["value"];

const cardStyle = {
  background: "rgba(0,0,0,0.55)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "20px",
  padding: "1.75rem",
} as const;

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [bestPart, setBestPart] = useState<BestPart | null>(null);
  const [pmf, setPmf] = useState<Pmf | null>(null);
  const [blocker, setBlocker] = useState<Blocker | null>(null);
  const [improvement, setImprovement] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = bestPart && pmf && blocker && !submitting;

  async function handleSubmit() {
    if (!bestPart || !pmf || !blocker) return;

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("feedback").insert({
      date: getPacificDate(),
      best_part: bestPart,
      pmf,
      blocker,
      improvement: improvement.trim() || null,
    });

    setSubmitting(false);

    if (insertError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setSubmitted(true);
    setTimeout(onClose, 1600);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-md flex-col gap-6 overflow-y-auto text-left"
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 cursor-pointer text-white/30 transition-colors hover:text-white/60"
        >
          <X size={22} strokeWidth={2.5} />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: "rgba(74,222,128,0.15)",
                border: "1px solid rgba(74,222,128,0.35)",
              }}
            >
              <Check size={28} strokeWidth={2.5} className="text-green-300" />
            </div>
            <p className="text-lg font-semibold text-white">Thank you!</p>
            <p className="text-sm text-white/55">
              Your feedback helps make Recess better.
            </p>
          </div>
        ) : (
          <>
            <div
              className="flex flex-col items-center text-center text-orange-300"
              style={{ marginBottom: "0.75rem" }}
            >
              <p className="text-2xl font-semibold">Share your feedback</p>
            </div>

            <ChoiceQuestion
              prompt={BEST_PART_Q.prompt}
              options={BEST_PART_Q.options}
              selected={bestPart}
              onSelect={(value) => setBestPart(value)}
            />

            <ChoiceQuestion
              prompt={PMF_Q.prompt}
              options={PMF_Q.options}
              selected={pmf}
              onSelect={(value) => setPmf(value)}
            />

            <ChoiceQuestion
              prompt={BLOCKER_Q.prompt}
              options={BLOCKER_Q.options}
              selected={blocker}
              onSelect={(value) => setBlocker(value)}
            />

            <div className="flex flex-col gap-2.5">
              <p className="text-base font-medium text-orange-300/85">
                If Recess did one thing better, what would it be?{" "}
                <span className="font-normal text-white/35">(optional)</span>
              </p>
              <textarea
                value={improvement}
                onChange={(e) => setImprovement(e.target.value)}
                rows={3}
                placeholder="Type anything…"
                className="w-full resize-none rounded-xl text-base text-white placeholder:text-white/30 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: "0.75rem",
                }}
              />
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="cursor-pointer rounded-xl text-base font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: "rgba(255,255,255,0.92)",
                color: "#111",
                padding: "0.75rem",
              }}
            >
              {submitting ? "Sending…" : "Submit"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface ChoiceQuestionProps<T extends string> {
  prompt: string;
  options: { value: T; label: string }[];
  selected: T | null;
  onSelect: (value: T) => void;
}

function ChoiceQuestion<T extends string>({
  prompt,
  options,
  selected,
  onSelect,
}: ChoiceQuestionProps<T>) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-base font-medium text-orange-300/85">{prompt}</p>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className="cursor-pointer rounded-xl text-left text-sm transition-all active:scale-[0.99]"
              style={{
                background: active
                  ? "rgba(255,255,255,0.25)"
                  : "rgba(255,255,255,0.05)",
                border: active
                  ? "1px solid rgba(255,255,255,0.8)"
                  : "1px solid rgba(255,255,255,0.1)",
                color: active ? "#fff" : "rgba(255,255,255,0.7)",
                padding: "0.65rem 0.85rem",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
