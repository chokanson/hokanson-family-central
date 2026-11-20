import { NextResponse } from "next/server";
import type { SpotifyData } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token || null;
}

export async function GET() {
  const now = new Date().toISOString();

  try {
    const token = await getSpotifyAccessToken();
    if (!token) {
      return NextResponse.json({
        live: false,
        isPlaying: false,
        updatedAt: now,
      } satisfies SpotifyData);
    }

    const res = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    // 204 = nothing playing
    if (res.status === 204 || !res.ok) {
      return NextResponse.json({
        live: true,
        isPlaying: false,
        updatedAt: now,
      } satisfies SpotifyData);
    }

    const data = await res.json();
    if (!data?.is_playing || !data?.item) {
      return NextResponse.json({
        live: true,
        isPlaying: false,
        updatedAt: now,
      } satisfies SpotifyData);
    }

    const item = data.item;
    const artists = Array.isArray(item.artists)
      ? item.artists.map((a: { name: string }) => a.name).join(", ")
      : "";
    const images = item.album?.images || [];
    const albumArtUrl = images[1]?.url || images[0]?.url || undefined;

    return NextResponse.json({
      live: true,
      isPlaying: true,
      title: item.name,
      artist: artists,
      album: item.album?.name,
      albumArtUrl,
      progressMs: data.progress_ms ?? 0,
      durationMs: item.duration_ms ?? 0,
      updatedAt: now,
    } satisfies SpotifyData);
  } catch {
    return NextResponse.json({
      live: false,
      isPlaying: false,
      updatedAt: now,
    } satisfies SpotifyData);
  }
}
