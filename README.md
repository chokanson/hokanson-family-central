# Hokanson Family Central

Custom family fridge dashboard built with Next.js, TypeScript, and Tailwind CSS — designed for free hosting on GitHub + Vercel and 24/7 display on a ChromeOS kiosk monitor.

## Included Widgets & Features

- **Top Bar:** Greeting, live 77096 current weather + 3-day forecast (Open-Meteo + National Weather Service, no key needed), sunset/accumulation/UV, and large clock/date.
- **Family Calendar:** 4-day horizontal agenda that automatically skips empty days, preserves emojis, and color-codes multiple Google Calendar `.ics` feeds.
- **Hokanson Weather Station:** 6-metric WeatherFlow Tempest grid (Air Temp, Feels Like, Lightning Strikes 1hr, Precip Local Day, Humidity, Wind Avg) with lightning visual alert.
- **Up Next Countdowns:** Auto-rolling holiday and family birthday countdown tiles (`src/config/family.ts`).
- **Smart Home (Unified SmartThings):** Pulls both your Nest Thermostat (current temp, setpoint, humidity) and Kwikset Back Door Lock (state + battery) with night-time unlocked and low-battery alerts.
- **Guest WiFi + QR Code:** Displays network info alongside an auto-generated scannable QR code.
- **Dynamic Spotify "Now Spinning":** Appears in the bottom-left with album art and live progress bar while music plays, and hides when idle.
- **Gemini Daily Family Brief:** Compact "Today's Heads-Up" card powered by Gemini or an external scheduled workflow JSON feed.
- **Anti-Burn-In Protection:** Smooth 10-minute rotating background wallpaper crossfade + subtle 15-minute micro pixel shift.
- **Controls Drawer:** Click the gear icon in the top-right to check Live vs. Demo status, cycle wallpapers, toggle fullscreen, or preview the Spotify and Night Lock Alert states.

## Quick Deploy (GitHub + Vercel)

1. Create a new **Private** repository on GitHub named `hokanson-family-central` and upload these files.
2. Import the repository into Vercel and click **Deploy**.
3. Open **Vercel → Project Settings → Environment Variables** and add the variables listed in `.env.example`, then redeploy.
4. Edit `src/config/family.ts` anytime to update countdown dates, Guest WiFi details, alert thresholds, or wallpaper rotation speed.
