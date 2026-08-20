import React, { useState, useEffect } from 'react';
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
  Download,
  Trash2,
  Plus,
  X,
  Loader2,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LocationInfo, UnitSystem } from '../types';
import { POPULAR_FISHING_LOCATIONS } from '../utils/weather';
import { searchLakesAndWaters, EXTENSIVE_FISHING_WATERS_DB } from '../utils/geocoding';
import { usePWAInstall } from '../utils/usePWAInstall';

interface HeaderProps {
  currentLocation: LocationInfo;
  onSelectLocation: (loc: LocationInfo) => void;
  savedLocations?: LocationInfo[];
  onAddLocation?: (loc: LocationInfo) => void;
  onRemoveLocation?: (loc: LocationInfo) => void;
  onResetLocations?: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  unitSystem: UnitSystem;
  onToggleUnits: () => void;
  onUseGps: () => void;
  isGpsLoading: boolean;
  activeTab: 'dashboard' | 'conditions' | 'fishtrap' | 'species' | 'catchlog' | 'ai' | 'android';
  onSelectTab: (tab: 'dashboard' | 'conditions' | 'fishtrap' | 'species' | 'catchlog' | 'ai' | 'android') => void;
  catchCount: number;
  onOpenNewCatchModal: () => void;
  onOpenQrModal?: (tab?: 'android' | 'pc') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onSelectLocation,
  savedLocations = POPULAR_FISHING_LOCATIONS,
  onAddLocation,
  onRemoveLocation,
  onResetLocations,
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
  const [locModalTab, setLocModalTab] = useState<'list' | 'add'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Online search state for finding specific lakes/waters
  const [onlineResults, setOnlineResults] = useState<LocationInfo[]>([]);
  const [isSearchingWaters, setIsSearchingWaters] = useState(false);

  // New water state for Add tab
  const [addWaterSearch, setAddWaterSearch] = useState('');
  const [addWaterSearchResults, setAddWaterSearchResults] = useState<LocationInfo[]>([]);
  const [isSearchingAddWaters, setIsSearchingAddWaters] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualRegion, setManualRegion] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall();

  // Debounced search for waters whenever searchQuery changes
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setOnlineResults([]);
      setIsSearchingWaters(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingWaters(true);
      try {
        const results = await searchLakesAndWaters(searchQuery);
        // Exclude ones already in savedLocations
        const filtered = results.filter((res) => {
          return !savedLocations.some(
            (saved) =>
              saved.name.toLowerCase() === res.name.toLowerCase() ||
              (Math.abs(saved.lat - res.lat) < 0.01 && Math.abs(saved.lon - res.lon) < 0.01)
          );
        });
        setOnlineResults(filtered);
      } catch (err) {
        console.error('Error searching waters:', err);
      } finally {
        setIsSearchingWaters(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, savedLocations]);

  // Debounced search for Add Water tab
  useEffect(() => {
    if (!addWaterSearch.trim() || addWaterSearch.trim().length < 2) {
      setAddWaterSearchResults([]);
      setIsSearchingAddWaters(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingAddWaters(true);
      try {
        const results = await searchLakesAndWaters(addWaterSearch);
        setAddWaterSearchResults(results);
      } catch (err) {
        console.error('Error searching waters in add tab:', err);
      } finally {
        setIsSearchingAddWaters(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [addWaterSearch]);

  const filteredSavedLocations = savedLocations.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAndSaveDiscoveredWater = (loc: LocationInfo) => {
    if (onAddLocation) {
      onAddLocation(loc);
    } else {
      onSelectLocation(loc);
    }
    setFeedbackMsg(`Selected "${loc.name}"!`);
    setTimeout(() => setFeedbackMsg(null), 3000);
    setShowLocPicker(false);
  };

  const handleAddManualCustomWater = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (!manualName.trim()) return;
    if (isNaN(lat) || isNaN(lon)) return;

    const newLoc: LocationInfo = {
      name: manualName.trim(),
      region: manualRegion.trim() || 'Custom Fishing Spot',
      lat: +lat.toFixed(4),
      lon: +lon.toFixed(4),
      isCustom: true,
    };

    if (onAddLocation) {
      onAddLocation(newLoc);
    } else {
      onSelectLocation(newLoc);
    }

    setFeedbackMsg(`Added "${newLoc.name}" to fishing waters!`);
    setTimeout(() => setFeedbackMsg(null), 3000);

    setManualName('');
    setManualRegion('');
    setManualLat('');
    setManualLon('');
    setShowLocPicker(false);
  };

  const handleUseGpsForManualWater = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setManualLat(pos.coords.latitude.toFixed(4));
        setManualLon(pos.coords.longitude.toFixed(4));
        if (!manualName) {
          setManualName('My GPS Fishing Coordinates');
        }
        if (!manualRegion) {
          setManualRegion('Current Device Location');
        }
        setIsGettingGps(false);
      },
      (err) => {
        console.error('GPS error:', err);
        setIsGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleDateChange = (daysOffset: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + daysOffset);
    onSelectDate(next);
  };

  const isToday = new Date().toDateString() === selectedDate.toDateString();

  const QUICK_LAKES = [
    { name: 'Fishtrap Lake', region: 'Pikeville, KY, USA', lat: 37.4253, lon: -82.4182 },
    { name: 'Dewey Lake', region: 'Prestonsburg, KY, USA', lat: 37.72, lon: -82.72 },
    { name: 'Cave Run Lake', region: 'Morehead, KY, USA', lat: 38.12, lon: -83.53 },
    { name: 'Lake Cumberland', region: 'Jamestown, KY, USA', lat: 36.95, lon: -84.95 },
    { name: 'Kentucky Lake', region: 'Gilbertsville, KY, USA', lat: 36.85, lon: -88.25 },
    { name: 'Dale Hollow Lake', region: 'Celina, TN / KY, USA', lat: 36.53, lon: -85.35 },
    { name: 'Lake Okeechobee', region: 'Florida, USA', lat: 26.96, lon: -80.83 },
    { name: 'Lake Guntersville', region: 'Alabama, USA', lat: 34.36, lon: -86.29 },
  ];

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
          <span>Pikeville & Fishtrap Overview</span>
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

      {/* Location Picker Modal / Destination Manager */}
      {showLocPicker && (
        <div
          id="location-picker-backdrop"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-12 sm:pt-16 animate-in fade-in duration-200"
        >
          <div
            id="location-picker-modal"
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-100 max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">Select Fishing Destination</h3>
                  <p className="text-xs text-slate-400">Add, remove, or switch fishing waters and lakes</p>
                </div>
              </div>
              <button
                id="close-location-modal-btn"
                onClick={() => setShowLocPicker(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification feedback */}
            {feedbackMsg && (
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            {/* Modal Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                id="loc-tab-list"
                onClick={() => setLocModalTab('list')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  locModalTab === 'list'
                    ? 'bg-emerald-600 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Fish className="w-3.5 h-3.5" />
                <span>Saved Waters ({savedLocations.length})</span>
              </button>

              <button
                type="button"
                id="loc-tab-add"
                onClick={() => setLocModalTab('add')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  locModalTab === 'add'
                    ? 'bg-emerald-600 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Fishing Water</span>
              </button>
            </div>

            {/* TAB 1: SAVED & SEARCH FISHING WATERS */}
            {locModalTab === 'list' && (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                {/* Search & Actions bar */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      id="location-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search any lake, river, reservoir, or town..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                    {isSearchingWaters && (
                      <Loader2 className="w-3.5 h-3.5 absolute right-3 top-2.5 text-emerald-400 animate-spin" />
                    )}
                  </div>

                  {onResetLocations && (
                    <button
                      type="button"
                      onClick={onResetLocations}
                      title="Reset back to default fishing waters"
                      className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  )}
                </div>

                {/* List Container with Scrolling */}
                <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-80">
                  {/* SECTION 1: Saved Locations matching search */}
                  {filteredSavedLocations.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
                        <span>Saved Waters ({filteredSavedLocations.length})</span>
                      </div>
                      {filteredSavedLocations.map((loc) => {
                        const isSelected =
                          loc.lat === currentLocation.lat && loc.lon === currentLocation.lon;
                        return (
                          <div
                            key={`saved-${loc.name}-${loc.lat}-${loc.lon}`}
                            className={`group p-2.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                                : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            {/* Clickable Destination Select area */}
                            <button
                              type="button"
                              onClick={() => {
                                onSelectLocation(loc);
                                setShowLocPicker(false);
                              }}
                              className="flex-1 text-left flex items-start justify-between min-w-0"
                            >
                              <div className="truncate pr-2">
                                <div className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
                                  <span className="truncate">{loc.name}</span>
                                  {loc.isCustom && (
                                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded-full">
                                      Custom
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {loc.region}
                                </div>
                              </div>
                              {isSelected && (
                                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Active
                                </span>
                              )}
                            </button>

                            {/* Remove / Delete Button */}
                            {onRemoveLocation && (
                              <button
                                type="button"
                                title={`Remove "${loc.name}" from saved waters`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveLocation(loc);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/50 rounded-lg transition shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* SECTION 2: Discovered Online / Worldwide Waters from search query */}
                  {searchQuery.trim().length >= 2 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider px-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>Search Results & Lakes ({onlineResults.length})</span>
                        </span>
                        {isSearchingWaters && (
                          <span className="text-[10px] text-slate-400 font-normal lowercase flex items-center gap-1">
                            searching waters...
                          </span>
                        )}
                      </div>

                      {onlineResults.map((loc) => (
                        <div
                          key={`online-${loc.name}-${loc.lat}-${loc.lon}`}
                          className="p-2.5 rounded-xl border border-slate-700/80 bg-slate-950/60 hover:bg-slate-800/80 hover:border-emerald-500/40 transition flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="font-semibold text-xs text-slate-100 flex items-center gap-1.5 truncate">
                              <Fish className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">{loc.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {loc.region}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectAndSaveDiscoveredWater(loc)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition shrink-0 flex items-center gap-1 shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Select & Save</span>
                          </button>
                        </div>
                      ))}

                      {!isSearchingWaters && onlineResults.length === 0 && filteredSavedLocations.length === 0 && (
                        <div className="p-5 text-center bg-slate-950/40 border border-slate-800 rounded-2xl space-y-2">
                          <p className="text-xs text-slate-400">
                            No specific waters found for "{searchQuery}".
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Try searching with city, state, or reservoir name (e.g. "Lake Cumberland", "Cave Run", "Okeechobee").
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty state when no search query and no saved items */}
                  {searchQuery.trim().length === 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
                        Popular Fishing Hotspots (1-Click)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {QUICK_LAKES.map((quick) => (
                          <button
                            key={quick.name}
                            type="button"
                            onClick={() => handleSelectAndSaveDiscoveredWater(quick)}
                            className="text-left p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/40 text-xs transition group"
                          >
                            <div className="font-semibold text-slate-200 group-hover:text-emerald-300 text-[11px] truncate">
                              {quick.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {quick.region.split(',')[0]}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: SEARCH & ADD NEW FISHING WATER */}
            {locModalTab === 'add' && (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                {/* Search box for any water */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      Search Lake, Reservoir, River, or Coastal Water
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Lake Cumberland, Cave Run, Lake Champlain, Dale Hollow..."
                        value={addWaterSearch}
                        onChange={(e) => setAddWaterSearch(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                      {isSearchingAddWaters && (
                        <Loader2 className="w-3.5 h-3.5 absolute right-3 top-2.5 text-emerald-400 animate-spin" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Coordinates and weather telemetry are resolved automatically from official databases.
                    </p>
                  </div>

                  {/* Add Water Search Results */}
                  {addWaterSearchResults.length > 0 && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                        Matching Waters Found ({addWaterSearchResults.length}):
                      </span>
                      {addWaterSearchResults.map((res) => (
                        <div
                          key={`search-res-${res.name}-${res.lat}-${res.lon}`}
                          className="p-2 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between gap-2"
                        >
                          <div className="truncate pr-2">
                            <div className="font-semibold text-xs text-slate-100 truncate">{res.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{res.region}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectAndSaveDiscoveredWater(res)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition shrink-0"
                          >
                            + Add & Select
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Presets Section */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Featured Regional Fishing Waters (1-Click Add)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {QUICK_LAKES.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleSelectAndSaveDiscoveredWater(preset)}
                        className="text-left p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/40 text-xs transition group"
                      >
                        <div className="font-semibold text-slate-200 group-hover:text-emerald-300 text-[11px] truncate">
                          {preset.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {preset.region.split(',')[0]}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collapsible Manual Coordinates Section (Optional for boat GPS waypoints) */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
                  <button
                    type="button"
                    onClick={() => setShowManualCoords(!showManualCoords)}
                    className="w-full p-3 flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-slate-500" />
                      <span>Optional: Enter Custom GPS Waypoint / Coordinates</span>
                    </span>
                    {showManualCoords ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showManualCoords && (
                    <form onSubmit={handleAddManualCustomWater} className="p-3 pt-0 space-y-2.5 border-t border-slate-800/60">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Spot Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. My Secret Brush Pile / Dock"
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            Latitude (Decimal)
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="e.g. 37.42"
                            value={manualLat}
                            onChange={(e) => setManualLat(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            Longitude (Decimal)
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="e.g. -82.42"
                            value={manualLon}
                            onChange={(e) => setManualLon(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={handleUseGpsForManualWater}
                          disabled={isGettingGps}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] font-medium text-emerald-400 flex items-center gap-1 transition"
                        >
                          <Navigation className={`w-3 h-3 ${isGettingGps ? 'animate-spin' : ''}`} />
                          <span>{isGettingGps ? 'Reading GPS...' : 'Use Current Device GPS'}</span>
                        </button>

                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition"
                        >
                          Save Custom Spot
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
