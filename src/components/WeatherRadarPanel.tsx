import React, { useState } from 'react';
import {
  CloudLightning,
  Radio,
  Layers,
  Maximize2,
  ExternalLink,
  MapPin,
  RefreshCw,
  Compass,
  Eye,
  Info
} from 'lucide-react';
import { LocationInfo } from '../types';

interface WeatherRadarPanelProps {
  location: LocationInfo;
}

export const WeatherRadarPanel: React.FC<WeatherRadarPanelProps> = ({ location }) => {
  const [radarType, setRadarType] = useState<'rainviewer' | 'windy' | 'nws'>('rainviewer');
  const [isLiveRefreshing, setIsLiveRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsLiveRefreshing(true);
    setTimeout(() => {
      setIsLiveRefreshing(false);
    }, 600);
  };

  // RainViewer interactive map URL centered on current coordinates
  const rainviewerUrl = `https://www.rainviewer.com/map.html?loc=${location.lat},${location.lon},9&oCS=1&c=1&o=83&oC=0&s=0&sn=1&ts=1`;

  // Windy live doppler radar & wind stream
  const windyUrl = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=9&overlay=radar&product=radar&level=surface&lat=${location.lat}&lon=${location.lon}`;

  return (
    <div
      id="weather-radar-panel"
      className="bg-slate-900/95 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4"
    >
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <CloudLightning className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-100 flex items-center gap-2">
              Live Weather Radar & Precipitation Track
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {location.name}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              High-resolution Doppler radar loop centered at {location.lat.toFixed(2)}°N, {location.lon.toFixed(2)}°W
            </p>
          </div>
        </div>

        {/* Radar Source Switcher & External Link */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setRadarType('rainviewer')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                radarType === 'rainviewer'
                  ? 'bg-emerald-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              RainViewer Doppler
            </button>
            <button
              onClick={() => setRadarType('windy')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                radarType === 'windy'
                  ? 'bg-emerald-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Windy HD Radar
            </button>
          </div>

          <a
            href={radarType === 'rainviewer' ? rainviewerUrl : windyUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Radar Fullscreen in New Window"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 rounded-xl border border-slate-700 transition"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Embedded Interactive Radar Map */}
      <div className="relative w-full h-[400px] sm:h-[460px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
        <iframe
          key={`${radarType}-${location.lat}-${location.lon}`}
          title="Live Weather Doppler Radar"
          src={radarType === 'rainviewer' ? rainviewerUrl : windyUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allow="geolocation"
        />

        {/* Overlay Badge */}
        <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] font-bold text-slate-200 shadow-lg flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Doppler Loop • {location.name}</span>
        </div>
      </div>

      {/* Radar Legend / Quick Tips */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300">Radar Legend:</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Light Rain
            <span className="w-3 h-3 rounded bg-yellow-400 inline-block ml-1.5" /> Moderate
            <span className="w-3 h-3 rounded bg-orange-500 inline-block ml-1.5" /> Heavy
            <span className="w-3 h-3 rounded bg-red-600 inline-block ml-1.5" /> Storm Cell
          </div>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          Track impending fronts for barometric pressure feeding spikes.
        </div>
      </div>
    </div>
  );
};
