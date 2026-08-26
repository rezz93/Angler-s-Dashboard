import React, { useState, useEffect, useMemo } from 'react';
import {
  Header
} from './components/Header';
import { FishtrapLakeCard } from './components/FishtrapLakeCard';
import { WeatherRadarPanel } from './components/WeatherRadarPanel';
import { BiteScoreCard } from './components/BiteScoreCard';
import { HourlyForecast } from './components/HourlyForecast';
import { EnvironmentalPanel } from './components/EnvironmentalPanel';
import { SpeciesGuide } from './components/SpeciesGuide';
import { CatchLogView } from './components/CatchLogView';
import { CatchLogModal } from './components/CatchLogModal';
import { AndroidQRModal } from './components/AndroidQRModal';
import { AndroidQRView } from './components/AndroidQRView';
import { AIAssistant } from './components/AIAssistant';
import { AIOverviewBriefing } from './components/AIOverviewBriefing';
import { calculateSolunar } from './utils/solunar';
import { fetchWeatherData, FISHTRAP_LAKE_LOCATION } from './utils/weather';
import { getComputedSpeciesList } from './utils/speciesData';
import { FISHTRAP_LAKE_HYDROLOGY, fetchFishtrapHydrology, LakeHydrologyData } from './utils/lakeHydrology';
import {
  CatchRecord,
  CurrentWeather,
  HourlyForecastItem,
  LocationInfo,
  SolunarData,
  TideData,
  UnitSystem,
} from './types';
import { Loader2, AlertCircle, Sparkles, CloudSun, Waves, Fish, Target, ArrowRight, Gauge, Activity, ShieldCheck } from 'lucide-react';

const INITIAL_SAMPLE_CATCHES: CatchRecord[] = [
  {
    id: 'catch-1',
    species: 'Largemouth Bass',
    weight: 6.4,
    length: 22.5,
    lureOrBait: '3/8 oz Chatterbait (Green Pumpkin)',
    locationName: 'Submerged Hydrilla Point',
    waterDepthFt: 6.0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    notes: 'Hit violently during the morning solunar major transit right on the grass edge.',
    isTrophy: true,
    weatherSnapshot: {
      temp: 74,
      pressureTrend: 'falling',
      moonPhase: 'Waxing Gibbous',
      solunarScore: 88,
    },
  },
  {
    id: 'catch-2',
    species: 'Smallmouth Bass',
    weight: 4.1,
    length: 19.0,
    lureOrBait: '1/5 oz Ned Rig (TRD PB&J)',
    locationName: 'Rocky Shoal Drop-off',
    waterDepthFt: 14.5,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    notes: 'Slow dragging over boulders in 8 mph wind chop.',
    isTrophy: false,
    weatherSnapshot: {
      temp: 68,
      pressureTrend: 'steady',
      moonPhase: 'First Quarter',
      solunarScore: 72,
    },
  },
  {
    id: 'catch-3',
    species: 'Walleye',
    weight: 5.8,
    length: 24.0,
    lureOrBait: '1/4 oz Jig + Live Shiner',
    locationName: 'Bridge Channel Ledge',
    waterDepthFt: 18.0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    notes: 'Overcast skies and dusk low-light feeding spree.',
    isTrophy: true,
    weatherSnapshot: {
      temp: 62,
      pressureTrend: 'falling_fast',
      moonPhase: 'Full Moon',
      solunarScore: 94,
    },
  }
];

export default function App() {
  const currentLocation = FISHTRAP_LAKE_LOCATION;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'conditions' | 'fishtrap' | 'species' | 'catchlog' | 'ai' | 'android'>('dashboard');

  const [catches, setCatches] = useState<CatchRecord[]>(() => {
    const saved = localStorage.getItem('anglers_daily_catch_log');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return INITIAL_SAMPLE_CATCHES;
  });

  const [isCatchModalOpen, setIsCatchModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrModalTab, setQrModalTab] = useState<'android' | 'pc'>('android');
  const [prefillCatchSpecies, setPrefillCatchSpecies] = useState('');
  const [prefillCatchLure, setPrefillCatchLure] = useState('');

  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Chrome PC Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
        return;
      }

      if (e.key === '1') setActiveTab('dashboard');
      else if (e.key === '2') setActiveTab('conditions');
      else if (e.key === '3') setActiveTab('fishtrap');
      else if (e.key === '4') setActiveTab('species');
      else if (e.key === '5') setActiveTab('catchlog');
      else if (e.key === '6' || e.key === '7') setActiveTab('ai');
      else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setPrefillCatchSpecies('');
        setPrefillCatchLure('');
        setIsCatchModalOpen(true);
      } else if (e.key === 'u' || e.key === 'U') {
        setUnitSystem((prev) => (prev === 'imperial' ? 'metric' : 'imperial'));
      } else if (e.key === 'Escape') {
        setIsCatchModalOpen(false);
        setIsQrModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Computed Solunar data
  const solunarData: SolunarData = useMemo(() => {
    return calculateSolunar(selectedDate, currentLocation.lat, currentLocation.lon);
  }, [selectedDate, currentLocation.lat, currentLocation.lon]);

  // Weather state
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastItem[]>([]);
  const [hydrologyData, setHydrologyData] = useState<LakeHydrologyData>(FISHTRAP_LAKE_HYDROLOGY);
  const [tideData, setTideData] = useState<TideData>({
    isCoastal: false,
    events: [],
    currentStatus: 'Freshwater / Non-Tidal',
  });

  // Save catches to localStorage
  useEffect(() => {
    localStorage.setItem('anglers_daily_catch_log', JSON.stringify(catches));
  }, [catches]);

  // Fetch USACE live hydrology on mount and interval
  useEffect(() => {
    const controller = new AbortController();
    const load = () => {
      fetchFishtrapHydrology(controller.signal).then((data) => {
        if (data) setHydrologyData(data);
      });
    };
    load();
    // CWMS publishes on a 15 minute cadence.
    const timer = window.setInterval(load, 15 * 60 * 1000);
    return () => {
      window.clearInterval(timer);
      controller.abort();
    };
  }, []);

  // Fetch weather when date changes
  useEffect(() => {
    let isCancelled = false;
    async function loadData() {
      setIsLoadingWeather(true);
      setWeatherError(null);
      try {
        const { current, hourly, tides } = await fetchWeatherData(currentLocation, solunarData);
        if (!isCancelled) {
          setCurrentWeather(current);
          setHourlyForecast(hourly);
          setTideData(tides);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setWeatherError(err.message || 'Failed to fetch weather');
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingWeather(false);
        }
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [currentLocation, selectedDate]);

  // Species ratings computed dynamically
  const computedSpecies = useMemo(() => {
    if (!currentWeather) return [];
    return getComputedSpeciesList(currentWeather, solunarData);
  }, [currentWeather, solunarData]);

  const handleAddCatch = (catchData: Omit<CatchRecord, 'id'>) => {
    const newRecord: CatchRecord = {
      ...catchData,
      id: `catch-${Date.now()}`,
    };
    setCatches((prev) => [newRecord, ...prev]);
  };

  const handleDeleteCatch = (id: string) => {
    setCatches((prev) => prev.filter((c) => c.id !== id));
  };

  const handleOpenCatchModalForSpecies = (speciesName: string, defaultLure: string) => {
    setPrefillCatchSpecies(speciesName);
    setPrefillCatchLure(defaultLure);
    setIsCatchModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* App Header */}
      <Header
        currentLocation={currentLocation}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        unitSystem={unitSystem}
        onToggleUnits={() =>
          setUnitSystem((prev) => (prev === 'imperial' ? 'metric' : 'imperial'))
        }
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        catchCount={catches.length}
        onOpenNewCatchModal={() => {
          setPrefillCatchSpecies('');
          setPrefillCatchLure('');
          setIsCatchModalOpen(true);
        }}
        onOpenQrModal={(tab = 'android') => {
          setQrModalTab(tab);
          setIsQrModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Loading / Error Banner if any */}
        {isLoadingWeather && !currentWeather && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-xl">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-sm font-semibold text-slate-300">
                Calculating solunar feeding tables & barometric curves for {currentLocation.name}...
              </p>
            </div>
          </div>
        )}

        {weatherError && (
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex items-center gap-3 text-amber-300 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>
              <strong>Note:</strong> {weatherError}. Using high-precision mathematical models.
            </span>
          </div>
        )}

        {currentWeather && (
          <>
            {/* 1. DASHBOARD VIEW (Pikeville & Fishtrap Overview Start Page) */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* 1A. AI Angler Guide Intelligence Briefing at the TOP */}
                <AIOverviewBriefing
                  location={currentLocation}
                  weather={currentWeather}
                  solunar={solunarData}
                  unitSystem={unitSystem}
                  hydrology={hydrologyData}
                  onOpenFullAdvisor={() => setActiveTab('ai')}
                />

                {/* 1B. Quick Snapshots Grid (Conditions & Fishtrap Hydrology) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Conditions & Solunar Snapshot */}
                  <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition group">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                            <CloudSun className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                            Live Conditions & Solunar
                          </h3>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {solunarData.ratingScore}/100 Score
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Air Temp</div>
                          <div className="text-base font-black text-slate-100 mt-0.5">
                            {currentWeather.temp}°{unitSystem === 'imperial' ? 'F' : 'C'}
                          </div>
                        </div>
                        <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Barometer</div>
                          <div className="text-base font-black text-amber-300 mt-0.5">
                            {currentWeather.pressureInHg} <span className="text-[10px] text-slate-400 font-normal">inHg</span>
                          </div>
                        </div>
                        <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Wind</div>
                          <div className="text-base font-black text-cyan-300 mt-0.5">
                            {currentWeather.windSpeed} <span className="text-[10px] text-slate-400 font-normal">{unitSystem === 'imperial' ? 'mph' : 'km/h'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Next Peak Bite Window:</span>
                          <strong className="text-amber-300">
                            {solunarData.majorPeriods[0]?.start || '06:30 AM'} – {solunarData.majorPeriods[0]?.end || '08:30 AM'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('conditions')}
                      className="mt-4 w-full py-2.5 px-3 bg-slate-800 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-slate-700 hover:border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <CloudSun className="w-3.5 h-3.5" />
                      <span>View Live Radar, Hourly & Solunar Conditions →</span>
                    </button>
                  </div>

                  {/* Fishtrap Lake Hydrology Snapshot */}
                  <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition group">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                            <Waves className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                            Fishtrap Lake Telemetry
                          </h3>
                        </div>
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                          USACE #FTPK2
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Lake Elevation</div>
                          <div className="text-base font-black text-emerald-300 mt-0.5">
                            {hydrologyData.poolElevationFt.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">ft</span>
                          </div>
                        </div>
                        <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Inflow / Outflow</div>
                          <div className="text-xs font-black text-slate-200 mt-1">
                            <span className="text-cyan-300">{hydrologyData.inflowCfs.toFixed(0)}</span> / <span className="text-amber-300">{hydrologyData.outflowCfs.toFixed(0)}</span> <span className="text-[9px] text-slate-400">cfs</span>
                          </div>
                        </div>
                        <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Water Temp</div>
                          <div className="text-base font-black text-teal-300 mt-0.5">
                            {hydrologyData.waterTempF.toFixed(1)}°F
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">USACE Telemetry:</span>
                          <strong className="text-emerald-300 font-medium">{hydrologyData.statusSummary}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('fishtrap')}
                      className="mt-4 w-full py-2.5 px-3 bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-slate-700 hover:border-cyan-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Waves className="w-3.5 h-3.5" />
                      <span>View Official USACE Dam & Tailwater Telemetry →</span>
                    </button>
                  </div>
                </div>

                {/* 1C. Species Radar Bite Forecast Preview */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-sm font-black text-slate-200 flex items-center gap-2">
                      <Fish className="w-4 h-4 text-emerald-400" />
                      Active Species Bite Radar (Top Picks)
                    </h3>
                    <button
                      onClick={() => setActiveTab('species')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                    >
                      <span>View all {computedSpecies.length} species</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <SpeciesGuide
                    speciesList={computedSpecies}
                    onLogCatchForSpecies={handleOpenCatchModalForSpecies}
                  />
                </div>
              </div>
            )}

            {/* 2. CONDITIONS VIEW (Radar, Solunar Info & Weather) */}
            {activeTab === 'conditions' && (
              <div className="space-y-6">
                {/* Hero Solunar & Bite Score */}
                <BiteScoreCard
                  solunar={solunarData}
                  weather={currentWeather}
                  unitSystem={unitSystem}
                />

                {/* Live Doppler Weather Radar Panel */}
                <WeatherRadarPanel location={currentLocation} />

                {/* 24-Hour Forecast Timeline */}
                <HourlyForecast
                  hourly={hourlyForecast}
                  unitSystem={unitSystem}
                />

                {/* 4-Panel Environmental Gauges */}
                <EnvironmentalPanel
                  weather={currentWeather}
                  solunar={solunarData}
                  tides={tideData}
                  unitSystem={unitSystem}
                />
              </div>
            )}

            {/* 3. FISHTRAP HYDROLOGY DEDICATED VIEW */}
            {activeTab === 'fishtrap' && (
              <div className="space-y-6">
                <FishtrapLakeCard unitSystem={unitSystem} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <HourlyForecast
                    hourly={hourlyForecast}
                    unitSystem={unitSystem}
                  />
                  <EnvironmentalPanel
                    weather={currentWeather}
                    solunar={solunarData}
                    tides={tideData}
                    unitSystem={unitSystem}
                  />
                </div>
              </div>
            )}

            {/* 4. SPECIES RADAR TAB */}
            {activeTab === 'species' && (
              <SpeciesGuide
                speciesList={computedSpecies}
                onLogCatchForSpecies={handleOpenCatchModalForSpecies}
              />
            )}

            {/* 5. CATCH LOG JOURNAL TAB */}
            {activeTab === 'catchlog' && (
              <CatchLogView
                catches={catches}
                onAddCatch={handleAddCatch}
                onDeleteCatch={handleDeleteCatch}
                unitSystem={unitSystem}
                onOpenModal={() => {
                  setPrefillCatchSpecies('');
                  setPrefillCatchLure('');
                  setIsCatchModalOpen(true);
                }}
              />
            )}

            {/* 7. AI ANGLER GUIDE TAB */}
            {activeTab === 'ai' && (
              <AIAssistant
                currentLocation={currentLocation}
                weather={currentWeather}
                solunar={solunarData}
                unitSystem={unitSystem}
                hydrology={hydrologyData}
              />
            )}

            {/* 8. DEDICATED ANDROID & MOBILE QR HUB TAB */}
            {activeTab === 'android' && (
              <AndroidQRView />
            )}
          </>
        )}
      </main>

      {/* Catch Logging Modal */}
      {currentWeather && (
        <CatchLogModal
          isOpen={isCatchModalOpen}
          onClose={() => setIsCatchModalOpen(false)}
          onSaveCatch={handleAddCatch}
          currentLocation={currentLocation}
          currentWeather={currentWeather}
          currentSolunar={solunarData}
          unitSystem={unitSystem}
          prefillSpecies={prefillCatchSpecies}
          prefillLure={prefillCatchLure}
        />
      )}

      {/* Android & Chrome PC Modal (Triggered by upper Header QR button) */}
      <AndroidQRModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        initialTab={qrModalTab}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>Angler's Daily Dashboard © {new Date().getFullYear()} • Professional Solunar & Weather Telemetry</span>
          <span className="text-emerald-500/80 font-medium">Built for Mobile & Desktop Anglers</span>
        </div>
      </footer>
    </div>
  );
}
