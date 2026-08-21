import React from 'react';
import {
  Compass,
  MapPin,
  Calendar,
  RotateCcw,
  Sparkles,
  BookOpen,
  Fish,
  Waves,
  QrCode,
  CloudSun,
  Download,
} from 'lucide-react';
import { LocationInfo, UnitSystem } from '../types';
import { FISHTRAP_LAKE_LOCATION } from '../utils/weather';
import { usePWAInstall } from '../utils/usePWAInstall';

interface HeaderProps {
  currentLocation?: LocationInfo;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  unitSystem: UnitSystem;
  onToggleUnits: () => void;
  activeTab: 'dashboard' | 'conditions' | 'fishtrap' | 'species' | 'catchlog' | 'ai' | 'android';
  onSelectTab: (tab: 'dashboard' | 'conditions' | 'fishtrap' | 'species' | 'catchlog' | 'ai' | 'android') => void;
  catchCount: number;
  onOpenNewCatchModal: () => void;
  onOpenQrModal?: (tab?: 'android' | 'pc') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation = FISHTRAP_LAKE_LOCATION,
  selectedDate,
  onSelectDate,
  unitSystem,
  onToggleUnits,
  activeTab,
  onSelectTab,
  catchCount,
  onOpenNewCatchModal,
  onOpenQrModal,
}) => {
  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall();

  const handleDateChange = (daysOffset: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + daysOffset);
    onSelectDate(next);
  };

  const isToday = new Date().toDateString() === selectedDate.toDateString();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-emerald-900/40 text-slate-100 shadow-lg">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Hardcoded Fishtrap Lake Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-2 flex items-center justify-center shadow-md shadow-emerald-900/50">
              <Fish className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-1.5">
                  Angler's Daily Dashboard
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  PRO TACTICAL
                </span>
              </div>
              <p className="text-xs text-slate-400">Solunar • Barometer • Bite Forecasts</p>
            </div>
          </div>

          {/* Hardcoded Fishtrap Lake Location Badge */}
          <div
            id="header-location-badge"
            className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-100">
              {currentLocation.name}
            </span>
            <span className="text-slate-400 text-[11px]">({currentLocation.region})</span>
          </div>
        </div>

        {/* Date Controls, Units & Quick Catch Button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap ml-auto">
          {/* Date Picker */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-lg p-0.5 text-xs font-medium">
            <button
              id="prev-date-btn"
              onClick={() => handleDateChange(-1)}
              className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
            >
              ◀
            </button>
            <div className="px-2 py-1 flex items-center gap-1 text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>
                {selectedDate.toLocaleDateString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              {isToday && (
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1 rounded">Today</span>
              )}
            </div>
            <button
              id="next-date-btn"
              onClick={() => handleDateChange(1)}
              className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
            >
              ▶
            </button>
            {!isToday && (
              <button
                id="reset-today-btn"
                onClick={() => onSelectDate(new Date())}
                title="Reset to today"
                className="px-1.5 py-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Unit Switcher */}
          <button
            id="units-toggle-btn"
            onClick={onToggleUnits}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition"
          >
            {unitSystem === 'imperial' ? '°F • mph' : '°C • km/h'}
          </button>

          {/* Chrome PC 1-Click Install Button (if available) */}
          {isInstallable && !isInstalled && (
            <button
              id="header-install-pc-btn"
              onClick={() => triggerInstall()}
              title="Install Angler's Daily on Chrome PC"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Install PC App</span>
            </button>
          )}

          {/* Mobile QR Code Button (compact icon) */}
          {onOpenQrModal && (
            <button
              id="header-qr-code-btn"
              onClick={() => onOpenQrModal('android')}
              title="Show Mobile QR Code"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 hover:text-emerald-300 transition"
            >
              <QrCode className="w-4 h-4" />
            </button>
          )}

          {/* Quick Log Catch Button */}
          <button
            id="quick-log-catch-btn"
            onClick={onOpenNewCatchModal}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-md shadow-emerald-950/50"
          >
            <Fish className="w-4 h-4" />
            <span>+ Log Catch</span>
            {catchCount > 0 && (
              <span className="bg-slate-900 text-emerald-300 px-1.5 py-0.2 rounded-full text-[10px]">
                {catchCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1.5 border-t border-slate-800/80 text-xs">
        <button
          id="tab-dashboard"
          onClick={() => onSelectTab('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
            activeTab === 'dashboard'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Fishtrap Overview</span>
        </button>

        <button
          id="tab-ai-guide"
          onClick={() => onSelectTab('ai')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
            activeTab === 'ai'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-teal-400 hover:text-teal-200 hover:bg-slate-800 border border-teal-500/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span>AI Angler Guide</span>
        </button>

        <button
          id="tab-conditions"
          onClick={() => onSelectTab('conditions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
            activeTab === 'conditions'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CloudSun className="w-3.5 h-3.5 text-amber-400" />
          <span>Conditions</span>
        </button>

        <button
          id="tab-fishtrap"
          onClick={() => onSelectTab('fishtrap')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
            activeTab === 'fishtrap'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Waves className="w-3.5 h-3.5 text-cyan-400" />
          <span>Fishtrap Hydrology</span>
        </button>

        <button
          id="tab-species"
          onClick={() => onSelectTab('species')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
            activeTab === 'species'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Fish className="w-3.5 h-3.5" />
          <span>Species Radar</span>
        </button>

        <button
          id="tab-catchlog"
          onClick={() => onSelectTab('catchlog')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
            activeTab === 'catchlog'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Catch Log</span>
          {catchCount > 0 && (
            <span className="px-1.5 py-0.2 bg-slate-700 text-slate-200 rounded-full text-[10px]">
              {catchCount}
            </span>
          )}
        </button>

        <button
          id="tab-android-qr"
          onClick={() => onSelectTab('android')}
          title="Mobile QR Hub"
          aria-label="Mobile QR Hub"
          className={`p-1.5 rounded-lg flex items-center justify-center transition shrink-0 ${
            activeTab === 'android'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-emerald-400 hover:text-emerald-200 hover:bg-slate-800 border border-emerald-500/30'
          }`}
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
        </button>
      </div>
    </header>
  );
};
