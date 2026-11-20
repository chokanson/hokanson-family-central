"use client";

import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from "lucide-react";

interface WeatherIconProps {
  code: number;
  className?: string;
}

export function WeatherIcon({ code, className = "w-6 h-6" }: WeatherIconProps) {
  if (code === 0) return <Sun className={className} strokeWidth={1.6} />;
  if (code === 1 || code === 2)
    return <CloudSun className={className} strokeWidth={1.6} />;
  if (code === 3) return <Cloud className={className} strokeWidth={1.6} />;
  if (code === 45 || code === 48)
    return <CloudFog className={className} strokeWidth={1.6} />;
  if (code >= 51 && code <= 57)
    return <CloudDrizzle className={className} strokeWidth={1.6} />;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return <CloudRain className={className} strokeWidth={1.6} />;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return <CloudSnow className={className} strokeWidth={1.6} />;
  if (code >= 95)
    return <CloudLightning className={className} strokeWidth={1.6} />;
  return <CloudSun className={className} strokeWidth={1.6} />;
}
