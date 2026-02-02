
import { EventStandard } from "./types";

export const formatTime = (seconds: number): string => {
  if (!seconds || seconds === 0) return "DNS";
  if (seconds < 0) return "N/A";
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 100);

  const sStr = s < 10 ? `0${s}` : `${s}`;
  const msStr = ms < 10 ? `0${ms}` : `${ms}`;

  if (h > 0) {
    // Format as h:mm:ss for durations of 1 hour or more (no decimals)
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${h}:${mStr}:${sStr}`;
  }

  // Fallback to existing m:ss.xx for shorter durations
  return `${m}:${sStr}.${msStr}`;
};

export const parseTime = (timeStr: string): number | null => {
  // Expected formats: h:mm:ss.xx, mm:ss.xx, ss.xx, or without decimals
  const parts = timeStr.split(':');
  
  if (parts.length === 3) {
    // hours:minutes:seconds
    const hr = parseFloat(parts[0]);
    const min = parseFloat(parts[1]);
    const sec = parseFloat(parts[2]);
    if (isNaN(hr) || isNaN(min) || isNaN(sec)) return null;
    return hr * 3600 + min * 60 + sec;
  } else if (parts.length === 2) {
    // minutes:seconds
    const min = parseFloat(parts[0]);
    const sec = parseFloat(parts[1]);
    if (isNaN(min) || isNaN(sec)) return null;
    return min * 60 + sec;
  } else if (parts.length === 1) {
    // seconds only
    const sec = parseFloat(parts[0]);
    if (isNaN(sec)) return null;
    return sec;
  }
  return null;
};

export const calculatePoints = (athleteTime: number, goldTime: number, kValue: number = 1.1): number => {
  if (athleteTime <= 0) return 0;
  const rawPoints = 1000 * Math.pow(goldTime / athleteTime, kValue);
  return Math.round(rawPoints);
};

export const getOrdinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const getEventDistance = (eventName: string): number => {
  const lower = eventName.toLowerCase();
  const match = lower.match(/(\d+(\.\d+)?)\s*(km|m)/);
  
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[3];
    if (unit === 'km') return val * 1000;
    if (unit === 'm') return val;
  }
  
  // Fallbacks
  if (lower.includes('1500')) return 1500;
  if (lower.includes('3000')) return 3000;
  if (lower.includes('5000')) return 5000;
  if (lower.includes('10000')) return 10000;
  if (lower.includes('half')) return 21097.5;
  if (lower.includes('marathon')) return 42195;
  
  return 0;
};

export const sortEventsByDistance = (events: EventStandard[]): EventStandard[] => {
  return [...events].sort((a, b) => {
    const distA = getEventDistance(a.name);
    const distB = getEventDistance(b.name);
    // If distances are 0 or equal, fallback to name sort
    if (distA === distB) return a.name.localeCompare(b.name, undefined, { numeric: true });
    return distA - distB;
  });
};
