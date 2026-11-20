"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Thermometer,
  Zap,
  CloudRain,
  Droplets,
  Wind,
  Sunrise,
  Sunset,
  Gauge,
  Lock,
  LockOpen,
  Battery,
  BatteryWarning,
  Wifi,
} from "lucide-react";
import { FAMILY_CONFIG, type CountdownEvent } from "@/config/family";
import type { SmartThingsData, TempestData, WeatherData } from "@/lib/types";

interface RightWidgetsProps {
  tempest: TempestData | null;
  smartthings: SmartThingsData | null;
  weather: WeatherData | null;
  previewLockAlert?: boolean;
}

function daysUntil(event: CountdownEvent): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let targetYear = event.year ?? now.getFullYear();
  let target = new Date(targetYear, event.month - 1, event.day);

  if (!event.year && target < today) {
    targetYear += 1;
    target = new Date(targetYear, event.month - 1, event.day);
  }

  const diffMs = target.getTime() - today.getTime();
  return Math.max(0, Math.round(diffMs / 86400000));
}

export function RightWidgets({
  tempest,
  smartthings,
  weather,
  previewLockAlert = false,
}: RightWidgetsProps) {
  const [wifiQrSvg, setWifiQrSvg] = useState<string>("");

  useEffect(() => {
    const { ssid, password, encryption } = FAMILY_CONFIG.guestWifi;
    const esc = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
    const wifiPayload = `WIFI:T:${encryption};S:${esc(ssid)};P:${esc(password)};;`;

    QRCode.toString(wifiPayload, {
      type: "svg",
      margin: 1,
      width: 68,
      color: {
        dark: "#ffffff",
        light: "#00000000",
      },
    })
      .then(setWifiQrSvg)
      .catch(() => setWifiQrSvg(""));
  }, []);

  // Compute upcoming countdowns sorted soonest first
  const countdowns = FAMILY_CONFIG.countdowns
    .map((ev) => ({ ...ev, days: daysUntil(ev) }))
    .filter((ev) => ev.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, FAMILY_CONFIG.maxCountdownsVisible);

  // Smart Visual Alerts logic
  const currentHour = new Date().getHours();
  const isNightTime =
    currentHour >= FAMILY_CONFIG.alerts.lockAlertStartHour ||
    currentHour < FAMILY_CONFIG.alerts.lockAlertEndHour;

  const lockState = previewLockAlert
    ? "unlocked"
    : smartthings?.lock.state ?? "locked";
  const lockBattery = smartthings?.lock.battery ?? 90;
  const lockIsAlert =
    (lockState === "unlocked" && (isNightTime || previewLockAlert)) ||
    lockBattery < FAMILY_CONFIG.alerts.lowBatteryThreshold;

  const lightningCount = tempest?.lightningCountLast1hr ?? 0;
  const lightningAlert = lightningCount > 0;

  return (
    <aside className="flex flex-col justify-between h-full gap-4">
      {/* Upper Right: Tempest Grid + Sunrise/Sunset & Countdowns */}
      <div className="grid grid-cols-12 gap-4 items-start">
        {/* Hokanson Weather Station (Tempest) */}
        <div className="col-span-8 flex flex-col">
          <h2 className="text-xs font-medium text-white/75 text-center mb-2.5 tracking-wide">
            Hokanson Weather Station
          </h2>
          {tempest && (
            <div className="grid grid-cols-3 gap-x-2 gap-y-4 text-center">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/60 h-6 flex items-end justify-center leading-tight">
                  Air Temperature
                </span>
                <Thermometer
                  className="w-6 h-6 text-white/85 my-1"
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium text-white tabular-nums">
                  {tempest.airTemperature}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/60 h-6 flex items-end justify-center leading-tight">
                  Feels Like
                </span>
                <Thermometer
                  className="w-6 h-6 text-white/85 my-1"
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium text-white tabular-nums">
                  {tempest.feelsLike}
                </span>
              </div>

              <div
                className={`flex flex-col items-center rounded-md py-0.5 transition ${
                  lightningAlert
                    ? "bg-amber-500/25 ring-1 ring-amber-400/70 alert-pulse"
                    : ""
                }`}
              >
                <span className="text-[10px] text-white/60 h-6 flex items-end justify-center leading-tight px-1">
                  Lightning Strikes 1hr
                </span>
                <Zap
                  className={`w-6 h-6 my-1 ${
                    lightningAlert ? "text-amber-300" : "text-white/85"
                  }`}
                  strokeWidth={1.5}
                />
                <span
                  className={`text-sm font-medium tabular-nums ${
                    lightningAlert ? "text-amber-200" : "text-white"
                  }`}
                >
                  {lightningCount}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/60 h-6 flex items-end justify-center leading-tight">
                  Precip Local Day
                </span>
                <CloudRain
                  className="w-6 h-6 text-white/85 my-1"
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium text-white tabular-nums">
                  {tempest.precipAccumLocalDay}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/60 h-6 flex items-end justify-center leading-tight">
                  Relative Humidity
                </span>
                <Droplets
                  className="w-6 h-6 text-white/85 my-1"
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium text-white tabular-nums">
                  {tempest.relativeHumidity}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/60 h-6 flex items-end justify-center leading-tight">
                  Wind Avg
                </span>
                <Wind
                  className="w-6 h-6 text-white/85 my-1"
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium text-white tabular-nums">
                  {tempest.windAvg}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sunrise/Sunset + Up Next Countdowns */}
        <div className="col-span-4 flex flex-col gap-3">
          {weather && (
            <div className="flex items-center justify-center gap-3 text-xs text-white/85">
              <span className="flex items-center gap-1">
                <Sunrise className="w-3.5 h-3.5 text-amber-200/80" />
                {weather.sunrise}
              </span>
              <span className="flex items-center gap-1">
                <Sunset className="w-3.5 h-3.5 text-orange-200/80" />
                {weather.sunset.toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {countdowns.map((ev) => (
              <div key={ev.title} className="flex flex-col">
                <span className="text-[11px] font-medium text-white/85 mb-1">
                  {ev.title}
                </span>
                <div className="glass-card rounded-sm py-2 px-3 flex flex-col items-center justify-center">
                  <span className="text-2xl font-light text-white leading-none tabular-nums">
                    {ev.days}
                  </span>
                  <span className="text-[9px] tracking-widest uppercase text-white/65 mt-1">
                    {ev.days === 1 ? "DAY" : "DAYS"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Right: Home Temperature (Nest) + Back Door Lock (Kwikset) + Guest WiFi QR */}
      <div className="flex flex-col items-center gap-5 pb-2">
        <div className="flex items-center justify-center gap-12 w-full">
          {/* Home Temperature */}
          {smartthings && (
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-white/80">
                {smartthings.thermostat.name}
              </span>
              <span className="text-5xl font-extralight text-white mt-0.5 tabular-nums">
                {smartthings.thermostat.currentTemp}°
              </span>
              <div className="flex items-center gap-3 mt-1 text-xs text-white/75">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-white/70" />
                  {smartthings.thermostat.setpoint}°
                </span>
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-white/70" />
                  {smartthings.thermostat.humidity}%
                </span>
              </div>
            </div>
          )}

          {/* Back Door Lock with Smart Visual Alert */}
          <div
            className={`flex flex-col items-center rounded-lg px-4 py-2 transition ${
              lockIsAlert
                ? "bg-red-500/25 ring-1 ring-red-400/75 alert-pulse"
                : ""
            }`}
          >
            <span className="text-xs font-medium text-white/80">
              {smartthings?.lock.name || "Back Door Lock"}
            </span>
            <div className="my-1.5">
              {lockState === "unlocked" ? (
                <LockOpen
                  className={`w-8 h-8 ${
                    lockIsAlert ? "text-red-300" : "text-amber-300"
                  }`}
                  strokeWidth={1.6}
                />
              ) : (
                <Lock className="w-8 h-8 text-white/90" strokeWidth={1.6} />
              )}
            </div>
            <span
              className={`text-sm font-medium capitalize ${
                lockIsAlert ? "text-red-200" : "text-white/90"
              }`}
            >
              {lockState}
            </span>
            <span
              className={`flex items-center gap-1 text-[11px] mt-0.5 ${
                lockBattery < FAMILY_CONFIG.alerts.lowBatteryThreshold
                  ? "text-amber-300 font-semibold"
                  : "text-white/70"
              }`}
            >
              {lockBattery < FAMILY_CONFIG.alerts.lowBatteryThreshold ? (
                <BatteryWarning className="w-3.5 h-3.5" />
              ) : (
                <Battery className="w-3.5 h-3.5" />
              )}
              {lockBattery}%
            </span>
          </div>
        </div>

        {/* Guest WiFi + Scannable QR Code */}
        <div className="flex items-center gap-4 glass-card-dark rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Wifi className="w-6 h-6 text-white/85 shrink-0" strokeWidth={1.6} />
            <div className="text-xs leading-snug">
              <div className="text-white/65">{FAMILY_CONFIG.guestWifi.label}</div>
              <div className="text-white font-medium">
                {FAMILY_CONFIG.guestWifi.ssid}
              </div>
              <div className="text-white/80">
                Password: {FAMILY_CONFIG.guestWifi.password}
              </div>
            </div>
          </div>

          {wifiQrSvg && (
            <div
              className="w-[62px] h-[62px] rounded bg-white/10 p-1 shrink-0"
              title="Scan to join Guest WiFi"
              dangerouslySetInnerHTML={{ __html: wifiQrSvg }}
            />
          )}
        </div>
      </div>
    </aside>
  );
}
