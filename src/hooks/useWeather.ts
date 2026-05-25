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

type WeatherCache = {
  timestamp: number;
  data: WeatherData;
};

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
    videoSrc: getRandomVideo(config),
    sunInfo: null,
  };
}

export function useWeather(): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherData>(buildFallback);
  const [loading, setLoading] = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    // Check cache before requesting location — fresh cache skips geolocation entirely
    try {
      const raw = localStorage.getItem(WEATHER_CACHE_KEY);
      if (raw) {
        const cached: WeatherCache = JSON.parse(raw);
        const ageMs = Date.now() - cached.timestamp;
        if (ageMs < WEATHER_CACHE_DURATION_MS) {
          setWeather(cached.data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Cache read failed (corrupted JSON etc) — fall through to geolocation
      localStorage.removeItem(WEATHER_CACHE_KEY);
    }

    navigator.geolocation.getCurrentPosition(
      // Success callback: called when the user's location is successfully retrieved
      async (position) => {
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

          // Save to cache after successful fetch
          try {
            const newCache: WeatherCache = {
              timestamp: Date.now(),
              data: mappedWeatherData,
            };
            localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(newCache));
          } catch {
            // localStorage full or unavailable — fail silently
            console.warn("Weather cache write failed");
          }

          setWeather(mappedWeatherData);
        } catch {
          setWeather(buildFallback());
        } finally {
          setLoading(false);
        }
      },
      // Error callback: called when the user's location cannot be retrieved or access is denied
      () => {
        setWeather(buildFallback());
        setLocationDenied(true);
        setLoading(false);
      },
    );
  }, []);

  return { weather, loading, locationDenied };
}
