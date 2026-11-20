import { NextResponse } from "next/server";
import { FAMILY_CONFIG } from "@/config/family";
import type { WeatherData, ForecastDay } from "@/lib/types";

export const revalidate = 900; // 15 minutes

function uvToLabel(uv: number): string {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}

function formatTime12h(isoString: string): string {
  // Open-Meteo returns local ISO like "2026-11-20T17:24" when timezone is set
  const timePart = isoString.split("T")[1];
  if (!timePart) return "";
  const [hStr, mStr] = timePart.split(":");
  const h = Number(hStr);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr}${ampm}`;
}

function formatTimeUpper12h(isoString: string): string {
  const timePart = isoString.split("T")[1];
  if (!timePart) return "";
  const [hStr, mStr] = timePart.split(":");
  const h = Number(hStr);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${ampm}`;
}

function wmoSummary(code: number, high: number, low: number): string {
  const descMap: Record<number, string> = {
    0: "Clear skies.",
    1: "Mainly clear.",
    2: "Partly cloudy.",
    3: "Mostly cloudy.",
    45: "Foggy.",
    48: "Depositing rime fog.",
    51: "Light drizzle.",
    53: "Moderate drizzle.",
    55: "Dense drizzle.",
    61: "Light rain.",
    63: "Moderate rain.",
    65: "Heavy rain.",
    80: "Rain showers.",
    81: "Moderate showers.",
    82: "Heavy showers.",
    95: "Thunderstorms.",
    96: "Thunderstorms with hail.",
  };
  const desc = descMap[code] || "Partly cloudy.";
  return `${desc} High near ${Math.round(high)}° and low near ${Math.round(low)}°.`;
}

async function fetchNwsSummary(lat: number, lon: number): Promise<string | null> {
  try {
    const headers = {
      "User-Agent": "HokansonFamilyCentral/1.0 (personal-home-dashboard)",
      Accept: "application/geo+json",
    };
    const pointRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
      headers,
      next: { revalidate: 86400 },
    });
    if (!pointRes.ok) return null;
    const pointJson = await pointRes.json();
    const forecastUrl: string | undefined = pointJson?.properties?.forecast;
    if (!forecastUrl) return null;

    const forecastRes = await fetch(forecastUrl, {
      headers,
      next: { revalidate: 1800 },
    });
    if (!forecastRes.ok) return null;
    const forecastJson = await forecastRes.json();
    const firstPeriod = forecastJson?.properties?.periods?.[0];
    if (!firstPeriod?.detailedForecast) return null;

    // Keep summary concise (first 2 sentences)
    const sentences = String(firstPeriod.detailedForecast)
      .split(/(?<=\.)\s+/)
      .slice(0, 2)
      .join(" ");
    return sentences;
  } catch {
    return null;
  }
}

export async function GET() {
  const { lat, lon, timezone } = FAMILY_CONFIG.location;

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set(
      "current",
      "temperature_2m,apparent_temperature,weather_code"
    );
    url.searchParams.set(
      "daily",
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,uv_index_max,sunrise,sunset"
    );
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("precipitation_unit", "inch");
    url.searchParams.set("timezone", timezone);
    url.searchParams.set("forecast_days", "4");

    const [omRes, nwsSummary] = await Promise.all([
      fetch(url.toString(), { next: { revalidate: 900 } }),
      fetchNwsSummary(lat, lon),
    ]);

    if (!omRes.ok) {
      throw new Error(`Open-Meteo HTTP ${omRes.status}`);
    }

    const data = await omRes.json();
    const daily = data.daily;
    const current = data.current;

    const forecast: ForecastDay[] = [0, 1, 2].map((idx) => {
      const dateIso: string = daily.time[idx];
      let label = "Today";
      if (idx > 0) {
        const [y, m, d] = dateIso.split("-").map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        label = dt.toLocaleDateString("en-US", {
          weekday: "short",
          timeZone: "UTC",
        });
      }
      return {
        label,
        dateIso,
        weatherCode: daily.weather_code[idx] ?? 0,
        precipChance: Math.round(daily.precipitation_probability_max[idx] ?? 0),
        high: Math.round(daily.temperature_2m_max[idx] ?? 0),
        low: Math.round(daily.temperature_2m_min[idx] ?? 0),
      };
    });

    const uvIndex = Number(daily.uv_index_max?.[0] ?? 0);
    const payload: WeatherData = {
      live: true,
      currentTemp: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      weatherCode: current.weather_code ?? 0,
      summary:
        nwsSummary ||
        wmoSummary(
          current.weather_code ?? 2,
          daily.temperature_2m_max?.[0] ?? 75,
          daily.temperature_2m_min?.[0] ?? 60
        ),
      sunrise: formatTimeUpper12h(daily.sunrise?.[0] ?? "2026-01-01T06:50"),
      sunset: formatTime12h(daily.sunset?.[0] ?? "2026-01-01T17:24"),
      accumulationInches: Number((daily.precipitation_sum?.[0] ?? 0).toFixed(2)),
      uvIndex,
      uvLabel: uvToLabel(uvIndex),
      forecast,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload);
  } catch {
    const fallback: WeatherData = {
      live: false,
      currentTemp: 55,
      feelsLike: 55,
      weatherCode: 3,
      summary: "Mostly cloudy. Highs in the mid 70s and lows in the low 60s.",
      sunrise: "6:50 AM",
      sunset: "5:24pm",
      accumulationInches: 0,
      uvIndex: 4,
      uvLabel: "Moderate",
      forecast: [
        { label: "Today", dateIso: "", weatherCode: 3, precipChance: 3, high: 76, low: 60 },
        { label: "Sat", dateIso: "", weatherCode: 2, precipChance: 8, high: 78, low: 65 },
        { label: "Sun", dateIso: "", weatherCode: 2, precipChance: 23, high: 78, low: 54 },
      ],
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(fallback);
  }
}
