"use client";

import { useEffect, useState } from "react";
import { Droplets, Sunset, CloudRain, Sun, Settings } from "lucide-react";
import { FAMILY_CONFIG } from "@/config/family";
import type { WeatherData } from "@/lib/types";
import { WeatherIcon } from "./WeatherIcon";

interface TopBarProps {
  weather: WeatherData | null;
  onOpenSettings: () => void;
}

export function TopBar({ weather, onOpenSettings }: TopBarProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tz = FAMILY_CONFIG.location.timezone;

  const timeParts = now
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).formatToParts(now)
    : [];

  const hourMin = timeParts
    .filter((p) => p.type === "hour" || p.type === "minute" || p.type === "literal")
    .map((p) => p.value)
    .join("")
    .trim();

  const dayPeriod =
    timeParts.find((p) => p.type === "dayPeriod")?.value?.toUpperCase() || "";

  const dateLine = now
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(now)
    : "";

  const rainThreshold = FAMILY_CONFIG.alerts.highRainChanceThreshold;

  return (
    <header className="grid grid-cols-12 items-start gap-4 px-8 pt-6 pb-2">
      {/* Left: Greeting & Board Title */}
      <div className="col-span-4 flex flex-col justify-start pt-1">
        <span className="font-script text-3xl text-white/95 leading-none tracking-wide">
          {FAMILY_CONFIG.greetingPrefix}
        </span>
        <h1 className="mt-2 text-3xl font-light tracking-tight text-white">
          {FAMILY_CONFIG.boardTitle}
        </h1>
      </div>

      {/* Center: 77096 Current Weather + 3-Day Forecast */}
      <div className="col-span-5 flex flex-col items-center">
        {weather && (
          <>
            <div className="flex items-start gap-7 w-full justify-center">
              {/* Current conditions */}
              <div className="flex flex-col items-end text-right max-w-[195px]">
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-light tracking-tight text-white">
                    {weather.currentTemp}°
                  </span>
                  <WeatherIcon
                    code={weather.weatherCode}
                    className="w-8 h-8 text-white/90"
                  />
                </div>
                <span className="text-xs text-white/75 mt-0.5">
                  Feels like {weather.feelsLike}
                </span>
                <p className="text-[11px] leading-snug text-white/80 mt-1 line-clamp-3">
                  {weather.summary}
                </p>
              </div>

              {/* 3-day forecast */}
              <div className="flex items-start gap-6 pt-0.5">
                {weather.forecast.map((day) => {
                  const highRain = day.precipChance >= rainThreshold;
                  return (
                    <div
                      key={day.label}
                      className="flex flex-col items-center min-w-[54px]"
                    >
                      <span className="text-xs font-medium text-white/90">
                        {day.label}
                      </span>
                      <WeatherIcon
                        code={day.weatherCode}
                        className="w-6 h-6 text-white my-1.5"
                      />
                      <span
                        className={`flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                          highRain
                            ? "bg-sky-400/25 text-sky-200 ring-1 ring-sky-300/50"
                            : "text-white/70"
                        }`}
                      >
                        <Droplets className="w-2.5 h-2.5" />
                        {day.precipChance}%
                      </span>
                      <div className="mt-1 flex items-center gap-1.5 text-xs">
                        <span className="text-white font-medium">
                          {day.high}°
                        </span>
                        <span className="text-white/60">{day.low}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sub-bar: Sunset / Accumulation / UV */}
            <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-center gap-10 text-[11px] text-white/75 w-full max-w-[420px]">
              <div className="flex flex-col items-center">
                <span className="flex items-center gap-1 text-white/55 text-[10px]">
                  <Sunset className="w-3 h-3" /> Sunset
                </span>
                <span className="text-white/90 font-medium mt-0.5">
                  {weather.sunset}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="flex items-center gap-1 text-white/55 text-[10px]">
                  <CloudRain className="w-3 h-3" /> Accumulation
                </span>
                <span className="text-white/90 font-medium mt-0.5">
                  {weather.accumulationInches} in
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="flex items-center gap-1 text-white/55 text-[10px]">
                  <Sun className="w-3 h-3" /> UV
                </span>
                <span className="text-white/90 font-medium mt-0.5">
                  {weather.uvLabel}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right: Big Clock + Date + Gear Button */}
      <div className="col-span-3 flex flex-col items-end text-right relative">
        <button
          onClick={onOpenSettings}
          title="Dashboard Status & Controls"
          className="absolute -top-3 -right-4 p-1.5 rounded-full text-white/40 hover:text-white/90 hover:bg-white/10 transition"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="flex items-baseline gap-1.5 leading-none">
          <span className="text-7xl font-extralight tracking-tight text-white tabular-nums">
            {hourMin || "--:--"}
          </span>
          <span className="text-xl font-light text-white/80">{dayPeriod}</span>
        </div>
        <div className="mt-1.5 text-xl font-light text-white/85">
          {dateLine}
        </div>
      </div>
    </header>
  );
}
