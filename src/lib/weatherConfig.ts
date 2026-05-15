export type WeatherGroup =
  | "Clear_day"
  | "Clear_night"
  | "Cloudy"
  | "Rain"
  | "Thunderstorm"
  | "Snow"
  | "Atmosphere";

export type WeatherConfig = {
  videos: [string, string, string];
  overlayOpacity: number;
};

const CDN = "https://res.cloudinary.com/recessprod/video/upload/q_auto,f_auto";

export const weatherConfig: Record<WeatherGroup, WeatherConfig> = {
  Clear_day: {
    videos: [
      `${CDN}/v1778703879/clear_day_1_zfknxe.mp4`,
      `${CDN}/v1778703879/clear_day_1_zfknxe.mp4`,
      `${CDN}/v1778703879/clear_day_1_zfknxe.mp4`,
    ],
    overlayOpacity: 0.25,
  },
  Clear_night: {
    videos: [
      `${CDN}/v1778703879/clear_night_1_lkyuiw.mp4`,
      `${CDN}/v1778703879/clear_night_1_lkyuiw.mp4`,
      `${CDN}/v1778703879/clear_night_1_lkyuiw.mp4`,
    ],
    overlayOpacity: 0.35,
  },
  Cloudy: {
    videos: [
      `${CDN}/v1778703879/cloudy_1_dbpibv.mp4`,
      `${CDN}/v1778703879/cloudy_1_dbpibv.mp4`,
      `${CDN}/v1778703879/cloudy_1_dbpibv.mp4`,
    ],
    overlayOpacity: 0.45,
  },
  Rain: {
    videos: [
      `${CDN}/v1778703879/rain_1_ks9l2y.mp4`,
      `${CDN}/v1778703879/rain_1_ks9l2y.mp4`,
      `${CDN}/v1778703879/rain_1_ks9l2y.mp4`,
    ],
    overlayOpacity: 0.5,
  },
  Thunderstorm: {
    videos: [
      `${CDN}/v1778703879/thunderstorm_1_jqpfho.mp4`,
      `${CDN}/v1778703879/thunderstorm_1_jqpfho.mp4`,
      `${CDN}/v1778703879/thunderstorm_1_jqpfho.mp4`,
    ],
    overlayOpacity: 0.6,
  },
  Snow: {
    videos: [
      `${CDN}/v1778703879/snow_1_ivvpt8.mp4`,
      `${CDN}/v1778703879/snow_1_ivvpt8.mp4`,
      `${CDN}/v1778703879/snow_1_ivvpt8.mp4`,
    ],
    overlayOpacity: 0.3,
  },
  Atmosphere: {
    videos: [
      `${CDN}/v1778703880/foggy_1_nj91ky.mp4`,
      `${CDN}/v1778703880/foggy_1_nj91ky.mp4`,
      `${CDN}/v1778703880/foggy_1_nj91ky.mp4`,
    ],
    overlayOpacity: 0.45,
  },
};

export function getRandomVideo(config: WeatherConfig): string {
  const index = Math.floor(Math.random() * config.videos.length);
  return config.videos[index];
}

export function getWeatherGroup(
  conditionCode: number,
  iconCode: string,
): WeatherGroup {
  const isNight = iconCode.endsWith("n");

  if (conditionCode === 800) {
    return isNight ? "Clear_night" : "Clear_day";
  }
  if (conditionCode >= 200 && conditionCode < 300) {
    return "Thunderstorm";
  }
  if (conditionCode >= 300 && conditionCode < 400) {
    return "Rain";
  }
  if (conditionCode >= 500 && conditionCode < 600) {
    return "Rain";
  }
  if (conditionCode >= 600 && conditionCode < 700) {
    return "Snow";
  }
  if (conditionCode >= 700 && conditionCode < 800) {
    return "Atmosphere";
  }
  if (conditionCode >= 801 && conditionCode <= 804) {
    return "Cloudy";
  }
  return "Cloudy";
}
