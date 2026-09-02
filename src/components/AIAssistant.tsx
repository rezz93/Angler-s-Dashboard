import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  Waves,
  RefreshCw,
  Layers,
  Zap,
  CheckCircle2,
  Loader2,
  CloudSun,
  Sun,
  Moon,
  Clock,
  Wind,
  Gauge,
  Thermometer,
  Calendar,
  Compass,
  ArrowUpRight,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import Markdown from 'react-markdown';
import { CurrentWeather, LocationInfo, SolunarData, UnitSystem } from '../types';
import { LakeHydrologyData, FISHTRAP_LAKE_HYDROLOGY } from '../utils/lakeHydrology';
import { FrontsData, summarizeFronts } from '../utils/weatherFronts';
import { getSeasonContext } from '../utils/season';
import { FrontOutlookNote } from './FrontOutlookNote';
import {
  SyncedChatMessage,
  getLocalChatHistory,
  fetchServerChatHistory,
  syncChatMessageToServer,
  removeChatMessage,
  clearSyncedChatHistory,
  subscribeToChatUpdates,
  saveLocalChatHistory,
} from '../utils/aiChatStore';
import {
  requestAnglerAdvice,
  getGeminiApiKey,
  setGeminiApiKey,
  subscribeToGeminiKeyChanges,
} from '../utils/geminiAdvice';

interface AIAssistantProps {
  currentLocation: LocationInfo;
  weather: CurrentWeather;
  solunar: SolunarData;
  unitSystem: UnitSystem;
  hydrology?: LakeHydrologyData;
  fronts?: FrontsData;
  isLoadingFronts?: boolean;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  currentLocation,
  weather,
  solunar,
  unitSystem,
  hydrology = FISHTRAP_LAKE_HYDROLOGY,
  fronts,
  isLoadingFronts = false,
}) => {
  const waterTempDisplay = hydrology.waterTempF > 0
    ? `${hydrology.waterTempF.toFixed(1)}°F`
    : 'unavailable';

  const [chatHistory, setChatHistory] = useState<SyncedChatMessage[]>(() => getLocalChatHistory());
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => getGeminiApiKey());
  const [keyDraft, setKeyDraft] = useState('');
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const chatMessagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => subscribeToGeminiKeyChanges(setApiKey), []);

  // Solunar Best Times String
  const majorTimesSummary = solunar.majorPeriods && solunar.majorPeriods.length > 0
    ? solunar.majorPeriods.map((p, idx) => `Major ${idx + 1}: ${p.start}–${p.end} (Peak ${p.peak})`).join(' | ')
    : 'Major 1: 06:30 AM–08:30 AM | Major 2: 06:45 PM–08:45 PM';

  const minorTimesSummary = solunar.minorPeriods && solunar.minorPeriods.length > 0
    ? solunar.minorPeriods.map((p, idx) => `Minor ${idx + 1}: ${p.start}–${p.end} (Peak ${p.peak})`).join(' | ')
    : 'Minor 1: 12:30 PM–01:30 PM | Minor 2: 12:45 AM–01:45 AM';

  const bestTimesCombined = `${majorTimesSummary}; ${minorTimesSummary}`;

  // Weather Statement Builder
  const seasonContext = getSeasonContext(new Date(), hydrology.waterTempF);
  const frontContext = summarizeFronts(fronts);

  // Only a boundary the WPC analysis actually places nearby earns front language.
  const nearbyFrontMi = fronts?.status === 'ok' ? fronts.nearest?.distanceMi : undefined;
  const frontClause =
    nearbyFrontMi !== undefined && nearbyFrontMi <= 150
      ? ` The nearest analysed boundary is a ${fronts?.nearest?.label.toLowerCase()} about ${nearbyFrontMi} mi ${fronts?.nearest?.bearingText}, so treat this as front-influenced air.`
      : nearbyFrontMi !== undefined
      ? ` The nearest analysed boundary sits roughly ${nearbyFrontMi} mi ${fronts?.nearest?.bearingText} — far enough out that today's pressure change is air-mass driven rather than an imminent passage.`
      : '';

  const pressureAdvice =
    weather.pressureTrend === 'falling' || weather.pressureTrend === 'falling_fast'
      ? `A ${weather.pressureTrend === 'falling_fast' ? 'sharply falling' : 'falling'} barometer generally widens the feeding window. Work reaction lures (spinnerbaits, squarebill crankbaits, chatterbaits) across windward points and secondary channel cuts.`
      : weather.pressureTrend === 'rising' || weather.pressureTrend === 'rising_fast'
      ? `${weather.pressureTrend === 'rising_fast' ? 'Sharply rising' : 'Rising'} pressure typically holds fish tighter to deep bottom structure, dock pilings, and shaded bluff walls. Downsize to finesse jigs, drop shot rigs, and Ned rigs with subtle cadences.`
      : 'Steady barometric pressure keeps feeding patterns routine. Fish transition shelves during solunar peak windows and hold on medium-depth structure through midday.';

  const weatherStatement = `${
    weather.isSimulated
      ? `Live weather is unavailable right now, so the numbers below are seasonal placeholders, not observations. `
      : ''
  }Tactical Atmospheric Assessment for ${currentLocation.name} on ${seasonContext.dateLabel} (${seasonContext.label}): ${weather.weatherDescription} with ambient air temperature at ${weather.temp}°F (feels like ${weather.feelsLike}°F) and ${weather.humidity}% humidity. Wind is from the ${weather.windDirectionText} at ${weather.windSpeed} mph. Sea-level barometric pressure registers ${weather.pressureInHg.toFixed(2)} inHg (${weather.pressureTrend.replace('_', ' ')}, ${weather.pressureDelta6h} hPa over 6 h). Seasonal pattern: ${seasonContext.phase}. ${pressureAdvice}${frontClause}`;

  // Solunar Statement Builder
  const solunarStatement = `Today's Solunar Bite Rating is rated ${solunar.ratingScore}/100 (${solunar.overallQuality} Activity) under a ${solunar.moonPhaseName} (${solunar.moonIllumination}% illumination). Prime feeding windows for today are concentrated during Major Periods: ${
    solunar.majorPeriods[0] ? `${solunar.majorPeriods[0].start} to ${solunar.majorPeriods[0].end} (Peak at ${solunar.majorPeriods[0].peak})` : 'Morning Major'
  } and ${
    solunar.majorPeriods[1] ? `${solunar.majorPeriods[1].start} to ${solunar.majorPeriods[1].end} (Peak at ${solunar.majorPeriods[1].peak})` : 'Evening Major'
  }. Secondary feeding spikes occur during Minor Periods: ${
    solunar.minorPeriods[0] ? `${solunar.minorPeriods[0].start} to ${solunar.minorPeriods[0].end} (Peak at ${solunar.minorPeriods[0].peak})` : 'Midday Minor'
  } and ${
    solunar.minorPeriods[1] ? `${solunar.minorPeriods[1].start} to ${solunar.minorPeriods[1].end} (Peak at ${solunar.minorPeriods[1].peak})` : 'Night Minor'
  }. Position your boat on high-percentage points and creek channels 15–20 minutes before these peaks.`;

  // Sync across Android, Desktop, and Dashboard AI Briefing
  useEffect(() => {
    fetchServerChatHistory().then((msgs) => {
      if (msgs && msgs.length > 0) {
        setChatHistory(msgs);
      }
    });

    const unsubscribe = subscribeToChatUpdates((updated) => {
      setChatHistory(updated);
    });

    return () => unsubscribe();
  }, []);

  const scrollToChatBottom = () => {
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTo({
        top: chatMessagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const quickPrompts = [
    '⏰ When are the best solunar bite times today?',
    '🌤️ How does today\'s weather forecast affect the bite?',
    '🎣 How to catch Freshwater Stripers at Fishtrap Dam today?',
    '🐟 Where are Crappie holding in brush piles today?',
    '🔥 Recommend top 3 Bass lures for current barometer',
    '🌊 Catfish strategy for deep Levisa Fork holes',
  ];

  const handleSendMessage = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || isLoading) return;

    const itemId = `qa-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newQueryItem: SyncedChatMessage = {
      id: itemId,
      question: text,
      isLoading: true,
      timestamp,
    };

    const nextList = [...chatHistory, newQueryItem];
    setChatHistory(nextList);
    saveLocalChatHistory(nextList);

    if (!queryToSend) setInputQuery('');
    setIsLoading(true);
    setTimeout(scrollToChatBottom, 50);

    try {
      const { advice, source, error } = await requestAnglerAdvice(text, {
        location: `${currentLocation.name} (${currentLocation.region})`,
        weather: weather.weatherDescription,
        airTemp: `${weather.temp}°F`,
        pressure: `${weather.pressureInHg} inHg / ${weather.pressureHpa} hPa`,
        pressureTrend: weather.pressureTrend,
        waterTemp: `${waterTempDisplay} (USACE Live Dam Sensor #FTPK2)`,
        inflowOutflow: `${hydrology.inflowCfs} cfs inflow / ${hydrology.outflowCfs} cfs outflow`,
        poolElevation: `${hydrology.poolElevationFt.toFixed(2)} ft (Summer Pool: ${hydrology.summerPoolFt.toFixed(2)} ft)`,
        windSpeed: `${weather.windSpeed} mph`,
        windDirection: `${weather.windDirectionText} (${weather.windDirectionDeg}°)`,
        solunarScore: solunar.ratingScore,
        solunarQuality: solunar.overallQuality,
        moonPhase: `${solunar.moonPhaseName} (${solunar.moonIllumination}%)`,
        solunarBestTimes: bestTimesCombined,
        targetSpecies: 'Largemouth Bass, Smallmouth Bass, Crappie, Panfish, Catfish, Freshwater Stripers',
        frontalAnalysis: frontContext,
        frontalDiscussion: fronts?.discussion,
        date: seasonContext.dateLabel,
        season: `${seasonContext.label} — ${seasonContext.phase}`,
        dataNotice: weather.isSimulated
          ? 'The live weather API was unreachable; the weather values above are seasonal placeholders. Say so rather than presenting them as observations.'
          : undefined,
      });

      if (error) {
        console.warn('Gemini unavailable, answered with the local tactical engine:', error);
      }

      const completedItem: SyncedChatMessage = {
        id: itemId,
        question: text,
        answer: advice,
        isLoading: false,
        timestamp,
        source,
      };

      const updatedHistory = nextList.map((item) =>
        item.id === itemId ? completedItem : item
      );

      setChatHistory(updatedHistory);
      saveLocalChatHistory(updatedHistory);
      syncChatMessageToServer(completedItem);
      setTimeout(scrollToChatBottom, 50);
    } catch (err) {
      console.error('Failed to get AI fishing advice:', err);
      const fallbackItem: SyncedChatMessage = {
        id: itemId,
        question: text,
        answer: `### 🎣 Tactical Advisory: Expected Weather & Solunar Timing\n\n**Expected Weather Statement:**\n${weatherStatement}\n\n**Best Solunar Times for Today:**\n${solunarStatement}\n\n**Strategic Recommendation:** With USACE water temperature at **${waterTempDisplay}** and a **${weather.pressureTrend}** barometer, fish high-percentage transition shelves and main lake points with reaction baits during Major periods, then downsize to finesse jigs and drop shots during midday.`,
        isLoading: false,
        timestamp,
      };

      const updatedHistory = nextList.map((item) =>
        item.id === itemId ? fallbackItem : item
      );

      setChatHistory(updatedHistory);
      saveLocalChatHistory(updatedHistory);
      syncChatMessageToServer(fallbackItem);
      setTimeout(scrollToChatBottom, 50);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (id: string) => {
    const updated = chatHistory.filter((item) => item.id !== id);
    setChatHistory(updated);
    await removeChatMessage(id);
  };

  const handleClearHistory = async () => {
    setChatHistory([]);
    await clearSyncedChatHistory();
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP HEADER & TELEMETRY BADGES */}
      <div className="bg-slate-900/95 border border-teal-500/40 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-2.5 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-950/50">
              <Sparkles className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
                  AI Angler Guide
                </h1>
                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  Live Advisor
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>Precision forecasts & solunar peak timing for <strong>{currentLocation.name}</strong></span>
                <span>•</span>
                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                  <Waves className="w-3.5 h-3.5 text-emerald-400" />
                  USACE Water Temp: <strong className="text-slate-100">{waterTempDisplay}</strong>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border ${
                apiKey
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {apiKey ? 'Gemini Live' : 'Offline Tactical Engine'}
            </span>
            <button
              onClick={() => {
                setKeyDraft('');
                setShowKeyPanel((open) => !open);
              }}
              className="text-xs text-slate-300 hover:text-teal-300 p-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-teal-500/40 transition flex items-center gap-1"
              title="Configure Gemini API key"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>AI Key</span>
            </button>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Desktop & Android Synced
            </span>
            {chatHistory.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-xs text-slate-400 hover:text-rose-400 p-1.5 rounded-xl bg-slate-800 border border-slate-700 transition flex items-center gap-1 hover:border-rose-500/40"
                title="Clear synced conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Chat</span>
              </button>
            )}
          </div>
        </div>

        {showKeyPanel && (
          <div className="mt-4 bg-slate-950/90 border border-teal-500/30 rounded-2xl p-4 space-y-2.5 relative z-10">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-300 uppercase tracking-wide">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Gemini API Key</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This dashboard is hosted as static files, so there is no server to hold a key. Paste
              your own Google AI Studio key to get live Gemini briefings — it is stored only in this
              browser and sent directly to Google. Without a key, answers come from the bundled
              tactical engine using live USACE and weather telemetry.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="password"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder={apiKey ? 'Key saved — paste a new key to replace it' : 'AIza…'}
                className="flex-1 min-w-[220px] bg-slate-900 border border-slate-700 focus:border-teal-400 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition font-mono"
              />
              <button
                onClick={() => {
                  setGeminiApiKey(keyDraft);
                  setKeyDraft('');
                  setShowKeyPanel(false);
                }}
                disabled={!keyDraft.trim()}
                className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Key
              </button>
              {apiKey && (
                <button
                  onClick={() => {
                    setGeminiApiKey('');
                    setKeyDraft('');
                  }}
                  className="px-3 py-2 text-xs font-bold text-rose-300 hover:text-rose-200 bg-slate-900 border border-rose-500/30 rounded-xl transition"
                >
                  Remove
                </button>
              )}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-teal-300 hover:text-teal-200 flex items-center gap-1 font-semibold"
              >
                Get a key
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* 2. DEDICATED REAL-TIME TELEMETRY & TACTICAL WEATHER STATEMENT BRIEFING */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5 relative z-10">
          {/* A. EXPECTED WEATHER & REAL-TIME TELEMETRY STATEMENT CARD */}
          <div className="bg-slate-950/85 border border-teal-500/30 rounded-2xl p-4.5 flex flex-col justify-between space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wide">
                <CloudSun className="w-4 h-4 text-amber-400" />
                <span>Real-Time Atmospheric & Lake Telemetry</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
                {weather.temp}°F • {weather.weatherDescription}
              </span>
            </div>

            {/* Weather & Telemetry Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center justify-center gap-1">
                  <Gauge className="w-3 h-3 text-cyan-400" />
                  Barometer
                </span>
                <strong className="text-slate-100 font-mono text-sm block mt-0.5">
                  {weather.pressureInHg} <span className="text-[10px] text-slate-400 font-normal">inHg</span>
                </strong>
                <span className={`text-[10px] font-bold uppercase ${
                  weather.pressureTrend === 'falling' ? 'text-amber-400' : weather.pressureTrend === 'rising' ? 'text-cyan-400' : 'text-emerald-400'
                }`}>
                  {weather.pressureTrend}
                </span>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center justify-center gap-1">
                  <Wind className="w-3 h-3 text-emerald-400" />
                  Wind & Direction
                </span>
                <strong className="text-slate-100 font-mono text-sm block mt-0.5">
                  {weather.windSpeed} <span className="text-[10px] text-slate-400 font-normal">mph</span>
                </strong>
                <span className="text-[10px] text-emerald-300 font-medium">
                  {weather.windDirectionText} ({weather.windDirectionDeg}°)
                </span>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center justify-center gap-1">
                  <Thermometer className="w-3 h-3 text-teal-400" />
                  USACE Water
                </span>
                <strong className="text-teal-300 font-mono text-sm block mt-0.5">
                  {waterTempDisplay}
                </strong>
                <span className="text-[10px] text-slate-400">
                  Air: {weather.temp}°F
                </span>
              </div>
            </div>

            {/* Hydrology strip: Inflow / Outflow & Elevation */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px]">
                  Dam In/Outflow: <strong className="text-slate-100">{hydrology.inflowCfs} / {hydrology.outflowCfs} cfs</strong>
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Pool Elevation: <strong className="text-teal-300 font-mono">{hydrology.poolElevationFt.toFixed(1)} ft</strong>
              </div>
            </div>

            {/* Formatted Tactical Weather Statement */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3 text-xs text-slate-200 leading-relaxed space-y-1.5">
              <div className="font-semibold text-teal-300 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                <Sparkles className="w-3 h-3 text-teal-400" />
                <span>Tactical Weather Statement:</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {weatherStatement}
              </p>
            </div>

            {/* AI reading of the surface frontal analysis */}
            <FrontOutlookNote
              fronts={fronts}
              weather={weather}
              isLoadingFronts={isLoadingFronts}
              waterTempF={hydrology.waterTempF}
            />
          </div>

          {/* B. SOLUNAR BEST TIMES FOR TODAY CARD */}
          <div className="bg-slate-950/85 border border-emerald-500/30 rounded-2xl p-4.5 flex flex-col justify-between space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wide">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Solunar Best Times For Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  {solunar.ratingScore}/100 • {solunar.overallQuality}
                </span>
              </div>
            </div>

            {/* Major and Minor Windows Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Major Feeding Windows */}
              <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    Major Peak Windows
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 rounded">High Bite</span>
                </div>
                <div className="space-y-1 pt-1 text-[11px]">
                  {solunar.majorPeriods.map((period, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
                      <span className="text-slate-200 font-semibold">{period.start} – {period.end}</span>
                      <span className="text-amber-400 font-mono font-bold text-[10px]">Peak: {period.peak}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Minor Feeding Windows */}
              <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Minor Peak Windows
                  </span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 rounded">Secondary</span>
                </div>
                <div className="space-y-1 pt-1 text-[11px]">
                  {solunar.minorPeriods.map((period, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
                      <span className="text-slate-200 font-semibold">{period.start} – {period.end}</span>
                      <span className="text-cyan-400 font-mono font-bold text-[10px]">Peak: {period.peak}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sun & Moon Telemetry Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[11px]">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sunrise: <strong className="text-slate-100">{weather.sunrise || '06:48 AM'}</strong></span>
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <Sun className="w-3.5 h-3.5 text-orange-400" />
                  <span>Sunset: <strong className="text-slate-100">{weather.sunset || '08:14 PM'}</strong></span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Moon className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-400 font-medium">
                  {solunar.moonPhaseName} (<strong className="text-slate-200">{solunar.moonIllumination}%</strong>)
                </span>
              </div>
            </div>

            {/* Formatted Statement */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3 text-xs text-slate-200 leading-relaxed space-y-1.5">
              <div className="font-semibold text-emerald-300 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Tactical Timing Strategy:</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {solunarStatement}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE AI ANGLER DIRECT Q&A CHAT CONTAINER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col min-h-[500px]">
        {/* Chat Section Title & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-teal-400" />
            <h2 className="text-sm sm:text-base font-bold text-slate-100">
              Direct AI Angler Q&A Interface
            </h2>
            <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-bold">
              Telemetry Grounded
            </span>
          </div>
          <div className="flex items-center gap-2">
            {chatHistory.length > 0 && (
              <button
                id="btn-clear-all-ai-history"
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-rose-400/90 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 rounded-lg transition"
                title="Clear all question history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All ({chatHistory.length})</span>
              </button>
            )}
            <span className="text-xs text-slate-400 hidden sm:inline">
              Powered by live USACE water temp & solunar data
            </span>
          </div>
        </div>

        {/* Quick Question Chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-teal-500/20 border border-slate-700 hover:border-teal-500/40 text-slate-300 hover:text-teal-200 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1 disabled:opacity-50"
            >
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Chat History Messages Feed */}
        <div
          ref={chatMessagesContainerRef}
          className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[520px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
        >
          {/* Welcome Intro Box */}
          <div className="bg-slate-950/80 border border-teal-500/30 rounded-2xl p-4 text-xs space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wide">
              <Bot className="w-4 h-4 text-teal-400" />
              <span>{currentLocation.name} AI Angler Guide Ready</span>
            </div>
            <div className="text-slate-200 leading-relaxed space-y-2">
              <p>
                🎣 <strong>Greetings, Angler!</strong> I have loaded today's real-time telemetry: <strong>USACE Water Temp: {waterTempDisplay}</strong>, <strong>Barometer: {weather.pressureInHg} inHg ({weather.pressureTrend})</strong>, and <strong>Solunar Rating: {solunar.ratingScore}/100 ({solunar.overallQuality})</strong>.
              </p>
              <p className="text-slate-300 text-xs">
                Ask me any question below about specific species (Bass, Crappie, Stripers, Catfish, Panfish), tactical depth adjustments, lure colors, or how today's expected weather affects your chosen spot! All past questions are saved below and can be removed individually at any time.
              </p>
            </div>
          </div>

          {/* Conversation History with Distinct User & AI Containers and Individual Delete Buttons */}
          {chatHistory.map((item) => (
            <div key={item.id} className="space-y-2 pt-1 group relative">
              {/* 1. USER QUESTION CONTAINER */}
              <div className="bg-slate-900 border border-teal-500/40 rounded-2xl p-3.5 shadow-md ml-auto max-w-[92%] sm:max-w-[85%] relative">
                <div className="flex items-center justify-between text-teal-300 font-bold mb-1 text-xs">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-400" />
                    <span>Your Question</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                    <button
                      id={`delete-user-question-${item.id}`}
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition"
                      title="Remove this question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-100 font-semibold text-xs sm:text-sm pl-5">
                  {item.question}
                </p>
              </div>

              {/* 2. AI ANGLER ADVICE CONTAINER */}
              <div className="bg-slate-950/95 border border-emerald-500/40 rounded-2xl p-4 shadow-xl mr-auto max-w-[98%] sm:max-w-[95%] relative">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span className="uppercase tracking-wider">AI Angler Tactical Advice</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.answer && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          item.source === 'heuristics' || !item.source
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {item.source === 'gemini'
                          ? 'Gemini'
                          : item.source === 'server'
                          ? 'Server AI'
                          : 'Offline Engine'}
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold flex items-center gap-1 border border-teal-500/30">
                      <Waves className="w-2.5 h-2.5" />
                      USACE: {waterTempDisplay}
                    </span>
                    <button
                      id={`delete-ai-advice-${item.id}`}
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition"
                      title="Remove this entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.isLoading ? (
                  <div className="flex items-center gap-2 text-teal-300 py-3 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing expected weather ({weather.weatherDescription}), solunar peak windows, and USACE water temp ({waterTempDisplay})...</span>
                  </div>
                ) : (
                  <div className="markdown-body text-xs text-slate-200 leading-relaxed space-y-2 [&_h3]:text-sm [&_h3]:font-black [&_h3]:text-slate-100 [&_h3]:mt-2 [&_strong]:text-slate-100 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4">
                    <Markdown>{item.answer || 'Target high-percentage transition shelves and secondary creek channels during solunar feeding windows.'}</Markdown>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 pt-3 border-t border-slate-800"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about stripers, crappie depths, best times today, lure colors, catfish holes..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 hover:border-teal-500/50 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-400 disabled:opacity-50 transition"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50 shadow-md"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Ask Guide</span>
          </button>
        </form>
      </div>
    </div>
  );
};
