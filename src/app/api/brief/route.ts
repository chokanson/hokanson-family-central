import { NextRequest, NextResponse } from "next/server";
import type { BriefData } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEMO_BRIEF: BriefData = {
  live: false,
  source: "demo",
  headline: "Today’s Heads-Up",
  bullets: [
    "Chris has Ellis & Cameron pickup at 4:00 PM — no Gaming Club today.",
    "Pack Karate weapons gear tonight for Cohen (8:30 AM) and Chris (9:15 AM) tomorrow.",
    "Mild afternoon near 76° with low rain chance; light jacket for early morning.",
  ],
  updatedAt: new Date().toISOString(),
};

export async function POST(req: NextRequest) {
  const now = new Date().toISOString();

  // Option 1: External Gemini Hydrogen / Scheduled Workflow JSON feed
  const feedUrl = process.env.FAMILY_BRIEF_FEED_URL;
  if (feedUrl) {
    try {
      const feedRes = await fetch(feedUrl, { cache: "no-store" });
      if (feedRes.ok) {
        const json = await feedRes.json();
        if (Array.isArray(json.bullets) && json.bullets.length > 0) {
          return NextResponse.json({
            live: true,
            source: "feed",
            headline: json.headline || "Today’s Heads-Up",
            bullets: json.bullets.slice(0, 3).map(String),
            updatedAt: json.updatedAt || now,
          } satisfies BriefData);
        }
      }
    } catch {
      // Fall through to Gemini API or demo
    }
  }

  // Option 2: Direct Gemini API call using today's live dashboard context
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ...DEMO_BRIEF, updatedAt: now });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const contextText = JSON.stringify(body).slice(0, 4000);

    const prompt = `You are the Hokanson Family morning kitchen briefing assistant.
Given this live dashboard snapshot (weather, Tempest station, and upcoming calendar events), write a crisp, practical "Today's Heads-Up" with 2 to 3 short bullet points (max 15 words each).
Focus on logistics: pickups, gear to pack, weather/rain prep, or schedule quirks. No fluff, no greetings.
Return strict JSON: {"headline": "Today’s Heads-Up", "bullets": ["...", "..."]}

Snapshot:
${contextText}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
        cache: "no-store",
      }
    );

    if (!geminiRes.ok) {
      throw new Error(`Gemini HTTP ${geminiRes.status}`);
    }

    const geminiJson = await geminiRes.json();
    const text =
      geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed.bullets) && parsed.bullets.length > 0) {
      return NextResponse.json({
        live: true,
        source: "gemini",
        headline: parsed.headline || "Today’s Heads-Up",
        bullets: parsed.bullets.slice(0, 3).map(String),
        updatedAt: now,
      } satisfies BriefData);
    }
  } catch {
    // Fallback cleanly
  }

  return NextResponse.json({ ...DEMO_BRIEF, updatedAt: now });
}
