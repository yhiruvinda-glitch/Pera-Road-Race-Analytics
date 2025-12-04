import React, { useState, useMemo } from 'react';
import { Athlete, EventStandard, PB, RaceSession } from '../types';
import { formatTime, parseTime, getEventDistance, sortEventsByDistance } from '../utils';
import { UserPlus, Trash2, Camera, Trophy, Plus, X, ArrowLeft, MapPin, History, Medal, Zap, Flame, Mountain, Star, Award, Crown, TrendingUp, AlertTriangle, UserMinus, UserCheck, Search, Timer } from 'lucide-react';

interface Props {
  athletes: Athlete[];
  standards: EventStandard[];
  sessions: RaceSession[];
  onAdd: (name: string, faculty: string, batch: string, photo: string | undefined, pbs: PB[]) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  isAdmin?: boolean;
}

const FACULTIES = [
  'Agriculture',
  'AHS',
  'Arts',
  'Dental Sciences',
  'Engineering',
  'Management',
  'Medicine',
  'Science',
  'Veterinary Sciences'
];

export const AthleteManager: React.FC<Props> = ({ athletes, standards, sessions, onAdd, onDelete, onToggleStatus, isAdmin = false }) => {
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newFaculty, setNewFaculty] = useState('');
  const [newBatch, setNewBatch] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | undefined>(undefined);
  
  // State for PB Entry
  const [newPBs, setNewPBs] = useState<PB[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [pbTimeInput, setPbTimeInput] = useState('');
  const [pbDateInput, setPbDateInput] = useState('');
  const [pbVenueInput, setPbVenueInput] = useState('');

  // State for delete/retire confirmation
  const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);
  const [athleteToToggle, setAthleteToToggle] = useState<Athlete | null>(null);

  const sortedStandards = useMemo(() => sortEventsByDistance(standards), [standards]);

  // Filter and Sort Logic
  const filteredAndSortedAthletes = useMemo(() => {
    // 1. Pre-calculate Ranks for Active Athletes
    // Matches Leaderboard Logic: Avg Points = Total Points / Total Entries (including penalties)
    const activeAthletesList = athletes.filter(a => a.isActive);
    const activeStats = activeAthletesList.map(a => {
      const aResults = sessions.flatMap(s => s.results).filter(r => r.athleteId === a.id);
      const totalPts = aResults.reduce((sum, r) => sum + r.points, 0);
      const totalEntries = aResults.length;
      const avgPts = totalEntries > 0 ? Math.round(totalPts / totalEntries) : 0;
      return { id: a.id, avgPts };
    }).sort((a, b) => b.avgPts - a.avgPts); // Descending Avg Pts
    
    const currentRankMap = new Map<string, number>();
    activeStats.forEach((s, index) => {
      currentRankMap.set(s.id, index + 1);
    });

    // 2. Pre-calculate Peak Avg for Retired Athletes (for sorting)
    const retiredAthletesList = athletes.filter(a => !a.isActive);
    const peakAvgMap = new Map<string, number>();
    
    if (retiredAthletesList.length > 0) {
        const chronSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        retiredAthletesList.forEach(a => {
             let highestAvg = 0;
             let totalPoints = 0;
             let count = 0;
             // Replay history
             for (const session of chronSessions) {
                const res = session.results.find(r => r.athleteId === a.id);
                if (res) {
                   totalPoints += res.points;
                   count++;
                   const currentAvg = Math.round(totalPoints / count);
                   if (currentAvg > highestAvg) highestAvg = currentAvg;
                }
             }
             peakAvgMap.set(a.id, highestAvg);
        });
    }

    let result = [...athletes];

    // 3. Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.name.toLowerCase().includes(query) || 
        (a.faculty && a.faculty.toLowerCase().includes(query)) ||
        (a.batch && a.batch.toLowerCase().includes(query))
      );
    }

    // 4. Sort
    result.sort((a, b) => {
      // Primary Sort: Active Status
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;

      if (a.isActive) {
        // Active: Sort by Rank (Ascending)
        // If unranked (new athlete with no races), push to bottom
        const rankA = currentRankMap.has(a.id) ? currentRankMap.get(a.id)! : 999999;
        const rankB = currentRankMap.has(b.id) ? currentRankMap.get(b.id)! : 999999;
        
        if (rankA !== rankB) return rankA - rankB;
        // Fallback: Name
        return a.name.localeCompare(b.name);
      } else {
        // Retired: Sort by Peak Avg (Descending)
        const peakA = peakAvgMap.get(a.id) || 0;
        const peakB = peakAvgMap.get(b.id) || 0;
        
        if (peakA !== peakB) return peakB - peakA;
        // Fallback: Name
        return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [athletes, sessions, searchQuery]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPB = () => {
    const time = parseTime(pbTimeInput);
    if (selectedEventId && time) {
      setNewPBs(prev => [
        ...prev.filter(pb => pb.eventId !== selectedEventId), // Replace if exists
        {
          eventId: selectedEventId,
          time,
          date: pbDateInput,
          venue: pbVenueInput
        }
      ]);
      // Reset inputs
      setSelectedEventId('');
      setPbTimeInput('');
      setPbDateInput('');
      setPbVenueInput('');
    }
  };

  const handleRemovePB = (eventId: string) => {
    setNewPBs(prev => prev.filter(pb => pb.eventId !== eventId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(newName, newFaculty, newBatch, newPhoto, newPBs);
    setIsAdding(false);
    
    // Reset
    setNewName('');
    setNewFaculty('');
    setNewBatch('');
    setNewPhoto(undefined);
    setNewPBs([]);
    setSelectedEventId('');
    setPbTimeInput('');
    setPbDateInput('');
    setPbVenueInput('');
  };

  const confirmDelete = () => {
    if (athleteToDelete) {
      onDelete(athleteToDelete.id);
      setAthleteToDelete(null);
    }
  };

  const confirmToggleStatus = () => {
    if (athleteToToggle) {
      onToggleStatus(athleteToToggle.id);
      setAthleteToToggle(null);
    }
  };

  // --- Stats Calculation Helpers ---

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${meters} m`;
  };

  const calculateRank = (athleteId: string, sessionList: RaceSession[]): number => {
    // Rank logic: Only active athletes are ranked in the current season leaderboard.
    const activeAthletes = athletes.filter(a => a.isActive);
    const subject = athletes.find(a => a.id === athleteId);
    
    // If athlete is not active, they don't have a current rank
    if (!subject || !subject.isActive) return 0;

    const allStats = activeAthletes.map(a => {
      const aResults = sessionList.flatMap(s => s.results).filter(r => r.athleteId === a.id);
      const totalPts = aResults.reduce((sum, r) => sum + r.points, 0);
      const totalEntries = aResults.length;
      const avgPts = totalEntries > 0 ? Math.round(totalPts / totalEntries) : 0;
      return { id: a.id, avgPts };
    }).sort((a, b) => b.avgPts - a.avgPts);
    
    return allStats.findIndex(s => s.id === athleteId) + 1;
  };

  // Calculate Career Highs by replaying history
  const getCareerStats = (athleteId: string) => {
    const chronSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let bestRank = Infinity;
    let highestAvg = 0;
    
    // Map to track running totals: id -> { totalPoints, count }
    const historyStats = new Map<string, { totalPoints: number, count: number }>();

    for (const session of chronSessions) {
       // 1. Update stats for all participants in this session
       session.results.forEach(r => {
          const current = historyStats.get(r.athleteId) || { totalPoints: 0, count: 0 };
          historyStats.set(r.athleteId, {
             totalPoints: current.totalPoints + r.points,
             count: current.count + 1
          });
       });

       // 2. Only calculate rank/avg if the target athlete has data at this point
       const targetStats = historyStats.get(athleteId);
       if (targetStats) {
          // Calculate current average for target
          const currentAvg = Math.round(targetStats.totalPoints / targetStats.count);
          if (currentAvg > highestAvg) highestAvg = currentAvg;

          // Calculate rank against everyone else who has data at this point
          // We assume anyone with data is "active" historically for the purpose of historical ranking
          const leaderboard = Array.from(historyStats.entries()).map(([id, s]) => ({
             id,
             avg: Math.round(s.totalPoints / s.count)
          })).sort((a, b) => b.avg - a.avg);

          const rankIndex = leaderboard.findIndex(item => item.id === athleteId);
          if (rankIndex !== -1) {
             const currentRank = rankIndex + 1;
             if (currentRank < bestRank) bestRank = currentRank;
          }
       }
    }

    return {
       bestRank: bestRank === Infinity ? 0 : bestRank,
       highestAvg
    };
  };

  const getBadges = (athleteId: string, athleteResults: any[]) => {
    const badges = [];

    const maxPoints = Math.max(...athleteResults.map(r => r.points || 0), 0);
    const runs = athleteResults.filter(r => r.time > 0).length;
    const totalPts = athleteResults.reduce((sum, r) => sum + (r.points || 0), 0);
    const totalEntries = athleteResults.length;
    const avgPoints = totalEntries > 0 ? totalPts / totalEntries : 0;

    if (maxPoints >= 950) {
      badges.push({ name: 'The GOAT', icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', desc: 'Legendary Status: 950+ points in a race' });
    } else if (maxPoints >= 900) {
      badges.push({ name: '900 Club', icon: Award, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', desc: 'Elite Performance: 900+ points in a race' });
    } else if (maxPoints >= 800) {
      badges.push({ name: '800 Club', icon: Award, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20', desc: 'High Performance: 800+ points in a race' });
    } else if (maxPoints >= 700) {
      badges.push({ name: '700 Club', icon: Award, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', desc: 'Strong Performance: 700+ points in a race' });
    } else if (maxPoints >= 600) {
      badges.push({ name: '600 Club', icon: Award, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', desc: 'Solid Performance: 600+ points in a race' });
    } else if (maxPoints >= 500) {
      badges.push({ name: '500 Club', icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', desc: 'Breaking Through: 500+ points in a race' });
    }

    const hasSpeed = athleteResults.some(r => {
      const evt = standards.find(s => s.id === r.eventId);
      const isShort = evt && (evt.name.includes('1500') || evt.name.includes('3000') || evt.goldTime < 600);
      return isShort && r.points > 850;
    });
    if (hasSpeed) {
      badges.push({ name: 'Speedster', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', desc: 'Elite speed in short distances' });
    }

    const hasEndurance = athleteResults.some(r => {
      const evt = standards.find(s => s.id === r.eventId);
      const isLong = evt && (evt.name.includes('7km') || evt.name.includes('10km') || evt.goldTime > 1200);
      return isLong && r.points > 850;
    });
    if (hasEndurance) {
      badges.push({ name: 'Endurance Beast', icon: Mountain, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', desc: 'Dominance in long distance events' });
    }

    let winStreak = 0;
    for (const r of athleteResults) {
      if (r.time > 0) {
        if (r.rank === 1) winStreak++;
        else break;
      }
    }
    if (winStreak >= 2) {
      badges.push({ name: 'Streak Wins', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', desc: 'Won consecutive races' });
    }

    if (runs > 0 && runs <= 5 && avgPoints > 700) {
      badges.push({ name: 'Emerging Star', icon: Star, color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/20', desc: 'Outstanding start to the season' });
    }

    const podiumCount = athleteResults.filter(r => r.time > 0 && r.rank <= 3).length;
    if (podiumCount >= 3) {
      badges.push({ name: 'Podium Regular', icon: Medal, color: 'text-sky-300', bg: 'bg-sky-500/10', border: 'border-sky-500/20', desc: 'Consistent: 3+ podium finishes' });
    }

    if (sessions.length > 1) {
      const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestSession = sortedSessions[0];
      const currentRank = calculateRank(athleteId, sessions);
      const prevSessions = sessions.filter(s => s.id !== latestSession.id);
      if (prevSessions.length > 0) {
         const hasPreviousHistory = prevSessions.some(s => s.results.some(r => r.athleteId === athleteId));
         if (hasPreviousHistory && currentRank > 0) {
            const prevRank = calculateRank(athleteId, prevSessions);
            if (prevRank > 0 && currentRank < prevRank) {
               badges.push({ name: 'Climber', icon: TrendingUp, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20', desc: `Moved up from #${prevRank} to #${currentRank} this week` });
            }
         }
      }
    }

    return badges;
  };

  const getAthleteStats = (athleteId: string) => {
    const currentRank = calculateRank(athleteId, sessions);
    const rawResults = sessions.flatMap(s => s.results.map(r => ({ 
      ...r, 
      date: s.date, 
      eventId: s.eventId, 
      sessionName: s.name, 
      sessionId: s.id
    })));
    
    const athleteResults = rawResults
      .filter(r => r.athleteId === athleteId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const racesRun = athleteResults.filter(r => r.time > 0).length;
    const totalPoints = athleteResults.reduce((sum, r) => sum + r.points, 0);
    const totalEntries = athleteResults.length;
    const avgPts = totalEntries > 0 ? Math.round(totalPoints / totalEntries) : 0;
    const wins = athleteResults.filter(r => r.time > 0 && r.rank === 1).length;
    const podiums = athleteResults.filter(r => r.time > 0 && r.rank > 0 && r.rank <= 3).length;

    const totalDistanceMeters = athleteResults.reduce((sum, r) => {
      if (r.time <= 0) return sum;
      const evt = standards.find(s => s.id === r.eventId);
      return sum + (evt ? getEventDistance(evt.name) : 0);
    }, 0);

    const badges = getBadges(athleteId, athleteResults);

    return {
      rank: currentRank,
      racesRun,
      wins,
      podiums,
      totalPoints,
      avgPoints: avgPts,
      totalDistance: formatDistance(totalDistanceMeters),
      recentRaces: athleteResults,
      badges
    };
  };

  const renderProfile = (athlete: Athlete) => {
    const stats = getAthleteStats(athlete.id);
    const careerStats = getCareerStats(athlete.id);

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
        <button 
          onClick={() => setSelectedAthlete(null)}
          className="flex items-center text-slate-400 hover:text-white transition-colors group mb-2"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Roster
        </button>

        {/* --- HERO SECTION --- */}
        <div className={`relative bg-slate-800 rounded-3xl border border-slate-700 p-6 md:p-8 overflow-hidden shadow-2xl ${!athlete.isActive ? 'grayscale opacity-90' : ''}`}>
          {/* Background Decor */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
             <Trophy className="w-48 h-48 text-yellow-500 transform rotate-12" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
             {/* Identity */}
             <div className="flex-shrink-0">
               <div className="w-32 h-32 md:w-40 md:h-40 rounded-full ring-4 ring-slate-700 shadow-2xl overflow-hidden bg-slate-800">
                 {athlete.photoUrl ? (
                   <img src={athlete.photoUrl} alt={athlete.name} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-500">
                     {athlete.name.charAt(0)}
                   </div>
                 )}
               </div>
             </div>

             <div className="flex-1 text-center md:text-left space-y-2">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{athlete.name}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-lg text-slate-400">
                   <span className="font-semibold text-slate-300">{athlete.faculty}</span>
                   {athlete.batch && <span className="bg-slate-700/50 px-2 py-0.5 rounded text-sm">{athlete.batch}</span>}
                   <span className={`px-2 py-0.5 rounded text-sm font-bold uppercase tracking-wide border ${athlete.isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                      {athlete.isActive ? 'Active' : 'Retired'}
                   </span>
                </div>
             </div>

             {/* MASSIVE RANK */}
             <div className="flex-shrink-0 text-center md:text-right flex flex-col items-center md:items-end">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Current Rank</div>
                <div className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-2xl leading-none">
                   {stats.rank > 0 ? `#${stats.rank}` : '-'}
                </div>
                <div className="mt-2 flex items-baseline gap-2 bg-slate-900/40 px-4 py-1.5 rounded-lg border border-slate-700/30 backdrop-blur-sm">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Avg Pts</span>
                    <span className="text-2xl font-mono font-bold text-white">{stats.avgPoints}</span>
                </div>
             </div>
          </div>
        </div>

        {/* --- VICTORY ROW --- */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
           {/* Wins Card */}
           <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/5 border border-amber-500/20 rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group">
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform">
                 <Crown className="w-32 h-32 text-amber-500" />
              </div>
              <div>
                 <div className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-1">Career Wins</div>
                 <div className="text-5xl font-black text-white">{stats.wins}</div>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-full text-amber-400 border border-amber-500/30">
                 <Crown className="w-8 h-8" />
              </div>
           </div>

           {/* Podiums Card */}
           <div className="bg-gradient-to-br from-indigo-500/10 to-violet-600/5 border border-indigo-500/20 rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group">
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform">
                 <Medal className="w-32 h-32 text-indigo-500" />
              </div>
              <div>
                 <div className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-1">Podiums</div>
                 <div className="text-5xl font-black text-white">{stats.podiums}</div>
              </div>
              <div className="p-3 bg-indigo-500/20 rounded-full text-indigo-400 border border-indigo-500/30">
                 <Medal className="w-8 h-8" />
              </div>
           </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {/* Peak Rank */}
           <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                 <TrendingUp className="w-4 h-4 text-emerald-400" />
                 <span className="text-xs font-bold text-slate-400 uppercase">Peak Rank</span>
              </div>
              <div className="text-3xl font-bold text-white">
                 {careerStats.bestRank > 0 ? `#${careerStats.bestRank}` : '-'}
              </div>
           </div>

           {/* Peak Avg */}
           <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                 <Zap className="w-4 h-4 text-purple-400" />
                 <span className="text-xs font-bold text-slate-400 uppercase">Peak Avg Pts</span>
              </div>
              <div className="text-3xl font-bold text-white">
                 {careerStats.highestAvg}
              </div>
           </div>

           {/* Races Run */}
           <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                 <Timer className="w-4 h-4 text-blue-400" />
                 <span className="text-xs font-bold text-slate-400 uppercase">Races Run</span>
              </div>
              <div className="text-3xl font-bold text-white">
                 {stats.racesRun}
              </div>
           </div>

           {/* Distance */}
           <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                 <MapPin className="w-4 h-4 text-rose-400" />
                 <span className="text-xs font-bold text-slate-400 uppercase">Total Dist</span>
              </div>
              <div className="text-2xl font-bold text-white truncate" title={stats.totalDistance}>
                 {stats.totalDistance}
              </div>
           </div>
        </div>

        {/* --- BADGES --- */}
        {stats.badges.length > 0 && (
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-white">
                <Award className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-lg">Achievements</h3>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {stats.badges.map((badge, idx) => (
                <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border ${badge.bg} ${badge.border} transition-transform hover:scale-[1.02] shadow-sm`}>
                  <div className={`p-3 rounded-full bg-slate-900 ${badge.color} border border-slate-700/50 shrink-0`}>
                    <badge.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className={`font-bold ${badge.color} text-sm uppercase tracking-wide mb-0.5`}>{badge.name}</h4>
                    <p className="text-xs text-slate-400 leading-tight">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- DETAILS TABLES --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {/* Personal Bests Column */}
          <div className="md:col-span-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden h-fit">
            <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <h3 className="font-bold text-white">Personal Bests</h3>
            </div>
            <div className="p-2">
              {athlete.personalBests.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">No PBs recorded.</div>
              ) : (
                <div className="space-y-1">
                  {athlete.personalBests.map(pb => {
                     const evt = standards.find(s => s.id === pb.eventId);
                     return (
                       <div key={pb.eventId} className="flex flex-col p-3 hover:bg-slate-700/30 rounded-lg transition-colors border-b border-slate-700/50 last:border-0">
                         <div className="flex justify-between items-center mb-1">
                           <span className="text-slate-300 text-sm font-medium">{evt?.name || 'Unknown'}</span>
                           <span className="font-mono font-bold text-yellow-500">{formatTime(pb.time)}</span>
                         </div>
                         {(pb.date || pb.venue) && (
                           <div className="text-[10px] text-slate-500 flex gap-2">
                             {pb.date && <span>{new Date(pb.date).toLocaleDateString()}</span>}
                             {pb.date && pb.venue && <span>•</span>}
                             {pb.venue && <span>{pb.venue}</span>}
                           </div>
                         )}
                       </div>
                     )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Race History Column */}
          <div className="md:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
             <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="font-bold text-white">Recent Race History</h3>
            </div>
            <div className="overflow-x-auto">
              {stats.recentRaces.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No race data available.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700">
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium">Event</th>
                      <th className="p-3 font-medium text-center">Place</th>
                      <th className="p-3 font-medium text-right">Time</th>
                      <th className="p-3 font-medium text-right">Points</th>
                      <th className="p-3 font-medium text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {stats.recentRaces.map((race, idx) => {
                      const evt = standards.find(s => s.id === race.eventId);
                      return (
                        <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                          <td className="p-3 text-slate-400 whitespace-nowrap">{new Date(race.date).toLocaleDateString()}</td>
                          <td className="p-3 text-white">
                            <div className="font-medium">{race.sessionName}</div>
                            <div className="text-xs text-slate-500">{evt?.name}</div>
                          </td>
                           <td className="p-3 text-center font-bold text-white">
                            {race.rank === 1 ? <span className="text-yellow-500">1st</span> :
                             race.rank === 2 ? <span className="text-slate-300">2nd</span> :
                             race.rank === 3 ? <span className="text-amber-700">3rd</span> :
                             (race.time === 0 ? <span className="text-red-400">DNS</span> : <span className="text-slate-400">#{race.rank}</span>)}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-300">{formatTime(race.time)}</td>
                          <td className="p-3 text-right font-mono font-bold text-yellow-500">{race.points}</td>
                          <td className="p-3 text-right">
                             <div className="flex justify-end gap-1">
                               {race.tags.map(tag => (
                                 <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                    tag === 'PB' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                    tag === 'SB' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    tag === 'Penalty' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                 }`}>
                                   {tag}
                                 </span>
                               ))}
                               {race.tags.length === 0 && <span className="text-slate-600">-</span>}
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (selectedAthlete) {
    return renderProfile(selectedAthlete);
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Team Roster</h2>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Search athletes..."
                className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-yellow-500 outline-none w-full md:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isAdmin && (
            <button
                onClick={() => setIsAdding(!isAdding)}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors shadow-lg shadow-yellow-500/20 whitespace-nowrap"
            >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">New Athlete</span>
                <span className="sm:hidden">Add</span>
            </button>
            )}
        </div>
      </div>

      {isAdding && isAdmin && (
        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-top-4 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Create Athlete Profile</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Photo & Basic Info */}
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-600 rounded-xl hover:border-yellow-500 transition-colors cursor-pointer relative bg-slate-900/50">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                {newPhoto ? (
                  <img src={newPhoto} alt="Preview" className="w-32 h-32 rounded-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <span className="text-sm text-slate-400">Upload Photo</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                <input
                  required
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:border-yellow-500 outline-none"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Athlete Name"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Faculty</label>
                <select
                  required
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:border-yellow-500 outline-none"
                  value={newFaculty}
                  onChange={e => setNewFaculty(e.target.value)}
                >
                  <option value="">Select Faculty...</option>
                  {FACULTIES.map(fac => (
                    <option key={fac} value={fac}>{fac}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Batch</label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:border-yellow-500 outline-none"
                  value={newBatch}
                  onChange={e => setNewBatch(e.target.value)}
                  placeholder="e.g. 20, 21, 22"
                />
              </div>
            </div>

            {/* Initial PBs */}
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-2">Initial Personal Bests (Optional)</label>
              
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 mb-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                   <select 
                      className="bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm outline-none focus:border-yellow-500"
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                   >
                      <option value="">Select Event...</option>
                      {sortedStandards.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                   </select>
                   <input 
                       className="bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm font-mono outline-none focus:border-yellow-500"
                       placeholder="Time (mm:ss.xx)"
                       value={pbTimeInput}
                       onChange={(e) => setPbTimeInput(e.target.value)}
                   />
                   <input 
                       type="date"
                       className="bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm outline-none focus:border-yellow-500"
                       value={pbDateInput}
                       onChange={(e) => setPbDateInput(e.target.value)}
                   />
                   <input 
                       className="bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm outline-none focus:border-yellow-500"
                       placeholder="Venue / Race Name"
                       value={pbVenueInput}
                       onChange={(e) => setPbVenueInput(e.target.value)}
                   />
                 </div>
                 <div className="flex items-center justify-between">
                    <p className="text-xs text-yellow-500/80 italic flex items-center">
                       <AlertTriangle className="w-3 h-3 mr-1" />
                       Note: These PBs must have been achieved during their university student period.
                    </p>
                    <button
                        type="button"
                        onClick={handleAddPB}
                        disabled={!selectedEventId || !pbTimeInput}
                        className="bg-slate-700 hover:bg-yellow-500 hover:text-slate-900 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:hover:bg-slate-700 disabled:hover:text-white transition-colors text-sm font-medium flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Add Record
                    </button>
                 </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {newPBs.length === 0 && <p className="text-xs text-slate-500 italic text-center py-2">No PBs added yet.</p>}
                
                {newPBs.map((pb) => {
                   const event = standards.find(s => s.id === pb.eventId);
                   return (
                       <div key={pb.eventId} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-700 animate-in fade-in zoom-in-95">
                          <div className="flex flex-col">
                             <span className="text-sm font-medium text-slate-300">{event?.name || 'Unknown'}</span>
                             <div className="text-[10px] text-slate-500 flex gap-2">
                                {pb.date && <span>{new Date(pb.date).toLocaleDateString()}</span>}
                                {pb.venue && <span>{pb.venue}</span>}
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className="font-mono text-yellow-500 font-bold text-sm">{formatTime(pb.time)}</span>
                             <button type="button" onClick={() => handleRemovePB(pb.eventId)} className="text-slate-500 hover:text-red-400 transition-colors">
                                <X className="w-4 h-4" />
                             </button>
                          </div>
                       </div>
                   )
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
             <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white px-4">Cancel</button>
             <button type="submit" className="bg-yellow-500 text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-yellow-400">Create Profile</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedAthletes.map(athlete => (
          <div 
            key={athlete.id} 
            onClick={() => setSelectedAthlete(athlete)}
            className={`bg-slate-800 rounded-xl overflow-hidden border border-slate-700 group hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/5 transition-all cursor-pointer relative ${!athlete.isActive ? 'grayscale opacity-75' : ''}`}
          >
            {isAdmin && (
              <div className="absolute top-2 right-2 z-10 flex gap-2">
                 <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setAthleteToToggle(athlete);
                  }}
                  className={`p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${athlete.isActive ? 'text-slate-600 hover:text-orange-400 hover:bg-slate-900/80' : 'text-slate-600 hover:text-green-400 hover:bg-slate-900/80'}`}
                  title={athlete.isActive ? "Retire Athlete" : "Reactivate Athlete"}
                >
                  {athlete.isActive ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setAthleteToDelete(athlete);
                  }}
                  className="p-2 text-slate-600 hover:text-red-400 hover:bg-slate-900/80 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Athlete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {!athlete.isActive && (
                <div className="absolute top-2 left-2 z-10">
                   <span className="px-2 py-1 rounded bg-slate-900/80 text-slate-400 text-xs font-bold border border-slate-700">Alumni</span>
                </div>
            )}

            <div className="p-6 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-slate-700 mb-4 overflow-hidden ring-4 ring-slate-800 group-hover:ring-yellow-500 transition-all shadow-xl">
                {athlete.photoUrl ? (
                  <img src={athlete.photoUrl} alt={athlete.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-500">
                     {athlete.name.charAt(0)}
                   </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-1 group-hover:text-yellow-400 transition-colors">{athlete.name}</h3>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                {athlete.faculty ? `${athlete.faculty} ${athlete.batch ? `'${athlete.batch}` : ''}` : 'Athlete Profile'}
              </p>
            </div>
            
            <div className="bg-slate-900/50 p-4 border-t border-slate-700">
              <div className="grid grid-cols-3 divide-x divide-slate-700">
                 <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase">PBs</div>
                    <div className="font-mono text-white font-bold">{athlete.personalBests.length}</div>
                 </div>
                 <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase">Races</div>
                    <div className="font-mono text-white font-bold">
                      {sessions.reduce((acc, s) => acc + (s.results.some(r => r.athleteId === athlete.id && r.time > 0) ? 1 : 0), 0)}
                    </div>
                 </div>
                 <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase">Rank</div>
                    <div className="font-mono text-yellow-500 font-bold">#{getAthleteStats(athlete.id).rank > 0 ? getAthleteStats(athlete.id).rank : '-'}</div>
                 </div>
              </div>
            </div>
          </div>
        ))}
        {filteredAndSortedAthletes.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                No athletes found matching "{searchQuery}"
            </div>
        )}
      </div>

      {/* Retire/Reactivate Confirmation Modal */}
      {athleteToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-yellow-500">
              <div className="p-3 bg-yellow-500/10 rounded-full">
                {athleteToToggle.isActive ? <UserMinus className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
              </div>
              <h3 className="text-lg font-bold text-white">
                {athleteToToggle.isActive ? 'Retire Athlete?' : 'Reactivate Athlete?'}
              </h3>
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed">
              {athleteToToggle.isActive ? (
                <>
                  Are you sure you want to retire <span className="font-bold text-white">{athleteToToggle.name}</span>? 
                  <br />
                  They will be hidden from the main leaderboard but their data remains in history.
                </>
              ) : (
                <>
                  Are you sure you want to reactivate <span className="font-bold text-white">{athleteToToggle.name}</span>? 
                  <br />
                  They will appear on the leaderboard again.
                </>
              )}
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
              <button
                onClick={() => setAthleteToToggle(null)}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggleStatus}
                className={`px-4 py-2 text-slate-900 font-bold rounded-lg transition-colors text-sm shadow-lg ${athleteToToggle.isActive ? 'bg-yellow-500 hover:bg-yellow-400 shadow-yellow-500/20' : 'bg-green-500 hover:bg-green-400 shadow-green-500/20'}`}
              >
                {athleteToToggle.isActive ? 'Retire' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {athleteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Athlete?</h3>
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">{athleteToDelete.name}</span>? 
              <br />
              This action cannot be undone and will remove them from the roster. Historical race results will remain but may lose the link to this profile.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
              <button
                onClick={() => setAthleteToDelete(null)}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors text-sm shadow-lg shadow-red-500/20"
              >
                Delete Athlete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};