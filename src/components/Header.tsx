import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Calendar,
  Navigation,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  BookOpen,
  Fish,
  Waves,
  QrCode,
  Smartphone,
  Laptop,
  Monitor,
  CloudSun,
  Download
} from 'lucide-react';
import { LocationInfo, UnitSystem } from '../types';
import { POPULAR_FISHING_LOCATIONS } from '../utils/weather';
import { usePWAInstall } from '../utils/usePWAInstall';

interface HeaderProps {
  currentLocation: LocationInfo;
  onSelectLocation: (loc: LocationInfo) => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  unitSystem: UnitSystem;
  onToggleUnits: () => void;
  onUseGps: () => void;
  isGpsLoading: boolean;
  activeTab: 'dashboard' | 'conditions' | 'fishtrap' | 'species' | 'tackle' | 'catchlog' | 'ai';
  onSelectTab: (tab: 'dashboard' | 'conditions' | 'fishtrap' | 'species' | 'tackle' | 'catchlog' | 'ai') => void;
  catchCount: number;
  onOpenNewCatchModal: () => void;
  onOpenQrModal?: (tab?: 'android' | 'pc') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onSelectLocation,
  selectedDate,
  onSelectDate,
  unitSystem,
  onToggleUnits,
  onUseGps,
  isGpsLoading,
  activeTab,
  onSelectTab,
  catchCount,
  onOpenNewCatchModal,
  onOpenQrModal,
}) => {
  const [showLocPicker, setShowLocPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');
  const [customName, setCustomName] = useState('');

  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall();

  const filteredLocations = POPULAR_FISHING_LOCATIONS.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCustomCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      onSelectLocation({
        name: customName.trim() || `Coordinates (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
        region: 'Custom Fishing Spot',
        lat,
        lon,
        isCustom: true,
      });
      setShowLocPicker(false);
      setCustomLat('');
      setCustomLon('');
      setCustomName('');
    }
  };

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
        {/* Brand & Location Trigger */}
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

          {/* Location Selector Button */}
          <button
            id="location-picker-btn"
            onClick={() => setShowLocPicker(!showLocPicker)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-100 truncate max-w-[150px] sm:max-w-[200px]">
              {currentLocation.name}
            </span>
            <span className="text-slate-400 text-[11px]">({currentLocation.region})</span>
          </button>

          {/* GPS Quick Detect */}
          <button
            id="gps-detect-btn"
            onClick={onUseGps}
            disabled={isGpsLoading}
            title="Use current GPS coordinates"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 disabled:opacity-50 transition"
          >
            <Navigation className={`w-4 h-4 ${isGpsLoading ? 'animate-spin' : ''}`} />
          </button>
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

          {/* Android / Mobile QR Code & PC Hub Button */}
          {onOpenQrModal && (
            <button
              id="header-qr-code-btn"
              onClick={() => onOpenQrModal('android')}
              title="Open Android QR Code & Chrome PC Hub"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition shadow-sm"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">📱 QR & 💻 PC</span>
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
          <span>Pikeville & Fishtrap Overview</span>
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
          id="tab-tackle"
          onClick={() => onSelectTab('tackle')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
            activeTab === 'tackle'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          <span>Tactical Tackle</span>
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
          id="tab-ai-guide"
          onClick={() => onSelectTab('ai')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
            activeTab === 'ai'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>AI Advisor</span>
        </button>
      </div>

      {/* Location Picker Modal/Dropdown */}
      {showLocPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-16 sm:pt-24">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 text-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-slate-100">Select Fishing Destination</h3>
              </div>
              <button
                onClick={() => setShowLocPicker(false)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id="location-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search popular lakes, rivers, bays..."
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Popular Fishing Spots */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Top Rated Fishing Waters
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredLocations.map((loc) => {
                  const isSelected =
                    loc.lat === currentLocation.lat && loc.lon === currentLocation.lon;
                  return (
                    <button
                      key={loc.name}
                      onClick={() => {
                        onSelectLocation(loc);
                        setShowLocPicker(false);
                      }}
                      className={`text-left p-2.5 rounded-xl border transition flex items-start justify-between ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-100">{loc.name}</div>
                        <div className="text-[11px] text-slate-400">{loc.region}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Coordinates Option */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-400">Or Enter Custom GPS / Spot</p>
              <form onSubmit={handleAddCustomCoords} className="space-y-2">
                <input
                  type="text"
                  placeholder="Spot Name (e.g. My Secret Pond)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude (e.g. 28.53)"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    required
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude (e.g. -81.38)"
                    value={customLon}
                    onChange={(e) => setCustomLon(e.target.value)}
                    required
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition"
                >
                  Set Custom Location
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
