
import React, { useState } from 'react';
import { Athlete, EventStandard, Route, RaceSession } from '../types';
import { RaceEntry } from './RaceEntry';
import { RoutesManager } from './RoutesManager';
import { StandardsManager } from './StandardsManager';
import { isFirebaseEnabled } from '../services/firebase';
import { Lock, Timer, Map as MapIcon, Settings, ArrowRight, ShieldCheck, Database, Download, Upload, Code, Check } from 'lucide-react';

interface Props {
  athletes: Athlete[];
  standards: EventStandard[];
  routes: Route[];
  sessions: RaceSession[];
  onRecordSession: (meta: any, entries: any[]) => void;
  onAddRoute: (name: string, distance: string, elevation: string) => void;
  onDeleteRoute: (id: string) => void;
  onUpdateStandard: (std: EventStandard) => void;
  onAddStandard: (name: string, goldTime: number, kValue: number) => void;
  onImportData: (data: any) => void;
  isAuthenticated: boolean;
  onLogin: () => void;
}

type SubTab = 'entry' | 'routes' | 'standards' | 'database';

export const Editor: React.FC<Props> = ({
  athletes,
  standards,
  routes,
  sessions,
  onRecordSession,
  onAddRoute,
  onDeleteRoute,
  onUpdateStandard,
  onAddStandard,
  onImportData,
  isAuthenticated,
  onLogin
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('entry');
  const [codeCopied, setCodeCopied] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Samare357') {
      onLogin();
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  const handleExport = () => {
    const data = {
      athletes,
      standards,
      routes,
      sessions,
      exportDate: new Date().toISOString()
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pera_analytics_${isFirebaseEnabled ? 'cloud' : 'local'}_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateSourceCode = () => {
    const timestamp = Date.now().toString();
    const code = `import { Athlete, EventStandard, RaceSession, Route } from '../types';

export const STATIC_DB = {
  version: "${timestamp}",
  athletes: ${JSON.stringify(athletes, null, 2)} as Athlete[],
  standards: ${JSON.stringify(standards, null, 2)} as EventStandard[],
  sessions: ${JSON.stringify(sessions, null, 2)} as RaceSession[],
  routes: ${JSON.stringify(routes, null, 2)} as Route[]
};`;

    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 3000);
      alert("Code copied to clipboard! \n\nNow open 'data/staticDb.ts' in your project files and paste this content to update the hardwired database.");
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (confirm('WARNING: Importing a backup will completely replace your current data. Are you sure?')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = JSON.parse(evt.target?.result as string);
            onImportData(data);
          } catch (err) {
            alert('Failed to parse backup file. Is it a valid JSON?');
          }
        };
        reader.readAsText(file);
      }
      e.target.value = '';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md animate-in zoom-in-95">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-700">
              <Lock className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Admin Access</h2>
            <p className="text-slate-400 text-center mt-2">Enter password to manage routes, standards, and record results.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white text-center tracking-widest focus:border-yellow-500 outline-none transition-colors"
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-yellow-500 text-slate-900 font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
            >
              Access Editor <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 inline-flex gap-1 overflow-x-auto w-full md:w-auto custom-scrollbar">
        <button
          onClick={() => setActiveSubTab('entry')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeSubTab === 'entry' 
              ? 'bg-yellow-500 text-slate-900 shadow-lg' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Timer className="w-4 h-4" />
          Enter Results
        </button>
        <button
          onClick={() => setActiveSubTab('routes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeSubTab === 'routes' 
              ? 'bg-yellow-500 text-slate-900 shadow-lg' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          Routes
        </button>
        <button
          onClick={() => setActiveSubTab('standards')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeSubTab === 'standards' 
              ? 'bg-yellow-500 text-slate-900 shadow-lg' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          Standards
        </button>
        <button
          onClick={() => setActiveSubTab('database')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeSubTab === 'database' 
              ? 'bg-yellow-500 text-slate-900 shadow-lg' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Database className="w-4 h-4" />
          Database
        </button>
        <div className="ml-auto hidden md:flex items-center px-4 text-xs text-green-500 font-mono gap-1">
          <ShieldCheck className="w-3 h-3" /> Authenticated
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeSubTab === 'entry' && (
          <RaceEntry 
            athletes={athletes} 
            standards={standards} 
            routes={routes} 
            onSave={onRecordSession} 
          />
        )}
        {activeSubTab === 'routes' && (
          <RoutesManager 
            routes={routes} 
            onAdd={onAddRoute} 
            onDelete={onDeleteRoute} 
          />
        )}
        {activeSubTab === 'standards' && (
          <StandardsManager 
            standards={standards} 
            onUpdate={onUpdateStandard} 
            onAdd={onAddStandard} 
          />
        )}
        {activeSubTab === 'database' && (
          <div className="space-y-8">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-4xl mx-auto space-y-8">
              <div className="text-center">
                <Database className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white">Database Management</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${isFirebaseEnabled ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <span className={`text-sm font-mono ${isFirebaseEnabled ? 'text-green-400' : 'text-orange-400'}`}>
                      {isFirebaseEnabled ? 'Mode: Cloud (Firebase)' : 'Mode: Hardwired (Static Deployment)'}
                  </span>
                </div>
                <p className="text-slate-400 mt-2 text-sm max-w-lg mx-auto">
                   This app is configured to use a hardwired JSON database. To publish updates to online viewers, you must 
                   Copy the Source Code below, paste it into your project's <code>data/staticDb.ts</code> file, and redeploy the app.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {/* COPY SOURCE CODE (For Deployment) */}
                  <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 hover:border-yellow-500/50 transition-colors group relative overflow-hidden">
                    <div className="bg-yellow-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Code className="w-6 h-6 text-yellow-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Deploy Updates</h3>
                    <p className="text-sm text-slate-500 mb-4 h-12">Generate the code snippet required to hardwire your current data into the app.</p>
                    <button 
                      onClick={handleGenerateSourceCode}
                      className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {codeCopied ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                      {codeCopied ? 'Copied!' : 'Copy Source Code'}
                    </button>
                  </div>

                  {/* BACKUP (JSON) */}
                  <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors group">
                    <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Download className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Backup JSON</h3>
                    <p className="text-sm text-slate-500 mb-4 h-12">Download a raw JSON file for safekeeping or transfer.</p>
                    <button 
                      onClick={handleExport}
                      className="w-full bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-400 border border-slate-700 hover:border-blue-500 py-2 rounded-lg font-medium transition-all"
                    >
                      Download JSON
                    </button>
                  </div>

                  {/* RESTORE (JSON) */}
                  <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 hover:border-red-500/50 transition-colors group">
                    <div className="bg-red-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Restore JSON</h3>
                    <p className="text-sm text-slate-500 mb-4 h-12">Overwrite current data with a JSON backup.</p>
                    <label className="w-full bg-slate-800 hover:bg-red-600 hover:text-white text-red-400 border border-slate-700 hover:border-red-500 py-2 rounded-lg font-medium transition-all cursor-pointer text-center block">
                      <span>Upload & Restore</span>
                      <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
