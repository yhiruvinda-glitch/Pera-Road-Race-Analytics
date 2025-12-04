
export interface EventStandard {
  id: string;
  name: string; // e.g., "1500m"
  goldTime: number; // in seconds
  kValue: number; // default 1.1
}

export interface PB {
  eventId: string;
  time: number; // seconds
  date?: string;
  venue?: string;
}

export interface Athlete {
  id: string;
  name: string;
  faculty?: string;
  batch?: string;
  photoUrl?: string;
  personalBests: PB[];
  isActive: boolean;
}

export interface RaceResult {
  athleteId: string;
  time: number; // seconds. 0 if DNS/DNF
  points: number;
  rank: number;
  tags: string[]; // "PB", "SB", "Penalty", "CR"
  notes?: string;
}

export interface Route {
  id: string;
  name: string;
  distance: string; // e.g. "5km"
  elevation?: string; // e.g. "120m"
  description?: string;
}

export interface RaceSession {
  id: string;
  date: string;
  name: string; // e.g., "Season Opener"
  venue?: string; // e.g. "Central Park"
  routeId?: string; // Links to Route
  eventId: string; // Links to EventStandard
  isMandatory: boolean;
  results: RaceResult[];
  notes?: string;
}

export type Tab = 'dashboard' | 'history' | 'athletes' | 'trends' | 'records' | 'editor' | 'ai-coach';