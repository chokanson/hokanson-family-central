"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Maximize2, Image as ImageIcon, CheckCircle2, CircleDashed } from "lucide-react";
import { FAMILY_CONFIG } from "@/config/family";
import type {
  BriefData,
  CalendarData,
  SmartThingsData,
  SpotifyData,
  TempestData,
  WallpapersData,
  WeatherData,
} from "@/lib/types";
import { TopBar } from "./TopBar";
import { CalendarGrid } from "./CalendarGrid";
import { RightWidgets } from "./RightWidgets";
import { BottomLeftDock } from "./BottomLeftDock";

/** Built-in dark wave gradient fallback matching the DakBoard screenshot */
function FallbackWaveBackdrop() {
  return (
    <svg
      className="absolute inset-0 w-full h-full object-cover"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1b2a41" />
          <stop offset="50%" stopColor="#2c3e55" />
          <stop offset="100%" stopColor="#121c2b" />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#bgGrad)" />
      <path
        d="M0,260 C380,140 720,420 1160,250 C1520,110 1740,210 1920,170 L1920,1080 L0,1080 Z"
        fill="#394d66"
        opacity="0.55"
      />
      <path
        d="M0,520 C420,390 790,690 1240,460 C1580,290 1780,410 1920,350 L1920,1080 L0,1080 Z"
        fill="#192536"
        opacity="0.72"
      />
      <path
        d="M0,780 C440,620 880,930 1340,700 C1640,550 1810,670 1920,620 L1920,1080 L0,1080 Z"
        fill="#2e4159"
        opacity="0.65"
      />
    </svg>
  );
}

export function Dashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [tempest, setTempest] = useState<TempestData | null>(null);
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [smartthings, setSmartthings] = useState<SmartThingsData | null>(null);
  const [spotify, setSpotify] = useState<SpotifyData | null>(null);
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [wallpapers, setWallpapers] = useState<string[]>([]);
  const [wpIndex, setWpIndex] = useState(0);

  // Subtle anti-burn-in pixel shift (rotates 0..2px every 15 minutes)
  const [pixelShift, setPixelShift] = useState({ x: 0, y: 0 });

  // Settings drawer + preview toggles
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewSpotify, setPreviewSpotify] = useState(false);
  const [previewLockAlert, setPreviewLockAlert] = useState(false);

  const briefLoadedRef = useRef(false);

  const fetchJson = useCallback(async <T,>(url: string): Promise<T | null> => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }, []);

  // Load wallpapers once
  useEffect(() => {
    fetchJson<WallpapersData>("/api/wallpapers").then((data) => {
      if (data?.urls?.length) {
        setWallpapers(data.urls);
        setWpIndex(Math.floor(Math.random() * data.urls.length));
      }
    });
  }, [fetchJson]);

  // Rotate wallpaper every 10 minutes
  useEffect(() => {
    if (wallpapers.length <= 1) return;
    const ms = FAMILY_CONFIG.background.rotationMinutes * 60 * 1000;
    const id = setInterval(() => {
      setWpIndex((prev) => (prev + 1) % wallpapers.length);
    }, ms);
    return () => clearInterval(id);
  }, [wallpapers]);

  // Anti-burn-in gentle pixel shift every 15 minutes
  useEffect(() => {
    const offsets = [
      { x: 0, y: 0 },
      { x: 2, y: 1 },
      { x: -1, y: 2 },
      { x: -2, y: -1 },
      { x: 1, y: -2 },
    ];
    let step = 0;
    const id = setInterval(() => {
      step = (step + 1) % offsets.length;
      setPixelShift(offsets[step]);
    }, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Poll Weather, Tempest, Calendar, SmartThings, Spotify
  useEffect(() => {
    const loadWeather = () =>
      fetchJson<WeatherData>("/api/weather").then((d) => d && setWeather(d));
    const loadTempest = () =>
      fetchJson<TempestData>("/api/tempest").then((d) => d && setTempest(d));
    const loadCalendar = () =>
      fetchJson<CalendarData>("/api/calendar").then((d) => d && setCalendar(d));
    const loadSmartThings = () =>
      fetchJson<SmartThingsData>("/api/smartthings").then(
        (d) => d && setSmartthings(d)
      );
    const loadSpotify = () =>
      fetchJson<SpotifyData>("/api/spotify").then((d) => d && setSpotify(d));

    loadWeather();
    loadTempest();
    loadCalendar();
    loadSmartThings();
    loadSpotify();

    const t1 = setInterval(loadWeather, FAMILY_CONFIG.refreshIntervals.weatherMs);
    const t2 = setInterval(loadTempest, FAMILY_CONFIG.refreshIntervals.tempestMs);
    const t3 = setInterval(loadCalendar, FAMILY_CONFIG.refreshIntervals.calendarMs);
    const t4 = setInterval(
      loadSmartThings,
      FAMILY_CONFIG.refreshIntervals.smartthingsMs
    );
    const t5 = setInterval(loadSpotify, FAMILY_CONFIG.refreshIntervals.spotifyMs);

    return () => {
      clearInterval(t1);
      clearInterval(t2);
      clearInterval(t3);
      clearInterval(t4);
      clearInterval(t5);
    };
  }, [fetchJson]);

  // Fetch Gemini Daily Family Brief once weather & calendar are ready (and hourly)
  useEffect(() => {
    if (!weather || !calendar) return;

    const loadBrief = async () => {
      try {
        const res = await fetch("/api/brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weather: {
              currentTemp: weather.currentTemp,
              summary: weather.summary,
              forecast: weather.forecast,
            },
            upcomingDays: calendar.days.slice(0, 2),
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as BriefData;
          setBrief(data);
        }
      } catch {
        // Ignore transient errors
      }
    };

    if (!briefLoadedRef.current) {
      briefLoadedRef.current = true;
      loadBrief();
    }

    const id = setInterval(loadBrief, FAMILY_CONFIG.refreshIntervals.briefMs);
    return () => clearInterval(id);
  }, [weather, calendar]);

  const currentWallpaper = wallpapers[wpIndex];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const statusRows = [
    { label: "77096 Weather (Open-Meteo + NWS)", live: !!weather?.live },
    { label: "Tempest Weather Station", live: !!tempest?.live },
    { label: "Google Family Calendar", live: !!calendar?.live },
    { label: "SmartThings (Nest + Kwikset)", live: !!smartthings?.live },
    { label: "Spotify Now Spinning", live: !!spotify?.live },
    { label: "Gemini Daily Brief", live: !!brief?.live },
  ];

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-[#0e1621]">
      {/* Rotating Background Layer */}
      <FallbackWaveBackdrop />
      {currentWallpaper && (
        <div
          key={currentWallpaper}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url("${currentWallpaper}")` }}
        />
      )}
      {/* Subtle dark scrim so white typography stays crisp on any Basic Apple Guy wallpaper */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-950/30 to-slate-950/55" />

      {/* Main Kiosk Grid with Anti-Burn-In Micro Shift */}
      <div
        className="relative z-10 flex flex-col h-full w-full transition-transform duration-1000"
        style={{ transform: `translate(${pixelShift.x}px, ${pixelShift.y}px)` }}
      >
        <TopBar
          weather={weather}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <div className="flex-1 grid grid-cols-12 gap-6 px-8 pt-4 pb-6 min-h-0">
          {/* Left 8 Columns: 4-Day Calendar + Bottom-Left Dock (Spotify + Gemini Brief) */}
          <div className="col-span-8 flex flex-col justify-between min-h-0">
            <CalendarGrid calendar={calendar} />
            <BottomLeftDock
              spotify={spotify}
              brief={brief}
              previewSpotify={previewSpotify}
            />
          </div>

          {/* Right 4 Columns: Tempest, Sunrise/Sunset, Countdowns, Nest, Lock, Guest WiFi QR */}
          <div className="col-span-4 min-h-0">
            <RightWidgets
              tempest={tempest}
              smartthings={smartthings}
              weather={weather}
              previewLockAlert={previewLockAlert}
            />
          </div>
        </div>
      </div>

      {/* Quick Status & Controls Drawer */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-80 h-full bg-slate-900/95 border-l border-white/10 p-6 flex flex-col justify-between text-white">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-medium">Dashboard Controls</h3>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="p-1 rounded hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 mb-6">
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Widget Connection Status
                </div>
                {statusRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-white/5"
                  >
                    <span className="text-white/85">{row.label}</span>
                    {row.live ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Live
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-300/80">
                        <CircleDashed className="w-3.5 h-3.5" /> Demo
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Preview & Kiosk Tools
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 py-2 text-xs font-medium transition"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Toggle Fullscreen
                </button>
                {wallpapers.length > 1 && (
                  <button
                    onClick={() =>
                      setWpIndex((prev) => (prev + 1) % wallpapers.length)
                    }
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 py-2 text-xs font-medium transition"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Next Wallpaper (
                    {wpIndex + 1}/{wallpapers.length})
                  </button>
                )}
                <label className="flex items-center justify-between text-xs pt-2 cursor-pointer">
                  <span className="text-white/80">Preview Spotify Card</span>
                  <input
                    type="checkbox"
                    checked={previewSpotify}
                    onChange={(e) => setPreviewSpotify(e.target.checked)}
                    className="accent-emerald-400"
                  />
                </label>
                <label className="flex items-center justify-between text-xs pt-1 cursor-pointer">
                  <span className="text-white/80">Preview Night Lock Alert</span>
                  <input
                    type="checkbox"
                    checked={previewLockAlert}
                    onChange={(e) => setPreviewLockAlert(e.target.checked)}
                    className="accent-red-400"
                  />
                </label>
              </div>
            </div>

            <div className="text-[11px] text-white/45 leading-relaxed">
              Add API keys in Vercel → Project Settings → Environment Variables
              to switch widgets from Demo to Live.
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
