import { Analytics } from "@vercel/analytics/react";
import { useState } from "react";

import GameScreen from "./components/GameScreen/GameScreen";
import ProfileView from "./components/Profile/ProfileView";
import { WeatherBackground } from "./components/WeatherBackground/WeatherBackground";
import { TopBar } from "./components/TopBar/TopBar";
import VibeReadout from "./components/VibeReadout/VibeReadout";
import { useAuth } from "./hooks/useAuth";
import { useRecessDate } from "./hooks/useRecessDate";
import { useTheme } from "./hooks/useTheme";
import { useWeather } from "./hooks/useWeather";
import type { ThemeData } from "./lib/anthropic";
import { insertSentence } from "./lib/sentences";
import type { Mode, SubmitData } from "./types/types";

type Screen = "game" | "readout" | "profile";

function App() {
  const [screen, setScreen] = useState<Screen>("game");
  const [screenBeforeProfile, setScreenBeforeProfile] = useState<
    Exclude<Screen, "profile">
  >("game");
  const [submitData, setSubmitData] = useState<SubmitData | null>(null);
  const [submissionDate, setSubmissionDate] = useState<string | null>(null);
  const [submittedTheme, setSubmittedTheme] = useState<ThemeData | null>(null);
  const [userOpacity, setUserOpacity] = useState<number | null>(null);
  const [sentenceId, setSentenceId] = useState<string | null>(null);
  const [savedToProfile, setSavedToProfile] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0.35);

  const { ensureSession, userId } = useAuth();
  const { weather } = useWeather();
  const { recessDate, refreshSignal } = useRecessDate();
  const {
    themeData,
    themeId,
    themeDate,
    loading: themeLoading,
  } = useTheme(recessDate, refreshSignal);

  const overlayOpacity = userOpacity ?? weather.config.overlayOpacity;
  const themeReady = themeDate === recessDate && themeData !== null;
  const isNewDay =
    submissionDate !== null && submissionDate !== recessDate;

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
    setSubmissionDate(null);
    setSubmittedTheme(null);
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
    setSubmissionDate(recessDate);
    setSubmittedTheme(themeReady ? themeData : null);
    setSubmitData({ sentence, mode, isPublic });
    setScreen("readout");
    void persistSentence(sentence, mode, isPublic);
  };

  return (
    <>
      <Analytics />
      <WeatherBackground
        weather={weather}
        soundEnabled={soundEnabled}
        soundVolume={soundVolume}
      />

      <TopBar
        opacity={overlayOpacity}
        onOpacityChange={setUserOpacity}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled((enabled) => !enabled)}
        soundVolume={soundVolume}
        onSoundVolumeChange={setSoundVolume}
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
          themeData={themeReady ? themeData : null}
          themeLoading={themeLoading || !themeReady}
          recessDate={recessDate}
          onSubmit={handleSubmit}
        />
      )}

      {submitData && (
        <div style={{ display: screen === "readout" ? "contents" : "none" }}>
          <VibeReadout
            overlayOpacity={overlayOpacity}
            themeData={submittedTheme}
            submitData={submitData}
            sentenceId={sentenceId}
            isNewDay={isNewDay}
            canPlayToday={isNewDay && themeReady}
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
