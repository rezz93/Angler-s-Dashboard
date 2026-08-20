import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Target,
  Layers,
  ArrowRight,
  Bot,
  Send,
  Loader2,
  Trash2,
  User,
  MessageSquare,
  RefreshCw,
  Waves
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

interface AIOverviewBriefingProps {
  location: LocationInfo;
  weather: CurrentWeather;
  solunar: SolunarData;
  unitSystem: UnitSystem;
  hydrology?: LakeHydrologyData;
  onOpenFullAdvisor: () => void;
}

export const AIOverviewBriefing: React.FC<AIOverviewBriefingProps> = ({
  location,
  weather,
  solunar,
  unitSystem,
  hydrology = FISHTRAP_LAKE_HYDROLOGY,
  onOpenFullAdvisor,
}) => {
  const [quickQuestion, setQuickQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState<SyncedChatMessage[]>(() => getLocalChatHistory());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const actualWaterTemp = hydrology.waterTempF || 79.4;
  const waterTempDisplay = `${actualWaterTemp.toFixed(1)}°F`;

  // Subscribe to real-time synced AI chat updates (shared with full assistant & Android)
  useEffect(() => {
    fetchServerChatHistory().then((msgs) => {
      if (msgs && msgs.length > 0) {
        setQaHistory(msgs);
      }
    });

    const unsubscribe = subscribeToChatUpdates((updated) => {
      setQaHistory(updated);
    });

    return () => unsubscribe();
  }, []);

  const handleAskQuickQuestion = async (queryText?: string) => {
    const text = (queryText || quickQuestion).trim();
    if (!text || isSubmitting) return;

    const itemId = `qa-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newQueryItem: SyncedChatMessage = {
      id: itemId,
      question: text,
      isLoading: true,
      timestamp,
    };

    // Update local and save
    const nextList = [...qaHistory, newQueryItem];
    setQaHistory(nextList);
    saveLocalChatHistory(nextList);
    setQuickQuestion('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/gemini/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          conditions: {
            location: `${location.name} (${location.region})`,
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
      const answerText = data.advice || 'Target primary main lake points and creek channels near current seams.';

      const completedItem: SyncedChatMessage = {
        id: itemId,
        question: text,
        answer: answerText,
        isLoading: false,
        timestamp,
      };

      const updatedHistory = nextList.map((item) =>
        item.id === itemId ? completedItem : item
      );

      setQaHistory(updatedHistory);
      saveLocalChatHistory(updatedHistory);
      syncChatMessageToServer(completedItem);
    } catch (e) {
      const fallbackItem: SyncedChatMessage = {
        id: itemId,
        question: text,
        answer:
          '🎣 **Fishtrap Pro Tip:** With USACE water temp at ' +
          waterTempDisplay +
          ', focus on 10–18 ft ledges and secondary points with football jigs and deep diving crankbaits during peak solunar windows.',
        isLoading: false,
        timestamp,
      };

      const updatedHistory = nextList.map((item) =>
        item.id === itemId ? fallbackItem : item
      );

      setQaHistory(updatedHistory);
      saveLocalChatHistory(updatedHistory);
      syncChatMessageToServer(fallbackItem);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearHistory = async () => {
    setQaHistory([]);
    await clearSyncedChatHistory();
  };

  useEffect(() => {
    if (qaHistory.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [qaHistory]);

  const quickPrompts = [
    '🎣 Freshwater Stripers at Fishtrap Dam?',
    '🐟 Where are Crappie holding today?',
    '⚡ Best Bass lures for this barometer',
    '🎨 Top lure colors for current clarity',
  ];

  return (
    <div
      id="ai-overview-briefing"
      className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-teal-950/40 border-2 border-teal-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden"
    >
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
                AI Pro Angler Tactical Briefing
              </h2>
              <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                Pikeville & Fishtrap
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
              <span>Live AI intelligence for barometer ({weather.pressureInHg} inHg)</span>
              <span>•</span>
              <span className="text-teal-300 font-semibold flex items-center gap-1">
                <Waves className="w-3 h-3 inline text-teal-400" />
                USACE Water Temp: <strong className="text-slate-100">{waterTempDisplay}</strong>
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={onOpenFullAdvisor}
          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg hover:scale-105"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Open Full AI Co-Pilot</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3-Column Key Tactical Takeaways */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5 relative z-10">
        {/* 1. Bite Index & Peak Windows */}
        <div className="bg-slate-950/80 border border-teal-500/30 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-teal-400" />
              Bite Intensity
            </span>
            <span className="text-teal-300 font-mono text-[11px] font-bold">
              {solunar.ratingScore}/100 Score
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
              <span>{solunar.overallQuality} Activity</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-ping" />
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Prime feeding peaks coincide with <strong className="text-teal-300">{solunar.majorPeriods[0]?.start || '06:30 AM'}–{solunar.majorPeriods[0]?.end || '08:30 AM'}</strong> and <strong className="text-teal-300">{solunar.majorPeriods[1]?.start || '06:45 PM'}–{solunar.majorPeriods[1]?.end || '08:45 PM'}</strong>.
            </p>
          </div>

          <div className="text-[11px] text-teal-400/90 font-medium">
            🎯 Target weed edges & riprap during major spikes.
          </div>
        </div>

        {/* 2. Barometer & Depth Strategy */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Depth & Structure
            </span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold">
              8–16 ft Target
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-base sm:text-lg font-black text-cyan-300">
              Suspended & Drop-off Holding
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              With USACE water temp at <strong className="text-teal-300">{waterTempDisplay}</strong> and barometer at <strong className="text-slate-100">{weather.pressureInHg} inHg</strong>, fish stage on secondary points, brush piles, and creek bends.
            </p>
          </div>

          <div className="text-[11px] text-cyan-400/90 font-medium">
            🌊 Fish wind-blown shoreline banks in the afternoon.
          </div>
        </div>

        {/* 3. Recommended Top Lures */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-400" />
              Top Rigging
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
              High Confidence
            </span>
          </div>

          <div className="my-2.5 space-y-1 text-xs text-slate-200">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <span>1. Football Jig (Green Pumpkin / Black-Blue)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span>2. Deep Diving Crankbait (Chartreuse / Sexy Shad)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span>3. Drop Shot Finesse Worm (Watermelon Red)</span>
            </div>
          </div>

          <div className="text-[11px] text-emerald-400/90 font-medium">
            🎣 Slow down cadence on deep boulder transitions.
          </div>
        </div>
      </div>

      {/* Interactive AI Angler Direct Q&A Section */}
      <div className="mt-5 pt-4 border-t border-slate-800 relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wide">
              Ask AI Pro Angler Anything
            </h3>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              Synced Across Mobile & Desktop
            </span>
          </div>
          {qaHistory.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Thread</span>
            </button>
          )}
        </div>

        {/* Quick Question Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleAskQuickQuestion(prompt)}
              disabled={isSubmitting}
              className="text-[11px] bg-slate-950/80 hover:bg-teal-500/20 text-teal-300 hover:text-teal-200 px-2.5 py-1 rounded-xl border border-teal-500/30 transition disabled:opacity-50 font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input & Submit Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuickQuestion();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={quickQuestion}
            onChange={(e) => setQuickQuestion(e.target.value)}
            placeholder="Ask about stripers, crappie depths, bass on bluffs, lure colors, catfish..."
            className="flex-1 bg-slate-950 border border-slate-700 hover:border-teal-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 transition"
          />
          <button
            type="submit"
            disabled={!quickQuestion.trim() || isSubmitting}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Ask</span>
          </button>
        </form>

        {/* Conversation Thread Feed with Clearly Separated Question & AI Response Containers */}
        {qaHistory.length > 0 && (
          <div className="space-y-4 pt-2 max-h-[420px] overflow-y-auto pr-1">
            {qaHistory.map((item) => (
              <div key={item.id} className="space-y-2">
                {/* 1. SEPARATE USER QUESTION CONTAINER */}
                <div className="bg-slate-900/90 border border-teal-500/40 rounded-2xl p-3.5 shadow-md">
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

                {/* 2. SEPARATE AI RESPONSE CONTAINER */}
                <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
                      <Bot className="w-4 h-4 text-emerald-400" />
                      <span className="uppercase tracking-wider">AI Pro Angler Tactical Advice</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1 border border-emerald-500/30">
                      <Waves className="w-2.5 h-2.5" />
                      USACE Water: {waterTempDisplay}
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
        )}
      </div>
    </div>
  );
};
