import React, { useState } from 'react';
import {
  Fish,
  Trophy,
  Calendar,
  MapPin,
  Camera,
  Trash2,
  Download,
  Search,
  Sparkles,
  Plus,
  Scale,
  Ruler,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CatchRecord, UnitSystem } from '../types';

interface CatchLogViewProps {
  catches: CatchRecord[];
  onAddCatch: (catchData: Omit<CatchRecord, 'id'>) => void;
  onDeleteCatch: (id: string) => void;
  unitSystem: UnitSystem;
  onOpenModal: () => void;
}

export const CatchLogView: React.FC<CatchLogViewProps> = ({
  catches,
  onAddCatch,
  onDeleteCatch,
  unitSystem,
  onOpenModal,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('All');

  // Stats calculation
  const totalCatches = catches.length;
  const trophyCatches = catches.filter((c) => c.isTrophy).length;

  let maxWeight = 0;
  let pbSpecies = '';
  const speciesCountMap: Record<string, number> = {};
  const lureCountMap: Record<string, number> = {};

  catches.forEach((c) => {
    if (c.weight && c.weight > maxWeight) {
      maxWeight = c.weight;
      pbSpecies = c.species;
    }
    speciesCountMap[c.species] = (speciesCountMap[c.species] || 0) + 1;
    if (c.lureOrBait) {
      lureCountMap[c.lureOrBait] = (lureCountMap[c.lureOrBait] || 0) + 1;
    }
  });

  const topSpecies = Object.entries(speciesCountMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
  const topLure = Object.entries(lureCountMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  const filteredCatches = catches.filter((c) => {
    const matchesSearch =
      c.species.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.lureOrBait.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.locationName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(searchFilter.toLowerCase()));

    const matchesSpecies = speciesFilter === 'All' || c.species === speciesFilter;
    return matchesSearch && matchesSpecies;
  });

  const exportToJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(catches, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `angler_catch_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const uniqueSpeciesList: string[] = Array.from(new Set(catches.map((c) => c.species)));

  return (
    <div className="space-y-6">
      {/* Header & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Fish className="w-5 h-5 text-emerald-400" />
            Digital Angler's Catch Journal
          </h2>
          <p className="text-xs text-slate-400">
            Log, track, and analyze your catches with full environmental snapshot data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToJson}
            disabled={catches.length === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Log</span>
          </button>

          <button
            onClick={onOpenModal}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Catch</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Landed
          </span>
          <span className="text-2xl font-extrabold text-slate-100 mt-1 block">
            {totalCatches}
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold">
            {trophyCatches} Trophy {trophyCatches === 1 ? 'Catch' : 'Catches'} 🏆
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Personal Best
          </span>
          <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
            {maxWeight > 0 ? (unitSystem === 'imperial' ? `${maxWeight} lbs` : `${(maxWeight * 0.453592).toFixed(1)} kg`) : '—'}
          </span>
          <span className="text-[10px] text-slate-400 truncate block">
            {pbSpecies || 'No weight logged'}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Top Species
          </span>
          <span className="text-base font-extrabold text-emerald-300 mt-1.5 block truncate">
            {topSpecies}
          </span>
          <span className="text-[10px] text-slate-400">
            {speciesCountMap[topSpecies] ? `${speciesCountMap[topSpecies]} logged` : 'Start logging'}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Favorite Lure
          </span>
          <span className="text-base font-extrabold text-teal-300 mt-1.5 block truncate">
            {topLure}
          </span>
          <span className="text-[10px] text-slate-400">Most productive</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search catches by species, lure, location, or notes..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {uniqueSpeciesList.length > 0 && (
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Species ({catches.length})</option>
            {uniqueSpeciesList.map((sp) => (
              <option key={sp} value={sp}>
                {sp} ({speciesCountMap[sp]})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Catches Grid / List */}
      {filteredCatches.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-emerald-400">
            <Fish className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No Catches Logged Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click "Record Catch" above to log your latest fish with bait, weight, and environmental snapshot!
          </p>
          <button
            onClick={onOpenModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            + Log Your First Fish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCatches.map((c) => (
            <div
              key={c.id}
              className={`bg-slate-900/90 border rounded-3xl p-4 shadow-xl flex flex-col justify-between space-y-3 relative overflow-hidden transition hover:border-emerald-500/50 ${
                c.isTrophy
                  ? 'border-amber-500/60 bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20 shadow-amber-950/20 shadow-lg'
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Photo Preview if available */}
                {c.photoUrl && (
                  <div className="w-full h-40 rounded-2xl overflow-hidden mb-3 bg-slate-950 border border-slate-800">
                    <img
                      src={c.photoUrl}
                      alt={c.species}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Card Header with Species, Inline Trophy Pill, and Uncovered Trash Action */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                        {c.species}
                      </h3>
                      {c.isTrophy && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-black uppercase tracking-wider shadow-sm">
                          <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>Trophy</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{c.locationName}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCatch(c.id);
                    }}
                    className="p-1.5 rounded-xl bg-slate-800/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/80 transition shrink-0 shadow-sm"
                    title="Delete catch record"
                    aria-label="Delete catch record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Measurements */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Weight:{' '}
                      <strong className="text-slate-100">
                        {c.weight
                          ? unitSystem === 'imperial'
                            ? `${c.weight} lbs`
                            : `${(c.weight * 0.453592).toFixed(1)} kg`
                          : 'N/A'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Ruler className="w-3.5 h-3.5 text-teal-400" />
                    <span>
                      Length:{' '}
                      <strong className="text-slate-100">
                        {c.length
                          ? unitSystem === 'imperial'
                            ? `${c.length}"`
                            : `${(c.length * 2.54).toFixed(1)} cm`
                          : 'N/A'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Bait / Lure */}
                <div className="mt-2.5 text-xs text-slate-300">
                  <span className="text-slate-400">Lure / Bait: </span>
                  <strong className="text-emerald-300 font-semibold">{c.lureOrBait}</strong>
                </div>

                {/* Notes */}
                {c.notes && (
                  <p className="text-xs text-slate-400 italic mt-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                    "{c.notes}"
                  </p>
                )}
              </div>

              {/* Timestamp & Weather Snapshot */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {new Date(c.timestamp).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>

                {c.weatherSnapshot && (
                  <span className="text-emerald-400 font-medium">
                    {c.weatherSnapshot.temp}°F • {c.weatherSnapshot.pressureTrend}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
