import React from 'react';
import {
  Gauge,
  Wind,
  Moon,
  Droplets,
  TrendingDown,
  TrendingUp,
  Minus,
  Navigation,
  Sun,
  Sunset,
  Sunrise,
  Waves,
  Eye
} from 'lucide-react';
import { CurrentWeather, SolunarData, TideData, UnitSystem } from '../types';

interface EnvironmentalPanelProps {
  weather: CurrentWeather;
  solunar: SolunarData;
  tides: TideData;
  unitSystem: UnitSystem;
}

export const EnvironmentalPanel: React.FC<EnvironmentalPanelProps> = ({
  weather,
  solunar,
  tides,
  unitSystem,
}) => {
  const getWindTactics = (speed: number) => {
    if (speed < 4) {
      return {
        rating: 'Calm Glass',
        tip: 'Long casts with finesse plastics or topwater poppers. Fish are skittish in still water.',
      };
    } else if (speed <= 12) {
      return {
        rating: 'Ideal "Bite" Chop',
        tip: 'Perfect surface disturbance. Baitfish are pushed toward windward shorelines and points.',
      };
    } else if (speed <= 20) {
      return {
        rating: 'Heavy Drift',
        tip: 'Deploy drift sock or spot-lock. Throw heavy spinnerbaits and bladed jigs along windblown banks.',
      };
    } else {
      return {
        rating: 'Gale Warning',
        tip: 'Seek protected pockets, canals, and leeward coves for safety and manageable boat control.',
      };
    }
  };

  const windTactics = getWindTactics(weather.windSpeed);

  const getPressureAnalysis = (trend: string, delta: number) => {
    if (trend.includes('falling')) {
      return {
        title: 'Falling (Pre-Front Surge)',
        impact: 'Swim bladders expand; fish move up in the water column and feed with high aggression.',
        lures: 'Chatterbaits, Spinnerbaits, Lipless Cranks',
      };
    } else if (trend.includes('rising')) {
      return {
        title: 'Rising (Post-Front Lockjaw)',
        impact: 'High atmospheric pressure compacts air bladders. Fish glue themselves to bottom cover.',
        lures: 'Ned Rig, Dropshot, Tube Jigs, Live Bait',
      };
    } else {
      return {
        title: 'Steady & Consistent',
        impact: 'Normal feeding behavior. Match the hatch to ambient forage (shad, crawfish, bluegill).',
        lures: 'Texas Rig, Squarebills, Jigs',
      };
    }
  };

  const pressureAnalysis = getPressureAnalysis(weather.pressureTrend, weather.pressureDelta6h);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Barometer & Pressure */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Gauge className="w-4 h-4 text-emerald-400" />
              Barometer Trend
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              6h Δ: {weather.pressureDelta6h > 0 ? `+${weather.pressureDelta6h}` : weather.pressureDelta6h} hPa
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-100">
              {unitSystem === 'imperial' ? `${weather.pressureInHg} inHg` : `${weather.pressureHpa} hPa`}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              ({weather.pressureHpa} hPa)
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-emerald-400">
            {weather.pressureTrend.includes('falling') ? (
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            ) : weather.pressureTrend.includes('rising') ? (
              <TrendingUp className="w-4 h-4 text-amber-400" />
            ) : (
              <Minus className="w-4 h-4 text-blue-400" />
            )}
            <span>{pressureAnalysis.title}</span>
          </div>
        </div>

        <div className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800/80 text-[11px] space-y-1.5">
          <p className="text-slate-300 leading-snug">
            <strong className="text-slate-100">Impact: </strong>
            {pressureAnalysis.impact}
          </p>
          <p className="text-emerald-300 font-semibold">
            🎯 Best Choice: {pressureAnalysis.lures}
          </p>
        </div>
      </div>

      {/* 2. Wind & Drift Strategy */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Wind className="w-4 h-4 text-teal-400" />
              Wind & Drift
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">
              {windTactics.rating}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-slate-100">
                  {weather.windSpeed}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase">
                  {unitSystem === 'imperial' ? 'mph' : 'km/h'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gusts up to {weather.windGusts} {unitSystem === 'imperial' ? 'mph' : 'km/h'}
              </p>
            </div>

            {/* Compass Direction Arrow */}
            <div className="flex flex-col items-center">
              <div
                className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner"
                style={{ transform: `rotate(${weather.windDirectionDeg}deg)` }}
                title={`Wind from ${weather.windDirectionText} (${weather.windDirectionDeg}°)`}
              >
                <Navigation className="w-5 h-5 text-teal-400 fill-teal-400/40" />
              </div>
              <span className="text-[10px] font-bold text-slate-300 mt-1 uppercase">
                {weather.windDirectionText} ({weather.windDirectionDeg}°)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800/80 text-[11px] space-y-1">
          <p className="text-slate-300 leading-snug">
            <strong className="text-teal-300">Tactical Drift: </strong>
            {windTactics.tip}
          </p>
        </div>
      </div>

      {/* 3. Moon Phase & Illumination */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Moon className="w-4 h-4 text-indigo-400" />
              Moon Phase
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
              {solunar.moonIllumination}% Lit
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-lg font-extrabold text-slate-100">
                {solunar.moonPhaseName}
              </div>
              <p className="text-[11px] text-slate-400">
                Lunar Age: {solunar.moonAgeDays} days
              </p>
            </div>

            {/* Visual Moon Icon */}
            <div className="w-10 h-10 rounded-full bg-slate-950 border border-indigo-500/40 flex items-center justify-center text-indigo-300 text-lg font-bold shadow-md">
              🌕
            </div>
          </div>
        </div>

        <div className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800/80 text-[11px] space-y-1">
          <div className="flex justify-between text-slate-300">
            <span>Overhead Peak:</span>
            <strong className="text-slate-100">{solunar.moonTransitTime}</strong>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Underfoot Peak:</span>
            <strong className="text-slate-100">{solunar.moonUnderfootTime}</strong>
          </div>
          <div className="flex justify-between text-slate-400 pt-0.5">
            <span>Rise / Set:</span>
            <span>{solunar.moonRise} / {solunar.moonSet}</span>
          </div>
        </div>
      </div>

      {/* 4. Water Clarity, Temp & Sun Times */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Droplets className="w-4 h-4 text-cyan-400" />
              Water & Light
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                weather.estimatedWaterClarity === 'Crystal Clear'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : weather.estimatedWaterClarity === 'Slightly Stained'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {weather.estimatedWaterClarity}
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block uppercase">
                Est. Water Temp
              </span>
              <span className="text-2xl font-extrabold text-slate-100">
                {unitSystem === 'imperial'
                  ? `${weather.estimatedWaterTemp}°F`
                  : `${Math.round(((weather.estimatedWaterTemp - 32) * 5) / 9)}°C`}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 block uppercase">
                Air Temp / Feels
              </span>
              <span className="text-base font-bold text-slate-200">
                {unitSystem === 'imperial' ? `${weather.temp}° / ${weather.feelsLike}°` : `${Math.round(((weather.temp - 32) * 5) / 9)}° / ${Math.round(((weather.feelsLike - 32) * 5) / 9)}°`}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800/80 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1 text-amber-400">
              <Sunrise className="w-3.5 h-3.5" /> Dawn: {weather.sunrise}
            </span>
            <span className="flex items-center gap-1 text-orange-400">
              <Sunset className="w-3.5 h-3.5" /> Dusk: {weather.sunset}
            </span>
          </div>
          {tides.isCoastal && (
            <p className="text-cyan-300 pt-0.5 truncate text-[10px] font-semibold">
              🌊 {tides.currentStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
