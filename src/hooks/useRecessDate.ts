import { useEffect, useState } from "react";

import { getPacificDate } from "../lib/helper";

type RecessDateState = {
  date: string;
  refreshSignal: number;
};

export function useRecessDate() {
  const [state, setState] = useState<RecessDateState>(() => ({
    date: getPacificDate(),
    refreshSignal: 0,
  }));

  useEffect(() => {
    const syncDate = () => {
      setState((current) => ({
        date: getPacificDate(),
        refreshSignal: current.refreshSignal + 1,
      }));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") syncDate();
    };

    window.addEventListener("focus", syncDate);
    window.addEventListener("pageshow", syncDate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", syncDate);
      window.removeEventListener("pageshow", syncDate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return {
    recessDate: state.date,
    refreshSignal: state.refreshSignal,
  };
}
