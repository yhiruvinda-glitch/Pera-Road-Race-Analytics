
import React from 'react';
import { Tab } from '../types';
import { Trophy, Users, History, Activity, TrendingUp, ClipboardList, Lock, Brain } from 'lucide-react';

interface LayoutProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, onTabChange, children }) => {
  const navItems = [
    { id: 'dashboard', label: 'Leaderboard', icon: Trophy },
    { id: 'records', label: 'Records', icon: ClipboardList },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'history', label: 'Race History', icon: History },
    { id: 'athletes', label: 'Athletes', icon: Users },
    { id: 'ai-coach', label: 'AI Coach', icon: Brain },
    { id: 'editor', label: 'Admin Zone', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0 z-20">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-12 h-12 flex items-center justify-center">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg p-2 shadow-lg shadow-yellow-500/20">
                  <Activity className="w-7 h-7 text-slate-900" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white leading-tight">PERA ROAD RACE</h1>
              <p className="text-xs text-slate-400 font-mono">ANALYTICS</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as Tab)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  currentTab === item.id
                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-900 p-6 md:p-10">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};
