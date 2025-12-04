
import { useState, useEffect } from 'react';
import { Athlete, EventStandard, RaceSession, RaceResult, PB, Route } from '../types';
import { calculatePoints } from '../utils';
import { STATIC_DB } from '../data/staticDb';

// Helper for generating IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const useAthleticsData = () => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [standards, setStandards] = useState<EventStandard[]>([]);
  const [sessions, setSessions] = useState<RaceSession[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Persistence Helpers ---
  const persist = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving ${key} to local storage`, e);
    }
  };

  // --- Data Loading Strategy ---
  useEffect(() => {
    const loadData = () => {
      try {
        const localVersion = localStorage.getItem('db_version');
        
        // CHECK: Is the deployed code newer than what is in the browser?
        // If localVersion is missing or different from STATIC_DB.version, we force an update.
        if (localVersion !== STATIC_DB.version) {
          console.log("New deployment detected. Syncing with Static DB...");
          
          setAthletes(STATIC_DB.athletes);
          setStandards(STATIC_DB.standards);
          setSessions(STATIC_DB.sessions);
          setRoutes(STATIC_DB.routes);

          // Update Local Storage to match new deployment
          persist('athletes', STATIC_DB.athletes);
          persist('standards', STATIC_DB.standards);
          persist('sessions', STATIC_DB.sessions);
          persist('routes', STATIC_DB.routes);
          localStorage.setItem('db_version', STATIC_DB.version);
          
        } else {
          // Version matches, so Local Storage has the latest 'Edit State'. Load from Local Storage.
          const localAthletes = localStorage.getItem('athletes');
          const localStandards = localStorage.getItem('standards');
          const localSessions = localStorage.getItem('sessions');
          const localRoutes = localStorage.getItem('routes');

          if (localAthletes) setAthletes(JSON.parse(localAthletes));
          else setAthletes(STATIC_DB.athletes);

          if (localStandards) setStandards(JSON.parse(localStandards));
          else setStandards(STATIC_DB.standards);

          if (localSessions) setSessions(JSON.parse(localSessions));
          else setSessions(STATIC_DB.sessions);

          if (localRoutes) setRoutes(JSON.parse(localRoutes));
          else setRoutes(STATIC_DB.routes);
        }

      } catch (error) {
        console.error("Failed to load data:", error);
        // Fallback to static
        setAthletes(STATIC_DB.athletes);
        setStandards(STATIC_DB.standards);
        setSessions(STATIC_DB.sessions);
        setRoutes(STATIC_DB.routes);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // --- Actions ---

  const addAthlete = (name: string, faculty: string, batch: string, photoUrl: string | undefined, initialPBs: PB[]) => {
    const newAthlete: Athlete = {
      id: generateId(),
      name, faculty, batch, photoUrl: photoUrl || undefined, personalBests: initialPBs, isActive: true
    };
    
    setAthletes(prev => {
      const newState = [...prev, newAthlete];
      persist('athletes', newState);
      return newState;
    });
  };

  const deleteAthlete = (id: string) => {
    setAthletes(prev => {
      const newState = prev.filter(a => a.id !== id);
      persist('athletes', newState);
      return newState;
    });
  };

  const toggleAthleteStatus = (id: string) => {
    setAthletes(prev => {
      const newState = prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a);
      persist('athletes', newState);
      return newState;
    });
  };

  const updateStandard = (updatedStd: EventStandard) => {
    setStandards(prev => {
      const newState = prev.map(s => s.id === updatedStd.id ? updatedStd : s);
      persist('standards', newState);
      return newState;
    });
  };

  const addStandard = (name: string, goldTime: number, kValue: number) => {
    const newStd = { id: generateId(), name, goldTime, kValue };
    setStandards(prev => {
      const newState = [...prev, newStd];
      persist('standards', newState);
      return newState;
    });
  };

  const addRoute = (name: string, distance: string, elevation: string) => {
    const newRoute = { id: generateId(), name, distance, elevation };
    setRoutes(prev => {
      const newState = [...prev, newRoute];
      persist('routes', newState);
      return newState;
    });
  };

  const deleteRoute = (id: string) => {
    setRoutes(prev => {
      const newState = prev.filter(r => r.id !== id);
      persist('routes', newState);
      return newState;
    });
  };

  const calculatePenalty = (lastPlacePoints: number, athleteId: string, currentSessionDate: string): number => {
    const currentDate = new Date(currentSessionDate);
    const sortedHistory = sessions
      .filter(s => new Date(s.date) <= currentDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let lastResultPoints = null;
    for (const s of sortedHistory) {
      const res = s.results.find(r => r.athleteId === athleteId);
      if (res) { lastResultPoints = res.points; break; }
    }

    let penalty = Math.max(0, lastPlacePoints - 20);
    if (lastResultPoints !== null) {
       const historyCap = Math.max(0, lastResultPoints - 20);
       if (penalty > historyCap) penalty = historyCap;
    }
    return penalty;
  };

  const recordSession = (
    meta: { name: string; date: string; eventId: string; isMandatory: boolean; notes: string; venue?: string; routeId?: string },
    entries: { athleteId: string; time: number; place?: number }[],
    _ignoredMissed?: string[]
  ) => {
    const event = standards.find(s => s.id === meta.eventId);
    if (!event) return;

    // Course Record Logic
    let courseRecordTime = Infinity;
    if (meta.routeId) {
      const pastSessionsOnRoute = sessions.filter(s => s.routeId === meta.routeId);
      const allTimes = pastSessionsOnRoute.flatMap(s => s.results).filter(r => r.time > 0).map(r => r.time);
      if (allTimes.length > 0) courseRecordTime = Math.min(...allTimes);
    }

    let results: RaceResult[] = entries.map(entry => {
      const points = calculatePoints(entry.time, event.goldTime, event.kValue);
      const athlete = athletes.find(a => a.id === entry.athleteId);
      const tags: string[] = [];
      
      if (athlete && entry.time > 0) {
        const pb = athlete.personalBests.find(p => p.eventId === event.id);
        const isPB = !pb || entry.time < pb.time;
        if (isPB) tags.push('PB');
        
        const raceYear = parseInt(meta.date.split('-')[0]);
        const previousSessionBest = sessions
          .filter(s => parseInt(s.date.split('-')[0]) === raceYear && s.eventId === event.id)
          .flatMap(s => s.results)
          .filter(r => r.athleteId === entry.athleteId)
          .reduce((min, r) => (r.time > 0 && r.time < min ? r.time : min), Infinity);
        
        let manualPBBest = Infinity;
        if (pb?.date && parseInt(pb.date.split('-')[0]) === raceYear) manualPBBest = pb.time;

        if (isPB || entry.time < Math.min(previousSessionBest, manualPBBest)) tags.push('SB');
      }

      return { athleteId: entry.athleteId, time: entry.time, points, rank: 0, tags };
    });

    results.sort((a, b) => a.time - b.time);
    results = results.map((r, idx) => {
       const entry = entries.find(e => e.athleteId === r.athleteId);
       return { ...r, rank: (entry && entry.place) ? entry.place : (idx + 1) };
    });

    if (results.length > 0 && results[0].time < courseRecordTime && meta.routeId) results[0].tags.push('CR');

    if (meta.isMandatory) {
      const participatingIds = new Set(entries.map(e => e.athleteId));
      const activeAthletes = athletes.filter(a => a.isActive);
      const missingAthletes = activeAthletes.filter(a => !participatingIds.has(a.id));
      const lastPlacePoints = results.length > 0 ? results[results.length - 1].points : 0;
      
      missingAthletes.forEach(athlete => {
        results.push({
          athleteId: athlete.id, time: 0, points: calculatePenalty(lastPlacePoints, athlete.id, meta.date),
          rank: results.length + 1, tags: ['Penalty'], notes: 'Missed Mandatory Race'
        });
      });
    }

    // Determine updated athletes (new PBs)
    let updatedAthletes = [...athletes];

    for (const r of results) {
      if (r.time > 0) {
          updatedAthletes = updatedAthletes.map(a => {
            if (a.id === r.athleteId) {
              const existingPBs = a.personalBests || [];
              const idx = existingPBs.findIndex(pb => pb.eventId === event.id);
              const newPBData = { eventId: event.id, time: r.time, date: meta.date, venue: meta.venue || meta.name };
              
              if (idx === -1 || r.time < existingPBs[idx].time) {
                const newPBs = [...existingPBs];
                if (idx === -1) newPBs.push(newPBData);
                else newPBs[idx] = newPBData;
                return { ...a, personalBests: newPBs };
              }
            }
            return a;
          });
      }
    }
    
    // Save state
    setAthletes(updatedAthletes);
    persist('athletes', updatedAthletes);

    const newSession = { ...meta, results, id: generateId() };
    setSessions(prev => {
      const newState = [...prev, newSession];
      persist('sessions', newState);
      return newState;
    });
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const newState = prev.filter(s => s.id !== id);
      persist('sessions', newState);
      return newState;
    });
  };

  const importData = (data: any) => {
    if (data.athletes) { setAthletes(data.athletes); persist('athletes', data.athletes); }
    if (data.standards) { setStandards(data.standards); persist('standards', data.standards); }
    if (data.routes) { setRoutes(data.routes); persist('routes', data.routes); }
    if (data.sessions) { setSessions(data.sessions); persist('sessions', data.sessions); }
    alert("Data successfully imported!");
  };

  return {
    athletes,
    standards,
    sessions,
    routes,
    loading,
    addAthlete,
    deleteAthlete,
    toggleAthleteStatus,
    updateStandard,
    addStandard,
    addRoute,
    deleteRoute,
    recordSession,
    deleteSession,
    importData
  };
};
