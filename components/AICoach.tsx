import React, { useState } from 'react';
import { Athlete, RaceSession, EventStandard } from '../types';
import { generateCoachingReport } from '../services/geminiService';
import { Brain, Sparkles, Loader2, Target, Users, Calendar } from 'lucide-react';

interface Props {
  athletes: Athlete[];
  sessions: RaceSession[];
  standards: EventStandard[];
}

type Mode = 'team' | 'session' | 'athlete';

export const AICoach: React.FC<Props> = ({ athletes, sessions, standards }) => {
  const [mode, setMode] = useState<Mode>('team');
  const [selectedId, setSelectedId] = useState<string>('');
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Only show active athletes for AI analysis selection
  const sortedAthletes = [...athletes]
    .filter(a => a.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleGenerate = async () => {
    setLoading(true);
    setReport(''); // Clear previous report
    
    // For team mode, we don't need a specific ID
    const subjectId = mode === 'team' ? undefined : selectedId;
    
    // Validation
    if (mode !== 'team' && !subjectId) {
        setLoading(false);
        return;
    }

    const result = await generateCoachingReport(mode, subjectId, { athletes, sessions, standards });
    setReport(result);
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-white flex items-center gap-3">
             <Brain className="w-8 h-8 text-indigo-500" />
             AI Performance Coach
           </h2>
           <p className="text-slate-400 mt-1 max-w-2xl">
             Your virtual sports scientist. Select a context below to get evidence-based training advice, performance analysis, and strategic insights using the team's data.
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Control Panel */}
         <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 h-fit space-y-6 shadow-lg">
            <div>
               <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Analysis Scope</label>
               <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => { setMode('team'); setSelectedId(''); }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${mode === 'team' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-indigo-500/50'}`}
                  >
                     <Users className="w-6 h-6 mb-2" />
                     <span className="text-xs font-bold">Team</span>
                  </button>
                  <button 
                    onClick={() => { setMode('session'); setSelectedId(sortedSessions[0]?.id || ''); }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${mode === 'session' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-indigo-500/50'}`}
                  >
                     <Calendar className="w-6 h-6 mb-2" />
                     <span className="text-xs font-bold">Race</span>
                  </button>
                  <button 
                    onClick={() => { setMode('athlete'); setSelectedId(sortedAthletes[0]?.id || ''); }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${mode === 'athlete' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-indigo-500/50'}`}
                  >
                     <Target className="w-6 h-6 mb-2" />
                     <span className="text-xs font-bold">Athlete</span>
                  </button>
               </div>
            </div>

            {mode === 'session' && (
               <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-bold text-slate-300 mb-2">Select Race Session</label>
                  <select 
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                     value={selectedId}
                     onChange={(e) => setSelectedId(e.target.value)}
                  >
                     {sortedSessions.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({new Date(s.date).toLocaleDateString()})</option>
                     ))}
                  </select>
               </div>
            )}

            {mode === 'athlete' && (
               <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-bold text-slate-300 mb-2">Select Athlete</label>
                  <select 
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                     value={selectedId}
                     onChange={(e) => setSelectedId(e.target.value)}
                  >
                     {sortedAthletes.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                     ))}
                  </select>
               </div>
            )}

            <button
               onClick={handleGenerate}
               disabled={loading || (mode !== 'team' && !selectedId)}
               className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
               {loading ? 'Analyzing Data...' : 'Generate Coach Report'}
            </button>
            
            <div className="text-xs text-slate-500 mt-4 border-t border-slate-700/50 pt-4 italic">
               * The AI Coach uses the Gemini 2.5 Flash model to analyze your local data. Ensure your API key is configured.
            </div>
         </div>

         {/* Output Panel */}
         <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 min-h-[500px] flex flex-col shadow-xl">
             <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between rounded-t-xl">
                <span className="font-mono text-xs text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${loading ? 'bg-indigo-500 animate-pulse' : 'bg-green-500'}`}></div>
                   System Output
                </span>
                {report && (
                   <span className="text-xs text-slate-500">Generated just now</span>
                )}
             </div>
             
             <div className="p-8 flex-1 overflow-y-auto max-h-[70vh] custom-scrollbar">
                {loading ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                      <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                      <p className="animate-pulse">Consulting the data...</p>
                   </div>
                ) : report ? (
                   <div className="prose prose-invert prose-indigo max-w-none">
                      <div className="whitespace-pre-wrap leading-relaxed text-slate-200">
                         {report}
                      </div>
                   </div>
                ) : (
                   <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-50">
                      <Brain className="w-24 h-24" />
                      <p className="text-center max-w-sm">Select a scope and click Generate to receive a comprehensive analysis report.</p>
                   </div>
                )}
             </div>
         </div>
      </div>
    </div>
  );
};