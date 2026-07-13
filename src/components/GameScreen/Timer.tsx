import { useEffect, useRef, useState } from "react";

interface TimerProps {
  started: boolean;
  mode: "game" | "freewrite";
  onExpire: () => void;
}

function formatTime(t: number): string {
  if (t === 60) return "1:00";
  return `${t}s`;
}

export function Timer({ started, mode, onExpire }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Pause interval when leaving game mode (timeLeft preserved)
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, [mode]);

  // Start countdown once `started` flips true
  useEffect(() => {
    if (!started || mode !== "game") return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const colorClass =
    timeLeft > 30
      ? "text-white/70"
      : timeLeft > 15
        ? "text-amber-400"
        : "text-red-400";

  return (
    <span
      className={`font-mono text-lg tabular-nums transition-colors duration-500 ${colorClass}`}
    >
      {formatTime(timeLeft)}
    </span>
  );
}
