"use client";

import { Disc3, Sparkles } from "lucide-react";
import type { BriefData, SpotifyData } from "@/lib/types";

interface BottomLeftDockProps {
  spotify: SpotifyData | null;
  brief: BriefData | null;
  previewSpotify?: boolean;
}

const DEMO_SPOTIFY: SpotifyData = {
  live: false,
  isPlaying: true,
  title: "Duke Silver Smooth Jazz",
  artist: "Mouse Rat & Friends",
  album: "Pawnee Nights",
  progressMs: 92000,
  durationMs: 215000,
  updatedAt: "",
};

export function BottomLeftDock({
  spotify,
  brief,
  previewSpotify = false,
}: BottomLeftDockProps) {
  const activeTrack =
    spotify?.isPlaying ? spotify : previewSpotify ? DEMO_SPOTIFY : null;

  const progressPct =
    activeTrack && activeTrack.durationMs && activeTrack.durationMs > 0
      ? Math.min(
          100,
          Math.round(((activeTrack.progressMs || 0) / activeTrack.durationMs) * 100)
        )
      : 0;

  return (
    <div className="flex items-end gap-4 w-full">
      {/* Dynamic Spotify "Now Spinning" Widget — auto-hides when idle */}
      {activeTrack && (
        <div className="glass-card-dark rounded-xl p-3 flex items-center gap-3.5 max-w-[340px] min-w-[270px] shadow-lg">
          {activeTrack.albumArtUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeTrack.albumArtUrl}
              alt={activeTrack.album || "Album Art"}
              className="w-14 h-14 rounded-lg object-cover shrink-0 shadow"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-emerald-500/20 ring-1 ring-emerald-400/30 flex items-center justify-center shrink-0">
              <Disc3 className="w-7 h-7 text-emerald-300 animate-spin" style={{ animationDuration: "6s" }} />
            </div>
          )}

          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] uppercase tracking-widest text-emerald-300/90 font-semibold">
              Now Spinning
            </span>
            <span className="text-sm font-medium text-white truncate mt-0.5">
              {activeTrack.title}
            </span>
            <span className="text-xs text-white/70 truncate">
              {activeTrack.artist}
            </span>
            <div className="w-full h-1 bg-white/15 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Gemini Daily Family Brief */}
      {brief && brief.bullets.length > 0 && (
        <div className="glass-card-dark rounded-xl px-4 py-3 flex-1 max-w-[540px] shadow-lg">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-300/90 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{brief.headline}</span>
          </div>
          <ul className="space-y-1">
            {brief.bullets.map((line, i) => (
              <li
                key={i}
                className="text-xs text-white/85 leading-snug flex items-start gap-2"
              >
                <span className="text-sky-400 mt-0.5">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
