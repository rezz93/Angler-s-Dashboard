import React, { useState, useMemo } from 'react';
import {
  Fish,
  Flame,
  Layers,
  Sparkles,
  Palette,
  Compass,
  CheckCircle2,
  PlusCircle,
  RotateCcw
} from 'lucide-react';
import { TargetSpecies } from '../types';

interface SpeciesGuideProps {
  speciesList: TargetSpecies[];
  onLogCatchForSpecies: (speciesName: string, defaultLure: string) => void;
}

export const SpeciesGuide: React.FC<SpeciesGuideProps> = ({
  speciesList,
  onLogCatchForSpecies,
}) => {
  const [filterCategory, setFilterCategory] = useState<'All' | 'Hot' | 'Bass' | 'Crappie/Panfish' | 'Stripers' | 'Catfish'>('All');

  // Compute species counts for each category
  const filterCounts = useMemo(() => {
    const hotSpecies = speciesList.filter(
      (s) => s.activityTier === 'Hot Bite' || s.activityRating >= 75
    );
    const bassSpecies = speciesList.filter(
      (s) => (s.id.includes('bass') && !s.id.includes('striped')) || s.name.toLowerCase().includes('largemouth') || s.name.toLowerCase().includes('smallmouth')
    );
    const crappiePanfishSpecies = speciesList.filter(
      (s) => s.id === 'crappie' || s.id === 'panfish' || s.name.toLowerCase().includes('crappie') || s.name.toLowerCase().includes('panfish') || s.name.toLowerCase().includes('bluegill')
    );
    const striperSpecies = speciesList.filter(
      (s) => s.id === 'striped_bass' || s.id.includes('striped') || s.name.toLowerCase().includes('striper') || s.name.toLowerCase().includes('striped')
    );
    const catfishSpecies = speciesList.filter(
      (s) => s.id === 'catfish' || s.name.toLowerCase().includes('catfish')
    );

    return {
      all: speciesList.length,
      hot: hotSpecies.length > 0 ? hotSpecies.length : Math.min(3, speciesList.length),
      bass: bassSpecies.length,
      crappiePanfish: crappiePanfishSpecies.length,
      stripers: striperSpecies.length,
      catfish: catfishSpecies.length,
    };
  }, [speciesList]);

  // Filter species based on selected category
  const filteredSpecies = useMemo(() => {
    if (filterCategory === 'All') return speciesList;

    if (filterCategory === 'Hot') {
      const hot = speciesList.filter(
        (s) => s.activityTier === 'Hot Bite' || s.activityRating >= 75
      );
      if (hot.length > 0) return hot;
      // Fallback to top 3 active species if none strictly hit 75
      return [...speciesList].sort((a, b) => b.activityRating - a.activityRating).slice(0, 3);
    }

    if (filterCategory === 'Bass') {
      return speciesList.filter(
        (s) =>
          (s.id.includes('bass') && !s.id.includes('striped')) ||
          s.name.toLowerCase().includes('largemouth') ||
          s.name.toLowerCase().includes('smallmouth')
      );
    }

    if (filterCategory === 'Crappie/Panfish') {
      return speciesList.filter(
        (s) =>
          s.id === 'crappie' ||
          s.id === 'panfish' ||
          s.name.toLowerCase().includes('crappie') ||
          s.name.toLowerCase().includes('panfish') ||
          s.name.toLowerCase().includes('bluegill')
      );
    }

    if (filterCategory === 'Stripers') {
      return speciesList.filter(
        (s) =>
          s.id === 'striped_bass' ||
          s.id.includes('striped') ||
          s.name.toLowerCase().includes('striper') ||
          s.name.toLowerCase().includes('striped')
      );
    }

    if (filterCategory === 'Catfish') {
      return speciesList.filter(
        (s) =>
          s.id === 'catfish' ||
          s.name.toLowerCase().includes('catfish')
      );
    }

    return speciesList;
  }, [speciesList, filterCategory]);

  const filterButtons = [
    { id: 'All' as const, label: `All Species (${filterCounts.all})` },
    { id: 'Hot' as const, label: `🔥 Hot Bites (${filterCounts.hot})` },
    { id: 'Bass' as const, label: `Bass (${filterCounts.bass})` },
    { id: 'Crappie/Panfish' as const, label: `Crappie & Panfish (${filterCounts.crappiePanfish})` },
    { id: 'Stripers' as const, label: `Stripers (${filterCounts.stripers})` },
    { id: 'Catfish' as const, label: `Catfish (${filterCounts.catfish})` },
  ];

  return (
    <div className="space-y-4">
      {/* Header and Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Fish className="w-5 h-5 text-emerald-400" />
            Target Species Bite Radar & Tactics
          </h2>
          <p className="text-xs text-slate-400">
            Fishtrap Lake & Levisa Fork activity ratings computed dynamically from real-time barometer, water temperature, and solunar index.
          </p>
        </div>

        {/* Filter Navigation Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {filterButtons.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setFilterCategory(filter.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                filterCategory === filter.id
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-950/40 scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-emerald-300 border border-slate-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State Fallback */}
      {filteredSpecies.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <Fish className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">No species found for this filter</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try selecting a different species category or view all target species.
          </p>
          <button
            onClick={() => setFilterCategory('All')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Show All Species</span>
          </button>
        </div>
      ) : (
        /* Species Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpecies.map((sp) => {
            const isHot = sp.activityTier === 'Hot Bite' || sp.activityRating >= 75;

            return (
              <div
                key={sp.id}
                className={`bg-slate-900/90 border rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all hover:border-emerald-500/60 ${
                  isHot ? 'border-emerald-500/40 bg-gradient-to-b from-slate-900 to-slate-950' : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Top Title & Score */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                        {sp.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 italic font-mono block">
                        {sp.scientificName}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          isHot
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : sp.activityRating >= 60
                            ? 'bg-teal-500/20 text-teal-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isHot && <Flame className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400 animate-pulse" />}
                        {sp.activityRating}% Bite
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 uppercase tracking-wider font-semibold">
                        {sp.activityTier}
                      </span>
                    </div>
                  </div>

                  {/* Depth Zone */}
                  <div className="mt-3 flex items-center gap-2 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl p-2 text-slate-300">
                    <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate">
                      <strong className="text-slate-200">Active Zone: </strong>
                      {sp.depthZone}
                    </span>
                  </div>

                  {/* Top Recommended Lures */}
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Top Lures for Today
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {sp.topLures.map((lure, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium"
                        >
                          {lure}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Best Colors */}
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 text-teal-400" />
                      Color Palette
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {sp.bestColors.map((col, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[11px] border border-slate-800"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tactical Technique */}
                  <div className="mt-3 bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 text-xs text-slate-300 space-y-1">
                    <p className="leading-relaxed">
                      <strong className="text-emerald-400">Presentation: </strong>
                      {sp.technique}
                    </p>
                    <p className="text-[11px] text-amber-300/90 leading-snug">
                      💡 <em>{sp.proTip}</em>
                    </p>
                  </div>
                </div>

                {/* Log Catch Action */}
                <button
                  onClick={() => onLogCatchForSpecies(sp.name, sp.topLures[0])}
                  className="w-full py-2 bg-slate-800 hover:bg-emerald-600 hover:text-slate-950 text-slate-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-slate-700 hover:border-emerald-500"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log {sp.name} Catch</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
