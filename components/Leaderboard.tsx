
import React from 'react';
import { Athlete, RaceSession } from '../types';
import { Trophy } from 'lucide-react';

interface Props {
  athletes: Athlete[];
  sessions: RaceSession[];
}

interface RankedAthlete {
  athlete: Athlete;
  totalPoints: number;
  averagePoints: number;
  racesRun: number;
}

export const Leaderboard: React.FC<Props> = ({ athletes, sessions }) => {
  // Only show active athletes on the leaderboard
  const activeAthletes = athletes.filter(a => a.isActive);

  const data: RankedAthlete[] = activeAthletes.map(athlete => {
    const athleteResults = sessions.flatMap(s => s.results).filter(r => r.athleteId === athlete.id);
    
    // Total points includes everything (Actual Races + Penalties)
    const totalPoints = athleteResults.reduce((sum, r) => sum + r.points, 0);
    
    // Races Run ONLY counts actual races (where time > 0)
    const racesRun = athleteResults.filter(r => r.time > 0).length;
    
    // Average = Total Points / Total Entries (Races + Penalties)
    // If we only divided by racesRun, penalties wouldn't drag the average down correctly.
    const totalEntries = athleteResults.length;
    const averagePoints = totalEntries > 0 ? Math.round(totalPoints / totalEntries) : 0;

    return {
      athlete,
      totalPoints,
      averagePoints,
      racesRun
    };
  });

  // Sort by Average Points descending
  data.sort((a, b) => b.averagePoints - a.averagePoints);

  const TopThree = ({ data }: { data: RankedAthlete[] }) => (
    <div className="grid grid-cols-3 gap-4 mb-10 items-end max-w-2xl mx-auto">
      {/* 2nd Place */}
      {data[1] && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-slate-400 overflow-hidden mb-2 relative">
             <img src={data[1].athlete.photoUrl || `https://ui-avatars.com/api/?name=${data[1].athlete.name}`} className="w-full h-full object-cover" />
             <div className="absolute bottom-0 w-full bg-slate-400 text-slate-900 text-xs font-bold text-center">2nd</div>
          </div>
          <p className="font-bold text-slate-200 text-sm md:text-base text-center">{data[1].athlete.name}</p>
          <p className="font-mono text-yellow-500 font-bold">{data[1].averagePoints} pts</p>
        </div>
      )}
      
      {/* 1st Place */}
      {data[0] && (
        <div className="flex flex-col items-center -mt-6">
          <Trophy className="text-yellow-400 w-8 h-8 mb-2 animate-bounce" />
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-yellow-400 overflow-hidden mb-2 relative shadow-[0_0_20px_rgba(250,204,21,0.3)]">
             <img src={data[0].athlete.photoUrl || `https://ui-avatars.com/api/?name=${data[0].athlete.name}`} className="w-full h-full object-cover" />
             <div className="absolute bottom-0 w-full bg-yellow-400 text-slate-900 text-xs font-bold text-center">1st</div>
          </div>
          <p className="font-bold text-white text-lg text-center">{data[0].athlete.name}</p>
          <p className="font-mono text-yellow-400 text-xl font-bold">{data[0].averagePoints} pts</p>
        </div>
      )}

      {/* 3rd Place */}
      {data[2] && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-amber-700 overflow-hidden mb-2 relative">
             <img src={data[2].athlete.photoUrl || `https://ui-avatars.com/api/?name=${data[2].athlete.name}`} className="w-full h-full object-cover" />
             <div className="absolute bottom-0 w-full bg-amber-700 text-slate-200 text-xs font-bold text-center">3rd</div>
          </div>
          <p className="font-bold text-slate-200 text-sm md:text-base text-center">{data[2].athlete.name}</p>
          <p className="font-mono text-yellow-500 font-bold">{data[2].averagePoints} pts</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Season Leaderboard</h2>
        <p className="text-slate-400">Ranked by Average Points (Active Athletes)</p>
      </div>

      <TopThree data={data} />

      <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-16 text-center">Rank</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Athlete</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Races</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Total Pts</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Avg Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {data.map((row, index) => (
                <tr key={row.athlete.id} className="hover:bg-slate-700/50 transition-colors group">
                  <td className="p-4 text-center font-mono text-slate-500 group-hover:text-white">
                    {index + 1}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                        {row.athlete.photoUrl ? (
                          <img src={row.athlete.photoUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">{row.athlete.name.charAt(0)}</div>
                        )}
                      </div>
                      <span className="font-medium text-slate-200">{row.athlete.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-400">{row.racesRun}</td>
                  <td className="p-4 text-right font-mono text-slate-400">{row.totalPoints}</td>
                  <td className="p-4 text-right">
                    <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded border border-yellow-500/20 font-bold font-mono">
                      {row.averagePoints}
                    </span>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No active athletes found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
