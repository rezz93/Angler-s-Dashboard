import React, { useCallback, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { Wind, Loader2, RefreshCw, CircleSlash } from 'lucide-react';
import { CurrentWeather } from '../types';
import { FrontsData, summarizeFronts } from '../utils/weatherFronts';
import { getSeasonContext } from '../utils/season';
import { requestAnglerAdvice, AdviceSource } from '../utils/geminiAdvice';

interface FrontOutlookNoteProps {
  fronts?: FrontsData;
  weather: CurrentWeather;
  isLoadingFronts: boolean;
  /** USACE sensor reading; 0 or undefined means no live reading is available. */
  waterTempF?: number;
}

const CACHE_KEY = 'anglers_front_outlook_v1';

interface CachedNote {
  key: string;
  text: string;
  source: AdviceSource;
}

const FRONT_PROMPT = `In 2 to 3 sentences, explain what the surface frontal analysis above means for fishing Fishtrap Lake in the next 24 hours.
Rules: use only the frontal analysis, forecast discussion, barometer, and wind facts supplied in the conditions block. Never invent a front, a distance, or an arrival time. If the frontal analysis says no boundary is nearby or is unavailable, say that plainly and describe the air-mass pattern instead. Plain prose, no headings, no bullet points.`;

/**
 * Composed locally when no AI backend or key is reachable, so the note states the same
 * verified facts instead of a fabricated or empty briefing.
 */
function localFrontNote(fronts: FrontsData | undefined, weather: CurrentWeather): string {
  const summary = summarizeFronts(fronts);
  const trend = weather.pressureTrend.replace('_', ' ');
  const observed = weather.isSimulated
    ? `Live weather is unavailable, so the barometer and wind shown are seasonal placeholders`
    : `Local barometer is ${weather.pressureInHg} inHg and ${trend}, with wind from the ${weather.windDirectionText} at ${weather.windSpeed} mph`;

  const nearest = fronts?.status === 'ok' ? fronts.nearest : undefined;

  if (nearest && nearest.distanceMi <= 150) {
    const passage = fronts?.passage
      ? ` The model series shows the wind shift and pressure minimum near ${fronts.passage.startLabel}–${fronts.passage.endLabel} (modelled, not an official arrival time).`
      : '';
    return `${summary}. ${observed}. With the boundary that close, fish reaction baits on windward structure while pressure is falling and slow down once it rises behind the front.${passage}`;
  }

  if (nearest) {
    return `${summary}. ${observed}. That boundary is too far away to drive today's bite, so play the air mass in place: fish the solunar windows and match the forage instead of waiting on a frontal push.`;
  }

  return `${summary}. ${observed}, so play the air mass: work solunar windows and match the forage rather than waiting on a weather-driven push.`;
}

function cacheKeyFor(fronts?: FrontsData, weather?: CurrentWeather): string {
  return [
    fronts?.status ?? 'unknown',
    fronts?.validTime ?? 'no-valid-time',
    fronts?.nearest?.label ?? 'no-front',
    fronts?.passage?.startLabel ?? 'no-passage',
    weather?.pressureTrend ?? 'steady',
  ].join('|');
}

export const FrontOutlookNote: React.FC<FrontOutlookNoteProps> = ({
  fronts,
  weather,
  isLoadingFronts,
  waterTempF,
}) => {
  const [note, setNote] = useState<CachedNote | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const key = cacheKeyFor(fronts, weather);
  const liveWaterTempF = waterTempF && waterTempF > 0 ? waterTempF : undefined;
  const seasonContext = getSeasonContext(new Date(), liveWaterTempF);

  const generate = useCallback(
    async (force: boolean) => {
      if (!force) {
        try {
          const raw = localStorage.getItem(CACHE_KEY);
          const cached = raw ? (JSON.parse(raw) as CachedNote) : null;
          if (cached?.key === key) {
            setNote(cached);
            return;
          }
        } catch {
          // Unreadable cache: regenerate below.
        }
      }

      setIsGenerating(true);
      try {
        const { advice, source } = await requestAnglerAdvice(FRONT_PROMPT, {
          location: 'Fishtrap Lake (Pikeville, KY, USA)',
          weather: weather.weatherDescription,
          airTemp: `${weather.temp}°F`,
          pressure: `${weather.pressureInHg} inHg / ${weather.pressureHpa} hPa`,
          pressureTrend: `${weather.pressureTrend} (6h change ${weather.pressureDelta6h} hPa)`,
          windSpeed: `${weather.windSpeed} mph`,
          windDirection: `${weather.windDirectionText} (${weather.windDirectionDeg}°)`,
          waterTemp: liveWaterTempF
            ? `${liveWaterTempF.toFixed(1)}°F (USACE Live Dam Sensor #FTPK2)`
            : undefined,
          frontalAnalysis: summarizeFronts(fronts),
          frontalDiscussion: fronts?.discussion,
          date: seasonContext.dateLabel,
          season: `${seasonContext.label} — ${seasonContext.phase}`,
          dataNotice: weather.isSimulated
            ? 'The live weather API was unreachable; the weather values above are seasonal placeholders, not observations.'
            : undefined,
        });

        // The bundled heuristic engine answers species questions, not front questions,
        // so a locally composed factual note is used whenever AI is unreachable.
        const resolved: CachedNote =
          source === 'heuristics'
            ? { key, text: localFrontNote(fronts, weather), source }
            : { key, text: advice, source };

        setNote(resolved);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(resolved));
        } catch {
          // Best-effort cache only.
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [
      fronts,
      weather,
      key,
      liveWaterTempF,
      seasonContext.dateLabel,
      seasonContext.label,
      seasonContext.phase,
    ],
  );

  useEffect(() => {
    if (isLoadingFronts) return;
    generate(false);
  }, [generate, isLoadingFronts]);

  const sourceLabel =
    note?.source === 'heuristics' ? 'Local engine · NWS/WPC data' : 'AI interpretation · NWS/WPC data';

  return (
    <div
      id="front-outlook-note"
      className="bg-slate-900/90 border border-sky-500/30 rounded-xl p-3 text-xs text-slate-200 leading-relaxed space-y-1.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold text-sky-300 flex items-center gap-1 text-[11px] uppercase tracking-wide">
          <Wind className="w-3 h-3 text-sky-400" />
          <span>Frontal Outlook:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-700">
            {sourceLabel}
          </span>
          <button
            id="btn-refresh-front-outlook"
            onClick={() => generate(true)}
            disabled={isGenerating}
            title="Regenerate the frontal outlook"
            className="p-1 text-slate-500 hover:text-sky-300 rounded-md transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoadingFronts || (isGenerating && !note) ? (
        <p className="text-slate-400 flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
          Reading the surface analysis and forecast discussion...
        </p>
      ) : note ? (
        <div className="text-slate-300 text-xs leading-relaxed [&_p]:mb-1.5 [&_p:last-child]:mb-0">
          <Markdown>{note.text}</Markdown>
        </div>
      ) : (
        <p className="text-slate-400 flex items-center gap-1.5">
          <CircleSlash className="w-3 h-3 text-slate-500" />
          Frontal outlook unavailable right now.
        </p>
      )}
    </div>
  );
};
