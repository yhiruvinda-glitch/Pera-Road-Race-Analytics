
import React, { useState, useMemo } from 'react';
import { EventStandard } from '../types';
import { formatTime, sortEventsByDistance } from '../utils';
import { Plus, Edit2, Check, X } from 'lucide-react';

interface Props {
  standards: EventStandard[];
  onUpdate: (std: EventStandard) => void;
  onAdd: (name: string, goldTime: number, kValue: number) => void;
}

export const StandardsManager: React.FC<Props> = ({ standards, onUpdate, onAdd }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{name: string, goldTime: string, kValue: string}>({ name: '', goldTime: '', kValue: '' });
  
  const [isAdding, setIsAdding] = useState(false);
  const [newStandard, setNewStandard] = useState({ name: '', goldTime: '', kValue: '1.1' });

  const sortedStandards = useMemo(() => sortEventsByDistance(standards), [standards]);

  const handleEditClick = (std: EventStandard) => {
    setEditingId(std.id);
    setEditValues({ name: std.name, goldTime: std.goldTime.toString(), kValue: std.kValue.toString() });
  };

  const handleSaveEdit = (id: string) => {
    onUpdate({
      id,
      name: editValues.name,
      goldTime: parseFloat(editValues.goldTime),
      kValue: parseFloat(editValues.kValue) || 1.1
    });
    setEditingId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(newStandard.name, parseFloat(newStandard.goldTime), parseFloat(newStandard.kValue) || 1.1);
    setIsAdding(false);
    setNewStandard({ name: '', goldTime: '', kValue: '1.1' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Gold Standards</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-white">New Event Standard</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Event Name</label>
              <input
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:border-yellow-500 outline-none"
                value={newStandard.name}
                onChange={e => setNewStandard({...newStandard, name: e.target.value})}
                placeholder="e.g. 8km Cross Country"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Gold Time (seconds)</label>
              <input
                required
                type="number"
                step="0.1"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:border-yellow-500 outline-none"
                value={newStandard.goldTime}
                onChange={e => setNewStandard({...newStandard, goldTime: e.target.value})}
                placeholder="e.g. 1540"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">K-Factor (Power)</label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:border-yellow-500 outline-none"
                value={newStandard.kValue}
                onChange={e => setNewStandard({...newStandard, kValue: e.target.value})}
                placeholder="e.g. 1.1"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
             <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-white px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-yellow-500 text-slate-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400"
            >
              Save Event
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedStandards.map(std => (
          <div key={std.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 relative group">
            {editingId === std.id ? (
              <div className="space-y-4">
                <input
                  className="w-full bg-slate-900 p-2 rounded border border-slate-600 text-white"
                  value={editValues.name}
                  onChange={e => setEditValues({...editValues, name: e.target.value})}
                />
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 text-sm">Target:</span>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full bg-slate-900 p-2 rounded border border-slate-600 text-white"
                    value={editValues.goldTime}
                    onChange={e => setEditValues({...editValues, goldTime: e.target.value})}
                  />
                  <span className="text-slate-400 text-sm">s</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 text-sm">K-Factor:</span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-900 p-2 rounded border border-slate-600 text-white"
                    value={editValues.kValue}
                    onChange={e => setEditValues({...editValues, kValue: e.target.value})}
                  />
                </div>
                 <div className="flex justify-end space-x-2 mt-2">
                   <button onClick={() => setEditingId(null)} className="p-2 text-red-400 hover:bg-slate-700 rounded"><X className="w-4 h-4"/></button>
                   <button onClick={() => handleSaveEdit(std.id)} className="p-2 text-green-400 hover:bg-slate-700 rounded"><Check className="w-4 h-4"/></button>
                 </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">{std.name}</h3>
                  <button 
                    onClick={() => handleEditClick(std)}
                    className="text-slate-500 hover:text-yellow-400 transition-colors p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Gold Time</span>
                    <span className="font-mono text-yellow-400">{formatTime(std.goldTime)}</span>
                  </div>
                   <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Seconds</span>
                    <span className="font-mono text-slate-200">{std.goldTime}s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Factor (k)</span>
                    <span className="font-mono text-slate-200">{std.kValue}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
