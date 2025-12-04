
import React, { useState } from 'react';
import { Route } from '../types';
import { Plus, Trash2, MapPin, Mountain, Map as MapIcon } from 'lucide-react';

interface Props {
  routes: Route[];
  onAdd: (name: string, distance: string, elevation: string) => void;
  onDelete: (id: string) => void;
}

export const RoutesManager: React.FC<Props> = ({ routes, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newRoute, setNewRoute] = useState({ name: '', distance: '', elevation: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoute.name) {
      onAdd(newRoute.name, newRoute.distance, newRoute.elevation);
      setNewRoute({ name: '', distance: '', elevation: '' });
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapIcon className="w-6 h-6 text-yellow-500" />
            Route Management
          </h2>
          <p className="text-slate-400 text-sm">Manage standard race courses and venues</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors shadow-lg shadow-yellow-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Route</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-top-4 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">New Course Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Route Name</label>
              <input
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:border-yellow-500 outline-none"
                value={newRoute.name}
                onChange={e => setNewRoute({...newRoute, name: e.target.value})}
                placeholder="e.g. Campus Loop A"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Distance</label>
              <input
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:border-yellow-500 outline-none"
                value={newRoute.distance}
                onChange={e => setNewRoute({...newRoute, distance: e.target.value})}
                placeholder="e.g. 5.2km"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Elevation Gain</label>
              <input
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:border-yellow-500 outline-none"
                value={newRoute.elevation}
                onChange={e => setNewRoute({...newRoute, elevation: e.target.value})}
                placeholder="e.g. 120m"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
             <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white px-4">Cancel</button>
             <button type="submit" className="bg-yellow-500 text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-yellow-400">Save Route</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map(route => (
          <div key={route.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-yellow-500/50 transition-colors group relative">
            <button 
                onClick={() => onDelete(route.id)}
                className="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Trash2 className="w-4 h-4" />
            </button>
            
            <div className="flex items-start justify-between mb-4">
               <div className="bg-blue-500/10 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-400" />
               </div>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">{route.name}</h3>
            
            <div className="space-y-2">
               <div className="flex items-center text-slate-400 text-sm">
                  <MapIcon className="w-4 h-4 mr-2" />
                  <span>Distance: <span className="text-white font-mono">{route.distance}</span></span>
               </div>
               {route.elevation && (
                 <div className="flex items-center text-slate-400 text-sm">
                    <Mountain className="w-4 h-4 mr-2" />
                    <span>Elevation: <span className="text-white font-mono">{route.elevation}</span></span>
                 </div>
               )}
            </div>
          </div>
        ))}
        {routes.length === 0 && !isAdding && (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
                No routes defined yet. Click "Add New Route" to get started.
            </div>
        )}
      </div>
    </div>
  );
};
