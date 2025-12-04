import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Athlete, RaceSession } from '../types';
import { TrendingUp, Users, Filter } from 'lucide-react';

interface Props {
  athletes: Athlete[];
  sessions: RaceSession[];
}

const LINE_COLORS = [
  '#eab308', // Yellow-500
  '#3b82f6', // Blue-500
  '#ef4444', // Red-500
  '#22c55e', // Green-500
  '#a855f7', // Purple-500
  '#f97316', // Orange-500
  '#06b6d4', // Cyan-500
  '#ec4899', // Pink-500
  '#6366f1', // Indigo-500
  '#14b8a6', // Teal-500
];

export const TrendsAnalysis: React.FC<Props> = ({ athletes, sessions }) => {
  // Default to selecting the top 5 athletes by ID if none selected
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Memoize data transformation
  const chartData = useMemo(() => {
    // Sort sessions by date
    const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return sortedSessions.map(session => {
      const pointMap: { [key: string]: number | null } = {};
      
      session.results.forEach(r => {
        // Only include actual results, not penalties if desired. 
        // Penalties have points but time=0. Usually trends show performance, so we might keep penalties to show the drop
        // or filter them out. Let's include them as they are part of the "Score" history.
        pointMap[r.athleteId] = r.points;
      });

      return {
        date: new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: session.date,
        raceName: session.name,
        ...pointMap
      };
    });
  }, [sessions]);

  const toggleAthlete = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const selectTopAthletes = () => {
     // Select top 5 based on race count
     const sortedByRaces = [...athletes].sort((a, b) => {
        const countB = sessions.filter(s => s.results.some(r => r.athleteId === b.id)).length;
        const countA = sessions.filter(s => s.results.some(r => r.athleteId === a.id)).length;
        return countB - countA;
     });
     setSelectedIds(sortedByRaces.slice(0, 5).map(a => a.id));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-800 p-4 border border-slate-700 rounded-lg shadow-xl">
          <p className="font-bold text-white mb-1">{dataPoint.raceName}</p>
          <p className="text-xs text-slate-400 mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((p: any) => (
              <div key={p.name} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                <span className="text-slate-200">{p.name}:</span>
                <span className="font-mono font-bold text-white">{p.value} pts</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-yellow-500" />
            Performance Trends
          </h2>
          <p className="text-slate-400 text-sm">Visualize athlete point progression over the season</p>
        </div>
        
        {selectedIds.length === 0 && (
           <button 
             onClick={selectTopAthletes}
             className="text-sm bg-slate-800 hover:bg-slate-700 text-yellow-500 border border-slate-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
           >
             <Filter className="w-4 h-4" />
             Select Top 5 Active
           </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[500px]">
        {/* Chart Area */}
        <div className="lg:col-span-3 bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col shadow-xl">
           {selectedIds.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
                <Users className="w-16 h-16 opacity-20" />
                <p>Select athletes from the list to view their performance history.</p>
             </div>
           ) : (
             <div className="flex-1 min-h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                   <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      tickLine={false}
                      axisLine={false}
                   />
                   <YAxis 
                      stroke="#94a3b8" 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                   />
                   <Tooltip content={<CustomTooltip />} />
                   <Legend wrapperStyle={{ paddingTop: '20px' }} />
                   {selectedIds.map((id, index) => {
                     const athlete = athletes.find(a => a.id === id);
                     if (!athlete) return null;
                     return (
                       <Line
                         key={id}
                         type="monotone"
                         dataKey={id}
                         name={athlete.name}
                         stroke={LINE_COLORS[index % LINE_COLORS.length]}
                         strokeWidth={3}
                         dot={{ r: 4, fill: '#1e293b', strokeWidth: 2 }}
                         activeDot={{ r: 6, strokeWidth: 0 }}
                         connectNulls
                       />
                     );
                   })}
                 </LineChart>
               </ResponsiveContainer>
             </div>
           )}
        </div>

        {/* Athlete Selector Sidebar */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col h-full overflow-hidden">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            Select Athletes
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
            {athletes.map((athlete) => {
               const isSelected = selectedIds.includes(athlete.id);
               // Find color index based on selectedIds order or fixed? 
               // Better to fix color based on selection index if possible, but map index changes.
               // Let's just find index in selectedIds to match color if selected
               const colorIndex = selectedIds.indexOf(athlete.id);
               const color = colorIndex >= 0 ? LINE_COLORS[colorIndex % LINE_COLORS.length] : undefined;

               return (
                 <button
                   key={athlete.id}
                   onClick={() => toggleAthlete(athlete.id)}
                   className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                     isSelected 
                       ? 'bg-slate-700 text-white shadow-md ring-1 ring-slate-600' 
                       : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'
                   }`}
                 >
                   <div className={`w-4 h-4 rounded-full border flex-shrink-0 ${isSelected ? 'border-transparent' : 'border-slate-500'}`} style={{ backgroundColor: color || 'transparent' }}></div>
                   <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-6 h-6 rounded-full bg-slate-600 overflow-hidden flex-shrink-0">
                         {athlete.photoUrl ? (
                            <img src={athlete.photoUrl} className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px]">{athlete.name.charAt(0)}</div>
                         )}
                      </div>
                      <span className="truncate text-sm font-medium">{athlete.name}</span>
                   </div>
                 </button>
               );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-center text-slate-500">
            {selectedIds.length} athletes selected
          </div>
        </div>
      </div>
    </div>
  );
};