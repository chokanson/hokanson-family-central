import { NextResponse } from "next/server";
import type { SmartThingsData } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEMO_SMARTTHINGS: SmartThingsData = {
  live: false,
  thermostat: {
    name: "Home Temperature",
    currentTemp: 70,
    setpoint: 75,
    humidity: 56,
    mode: "cool",
  },
  lock: {
    name: "Back Door Lock",
    state: "locked",
    battery: 90,
  },
  updatedAt: new Date().toISOString(),
};

async function getSmartThingsAccessToken(): Promise<string | null> {
  // Option 1: Direct Personal Access Token
  if (process.env.SMARTTHINGS_TOKEN) {
    return process.env.SMARTTHINGS_TOKEN;
  }

  // Option 2: OAuth Refresh Token flow (recommended for permanent SmartThings access)
  const clientId = process.env.SMARTTHINGS_CLIENT_ID;
  const clientSecret = process.env.SMARTTHINGS_CLIENT_SECRET;
  const refreshToken = process.env.SMARTTHINGS_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://api.smartthings.com/oauth/token", {
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
  const json = await res.json();
  return json.access_token || null;
}

interface SmartThingsDevice {
  deviceId: string;
  label?: string;
  name?: string;
  components?: Array<{
    id: string;
    capabilities?: Array<{ id: string }>;
  }>;
}

async function discoverDeviceIds(token: string): Promise<{
  thermostatId?: string;
  lockId?: string;
}> {
  const res = await fetch("https://api.smartthings.com/v1/devices", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return {};
  const data = await res.json();
  const items: SmartThingsDevice[] = data.items || [];

  let thermostatId: string | undefined;
  let lockId: string | undefined;

  for (const dev of items) {
    const caps = new Set(
      (dev.components || []).flatMap((c) =>
        (c.capabilities || []).map((cap) => cap.id)
      )
    );
    const label = `${dev.label || ""} ${dev.name || ""}`.toLowerCase();

    if (
      !thermostatId &&
      (caps.has("thermostatMode") ||
        caps.has("thermostatCoolingSetpoint") ||
        label.includes("nest") ||
        label.includes("thermostat"))
    ) {
      thermostatId = dev.deviceId;
    }

    if (
      !lockId &&
      (caps.has("lock") || label.includes("lock") || label.includes("kwikset"))
    ) {
      lockId = dev.deviceId;
    }
  }

  return { thermostatId, lockId };
}

export async function GET() {
  try {
    const token = await getSmartThingsAccessToken();
    if (!token) {
      return NextResponse.json({
        ...DEMO_SMARTTHINGS,
        updatedAt: new Date().toISOString(),
      });
    }

    let thermostatId = process.env.SMARTTHINGS_THERMOSTAT_ID;
    let lockId = process.env.SMARTTHINGS_LOCK_ID;

    if (!thermostatId || !lockId) {
      const discovered = await discoverDeviceIds(token);
      thermostatId = thermostatId || discovered.thermostatId;
      lockId = lockId || discovered.lockId;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const [thermRes, lockRes] = await Promise.all([
      thermostatId
        ? fetch(
            `https://api.smartthings.com/v1/devices/${thermostatId}/status`,
            { headers, cache: "no-store" }
          )
        : Promise.resolve(null),
      lockId
        ? fetch(`https://api.smartthings.com/v1/devices/${lockId}/status`, {
            headers,
            cache: "no-store",
          })
        : Promise.resolve(null),
    ]);

    const thermostat = { ...DEMO_SMARTTHINGS.thermostat };
    const lock = { ...DEMO_SMARTTHINGS.lock };
    let gotLive = false;

    if (thermRes && thermRes.ok) {
      const json = await thermRes.json();
      const main = json?.components?.main || {};
      const tempVal = main.temperatureMeasurement?.temperature?.value;
      const humidityVal = main.relativeHumidityMeasurement?.humidity?.value;
      const modeVal = main.thermostatMode?.thermostatMode?.value;
      const coolSp = main.thermostatCoolingSetpoint?.coolingSetpoint?.value;
      const heatSp = main.thermostatHeatingSetpoint?.heatingSetpoint?.value;

      if (typeof tempVal === "number") {
        thermostat.currentTemp = Math.round(tempVal);
        gotLive = true;
      }
      if (typeof humidityVal === "number") {
        thermostat.humidity = Math.round(humidityVal);
      }
      if (typeof modeVal === "string") {
        thermostat.mode = modeVal;
      }
      const chosenSetpoint =
        modeVal === "heat" ? heatSp ?? coolSp : coolSp ?? heatSp;
      if (typeof chosenSetpoint === "number") {
        thermostat.setpoint = Math.round(chosenSetpoint);
      }
    }

    if (lockRes && lockRes.ok) {
      const json = await lockRes.json();
      const main = json?.components?.main || {};
      const lockVal = main.lock?.lock?.value;
      const batteryVal = main.battery?.battery?.value;

      if (lockVal === "locked" || lockVal === "unlocked") {
        lock.state = lockVal;
        gotLive = true;
      }
      if (typeof batteryVal === "number") {
        lock.battery = Math.round(batteryVal);
      }
    }

    return NextResponse.json({
      live: gotLive,
      thermostat,
      lock,
      updatedAt: new Date().toISOString(),
    } satisfies SmartThingsData);
  } catch {
    return NextResponse.json({
      ...DEMO_SMARTTHINGS,
      updatedAt: new Date().toISOString(),
    });
  }
}
