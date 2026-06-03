import { useState } from "react";

import GameScreen from "./components/GameScreen/GameScreen";
import { WeatherBackground } from "./components/WeatherBackground/WeatherBackground";
import { TopBar } from "./components/TopBar/TopBar";
import VibeReadout, {
  type SubmitData,
} from "./components/VibeReadout/VibeReadout";
import { useTheme } from "./hooks/useTheme";
import { useWeather } from "./hooks/useWeather";

type Screen = "game" | "readout";

type Mode = "game" | "freewrite";

function App() {
  const [screen, setScreen] = useState<Screen>("game");
  const [submitData, setSubmitData] = useState<SubmitData | null>(null);
  const [userOpacity, setUserOpacity] = useState<number | null>(null);

  const { weather } = useWeather();
  const { themeData, loading: themeLoading } = useTheme();

  const overlayOpacity = userOpacity ?? weather.config.overlayOpacity;

  const handleSubmit = (sentence: string, mode: Mode) => {
    if (!sentence.trim()) return;
    setSubmitData({ sentence, mode });
    setScreen("readout");
  };

  return (
    <>
      <WeatherBackground weather={weather} />

      <TopBar opacity={overlayOpacity} onOpacityChange={setUserOpacity} />

      {screen === "game" ? (
        <GameScreen
          overlayOpacity={overlayOpacity}
          themeData={themeData}
          themeLoading={themeLoading}
          onSubmit={handleSubmit}
        />
      ) : (
        submitData && (
          <VibeReadout
            overlayOpacity={overlayOpacity}
            themeData={themeData}
            submitData={submitData}
          />
        )
      )}
    </>
  );
}

export default App;
