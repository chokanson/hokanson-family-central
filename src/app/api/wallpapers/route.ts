import { NextResponse } from "next/server";
import { FAMILY_CONFIG } from "@/config/family";
import type { WallpapersData } from "@/lib/types";

export const revalidate = 86400;

export async function GET() {
  const urls = new Set<string>(FAMILY_CONFIG.background.customWallpaperUrls || []);

  // Paste your DakBoard comma-separated or newline-separated wallpaper URLs into WALLPAPER_URLS in Vercel
  const envUrls = process.env.WALLPAPER_URLS;
  if (envUrls) {
    for (const u of envUrls
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter((s) => s.startsWith("http"))) {
      urls.add(u);
    }
  }

  return NextResponse.json({
    urls: Array.from(urls),
    sourceCount: FAMILY_CONFIG.background.basicAppleGuyPages.length,
  } satisfies WallpapersData);
}
