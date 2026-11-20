import { NextResponse } from "next/server";
import type { TempestData } from "@/lib/types";

export const dynamic = "force-dynamic";

function cToF(c: number): number {
  return Number(((c * 9) / 5 + 32).toFixed(1));
}

function msToMph(ms: number): number {
  return Number((ms * 2.23694).toFixed(2));
}

function mmToInches(mm: number): number {
  return Number((mm / 25.4).toFixed(2));
}

const DEMO_TEMPEST: TempestData = {
  live: false,
  airTemperature: 54.7,
  feelsLike: 54.7,
  lightningCountLast1hr: 0,
  precipAccumLocalDay: 0,
  relativeHumidity: 98,
  windAvg: 2.95,
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  const token = process.env.TEMPEST_API_TOKEN;
  const stationId = process.env.TEMPEST_STATION_ID;

  if (!token || !stationId) {
    return NextResponse.json({
      ...DEMO_TEMPEST,
      updatedAt: new Date().toISOString(),
    });
  }

  try {
    const res = await fetch(
      `https://swd.weatherflow.com/swd/rest/observations/station/${encodeURIComponent(
        stationId
      )}?token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Tempest HTTP ${res.status}`);
    }

    const data = await res.json();
    const obs = data?.obs?.[0];
    if (!obs) {
      throw new Error("No observations returned from Tempest");
    }

    // WeatherFlow station observation API returns metric units by default
    const payload: TempestData = {
      live: true,
      airTemperature: cToF(Number(obs.air_temperature ?? 0)),
      feelsLike: cToF(Number(obs.feels_like ?? obs.air_temperature ?? 0)),
      lightningCountLast1hr: Number(obs.lightning_strike_count_last_1hr ?? 0),
      precipAccumLocalDay: mmToInches(
        Number(obs.precip_accum_local_day_final ?? obs.precip_accum_local_day ?? 0)
      ),
      relativeHumidity: Math.round(Number(obs.relative_humidity ?? 0)),
      windAvg: msToMph(Number(obs.wind_avg ?? 0)),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({
      ...DEMO_TEMPEST,
      updatedAt: new Date().toISOString(),
    });
  }
}
