import { useState } from "react";

import GameScreen from "./components/GameScreen/GameScreen";
import { WeatherBackground } from "./components/GameScreen/WeatherBackground";
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

  const { weather, locationDenied } = useWeather();
  const { themeData, loading: themeLoading } = useTheme();

  const overlayOpacity = weather.config.overlayOpacity;

  const handleSubmit = (sentence: string, mode: Mode) => {
    if (!sentence.trim()) return;
    setSubmitData({ sentence, mode });
    setScreen("readout");
  };

  return (
    <>
      <WeatherBackground weather={weather} locationDenied={locationDenied} />

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
