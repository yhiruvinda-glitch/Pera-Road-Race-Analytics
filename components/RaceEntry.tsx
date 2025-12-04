
import React, { useState, useMemo } from 'react';
import { Athlete, EventStandard, Route } from '../types';
import { parseTime, calculatePoints, sortEventsByDistance } from '../utils';
import { Plus, Trash2, Save, AlertCircle, MapPin } from 'lucide-react';

interface Props {
  athletes: Athlete[];
  standards: EventStandard[];
  routes?: Route[];
  onSave: (meta: any, entries: any[]) => void;
}

export const RaceEntry: React.FC<Props> = ({ athletes, standards, routes = [], onSave }) => {
  const [meta, setMeta] = useState({
    name: '',
    venue: '',
    routeId: '',
    date: new Date().toISOString().split('T')[0],
    eventId: '',
    isMandatory: false,
    notes: ''
  });

  const sortedStandards = useMemo(() => sortEventsByDistance(standards), [standards]);

  const [entries, setEntries] = useState<{ id: number; athleteId: string; timeStr: string; placeStr: string }[]>([
    { id: 1, athleteId: '', timeStr: '', placeStr: '' }
  ]);

  const handleEntryChange = (id: number, field: string, value: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const addRow = () => {
    setEntries(prev => [...prev, { id: Date.now(), athleteId: '', timeStr: '', placeStr: '' }]);
  };

  const removeRow = (id: number) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleRouteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRouteId = e.target.value;
    const selectedRoute = routes.find(r => r.id === selectedRouteId);
    
    if (selectedRoute) {
      setMeta({
        ...meta,
        routeId: selectedRoute.id,
        venue: selectedRoute.name // Auto-fill venue name
      });
    } else {
      setMeta({
        ...meta,
        routeId: '',
        venue: ''
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validEntries = [];
    
    for (const entry of entries) {
      if (entry.athleteId && entry.timeStr) {
        const time = parseTime(entry.timeStr);
        const place = parseInt(entry.placeStr);
        if (time !== null) {
          validEntries.push({ 
            athleteId: entry.athleteId, 
            time,
            place: !isNaN(place) && place > 0 ? place : undefined
          });
        }
      }
    }

    if (!meta.eventId) {
      alert("Please select an event.");
      return;
    }

    onSave(meta, validEntries);
    // Reset form
    setMeta({ ...meta, name: '', venue: '', routeId: '', notes: '' });
    setEntries([{ id: Date.now(), athleteId: '', timeStr: '', placeStr: '' }]);
  };

  const currentEvent = standards.find(s => s.id === meta.eventId);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
          New Race Session
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Race Name</label>
              <input
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-yellow-500 outline-none"
                value={meta.name}
                onChange={e => setMeta({ ...meta, name: e.target.value })}
                placeholder="e.g. Regional Qualifier"
              />
            </div>
            
            {/* Route / Venue Selection */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Venue / Course</label>
              <div className="relative">
                 <select 
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-yellow-500 outline-none appearance-none"
                    value={meta.routeId}
                    onChange={handleRouteChange}
                 >
                    <option value="">Select a defined course...</option>
                    {routes.map(r => (
                       <option key={r.id} value={r.id}>{r.name} ({r.distance})</option>
                    ))}
                 </select>
                 <MapPin className="absolute right-3 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
              <div className="mt-2">
                 <input
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-slate-300 focus:border-yellow-500 outline-none"
                    value={meta.venue}
                    onChange={e => setMeta({ ...meta, venue: e.target.value, routeId: '' })} // Clear route ID if manually typing
                    placeholder="Or type custom venue name..."
                  />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Date</label>
              <input
                required
                type="date"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-yellow-500 outline-none"
                value={meta.date}
                onChange={e => setMeta({ ...meta, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Event Type</label>
              <select
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-yellow-500 outline-none"
                value={meta.eventId}
                onChange={e => setMeta({ ...meta, eventId: e.target.value })}
              >
                <option value="">Select Event...</option>
                {sortedStandards.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
             <div className="flex items-center space-x-3 pt-6">
               <input
                 type="checkbox"
                 id="mandatory"
                 className="w-5 h-5 rounded bg-slate-900 border-slate-600 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-slate-800"
                 checked={meta.isMandatory}
                 onChange={e => setMeta({ ...meta, isMandatory: e.target.checked })}
               />
               <label htmlFor="mandatory" className="text-white font-medium select-none">Mandatory Race?</label>
             </div>
          </div>

          {meta.isMandatory && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-yellow-400">Automatic Penalty Detection</h3>
                <p className="text-xs text-yellow-200/70 mt-1">
                  Any active athlete not listed in the results below will be automatically marked as "Missed" and receive penalty points.
                </p>
              </div>
            </div>
          )}

          {/* Result Rows */}
          <div className="space-y-3">
             <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-300">Results</label>
             </div>
             
             {entries.map((entry, index) => {
               const parsed = parseTime(entry.timeStr);
               const projectedPoints = parsed && currentEvent 
                 ? calculatePoints(parsed, currentEvent.goldTime) 
                 : '-';
               
               return (
                 <div key={entry.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                    <span className="text-slate-500 font-mono text-sm w-8 pt-2 md:pt-0">{index + 1}.</span>
                    
                    <div className="flex-1 w-full">
                       <select
                         className="w-full bg-slate-800 border-slate-600 rounded px-3 py-2 text-white text-sm"
                         value={entry.athleteId}
                         onChange={e => handleEntryChange(entry.id, 'athleteId', e.target.value)}
                       >
                         <option value="">Select Athlete</option>
                         {/* Show currently selected athlete plus available active ones */}
                         {athletes
                           .filter(a => a.isActive)
                           .filter(a => a.id === entry.athleteId || (!entries.some(e => e.athleteId === a.id)))
                           .map(a => (
                           <option key={a.id} value={a.id}>{a.name}</option>
                         ))}
                       </select>
                    </div>

                    <div className="w-full md:w-20">
                      <input
                        className="w-full bg-slate-800 border-slate-600 rounded px-3 py-2 text-white font-mono text-sm text-center"
                        placeholder="Place"
                        title="Manual Place (Optional)"
                        type="number"
                        min="1"
                        value={entry.placeStr}
                        onChange={e => handleEntryChange(entry.id, 'placeStr', e.target.value)}
                      />
                    </div>

                    <div className="w-full md:w-32">
                      <input
                        className="w-full bg-slate-800 border-slate-600 rounded px-3 py-2 text-white font-mono text-sm text-right"
                        placeholder="mm:ss.xx"
                        value={entry.timeStr}
                        onChange={e => handleEntryChange(entry.id, 'timeStr', e.target.value)}
                      />
                    </div>
                    
                    <div className="w-full md:w-24 text-right">
                       <span className="text-yellow-500 font-bold font-mono">{projectedPoints}</span>
                       <span className="text-xs text-slate-500 ml-1">pts</span>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => removeRow(entry.id)}
                      className="text-slate-600 hover:text-red-400 p-2"
                      disabled={entries.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               );
             })}

             <button
               type="button"
               onClick={addRow}
               className="w-full py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-yellow-500 hover:border-yellow-500/50 transition-colors flex justify-center items-center font-medium text-sm"
             >
               <Plus className="w-4 h-4 mr-2" /> Add Athlete Result
             </button>
          </div>

          <div className="pt-4 border-t border-slate-700 flex justify-end">
            <button
              type="submit"
              className="bg-yellow-500 text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 shadow-lg shadow-yellow-500/20 flex items-center"
            >
              <Save className="w-5 h-5 mr-2" />
              Save Race Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
