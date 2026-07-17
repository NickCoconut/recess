import { useEffect, useState } from "react";

import {
  getRandomVideo,
  getWeatherGroup,
  weatherConfig,
  type WeatherConfig,
  type WeatherGroup,
} from "../lib/weatherConfig";

type SunInfo = {
  label: string;
  time: string;
};

export type WeatherData = {
  conditionCode: number;
  iconCode: string;
  description: string;
  city: string;
  group: WeatherGroup;
  config: WeatherConfig;
  videoSrc: string;
  sunInfo: SunInfo | null;
};

type UseWeatherResult = {
  weather: WeatherData;
  loading: boolean;
  locationDenied: boolean;
};

function formatUnixTime(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const WEATHER_CACHE_KEY = "recess_weather_cache";
const WEATHER_CACHE_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours
const WEATHER_RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutes

type WeatherCache = {
  timestamp: number;
  data: WeatherData;
};

function clearCache() {
  try {
    localStorage.removeItem(WEATHER_CACHE_KEY);
  } catch {
    // localStorage may be unavailable in privacy-restricted contexts.
  }
}

// Fallback weather data for when the user's location cannot be retrieved or access is denied
function buildFallback(): WeatherData {
  const config = weatherConfig["Cloudy"];
  return {
    conditionCode: 803,
    iconCode: "04d",
    description: "",
    city: "",
    group: "Cloudy",
    config,
    videoSrc: config.videos[2],
    sunInfo: null,
  };
}

// Read the cached weather regardless of age. Returns null if there's no cache
function readCache(): WeatherCache | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WeatherCache;
  } catch {
    // Corrupted JSON etc — drop it so we re-fetch cleanly
    clearCache();
    return null;
  }
}

export function useWeather(): UseWeatherResult {
  // Seed from any cached weather (even stale) so returning users never see the
  // Cloudy fallback flash. Only brand-new / cache-less visitors start on Cloudy.
  const [weather, setWeather] = useState<WeatherData>(
    () => readCache()?.data ?? buildFallback(),
  );
  const [loading, setLoading] = useState(() => {
    const cached = readCache();
    return !(
      cached && Date.now() - cached.timestamp < WEATHER_CACHE_DURATION_MS
    );
  });
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let refreshInFlight = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleRefresh = (delay: number) => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(
        () => {
          void refreshWeather();
        },
        Math.max(0, delay),
      );
    };

    const refreshWeather = async () => {
      if (cancelled || refreshInFlight) return;
      refreshInFlight = true;
      setLoading(true);

      if (!navigator.geolocation) {
        clearCache();
        setWeather(buildFallback());
        setLocationDenied(true);
        setLoading(false);
        refreshInFlight = false;
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (cancelled) return;

          const { latitude: lat, longitude: lon } = position.coords;
          try {
            const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
            if (!res.ok) throw new Error("Weather fetch failed");

            const data = (await res.json()) as {
              weather: { id: number; icon: string; description: string }[];
              sys: { sunrise: number; sunset: number };
              dt: number;
              name: string;
            };

            const conditionCode = data.weather[0].id;
            const iconCode = data.weather[0].icon;
            const description = data.weather[0].description;
            const city = data.name;
            const { sunrise, sunset } = data.sys;
            const dt = data.dt;

            const isDay = dt >= sunrise && dt < sunset;
            const sunInfo: SunInfo = isDay
              ? { label: "Sunset", time: formatUnixTime(sunset) }
              : { label: "Sunrise", time: formatUnixTime(sunrise) };

            const group = getWeatherGroup(conditionCode, iconCode);
            const config = weatherConfig[group];
            const videoSrc = getRandomVideo(config);

            const mappedWeatherData: WeatherData = {
              conditionCode,
              iconCode,
              description,
              city,
              group,
              config,
              videoSrc,
              sunInfo,
            };

            try {
              const newCache: WeatherCache = {
                timestamp: Date.now(),
                data: mappedWeatherData,
              };
              localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(newCache));
            } catch {
              console.warn("Weather cache write failed");
            }

            if (!cancelled) {
              setWeather(mappedWeatherData);
              setLocationDenied(false);
              scheduleRefresh(WEATHER_CACHE_DURATION_MS);
            }
          } catch (error) {
            console.warn("Weather revalidation failed", error);
            if (!cancelled) {
              if (!readCache()) setWeather(buildFallback());
              scheduleRefresh(WEATHER_RETRY_DELAY_MS);
            }
          } finally {
            if (!cancelled) {
              setLoading(false);
              refreshInFlight = false;
            }
          }
        },
        (error) => {
          if (cancelled) return;

          console.warn("Weather geolocation failed", error);
          clearCache();
          setWeather(buildFallback());
          setLocationDenied(true);
          setLoading(false);
          refreshInFlight = false;

          if (error.code !== error.PERMISSION_DENIED) {
            scheduleRefresh(WEATHER_RETRY_DELAY_MS);
          }
        },
        {
          enableHighAccuracy: false,
          maximumAge: 0,
          timeout: 10_000,
        },
      );
    };

    const refreshIfExpired = () => {
      const cached = readCache();
      if (
        !cached ||
        Date.now() - cached.timestamp >= WEATHER_CACHE_DURATION_MS
      ) {
        void refreshWeather();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshIfExpired();
    };

    const cached = readCache();
    if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_DURATION_MS) {
      scheduleRefresh(
        WEATHER_CACHE_DURATION_MS - (Date.now() - cached.timestamp),
      );
    } else {
      void refreshWeather();
    }

    window.addEventListener("focus", refreshIfExpired);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
      window.removeEventListener("focus", refreshIfExpired);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return { weather, loading, locationDenied };
}
