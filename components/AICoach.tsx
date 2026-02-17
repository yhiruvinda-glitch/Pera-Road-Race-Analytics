
import React, { useState, useRef } from 'react';
import { Athlete, RaceSession, EventStandard } from '../types';
import { generateCoachingReport } from '../services/geminiService';
import { Brain, Sparkles, Loader2, Target, Users, Calendar, Copy, Check, Download, History as HistoryIcon } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const activeAthletes = [...athletes].filter(a => a.isActive).sort((a, b) => a.name.localeCompare(b.name));

  const handleGenerate = async () => {
    setLoading(true);
    setReport('');
    setCopied(false);
    
    const subjectId = mode === 'team' ? undefined : selectedId;
    
    if (mode !== 'team' && !subjectId) {
        setLoading(false);
        return;
    }

    const result = await generateCoachingReport(mode, subjectId, { athletes, sessions, standards });
    setReport(result);
    setLoading(false);
  };

  const handleCopy = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Brain className="w-8 h-8 text-indigo-400" />
             </div>
             <h2 className="text-3xl font-black text-white tracking-tight">AI COACH <span className="text-indigo-500 font-mono text-sm ml-2">v3.0</span></h2>
           </div>
           <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
             Leverage high-performance sports science modeling to analyze team dynamics, race results, and individual progression.
           </p>
        </div>
        
        {report && (
          <div className="flex gap-2">
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold transition-all border border-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Report'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Sidebar Controls (4 cols) */}
         <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <HistoryIcon className="w-3 h-3" /> Configuration
               </h3>
               
               <div className="space-y-6">
                  {/* Scope Selector */}
                  <div>
                     <label className="block text-sm font-bold text-slate-300 mb-3">Analysis Scope</label>
                     <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button 
                          onClick={() => { setMode('team'); setSelectedId(''); }}
                          className={`flex flex-col items-center justify-center py-3 px-1 rounded-lg transition-all ${mode === 'team' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                           <Users className="w-5 h-5 mb-1" />
                           <span className="text-[10px] font-black uppercase">Team</span>
                        </button>
                        <button 
                          onClick={() => { setMode('session'); setSelectedId(sortedSessions[0]?.id || ''); }}
                          className={`flex flex-col items-center justify-center py-3 px-1 rounded-lg transition-all ${mode === 'session' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                           <Calendar className="w-5 h-5 mb-1" />
                           <span className="text-[10px] font-black uppercase">Race</span>
                        </button>
                        <button 
                          onClick={() => { setMode('athlete'); setSelectedId(activeAthletes[0]?.id || ''); }}
                          className={`flex flex-col items-center justify-center py-3 px-1 rounded-lg transition-all ${mode === 'athlete' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                           <Target className="w-5 h-5 mb-1" />
                           <span className="text-[10px] font-black uppercase">Athlete</span>
                        </button>
                     </div>
                  </div>

                  {/* Context-Specific Pickers */}
                  {mode === 'session' && (
                     <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-bold text-slate-300 mb-2">Select Competition</label>
                        <select 
                           className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                           value={selectedId}
                           onChange={(e) => setSelectedId(e.target.value)}
                        >
                           {sortedSessions.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.date})</option>
                           ))}
                        </select>
                     </div>
                  )}

                  {mode === 'athlete' && (
                     <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-bold text-slate-300 mb-2">Select Performance Profile</label>
                        <select 
                           className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                           value={selectedId}
                           onChange={(e) => setSelectedId(e.target.value)}
                        >
                           {activeAthletes.map(a => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                           ))}
                        </select>
                     </div>
                  )}

                  <button
                     onClick={handleGenerate}
                     disabled={loading || (mode !== 'team' && !selectedId)}
                     className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/10 active:scale-[0.98]"
                  >
                     {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                     {loading ? 'Synthesizing...' : 'Generate Analysis'}
                  </button>
               </div>
            </div>

            <div className="p-5 bg-amber-500/5 rounded-2xl border border-amber-500/20">
               <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                 <Brain className="w-3 h-3" /> Data engine
               </p>
               <p className="text-xs text-slate-400 leading-relaxed italic">
                 Analysis generated by Gemini 3.0 Pro using the Team's custom Points Matrix and physiological decay models.
               </p>
            </div>
         </div>

         {/* Report Output (8 cols) */}
         <div className="lg:col-span-8">
             <div className="bg-slate-900 border border-slate-800 rounded-3xl min-h-[600px] flex flex-col shadow-2xl overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${loading ? 'bg-indigo-500 animate-pulse' : report ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                       <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                          {loading ? 'Engine Processing...' : report ? 'Analysis Complete' : 'Awaiting Input'}
                       </span>
                    </div>
                 </div>
                 
                 <div ref={reportRef} className="p-8 flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.03),transparent)]">
                    {loading ? (
                       <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-6">
                          <div className="relative">
                            <div className="w-20 h-20 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                            <Brain className="w-8 h-8 text-indigo-500 absolute inset-0 m-auto" />
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-slate-200 animate-pulse">Running Neural Simulation...</p>
                            <p className="text-xs text-slate-500 mt-2">Correlating point trends across faculty rosters.</p>
                          </div>
                       </div>
                    ) : report ? (
                       <article className="prose prose-invert prose-indigo max-w-none 
                         prose-headings:font-black prose-headings:tracking-tight prose-headings:text-white
                         prose-p:text-slate-300 prose-p:leading-relaxed
                         prose-strong:text-indigo-400
                         prose-table:border prose-table:border-slate-800 prose-thead:bg-slate-950 prose-td:p-3 prose-th:p-3
                         prose-ul:list-disc prose-li:text-slate-300">
                          <div className="whitespace-pre-wrap">
                             {report}
                          </div>
                       </article>
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 py-20 opacity-30">
                          <Brain className="w-24 h-24" />
                          <div className="text-center">
                            <p className="text-xl font-bold">Ready for Analysis</p>
                            <p className="text-sm max-w-xs mx-auto">Select a team, session, or athlete profile to generate a tactical performance report.</p>
                          </div>
                       </div>
                    )}
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};
