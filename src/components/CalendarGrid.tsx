"use client";

import type { CalendarData } from "@/lib/types";

interface CalendarGridProps {
  calendar: CalendarData | null;
}

export function CalendarGrid({ calendar }: CalendarGridProps) {
  const days = calendar?.days || [];

  return (
    <section className="grid grid-cols-4 gap-3.5 w-full">
      {days.map((day) => (
        <div key={day.dateIso} className="flex flex-col min-w-0">
          {/* Day Header matching DakBoard */}
          <div className="flex items-baseline gap-2 pb-1.5 border-b border-white/25 mb-2">
            <span className="text-2xl font-extralight text-white/95 tabular-nums">
              {day.dayNumber}
            </span>
            <span className="text-sm font-light text-white/80 truncate">
              {day.dayLabel}
            </span>
          </div>

          {/* Event Cards */}
          <div className="flex flex-col gap-2">
            {day.events.map((ev) => (
              <div
                key={ev.id}
                className="rounded-sm bg-white/10 backdrop-blur-md px-2.5 py-2 border-l-[3px] shadow-sm"
                style={{ borderLeftColor: ev.color }}
              >
                <div className="text-[11px] font-medium text-white/75 leading-tight">
                  {ev.timeLabel}
                </div>
                <div className="text-[13px] font-normal text-white leading-snug mt-0.5 break-words">
                  {ev.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
