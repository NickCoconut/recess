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
      `${CDN}/v1779859690/clear_day_1_ivcl5l.mp4`,
      `${CDN}/v1779859688/clear_day_2_igaupb.mp4`,
      `${CDN}/v1779860607/clear_day_3_bmauu8.mp4`,
    ],
    overlayOpacity: 0.45,
  },
  Clear_night: {
    videos: [
      `${CDN}/v1779859690/clear_night_1_qqxmdr.mp4`,
      `${CDN}/v1779859691/clear_night_2_uy6bii.mp4`,
      `${CDN}/v1779859692/clear_night_3_no6khf.mp4`,
    ],
    overlayOpacity: 0.25,
  },
  Cloudy: {
    videos: [
      `${CDN}/v1779999823/cloudy_1_pggpze.mp4`,
      `${CDN}/v1779859695/cloudy_2_xlkyxg.mp4`,
      `${CDN}/v1779859699/cloudy_3_br8tee.mp4`,
    ],
    overlayOpacity: 0.5,
  },
  Rain: {
    videos: [
      `${CDN}/v1779859705/rain_1_g2vqqr.mp4`,
      `${CDN}/v1779859707/rain_2_qkjnxh.mp4`,
      `${CDN}/v1779859708/rain_3_kv10pf.mp4`,
    ],
    overlayOpacity: 0.45,
  },
  Thunderstorm: {
    videos: [
      `${CDN}/v1779859714/thunderstorm_1_bamgam.mp4`,
      `${CDN}/v1779859714/thunderstorm_2_um6ooe.mp4`,
      `${CDN}/v1779859716/thunderstorm_3_rqytrt.mp4`,
    ],
    overlayOpacity: 0.25,
  },
  Snow: {
    videos: [
      `${CDN}/v1779859709/snow_1_fhe9cb.mp4`,
      `${CDN}/v1779859710/snow_2_r0gciu.mp4`,
      `${CDN}/v1779859711/snow_3_zsjn5v.mp4`,
    ],
    overlayOpacity: 0.5,
  },
  Atmosphere: {
    videos: [
      `${CDN}/v1779859702/fog_1_ui1xdc.mp4`,
      `${CDN}/v1779859703/fog_2_kevjbj.mp4`,
      `${CDN}/v1779859708/fog_3_rdlpme.mp4`,
    ],
    overlayOpacity: 0.35,
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
    return isNight ? "Clear_night" : "Cloudy";
  }
  return "Cloudy";
}
