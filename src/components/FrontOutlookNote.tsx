import React, { useCallback, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { Wind, Loader2, RefreshCw, CircleSlash } from 'lucide-react';
import { CurrentWeather } from '../types';
import { FrontsData, summarizeFronts } from '../utils/weatherFronts';
import { getSeasonContext } from '../utils/season';
import { summarizeDayOutlook } from '../utils/weather';
import { requestAnglerAdvice, AdviceSource } from '../utils/geminiAdvice';

interface FrontOutlookNoteProps {
  fronts?: FrontsData;
  weather: CurrentWeather;
  isLoadingFronts: boolean;
  /** USACE sensor reading; 0 or undefined means no live reading is available. */
  waterTempF?: number;
  /** Day the outlook describes; the surface analysis only applies to today. */
  selectedDate?: Date;
}

const CACHE_KEY = 'anglers_front_outlook_v1';

interface CachedNote {
  key: string;
  text: string;
  source: AdviceSource;
}

const FRONT_PROMPT_TODAY = `In 2 to 3 sentences, explain what the surface frontal analysis above means for fishing Fishtrap Lake in the next 24 hours.
Rules: use only the frontal analysis, forecast trend, forecast discussion, barometer, and wind facts supplied in the conditions block. Never invent a front, a distance, or an arrival time. Fronts here track west to east, so a boundary described as departing has already passed — call that post-frontal air and never describe it as inbound. Your reading must match the forecast trend line: if it lists rain chances or a colder air mass, say so and do not call the day settled or bluebird. If the frontal analysis says no boundary is nearby or is unavailable, say that plainly and describe the air-mass pattern instead. Plain prose, no headings, no bullet points.`;

const FRONT_PROMPT_FORECAST = `In 2 to 3 sentences, explain what the forecast pressure and wind pattern above mean for fishing Fishtrap Lake on the forecast date in the conditions block.
Rules: no surface frontal analysis exists for a future date, so never state that a front is analysed, name a boundary distance, or give an arrival time. Work only from the forecast barometer, wind, sky and forecast-trend values supplied, keeping your reading consistent with the rain chances and temperature change in that trend, and say plainly that this is a forecast rather than an observed pattern. Plain prose, no headings, no bullet points.`;

/**
 * Composed locally when no AI backend or key is reachable, so the note states the same
 * verified facts instead of a fabricated or empty briefing.
 */
function localFrontNote(
  fronts: FrontsData | undefined,
  weather: CurrentWeather,
  isToday: boolean,
  dateLabel: string,
): string {
  const trend = weather.pressureTrend.replace('_', ' ');
  const dayTrend = summarizeDayOutlook(weather, isToday);

  if (!isToday) {
    const forecast = `Forecast for ${dateLabel} has the barometer near ${weather.pressureInHg} inHg and ${trend} (${weather.pressureDelta6h} hPa over 6 h), with wind from the ${weather.windDirectionText} at ${weather.windSpeed} mph under ${weather.weatherDescription.toLowerCase()}`;
    const tactic =
      weather.pressureTrend === 'falling' || weather.pressureTrend === 'falling_fast'
        ? 'a sagging barometer that far out usually means an approaching system, so plan on reaction baits along windward structure'
        : weather.pressureTrend === 'rising' || weather.pressureTrend === 'rising_fast'
          ? 'rising pressure points to a settled post-system air mass, so plan on finesse presentations and deeper structure'
          : 'a flat pressure profile points to a stable air mass, so plan around the solunar windows and forage rather than a weather push';
    return `${forecast}. ${dayTrend} No surface frontal analysis is issued for a future date, so nothing here is an analysed boundary — ${tactic}.`;
  }

  const summary = summarizeFronts(fronts);
  const observed = weather.isSimulated
    ? `Live weather is unavailable, so the barometer and wind shown are seasonal placeholders`
    : `Local barometer is ${weather.pressureInHg} inHg and ${trend}, with wind from the ${weather.windDirectionText} at ${weather.windSpeed} mph`;

  const nearest = fronts?.status === 'ok' ? fronts.nearest : undefined;
  const outlook = weather.outlook;
  const trendLine = dayTrend;
  const rainComing = (outlook?.precipWindow?.peakProb ?? outlook?.maxPrecipProb ?? 0) >= 40;
  const wet = rainComing || outlook?.rainNow === true;

  // Rain on the way outranks the boundary geometry: an unsettled sky is not a
  // post-frontal bluebird day, whichever side of the lake the front sits on.
  if (wet) {
    return `${summary}. ${observed}. ${trendLine} Unsettled, falling-light conditions like that usually pull fish shallower and widen the window, so work reaction baits on windward points and creek mouths ahead of the heaviest rain, then slide to slower presentations on cover once it moves through.`;
  }

  if (nearest?.motion === 'departing') {
    return `${summary}. ${observed}. ${trendLine} The boundary is already east of the lake, so this is post-frontal air: expect a tight bite, slow finesse presentations on cover, and lean on the solunar windows rather than a weather push.`;
  }

  if (nearest && nearest.distanceMi <= 150) {
    const passage = fronts?.passage
      ? ` The model series shows the wind shift and pressure minimum near ${fronts.passage.startLabel}–${fronts.passage.endLabel} (modelled, not an official arrival time).`
      : '';
    return `${summary}. ${observed}. ${trendLine} With the boundary that close, fish reaction baits on windward structure while pressure is falling and slow down once it rises behind the front.${passage}`;
  }

  if (nearest) {
    return `${summary}. ${observed}. ${trendLine} That boundary is still too far out to drive today's bite, so play the air mass in place: fish the solunar windows and match the forage instead of waiting on a frontal push.`;
  }

  return `${summary}. ${observed}. ${trendLine} Play the air mass: work solunar windows and match the forage rather than waiting on a weather-driven push.`;
}

function cacheKeyFor(fronts?: FrontsData, weather?: CurrentWeather, waterTempF?: number): string {
  return [
    fronts?.status ?? 'unknown',
    fronts?.validTime ?? 'no-valid-time',
    fronts?.nearest?.label ?? 'no-front',
    fronts?.passage?.startLabel ?? 'no-passage',
    weather?.pressureTrend ?? 'steady',
    // A changed rain/temperature track is a different briefing, even under the same front.
    weather?.outlook?.precipWindow?.startLabel ?? 'no-rain-window',
    weather?.outlook?.maxPrecipProb ?? 'no-precip',
    weather?.outlook?.tempVsPrevDayF ?? 'no-temp-delta',
    // A different day (or a new water reading) is a different briefing entirely.
    weather?.dateKey ?? 'today',
    waterTempF ? waterTempF.toFixed(0) : 'no-water-temp',
  ].join('|');
}

export const FrontOutlookNote: React.FC<FrontOutlookNoteProps> = ({
  fronts,
  weather,
  isLoadingFronts,
  waterTempF,
  selectedDate = new Date(),
}) => {
  const [note, setNote] = useState<CachedNote | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const isToday = new Date().toDateString() === selectedDate.toDateString();
  const liveWaterTempF = waterTempF && waterTempF > 0 ? waterTempF : undefined;
  const key = cacheKeyFor(fronts, weather, liveWaterTempF);
  const seasonContext = getSeasonContext(selectedDate, liveWaterTempF);

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
        const { advice, source } = await requestAnglerAdvice(
          isToday ? FRONT_PROMPT_TODAY : FRONT_PROMPT_FORECAST,
          {
            location: 'Fishtrap Lake (Pikeville, KY, USA)',
            weather: weather.weatherDescription,
            forecastTrend: summarizeDayOutlook(weather, isToday) || undefined,
            airTemp: `${weather.temp}°F`,
            pressure: `${weather.pressureInHg} inHg / ${weather.pressureHpa} hPa`,
            pressureTrend: `${weather.pressureTrend} (6h change ${weather.pressureDelta6h} hPa)`,
            windSpeed: `${weather.windSpeed} mph`,
            windDirection: `${weather.windDirectionText} (${weather.windDirectionDeg}°)`,
            waterTemp: liveWaterTempF
              ? `${liveWaterTempF.toFixed(1)}°F (USACE Live Dam Sensor #FTPK2)`
              : undefined,
            frontalAnalysis: isToday
              ? summarizeFronts(fronts)
              : 'No surface frontal analysis exists for a future date; the WPC bulletin only covers the current day.',
            frontalDiscussion: isToday ? fronts?.discussion : undefined,
            date: seasonContext.dateLabel,
            season: `${seasonContext.label} — ${seasonContext.phase}`,
            dataNotice: weather.isSimulated
              ? 'The live weather API was unreachable; the weather values above are seasonal placeholders, not observations.'
              : !isToday
                ? `Every value above is a forecast for ${seasonContext.dateLabel}, not a current observation.`
                : undefined,
          },
        );

        // The bundled heuristic engine answers species questions, not front questions,
        // so a locally composed factual note is used whenever AI is unreachable.
        const resolved: CachedNote =
          source === 'heuristics'
            ? { key, text: localFrontNote(fronts, weather, isToday, seasonContext.dateLabel), source }
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
      isToday,
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

  const dataLabel = isToday ? 'NWS/WPC data' : 'forecast data';
  const sourceLabel =
    note?.source === 'heuristics'
      ? `Local engine · ${dataLabel}`
      : `AI interpretation · ${dataLabel}`;

  return (
    <div
      id="front-outlook-note"
      className="bg-slate-900/90 border border-sky-500/30 rounded-xl p-3 text-xs text-slate-200 leading-relaxed space-y-1.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold text-sky-300 flex items-center gap-1 text-[11px] uppercase tracking-wide">
          <Wind className="w-3 h-3 text-sky-400" />
          <span>{isToday ? 'Frontal Outlook:' : `Outlook — ${seasonContext.dateLabel}:`}</span>
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
