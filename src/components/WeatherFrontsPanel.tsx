import React, { useState } from 'react';
import {
  Wind,
  Map,
  ChevronDown,
  ExternalLink,
  Loader2,
  AlertCircle,
  Clock,
  Navigation,
  Gauge,
  RefreshCw,
} from 'lucide-react';
import { CurrentWeather } from '../types';
import { FrontsData, FRONT_MAP_IMAGE, FRONT_MAP_PAGE } from '../utils/weatherFronts';

interface WeatherFrontsPanelProps {
  fronts?: FrontsData;
  isLoading: boolean;
  weather: CurrentWeather;
  onRefresh: () => void;
}

/** Fishtrap Lake's approximate position inside the WPC national forecast image. */
const LAKE_ORIGIN = '70.7% 47.7%';
const MAP_ASPECT = 887 / 640;

function relativeAge(iso?: string): string {
  if (!iso) return 'unknown';
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? '1 hr ago' : `${hours} hr ago`;
}

function frontTactics(weather: CurrentWeather, fronts?: FrontsData): string {
  const trend = weather.pressureTrend;
  if (fronts?.status === 'ok' && trend.includes('falling')) {
    return 'Pre-frontal falling barometer: fish feed hard and shallow. Cover water with chatterbaits, spinnerbaits, and lipless cranks on windward points until the boundary arrives.';
  }
  if (trend.includes('rising')) {
    return 'Post-frontal rising barometer behind the boundary: expect tight-lipped fish glued to cover. Slow down with Ned rigs, drop shots, and jigs worked on deep structure.';
  }
  if (fronts?.status === 'ok') {
    return 'A boundary is in the area but pressure is steady here. Fish normal patterns and watch the barometer: the bite window opens as pressure starts to drop.';
  }
  return 'No frontal push in range. Air mass fishing conditions: match the hatch and lean on solunar windows rather than weather-driven feeding.';
}

export const WeatherFrontsPanel: React.FC<WeatherFrontsPanelProps> = ({
  fronts,
  isLoading,
  weather,
  onRefresh,
}) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const hasFront = fronts?.status === 'ok' && !!fronts.nearest;
  // WPC reissues the graphic through the day, so tie the URL to this fetch.
  const mapSrc = `${FRONT_MAP_IMAGE}?t=${encodeURIComponent(fronts?.fetchedAt ?? 'live')}`;

  return (
    <div
      id="weather-fronts-panel"
      className="bg-slate-900/95 border-2 border-sky-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-100">
              Frontal Boundaries & Air Mass
            </h3>
            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-1.5">
              <span>NWS/WPC surface analysis</span>
              {fronts?.validTime && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-sky-400" />
                    Valid {new Date(fronts.validTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ({relativeAge(fronts.validTime)})
                  </span>
                </>
              )}
              {fronts?.isStale && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Stale / cached
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-fronts"
            onClick={onRefresh}
            disabled={isLoading}
            title="Reload the latest surface analysis"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-300 rounded-xl border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="btn-toggle-front-map"
            onClick={() => setIsMapOpen((prev) => !prev)}
            aria-expanded={isMapOpen}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg"
          >
            <Map className="w-3.5 h-3.5" />
            <span>{isMapOpen ? 'Hide Front Map' : 'Show Front Map'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition ${isMapOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status / stats */}
      {isLoading && !fronts ? (
        <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
          <span>Reading the latest WPC coded surface bulletin...</span>
        </div>
      ) : fronts?.status === 'error' ? (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3.5 flex items-start gap-2.5 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Frontal analysis unavailable right now ({fronts.error}). The map below still loads
            straight from the Weather Prediction Center.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-950/80 border border-sky-500/30 rounded-2xl p-3.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Nearest Boundary
            </div>
            <div className="text-base font-black text-sky-300 mt-1">
              {hasFront ? fronts!.nearest!.label : 'None within 400 mi'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {hasFront
                ? `${fronts!.frontsNearbyCount} analyzed front${fronts!.frontsNearbyCount === 1 ? '' : 's'} in range`
                : 'Air mass conditions overhead'}
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Navigation className="w-3 h-3 text-teal-400" />
              Distance & Bearing
            </div>
            <div className="text-base font-black text-slate-100 mt-1">
              {hasFront ? `${fronts!.nearest!.distanceMi} mi ${fronts!.nearest!.bearingText}` : '—'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {hasFront ? 'From Fishtrap Lake (±1° analysis grid)' : 'No boundary to measure'}
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              Modelled Wind Shift
            </div>
            <div className="text-base font-black text-amber-300 mt-1">
              {fronts?.passage ? `${fronts.passage.startLabel} – ${fronts.passage.endLabel}` : 'No shift flagged'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {fronts?.passage
                ? `${fronts.passage.windShiftDeg}° wind shift, ${fronts.passage.tempChangeF > 0 ? '+' : ''}${fronts.passage.tempChangeF}°F`
                : 'Next 24 h hourly model is flat'}
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Gauge className="w-3 h-3 text-emerald-400" />
              Pressure Center
            </div>
            <div className="text-base font-black text-emerald-300 mt-1">
              {fronts?.pressureCenter
                ? `${fronts.pressureCenter.kind} ${fronts.pressureCenter.pressureHpa} hPa`
                : '—'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {fronts?.pressureCenter
                ? `${fronts.pressureCenter.distanceMi} mi ${fronts.pressureCenter.bearingText} • local ${weather.pressureInHg} inHg`
                : `Local barometer ${weather.pressureInHg} inHg`}
            </p>
          </div>
        </div>
      )}

      {/* Tactical read */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 text-[11px] sm:text-xs text-slate-300 leading-snug">
        <strong className="text-sky-300">Front Tactics: </strong>
        {frontTactics(weather, fronts)}
      </div>

      {/* Collapsible small front map */}
      {isMapOpen && (
        <div className="space-y-2">
          <div className="relative w-full h-[220px] sm:h-[300px] bg-white rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
            {/* Sized to the image's own aspect ratio so the whole map is visible and the
                zoom origin lines up with Fishtrap Lake. */}
            <div
              className="relative h-full overflow-hidden"
              style={{ aspectRatio: `${MAP_ASPECT}`, maxWidth: '100%' }}
            >
              <img
                src={mapSrc}
                alt="WPC Day 1 national forecast showing frontal boundaries and precipitation"
                loading="lazy"
                className="w-full h-full transition-transform duration-300"
                style={{
                  transform: isZoomed ? 'scale(2.6)' : 'scale(1)',
                  transformOrigin: LAKE_ORIGIN,
                }}
              />

              <div
                className="absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full border-2 border-rose-600 bg-rose-500/50 pointer-events-none"
                style={{ left: '70.7%', top: '47.7%' }}
                title="Fishtrap Lake"
              />
            </div>

            <div className="absolute top-2 left-2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/80 text-[10px] font-bold text-slate-200 shadow-lg pointer-events-none">
              WPC Day 1 Forecast • Fronts & Precipitation
            </div>

            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
              <button
                id="btn-front-map-zoom"
                onClick={() => setIsZoomed((prev) => !prev)}
                className="px-2.5 py-1 bg-slate-950/85 hover:bg-slate-900 text-[10px] font-bold text-slate-200 rounded-lg border border-slate-700 transition"
              >
                {isZoomed ? 'Full U.S. view' : 'Zoom Fishtrap'}
              </button>
              <a
                href={FRONT_MAP_PAGE}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-slate-950/85 hover:bg-slate-900 text-[10px] font-bold text-sky-300 rounded-lg border border-slate-700 transition flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Full size
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 bg-blue-600 inline-block" /> Cold front
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 bg-red-600 inline-block" /> Warm front
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 bg-purple-600 inline-block" /> Occluded / stationary
            </span>
            <span className="text-slate-500">
              WPC Day 1 national forecast, reissued through the day. Zoom centers on Fishtrap Lake.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
