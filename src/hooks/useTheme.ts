import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { ThemeData } from "../lib/anthropic";

const CACHE_KEY = "recess_theme_cache";

type ThemeCache = {
  pacificDate: string;
  data: ThemeData;
};

function getPacificDateStr(): string {
  // Returns current date in Pacific Time as YYYY-MM-DD (e.g., "2024-05-09")
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
}

export function useTheme() {
  const [themeData, setThemeData] = useState<ThemeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTheme() {
      try {
        const todayPT = getPacificDateStr();

        // Check cached in localStorage
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const cache: ThemeCache = JSON.parse(raw);
          if (cache.pacificDate === todayPT) {
            setThemeData(cache.data);
            setLoading(false);
            return;
          }
        }

        // Fetch the most recent theme from Supabase
        const { data, error } = await supabase
          .from("daily_themes")
          .select("theme, words, date")
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle(); // database might be empty

        if (data && !error) {
          const theme: ThemeData = {
            theme: data.theme,
            words: data.words as [string, string, string],
          };

          // Only cache if today's theme
          if (data.date === todayPT) {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                pacificDate: todayPT,
                data: theme,
              }),
            );
          }

          setThemeData(theme);
        }
      } catch (err) {
        console.error("useTheme error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTheme();
  }, []);

  return { themeData, loading };
}
