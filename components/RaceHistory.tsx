
import React, { useState } from 'react';
import { RaceSession, Athlete, EventStandard } from '../types';
import { formatTime } from '../utils';
import { ChevronDown, ChevronUp, AlertTriangle, MapPin, Trash2 } from 'lucide-react';

interface Props {
  sessions: RaceSession[];
  athletes: Athlete[];
  standards: EventStandard[];
  onDelete: (id: string) => void;
  isAdmin?: boolean;
}

export const RaceHistory: React.FC<Props> = ({ sessions, athletes, standards, onDelete, isAdmin = false }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Delete confirmation state
  const [sessionToDelete, setSessionToDelete] = useState<RaceSession | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const confirmDelete = () => {
    if (sessionToDelete) {
      onDelete(sessionToDelete.id);
      setSessionToDelete(null);
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 relative">
      <h2 className="text-2xl font-bold text-white mb-6">Race History</h2>
      
      {sortedSessions.length === 0 && (
        <div className="text-center p-12 bg-slate-800 rounded-xl border border-slate-700 text-slate-500">
          No races recorded yet.
        </div>
      )}

      {sortedSessions.map(session => {
        const event = standards.find(s => s.id === session.eventId);
        const winner = session.results.length > 0 ? athletes.find(a => a.id === session.results[0].athleteId) : null;
        const isExpanded = expandedId === session.id;

        return (
          <div key={session.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden transition-all duration-300 group">
            <div 
              className="p-6 cursor-pointer hover:bg-slate-750 flex flex-col md:flex-row md:items-center justify-between gap-4 relative"
              onClick={() => toggleExpand(session.id)}
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-slate-400 border border-slate-600">
                  <span className="text-xs font-bold uppercase">{new Date(session.date).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-lg font-bold text-white">{new Date(session.date).getDate()}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {session.name}
                    {session.isMandatory && <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/30">Mandatory</span>}
                  </h3>
                  <div className="text-slate-400 text-sm flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="bg-slate-700 px-2 py-0.5 rounded text-xs text-slate-300">{event?.name}</span>
                    <span>• {session.results.length} Athletes</span>
                    {session.venue && (
                       <span className="flex items-center gap-1 text-slate-500">
                         <MapPin className="w-3 h-3" />
                         {session.venue}
                       </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                 {winner && (
                   <div className="hidden md:block text-right">
                     <p className="text-xs text-slate-500 uppercase tracking-wider">Winner</p>
                     <p className="text-sm font-medium text-yellow-400">{winner.name}</p>
                     <p className="text-xs font-mono text-slate-400">{formatTime(session.results[0].time)}</p>
                   </div>
                 )}
                 <div className="flex items-center gap-2">
                   {isAdmin && (
                     <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSessionToDelete(session);
                        }}
                        className="p-2 text-slate-600 hover:text-red-400 hover:bg-slate-900 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Race"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   )}
                   {isExpanded ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
                 </div>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-slate-700 bg-slate-900/30 p-6 animate-in slide-in-from-top-2">
                
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700">
                      <th className="pb-2 font-medium w-12">Rank</th>
                      <th className="pb-2 font-medium">Athlete</th>
                      <th className="pb-2 font-medium text-right">Time</th>
                      <th className="pb-2 font-medium text-right">Points</th>
                      <th className="pb-2 font-medium text-right">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {session.results.map((result) => {
                      const athlete = athletes.find(a => a.id === result.athleteId);
                      return (
                        <tr key={result.athleteId} className="hover:bg-slate-800/50">
                          <td className="py-3 font-mono text-slate-400">{result.rank}</td>
                          <td className="py-3 text-slate-200">{athlete?.name || 'Unknown'}</td>
                          <td className="py-3 text-right font-mono text-slate-300">{formatTime(result.time)}</td>
                          <td className="py-3 text-right font-bold text-yellow-500 font-mono">{result.points}</td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1">
                              {result.tags.includes('PB') && <span className="bg-green-500/20 text-green-400 text-xs px-1.5 rounded border border-green-500/30">PB</span>}
                              {result.tags.includes('SB') && <span className="bg-blue-500/20 text-blue-400 text-xs px-1.5 rounded border border-blue-500/30">SB</span>}
                              {result.tags.includes('CR') && <span className="bg-purple-500/20 text-purple-400 text-xs px-1.5 rounded border border-purple-500/30" title="Course Record">CR</span>}
                              {result.tags.includes('Penalty') && <span className="bg-red-500/20 text-red-400 text-xs px-1.5 rounded border border-red-500/30">PEN</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Race?</h3>
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">{sessionToDelete.name}</span>? 
              <br />
              This will remove all results and points associated with this session. This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
              <button
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors text-sm shadow-lg shadow-red-500/20"
              >
                Delete Race
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
