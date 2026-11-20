export interface ForecastDay {
  label: string; // "Today", "Sat", "Sun"
  dateIso: string;
  weatherCode: number;
  precipChance: number; // 0-100
  high: number;
  low: number;
}

export interface WeatherData {
  live: boolean;
  currentTemp: number;
  feelsLike: number;
  weatherCode: number;
  summary: string;
  sunset: string;
  sunrise: string;
  accumulationInches: number;
  uvLabel: string;
  uvIndex: number;
  forecast: ForecastDay[];
  updatedAt: string;
}

export interface TempestData {
  live: boolean;
  airTemperature: number; // °F
  feelsLike: number; // °F
  lightningCountLast1hr: number;
  precipAccumLocalDay: number; // inches
  relativeHumidity: number; // %
  windAvg: number; // mph
  updatedAt: string;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  startIso: string;
  endIso?: string;
  timeLabel: string; // "4:00 PM" or "All day"
  isAllDay: boolean;
  color: string; // hex color for left border
}

export interface CalendarDayColumn {
  dateIso: string; // YYYY-MM-DD
  dayNumber: string; // "20"
  dayLabel: string; // "Today", "Tomorrow", "Monday", "Tuesday"
  events: CalendarEventItem[];
}

export interface CalendarData {
  live: boolean;
  days: CalendarDayColumn[];
  updatedAt: string;
}

export interface SmartThingsData {
  live: boolean;
  thermostat: {
    name: string;
    currentTemp: number;
    setpoint: number;
    humidity: number;
    mode?: string;
  };
  lock: {
    name: string;
    state: "locked" | "unlocked" | "unknown";
    battery: number;
  };
  updatedAt: string;
}

export interface SpotifyData {
  live: boolean;
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumArtUrl?: string;
  progressMs?: number;
  durationMs?: number;
  updatedAt: string;
}

export interface BriefData {
  live: boolean;
  source: "gemini" | "feed" | "demo";
  headline: string;
  bullets: string[];
  updatedAt: string;
}

export interface WallpapersData {
  urls: string[];
  sourceCount: number;
}
