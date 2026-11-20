export interface CountdownEvent {
  title: string;
  /** Month (1-12) */
  month: number;
  /** Day of month (1-31) */
  day: number;
  /** If set, targets a specific year; if omitted, repeats every year */
  year?: number;
}

export const FAMILY_CONFIG = {
  greetingPrefix: "Welcome to",
  boardTitle: "Hokanson Family Central",

  /** Houston, TX 77096 */
  location: {
    zip: "77096",
    city: "Houston, TX",
    lat: 29.6697,
    lon: -95.4855,
    timezone: "America/Chicago",
  },

  /** Guest WiFi details + automatic QR code */
  guestWifi: {
    label: "Guest Wifi",
    ssid: "Pawnee City Hall Guest",
    password: "DukeSilver",
    /** WPA, WEP, or nopass */
    encryption: "WPA" as "WPA" | "WEP" | "nopass",
  },

  /**
   * "Up Next" Countdown Tiles
   * Automatically rolls over to next year once a date passes (unless year is specified).
   */
  countdowns: [
    { title: "Thanksgiving", month: 11, day: 26, year: 2026 },
    { title: "Ellis's Birthday", month: 12, day: 30 },
    { title: "Cohen's Birthday", month: 3, day: 12 },
    { title: "Christmas", month: 12, day: 25 },
  ] as CountdownEvent[],

  /** How many countdown cards to show at once */
  maxCountdownsVisible: 3,

  /** Smart Visual Alerts thresholds */
  alerts: {
    /** Highlight unlocked back door starting at this hour (24h, e.g., 21 = 9:00 PM) */
    lockAlertStartHour: 21,
    /** Stop highlighting unlocked back door at this hour (e.g., 6 = 6:00 AM) */
    lockAlertEndHour: 6,
    /** Highlight lock battery below this percentage */
    lowBatteryThreshold: 20,
    /** Highlight rain chance at or above this percentage */
    highRainChanceThreshold: 40,
  },

  /**
   * Background rotation settings (anti-burn-in)
   * Rotates every 10 minutes through your Basic Apple Guy wallpaper list.
   */
  background: {
    rotationMinutes: 10,
    /**
     * Source blog pages from Basic Apple Guy — our /api/wallpapers route
     * automatically discovers the wallpaper image URLs from these pages
     * and caches them for 24 hours.
     */
    basicAppleGuyPages: [
      "https://basicappleguy.com/basicappleblog/soundwav",
      "https://basicappleguy.com/basicappleblog/fluted-gradients-february-2026-edition",
      "https://basicappleguy.com/basicappleblog/hive",
      "https://basicappleguy.com/basicappleblog/gradients-of-september-2025-edition",
      "https://basicappleguy.com/basicappleblog/gradients-april-2025-edition",
      "https://basicappleguy.com/basicappleblog/fluted-gradients",
      "https://basicappleguy.com/basicappleblog/clear-wallpapers",
    ],
    /**
     * Optional: Paste your exact direct image URLs from DakBoard here.
     * If you add URLs here, they will be included first in the rotation!
     */
    customWallpaperUrls: [] as string[],
  },

  /** Refresh intervals in milliseconds */
  refreshIntervals: {
    weatherMs: 15 * 60 * 1000, // 15 min
    tempestMs: 60 * 1000, // 1 min
    calendarMs: 5 * 60 * 1000, // 5 min
    smartthingsMs: 60 * 1000, // 1 min
    spotifyMs: 10 * 1000, // 10 sec
    briefMs: 60 * 60 * 1000, // 1 hour
  },
};
