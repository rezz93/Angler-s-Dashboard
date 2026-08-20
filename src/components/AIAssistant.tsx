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
  Loader2
} from 'lucide-react';
import Markdown from 'react-markdown';
import { CurrentWeather, LocationInfo, SolunarData, UnitSystem } from '../types';
import { LakeHydrologyData, FISHTRAP_LAKE_HYDROLOGY } from '../utils/lakeHydrology';
import {
  SyncedChatMessage,
  getLocalChatHistory,
  fetchServerChatHistory,
  syncChatMessageToServer,
  clearSyncedChatHistory,
  subscribeToChatUpdates,
  saveLocalChatHistory,
} from '../utils/aiChatStore';

interface AIAssistantProps {
  currentLocation: LocationInfo;
  weather: CurrentWeather;
  solunar: SolunarData;
  unitSystem: UnitSystem;
  hydrology?: LakeHydrologyData;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  currentLocation,
  weather,
  solunar,
  unitSystem,
  hydrology = FISHTRAP_LAKE_HYDROLOGY,
}) => {
  const actualWaterTemp = hydrology.waterTempF || 79.4;
  const waterTempDisplay = `${actualWaterTemp.toFixed(1)}°F`;

  const [chatHistory, setChatHistory] = useState<SyncedChatMessage[]>(() => getLocalChatHistory());
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const quickPrompts = [
    '🎣 How to catch Freshwater Stripers at Fishtrap Dam?',
    '🐟 Where are Crappie holding in brush piles today?',
    '🔥 Recommend top 3 Bass lures for this barometer',
    '🌊 Catfish strategy for deep Levisa Fork holes',
    '🎨 Best lure colors for current water clarity',
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

    try {
      const response = await fetch('/api/gemini/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          conditions: {
            location: `${currentLocation.name} (${currentLocation.region})`,
            pressure: `${weather.pressureInHg} inHg / ${weather.pressureHpa} hPa`,
            pressureTrend: weather.pressureTrend,
            airTemp: `${weather.temp}°F`,
            waterTemp: `${waterTempDisplay} (USACE Live Dam Sensor #FTPK2)`,
            inflowOutflow: `${hydrology.inflowCfs} cfs inflow / ${hydrology.outflowCfs} cfs outflow`,
            poolElevation: `${hydrology.poolElevationFt.toFixed(2)} ft (Summer Pool: ${hydrology.summerPoolFt.toFixed(2)} ft)`,
            windSpeed: `${weather.windSpeed} mph`,
            windDirection: `${weather.windDirectionText} (${weather.windDirectionDeg}°)`,
            solunarScore: solunar.ratingScore,
            moonPhase: `${solunar.moonPhaseName} (${solunar.moonIllumination}%)`,
            weather: weather.weatherDescription,
            targetSpecies: 'Largemouth Bass, Smallmouth Bass, Crappie, Panfish, Catfish, Freshwater Stripers',
          },
        }),
      });

      const data = await response.json();
      const aiReplyText = data.advice || 'Target deep points and creek channel bends with slow finesse presentations.';

      const completedItem: SyncedChatMessage = {
        id: itemId,
        question: text,
        answer: aiReplyText,
        isLoading: false,
        timestamp,
      };

      const updatedHistory = nextList.map((item) =>
        item.id === itemId ? completedItem : item
      );

      setChatHistory(updatedHistory);
      saveLocalChatHistory(updatedHistory);
      syncChatMessageToServer(completedItem);
    } catch (err) {
      console.error('Failed to get AI fishing advice:', err);
      const fallbackItem: SyncedChatMessage = {
        id: itemId,
        question: text,
        answer: `🎣 **Tactical Field Note:** With USACE water temperature at **${waterTempDisplay}** and a ${weather.pressureTrend} barometer, focus on slow-rolled bladed jigs and finesse drop shots along weed edges and drop-offs during the major solunar peak at ${solunar.majorPeriods[0]?.peak || 'midday'}.`,
        isLoading: false,
        timestamp,
      };

      const updatedHistory = nextList.map((item) =>
        item.id === itemId ? fallbackItem : item
      );

      setChatHistory(updatedHistory);
      saveLocalChatHistory(updatedHistory);
      syncChatMessageToServer(fallbackItem);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    setChatHistory([]);
    await clearSyncedChatHistory();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col min-h-[700px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 p-2 flex items-center justify-center text-slate-950 shadow-md">
            <Sparkles className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              AI Angler Pro Guide & Tactical Co-Pilot
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Telemetry-grounded intelligence for Fishtrap Lake</span>
              <span>•</span>
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <Waves className="w-3 h-3 text-emerald-400" />
                Actual Water Temp: <strong className="text-slate-100">{waterTempDisplay}</strong> (USACE)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Desktop & Android Synced
          </span>
          {chatHistory.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-slate-400 hover:text-rose-400 p-1.5 rounded-lg bg-slate-800 border border-slate-700 transition flex items-center gap-1"
              title="Clear synced conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-emerald-300 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1 disabled:opacity-50"
          >
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Container with System Status & Distinct Question / Response separation */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        {/* Welcome Telemetry Card */}
        <div className="bg-slate-950/80 border border-teal-500/30 rounded-2xl p-4 text-xs space-y-2.5 shadow-sm">
          <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wide">
            <Bot className="w-4 h-4 text-teal-400" />
            <span>Fishtrap Lake AI Co-Pilot Ready</span>
          </div>
          <div className="text-slate-200 leading-relaxed space-y-2">
            <p>
              🎣 <strong>Greetings, Angler!</strong> I'm your AI Tournament Pro & Tactical Fishing Guide for <strong>Fishtrap Lake & Pikeville waters</strong>.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">USACE Water Temp</span>
                <strong className="text-teal-300 font-mono text-sm">{waterTempDisplay}</strong>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Pool Elevation</span>
                <strong className="text-emerald-300 font-mono text-sm">{hydrology.poolElevationFt.toFixed(2)} ft</strong>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Barometer</span>
                <strong className="text-amber-300 font-mono text-sm">{weather.pressureInHg} inHg</strong>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Solunar Rating</span>
                <strong className="text-emerald-400 font-mono text-sm">{solunar.ratingScore}/100</strong>
              </div>
            </div>
            <p className="text-slate-400 text-[11px] pt-1">
              Ask me about <strong>Largemouth & Smallmouth Bass, Crappie brush piles, Panfish, Catfish river channels, or Freshwater Stripers</strong>!
            </p>
          </div>
        </div>

        {/* Synced Q&A History with Explicitly Separated Containers */}
        {chatHistory.map((item) => (
          <div key={item.id} className="space-y-2 pt-1">
            {/* 1. SEPARATE USER QUESTION BOX */}
            <div className="bg-slate-900 border border-teal-500/40 rounded-2xl p-3.5 shadow-md ml-auto max-w-[92%] sm:max-w-[85%]">
              <div className="flex items-center justify-between text-teal-300 font-bold mb-1 text-xs">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-400" />
                  <span>Your Question</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
              </div>
              <p className="text-slate-100 font-semibold text-xs sm:text-sm pl-5">
                {item.question}
              </p>
            </div>

            {/* 2. SEPARATE AI PRO ANGLER ADVICE BOX */}
            <div className="bg-slate-950/95 border border-emerald-500/40 rounded-2xl p-4 shadow-xl mr-auto max-w-[98%] sm:max-w-[95%]">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span className="uppercase tracking-wider">AI Pro Angler Tactical Advice</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold flex items-center gap-1 border border-teal-500/30">
                  <Waves className="w-2.5 h-2.5" />
                  USACE: {waterTempDisplay}
                </span>
              </div>

              {item.isLoading ? (
                <div className="flex items-center gap-2 text-teal-300 py-3 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Fishtrap Lake USACE water temp ({waterTempDisplay}) & feeding patterns...</span>
                </div>
              ) : (
                <div className="markdown-body text-xs text-slate-200 leading-relaxed space-y-2 [&_h3]:text-sm [&_h3]:font-black [&_h3]:text-slate-100 [&_h3]:mt-2 [&_strong]:text-slate-100 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4">
                  <Markdown>{item.answer || ''}</Markdown>
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 pt-2 border-t border-slate-800"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask about stripers, crappie depths, bass on bluffs, catfish holes..."
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 hover:border-teal-500/50 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-400 disabled:opacity-50 transition"
        />
        <button
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50 shadow-md"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>Ask Pro</span>
        </button>
      </form>
    </div>
  );
};
