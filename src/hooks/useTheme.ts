import { useEffect, useState } from "react";

import type { ThemeData } from "../lib/anthropic";
import { supabase } from "../lib/supabase";

const CACHE_KEY = "recess_theme_cache";

type ThemeCache = {
  pacificDate: string;
  data: ThemeData;
  themeId: string | null;
};

export function useTheme(recessDate: string, refreshSignal: number) {
  const [themeData, setThemeData] = useState<ThemeData | null>(null);
  const [themeId, setThemeId] = useState<string | null>(null);
  const [themeDate, setThemeDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTheme() {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const cache: ThemeCache = JSON.parse(raw);
          if (cache.pacificDate === recessDate) {
            if (cancelled) return;
            setThemeData(cache.data);
            setThemeId(cache.themeId ?? null);
            setThemeDate(cache.pacificDate);
            setLoading(false);
            return;
          }
        }

        const { data, error } = await supabase
          .from("daily_themes")
          .select("id, theme, words, date")
          .eq("date", recessDate)
          .maybeSingle();

        if (cancelled) return;

        if (data && !error) {
          const theme: ThemeData = {
            theme: data.theme,
            words: data.words as [string, string, string],
          };
          const id = data.id;

          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              pacificDate: recessDate,
              data: theme,
              themeId: id,
            }),
          );

          setThemeData(theme);
          setThemeId(id);
          setThemeDate(data.date);
        } else {
          setThemeData(null);
          setThemeId(null);
          setThemeDate(null);
        }
      } catch (err) {
        console.error("useTheme error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTheme();
    return () => {
      cancelled = true;
    };
  }, [recessDate, refreshSignal]);

  return { themeData, themeId, themeDate, loading };
}
