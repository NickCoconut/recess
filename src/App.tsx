import { useState } from "react";

import GameScreen from "./components/GameScreen/GameScreen";
import ProfileView from "./components/Profile/ProfileView";
import { WeatherBackground } from "./components/WeatherBackground/WeatherBackground";
import { TopBar } from "./components/TopBar/TopBar";
import VibeReadout from "./components/VibeReadout/VibeReadout";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";
import { useWeather } from "./hooks/useWeather";
import { insertSentence } from "./lib/sentences";
import type { Mode, SubmitData } from "./types/types";

type Screen = "game" | "readout" | "profile";

function App() {
  const [screen, setScreen] = useState<Screen>("game");
  const [screenBeforeProfile, setScreenBeforeProfile] = useState<
    Exclude<Screen, "profile">
  >("game");
  const [submitData, setSubmitData] = useState<SubmitData | null>(null);
  const [userOpacity, setUserOpacity] = useState<number | null>(null);
  const [sentenceId, setSentenceId] = useState<string | null>(null);
  const [savedToProfile, setSavedToProfile] = useState(false);

  const { ensureSession, userId } = useAuth();
  const { weather } = useWeather();
  const { themeData, themeId, loading: themeLoading } = useTheme();

  const overlayOpacity = userOpacity ?? weather.config.overlayOpacity;

  const persistSentence = async (
    sentence: string,
    mode: Mode,
    isPublic: boolean,
  ) => {
    const known = !!weather.city;
    const params = {
      sentence,
      mode,
      themeId,
      weather: known ? weather.description : null,
      location: known ? weather.city : null,
      isPublic,
    };

    let row = await insertSentence(params);

    // The stored token can reference an anonymous user the cleanup cron already
    // reaped; the user_id foreign key then fails (23503). Recover transparently
    // by minting a fresh anonymous user and retrying the insert once.
    if (!row.id && row.errorCode === "23503") {
      await ensureSession(true);
      row = await insertSentence(params);
    }

    if (row.id) setSentenceId(row.id);
  };

  const handlePlayAgain = () => {
    setScreen("game");
    setSubmitData(null);
    setSentenceId(null);
    setSavedToProfile(false);
  };

  const handleSubmit = async (
    sentence: string,
    mode: Mode,
    isPublic: boolean,
  ) => {
    if (!sentence.trim()) return;
    await ensureSession();

    setSentenceId(null);
    setSavedToProfile(false);
    setSubmitData({ sentence, mode, isPublic });
    setScreen("readout");
    void persistSentence(sentence, mode, isPublic);
  };

  return (
    <>
      <WeatherBackground weather={weather} />

      <TopBar
        opacity={overlayOpacity}
        onOpacityChange={setUserOpacity}
        onSignOut={handlePlayAgain}
        onProfileClick={() => {
          if (screen !== "profile") {
            setScreenBeforeProfile(screen);
          }
          setScreen("profile");
        }}
        sentenceId={sentenceId}
      />

      {screen === "game" && (
        <GameScreen
          overlayOpacity={overlayOpacity}
          themeData={themeData}
          themeLoading={themeLoading}
          onSubmit={handleSubmit}
        />
      )}

      {submitData && (
        <div style={{ display: screen === "readout" ? "contents" : "none" }}>
          <VibeReadout
            overlayOpacity={overlayOpacity}
            themeData={themeData}
            submitData={submitData}
            sentenceId={sentenceId}
            saved={savedToProfile}
            onSaved={() => setSavedToProfile(true)}
            onPlayAgain={handlePlayAgain}
          />
        </div>
      )}

      {screen === "profile" && (
        <ProfileView
          overlayOpacity={overlayOpacity}
          userId={userId}
          onClose={() => setScreen(screenBeforeProfile)}
        />
      )}
    </>
  );
}

export default App;
