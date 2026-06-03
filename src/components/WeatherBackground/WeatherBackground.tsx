import { useEffect, useRef } from "react";

import type { WeatherData } from "../../hooks/useWeather";

type WeatherBackgroundProps = {
  weather: WeatherData;
};

export function WeatherBackground({ weather }: WeatherBackgroundProps) {
  const { videoSrc, city, description, sunInfo } = weather;

  // Show location hint if location is denied
  const showLocationHint = !sunInfo;
  const videoRef = useRef<HTMLVideoElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    video.load();
    void video.play();
  }, [videoSrc]);

  const capitalizedDescription =
    description.charAt(0).toUpperCase() + description.slice(1);

  const hasLabel = city || description;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "1.5rem",
          left: "1.5rem",
          zIndex: 1,
        }}
        className="flex flex-col gap-0.5"
      >
        {hasLabel && (
          <p className="text-xs tracking-wide text-white/40">
            {city}
            {city && description ? " · " : ""}
            {capitalizedDescription}
          </p>
        )}
        {sunInfo && (
          <p className="flex items-center gap-1 text-xs tracking-wide text-white/30">
            {sunInfo.label} {sunInfo.time}
          </p>
        )}
      </div>

      {showLocationHint && (
        <p
          style={{
            position: "absolute",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 1,
          }}
          className="text-xs tracking-wide text-white/30"
        >
          Allow location access for a live weather background
        </p>
      )}
    </div>
  );
}
