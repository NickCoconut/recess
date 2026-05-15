import { useEffect, useRef, useState } from "react";

import type { WeatherData } from "../../hooks/useWeather";

type WeatherBackgroundProps = {
  weather: WeatherData;
};

export function WeatherBackground({ weather }: WeatherBackgroundProps) {
  const { videoSrc, config, city, description, sunInfo } = weather;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setOpacity(0);

    const timer = setTimeout(() => {
      video.src = videoSrc;
      video.load();
      void video.play();
      setOpacity(1);
    }, 800);

    return () => clearTimeout(timer);
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
          opacity,
          transition: "opacity 800ms ease",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "black",
          opacity: config.overlayOpacity,
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
    </div>
  );
}
