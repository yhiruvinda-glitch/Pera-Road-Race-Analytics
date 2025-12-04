
import React, { useState, useMemo } from 'react';
import { Athlete, RaceSession, EventStandard, Route } from '../types';
import { formatTime, calculatePoints, sortEventsByDistance } from '../utils';
import { Trophy, Calendar, MapPin, Medal, Map as MapIcon, List, Star, Filter } from 'lucide-react';

interface Props {
  athletes: Athlete[];
  sessions: RaceSession[];
  standards: EventStandard[];
  routes?: Route[];
}

interface CourseRecordItem {
  athlete: Athlete | undefined;
  time: number;
  date: string;
  sessionName: string;
  points: number;
  venue?: string; // Optional to align with manual PBs if needed
}

export const RecordsList: React.FC<Props> = ({ athletes, sessions, standards, routes = [] }) => {
  const [viewMode, setViewMode] = useState<'events' | 'courses'>('events');
  const [filterMode, setFilterMode] = useState<'best' | 'all'>('best');
  
  const sortedStandards = useMemo(() => sortEventsByDistance(standards), [standards]);

  const [selectedEventId, setSelectedEventId] = useState<string>(
    sortedStandards.length > 0 ? sortedStandards[0].id : ''
  );
  // If standards change/sort changes, we might want to update selection if it's invalid, 
  // but usually standard ID stays valid.
  
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    routes.length > 0 ? routes[0].id : ''
  );

  // Filters
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterAthleteId, setFilterAthleteId] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const selectedEvent = standards.find(s => s.id === selectedEventId);
  const selectedRoute = routes.find(r => r.id === selectedRouteId);

  // Derive filter options
  const uniqueFaculties = useMemo(() => {
    const s = new Set<string>();
    athletes.forEach(a => { if (a.faculty) s.add(a.faculty); });
    return Array.from(s).sort();
  }, [athletes]);

  const uniqueBatches = useMemo(() => {
    const s = new Set<string>();
    athletes.forEach(a => { if (a.batch) s.add(a.batch); });
    return Array.from(s).sort();
  }, [athletes]);

  const sortedAthletes = useMemo(() => {
    return [...athletes].sort((a, b) => a.name.localeCompare(b.name));
  }, [athletes]);

  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    // Get years from sessions (Safe Parse)
    sessions.forEach(s => {
      if (s.date) years.add(s.date.split('-')[0]);
    });
    // Get years from athletes' PBs (Safe Parse)
    athletes.forEach(a => {
      a.personalBests.forEach(pb => {
        if (pb.date) years.add(pb.date.split('-')[0]);
      });
    });
    return Array.from(years).sort().reverse();
  }, [sessions, athletes]);

  const clearFilters = () => {
    setFilterFaculty('');
    setFilterBatch('');
    setFilterAthleteId('');
    setFilterYear('');
  };

  const eventRecords = useMemo(() => {
    if (!selectedEventId) return [];

    let records = [];

    if (filterMode === 'best') {
      records = athletes
        .flatMap(a => {
          const pb = a.personalBests.find(p => p.eventId === selectedEventId);
          if (!pb) return [];
          return [{
            athlete: a,
            time: pb.time,
            date: pb.date,
            venue: pb.venue,
            points: null // Calculated on render
          }];
        })
        .sort((a, b) => a.time - b.time);
    } else {
      // All Performances Mode
      // 1. Gather all session results for this event
      const sessionResults = sessions
        .filter(s => s.eventId === selectedEventId)
        .flatMap(s => s.results.filter(r => r.time > 0).map(r => ({
          athlete: athletes.find(a => a.id === r.athleteId),
          time: r.time,
          date: s.date,
          venue: s.venue || s.name,
          points: r.points
        })));

      // 2. Gather manual PBs that are NOT in the session results (deduplicate by date + time + athlete)
      const sessionSignatures = new Set(sessionResults.map(r => 
        `${r.athlete?.id}_${r.time}_${r.date || ''}`
      ));

      const manualPBs = athletes.flatMap(a => {
        const pb = a.personalBests.find(p => p.eventId === selectedEventId);
        if (!pb) return [];
        
        // Create signature for this PB
        const sig = `${a.id}_${pb.time}_${pb.date || ''}`;
        
        // If this PB matches a session result, skip it (it's already in the list)
        if (sessionSignatures.has(sig)) return [];

        return [{
          athlete: a,
          time: pb.time,
          date: pb.date,
          venue: pb.venue,
          points: null
        }];
      });

      records = [...sessionResults, ...manualPBs]
        .filter(r => r.athlete)
        .sort((a, b) => a.time - b.time);
    }
    return records;
  }, [athletes, selectedEventId, sessions, filterMode]);

  const courseRecords = useMemo(() => {
    if (!selectedRouteId) return [];

    // Get all results for this route
    const rawResults: CourseRecordItem[] = sessions
      .filter(s => s.routeId === selectedRouteId)
      .flatMap(s => 
         s.results
          .filter(r => r.time > 0)
          .map(r => ({
             athlete: athletes.find(a => a.id === r.athleteId),
             time: r.time,
             date: s.date,
             sessionName: s.name,
             points: r.points
          }))
      );
      
    const allResults = rawResults.filter((item): item is CourseRecordItem & { athlete: Athlete } => item.athlete !== undefined);

    let records: (CourseRecordItem & { athlete: Athlete })[] = [];

    if (filterMode === 'all') {
      records = allResults.sort((a, b) => a.time - b.time);
    } else {
      // Filter for best time per athlete
      const bests = new Map<string, CourseRecordItem & { athlete: Athlete }>();
      allResults.forEach(r => {
         const existing = bests.get(r.athlete.id);
         if (!existing || r.time < existing.time) {
           bests.set(r.athlete.id, r);
         }
      });
      // Use spread instead of Array.from to avoid type inference issues with unknown[]
      records = [...bests.values()].sort((a, b) => a.time - b.time);
    }
    return records;
  }, [sessions, selectedRouteId, athletes, filterMode]);

  // Apply Filters
  const filteredRecords = useMemo(() => {
    const source = viewMode === 'events' ? eventRecords : courseRecords;
    
    return source.filter(record => {
      const { athlete } = record;
      
      // Faculty Filter
      if (filterFaculty && athlete?.faculty !== filterFaculty) {
        return false;
      }

      // Batch Filter
      if (filterBatch && athlete?.batch !== filterBatch) {
        return false;
      }

      // Athlete Filter
      if (filterAthleteId && athlete?.id !== filterAthleteId) {
        return false;
      }

      // Year Filter (Safe Parse)
      if (filterYear) {
        if (!record.date) return false;
        const recYear = record.date.split('-')[0];
        if (recYear !== filterYear) return false;
      }

      return true;
    });
  }, [viewMode, eventRecords, courseRecords, filterFaculty, filterBatch, filterAthleteId, filterYear]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Records & Best Performances
        </h2>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-slate-400 text-sm">View all-time records by event or specific course</p>
          <span className="text-xs bg-slate-800 text-slate-500 px-2 py-0.5 rounded border border-slate-700 font-medium">Since 2025</span>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Main Controls & Selection */}
        <div className="p-6 border-b border-slate-700 bg-slate-900/50 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   {viewMode === 'events' ? (
                       <>
                           <h3 className="text-lg font-bold text-white flex items-center gap-2">
                             {selectedEvent?.name || 'Select Event'}
                             <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                {filterMode === 'best' ? 'Top Performances' : 'All Performances'}
                             </span>
                           </h3>
                           <p className="text-xs text-slate-500 mt-1">Gold Standard: {selectedEvent ? formatTime(selectedEvent.goldTime) : '-'}</p>
                       </>
                   ) : (
                       <>
                           <h3 className="text-lg font-bold text-white flex items-center gap-2">
                             {selectedRoute?.name || 'Select Course'}
                             <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                {filterMode === 'best' ? 'Course Records' : 'All Runs'}
                             </span>
                           </h3>
                           <p className="text-xs text-slate-500 mt-1">
                              {selectedRoute ? `${selectedRoute.distance} ${selectedRoute.elevation ? `• ${selectedRoute.elevation}` : ''}` : '-'}
                           </p>
                       </>
                   )}
                </div>

                <div className="w-full md:w-auto">
                   {viewMode === 'events' ? (
                     <select
                        className="w-full md:w-64 bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-yellow-500 outline-none"
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                     >
                        {sortedStandards.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                     </select>
                   ) : (
                      <select
                        className="w-full md:w-64 bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-yellow-500 outline-none"
                        value={selectedRouteId}
                        onChange={(e) => setSelectedRouteId(e.target.value)}
                     >
                        {routes.length === 0 && <option value="">No routes defined</option>}
                        {routes.map(r => (
                           <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                     </select>
                   )}
                </div>
            </div>

            {/* Sub-Filters & Controls */}
            <div className="flex flex-col xl:flex-row gap-4 pt-4 border-t border-slate-700/50 justify-between items-start xl:items-center">
               
               {/* Toggles Group */}
               <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                   <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 flex-1 sm:flex-none">
                       <button 
                          onClick={() => { setViewMode('events'); clearFilters(); }}
                          className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${viewMode === 'events' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                       >
                          <Trophy className="w-4 h-4" /> By Event
                       </button>
                       <button 
                          onClick={() => { setViewMode('courses'); clearFilters(); }}
                          className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${viewMode === 'courses' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                       >
                          <MapIcon className="w-4 h-4" /> By Course
                       </button>
                   </div>

                   <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 flex-1 sm:flex-none">
                       <button 
                          onClick={() => setFilterMode('best')}
                          className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${filterMode === 'best' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                       >
                          <Star className="w-4 h-4" /> Best
                       </button>
                       <button 
                          onClick={() => setFilterMode('all')}
                          className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${filterMode === 'all' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                       >
                          <List className="w-4 h-4" /> All
                       </button>
                   </div>
               </div>

               {/* Filters Group */}
               <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                   <div className="flex items-center text-sm text-slate-400">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters:
                   </div>
                   
                   <select
                      className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:border-yellow-500 outline-none max-w-[150px]"
                      value={filterAthleteId}
                      onChange={(e) => setFilterAthleteId(e.target.value)}
                   >
                      <option value="">All Athletes</option>
                      {sortedAthletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                   </select>

                   <select
                      className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:border-yellow-500 outline-none"
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                   >
                      <option value="">All Years</option>
                      {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
                   </select>

                   <select
                      className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:border-yellow-500 outline-none"
                      value={filterFaculty}
                      onChange={(e) => setFilterFaculty(e.target.value)}
                   >
                      <option value="">All Faculties</option>
                      {uniqueFaculties.map(fac => <option key={fac} value={fac}>{fac}</option>)}
                   </select>

                   <select
                      className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:border-yellow-500 outline-none"
                      value={filterBatch}
                      onChange={(e) => setFilterBatch(e.target.value)}
                   >
                      <option value="">All Batches</option>
                      {uniqueBatches.map(batch => <option key={batch} value={batch}>{batch}</option>)}
                   </select>

                   {(filterFaculty || filterBatch || filterAthleteId || filterYear) && (
                     <button 
                       onClick={clearFilters}
                       className="text-xs text-red-400 hover:text-red-300 ml-auto xl:ml-0"
                     >
                       Clear
                     </button>
                   )}
               </div>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700 text-slate-400">
                <th className="p-4 w-16 text-center font-bold uppercase tracking-wider">Rank</th>
                <th className="p-4 font-bold uppercase tracking-wider">Athlete</th>
                <th className="p-4 text-right font-bold uppercase tracking-wider">Time</th>
                <th className="p-4 text-right font-bold uppercase tracking-wider">Points</th>
                <th className="p-4 font-bold uppercase tracking-wider">Date</th>
                <th className="p-4 font-bold uppercase tracking-wider">{viewMode === 'events' ? 'Venue' : 'Race'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    No records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.slice(0, 100).map((record, index) => {
                   const isTop3 = index < 3;
                   const rankColor = index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-700' : 'text-slate-500';
                   const athlete = record.athlete;
                   
                   const points = viewMode === 'events' && selectedEvent
                        ? calculatePoints(record.time, selectedEvent.goldTime, selectedEvent.kValue)
                        : (record as any).points;

                   return (
                    <tr key={`${athlete?.id}-${index}`} className="hover:bg-slate-700/30 transition-colors group">
                      <td className="p-4 text-center">
                        <div className={`font-mono font-bold text-lg ${rankColor} flex justify-center items-center`}>
                           {index === 0 && <Medal className="w-4 h-4 mr-1" />}
                           {index + 1}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-slate-700 overflow-hidden ring-2 ${isTop3 ? 'ring-yellow-500/50' : 'ring-transparent'}`}>
                             {athlete?.photoUrl ? (
                               <img src={athlete.photoUrl} alt={athlete.name} className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                                 {athlete?.name.charAt(0)}
                               </div>
                             )}
                          </div>
                          <div>
                            <div className={`font-medium ${isTop3 ? 'text-white' : 'text-slate-300'}`}>
                              {athlete?.name || 'Unknown'}
                            </div>
                            {athlete?.faculty && (
                              <div className="text-xs text-slate-500">
                                {athlete.faculty} {athlete.batch && `(${athlete.batch})`}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-mono font-bold text-lg ${isTop3 ? 'text-yellow-500' : 'text-slate-300'}`}>
                          {formatTime(record.time)}
                        </span>
                        {/* Show CR tag only if it's the #1 time on a course */}
                        {index === 0 && viewMode === 'courses' && <span className="ml-2 text-[10px] text-yellow-500 bg-yellow-500/10 px-1 rounded uppercase border border-yellow-500/20">CR</span>}
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono font-bold text-slate-400">
                          {points || '-'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 whitespace-nowrap">
                         <div className="flex items-center gap-2">
                            {record.date && <Calendar className="w-3 h-3 text-slate-600" />}
                            {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                         </div>
                      </td>
                      <td className="p-4 text-slate-300">
                         <div className="flex items-center gap-2">
                            {viewMode === 'events' ? (
                                <>
                                  {record.venue && <MapPin className="w-3 h-3 text-slate-600" />}
                                  {record.venue || '-'}
                                </>
                            ) : (
                                <span>{(record as any).sessionName}</span>
                            )}
                         </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
