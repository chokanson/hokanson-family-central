import { NextResponse } from "next/server";
import ical from "node-ical";
import { FAMILY_CONFIG } from "@/config/family";
import type { CalendarData, CalendarDayColumn, CalendarEventItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEFAULT_COLORS = ["#60a5fa", "#38bdf8", "#818cf8", "#34d399", "#f472b6"];

function getLocalDateKey(date: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function formatTime(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getDayLabel(dateKey: string, todayKey: string, tomorrowKey: string): string {
  if (dateKey === todayKey) return "Today";
  if (dateKey === tomorrowKey) return "Tomorrow";
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return dt.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

function buildDemoCalendar(): CalendarData {
  const tz = FAMILY_CONFIG.location.timezone;
  const now = new Date();
  const addDays = (n: number) => new Date(now.getTime() + n * 86400000);
  const k0 = getLocalDateKey(addDays(0), tz);
  const k1 = getLocalDateKey(addDays(1), tz);
  const k3 = getLocalDateKey(addDays(3), tz);
  const k4 = getLocalDateKey(addDays(4), tz);

  return {
    live: false,
    updatedAt: now.toISOString(),
    days: [
      {
        dateIso: k0,
        dayNumber: String(Number(k0.split("-")[2])),
        dayLabel: "Today",
        events: [
          {
            id: "demo-1",
            title: "(Chris) Pickup Ellis & Cameron - No Gaming Club",
            startIso: now.toISOString(),
            timeLabel: "4:00 PM",
            isAllDay: false,
            color: "#38bdf8",
          },
        ],
      },
      {
        dateIso: k1,
        dayNumber: String(Number(k1.split("-")[2])),
        dayLabel: "Tomorrow",
        events: [
          {
            id: "demo-2",
            title: "(Cohen) 🥋 Karate Class: Weapons",
            startIso: addDays(1).toISOString(),
            timeLabel: "8:30 AM",
            isAllDay: false,
            color: "#60a5fa",
          },
          {
            id: "demo-3",
            title: "(Chris) 🥋 Karate Class: Weapons (C)",
            startIso: addDays(1).toISOString(),
            timeLabel: "9:15 AM",
            isAllDay: false,
            color: "#38bdf8",
          },
          {
            id: "demo-4",
            title: "(Ellis) 🎻 Cello Lesson w/ Larissa",
            startIso: addDays(1).toISOString(),
            timeLabel: "12:30 PM",
            isAllDay: false,
            color: "#818cf8",
          },
        ],
      },
      {
        dateIso: k3,
        dayNumber: String(Number(k3.split("-")[2])),
        dayLabel: getDayLabel(k3, k0, k1),
        events: [
          {
            id: "demo-5",
            title: "🦃 No School – Thanksgiving Recess (HISD)",
            startIso: addDays(3).toISOString(),
            timeLabel: "All day",
            isAllDay: true,
            color: "#6366f1",
          },
          {
            id: "demo-6",
            title: "(Leslie & Boys) 🦷 Teeth Cleaning",
            startIso: addDays(3).toISOString(),
            timeLabel: "1:30 PM",
            isAllDay: false,
            color: "#38bdf8",
          },
          {
            id: "demo-7",
            title: "(Cohen) 🥋 Karate Class: Core Curriculum",
            startIso: addDays(3).toISOString(),
            timeLabel: "4:30 PM",
            isAllDay: false,
            color: "#60a5fa",
          },
          {
            id: "demo-8",
            title: "(Gray) 💪✝️ Young Life",
            startIso: addDays(3).toISOString(),
            timeLabel: "7:35 PM",
            isAllDay: false,
            color: "#818cf8",
          },
        ],
      },
      {
        dateIso: k4,
        dayNumber: String(Number(k4.split("-")[2])),
        dayLabel: getDayLabel(k4, k0, k1),
        events: [
          {
            id: "demo-9",
            title: "🦃 No School – Thanksgiving Recess (HISD)",
            startIso: addDays(4).toISOString(),
            timeLabel: "All day",
            isAllDay: true,
            color: "#6366f1",
          },
        ],
      },
    ],
  };
}

interface FeedSpec {
  url: string;
  color: string;
}

function parseFeedSpecs(raw: string): FeedSpec[] {
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, idx) => {
      // Supports either "https://..." OR "Label|https://...|#38bdf8"
      const parts = entry.split("|").map((p) => p.trim());
      if (parts.length >= 2) {
        return {
          url: parts[1],
          color: parts[2] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
        };
      }
      return {
        url: parts[0],
        color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      };
    });
}

export async function GET() {
  const rawUrls = process.env.GOOGLE_CALENDAR_ICS_URLS;
  if (!rawUrls || !rawUrls.trim()) {
    return NextResponse.json(buildDemoCalendar());
  }

  const tz = FAMILY_CONFIG.location.timezone;
  const now = new Date();
  const windowStart = new Date(now.getTime() - 12 * 3600 * 1000);
  const windowEnd = new Date(now.getTime() + 21 * 86400 * 1000);

  const todayKey = getLocalDateKey(now, tz);
  const tomorrowKey = getLocalDateKey(new Date(now.getTime() + 86400000), tz);

  const feeds = parseFeedSpecs(rawUrls);
  const byDay = new Map<string, CalendarEventItem[]>();

  try {
    await Promise.all(
      feeds.map(async (feed, feedIdx) => {
        const res = await fetch(feed.url, { cache: "no-store" });
        if (!res.ok) return;
        const icsText = await res.text();
        const parsed = ical.sync.parseICS(icsText);

        for (const item of Object.values(parsed)) {
          if (!item || item.type !== "VEVENT" || !item.start) continue;

          const title = String(item.summary || "Untitled Event").trim();
          const isAllDay = item.datetype === "date";
          const occurrences: Date[] = [];

          if (item.rrule) {
            const dates = item.rrule.between(windowStart, windowEnd, true);
            for (const d of dates) {
              const exKey = d.toISOString().slice(0, 10);
              if (item.exdate && item.exdate[exKey]) continue;
              occurrences.push(d);
            }
          } else {
            const startDate = new Date(item.start);
            if (startDate >= windowStart && startDate <= windowEnd) {
              occurrences.push(startDate);
            }
          }

          for (const occ of occurrences) {
            const dateKey = isAllDay
              ? occ.toISOString().slice(0, 10)
              : getLocalDateKey(occ, tz);

            if (dateKey < todayKey) continue;

            const list = byDay.get(dateKey) || [];
            list.push({
              id: `${feedIdx}-${item.uid || title}-${dateKey}-${occ.getTime()}`,
              title,
              startIso: occ.toISOString(),
              timeLabel: isAllDay ? "All day" : formatTime(occ, tz),
              isAllDay,
              color: feed.color,
            });
            byDay.set(dateKey, list);
          }
        }
      })
    );

    // Sort dates and take the next 4 days that have events (auto-skipping empty days!)
    const sortedKeys = Array.from(byDay.keys()).sort().slice(0, 4);
    const days: CalendarDayColumn[] = sortedKeys.map((dateKey) => {
      const events = (byDay.get(dateKey) || []).sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return a.startIso.localeCompare(b.startIso);
      });

      return {
        dateIso: dateKey,
        dayNumber: String(Number(dateKey.split("-")[2])),
        dayLabel: getDayLabel(dateKey, todayKey, tomorrowKey),
        events,
      };
    });

    const payload: CalendarData = {
      live: true,
      days,
      updatedAt: now.toISOString(),
    };
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(buildDemoCalendar());
  }
}
