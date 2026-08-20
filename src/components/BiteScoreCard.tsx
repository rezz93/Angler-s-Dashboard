import React from 'react';
import {
  Flame,
  Clock,
  Gauge,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Zap,
  Moon,
  Info
} from 'lucide-react';
import { CurrentWeather, SolunarData, UnitSystem } from '../types';

interface BiteScoreCardProps {
  solunar: SolunarData;
  weather: CurrentWeather;
  unitSystem: UnitSystem;
}

export const BiteScoreCard: React.FC<BiteScoreCardProps> = ({
  solunar,
  weather,
  unitSystem,
}) => {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Epic':
        return 'from-amber-400 to-emerald-400 text-emerald-300 border-emerald-500/40 bg-emerald-950/40';
      case 'Good':
        return 'from-emerald-400 to-teal-400 text-emerald-300 border-emerald-500/30 bg-emerald-950/30';
      case 'Fair':
        return 'from-blue-400 to-cyan-400 text-blue-300 border-blue-500/30 bg-blue-950/30';
      default:
        return 'from-slate-400 to-slate-500 text-slate-300 border-slate-700 bg-slate-800/40';
    }
  };

  const getPressureTrendBadge = (trend: string) => {
    switch (trend) {
      case 'falling':
      case 'falling_fast':
        return {
          label: 'Falling Barometer (High Activity)',
          icon: <TrendingDown className="w-4 h-4 text-emerald-400" />,
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          desc: 'Fish are aggressively feeding before the low-pressure front arrives.',
        };
      case 'rising':
      case 'rising_fast':
        return {
          label: 'Rising Barometer (Finesse Mode)',
          icon: <TrendingUp className="w-4 h-4 text-amber-400" />,
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          desc: 'High pressure post-front. Downsize lures and slow your retrieve.',
        };
      default:
        return {
          label: 'Steady Barometer (Normal Bite)',
          icon: <Minus className="w-4 h-4 text-blue-400" />,
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          desc: 'Stable conditions. Fish standard seasonal patterns.',
        };
    }
  };

  const trendBadge = getPressureTrendBadge(weather.pressureTrend);
  const pressureValue = unitSystem === 'imperial' ? `${weather.pressureInHg} inHg` : `${weather.pressureHpa} hPa`;

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Solunar Overall Score Dial */}
        <div className="lg:col-span-4 flex flex-col items-center text-center sm:border-r sm:border-slate-800/80 sm:pr-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
            <Flame className="w-4 h-4" />
            <span>Daily Solunar Bite Index</span>
          </div>

          <div className="relative flex items-center justify-center my-2">
            {/* SVG Circular Ring Gauge */}
            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={314.159}
                strokeDashoffset={314.159 * (1 - solunar.ratingScore / 100)}
                strokeLinecap="round"
                fill="transparent"
                className={`transition-all duration-1000 ${
                  solunar.ratingScore >= 80
                    ? 'text-emerald-400'
                    : solunar.ratingScore >= 60
                    ? 'text-teal-400'
                    : 'text-blue-400'
                }`}
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold tracking-tighter text-slate-100">
                {solunar.ratingScore}
              </span>
              <span className="text-[11px] font-semibold uppercase text-slate-400">/ 100</span>
            </div>
          </div>

          <div className="mt-1">
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full border ${getQualityColor(
                solunar.overallQuality
              )}`}
            >
              {solunar.overallQuality.toUpperCase()} FISHING DAY
            </span>
            <p className="text-xs text-slate-400 mt-2 max-w-xs">
              Moon: <strong className="text-slate-200">{solunar.moonPhaseName}</strong> ({solunar.moonIllumination}% illumination)
            </p>
          </div>
        </div>

        {/* Feeding Times Breakdown */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                Prime Solunar Feeding Windows
              </h3>
            </div>

            {/* Pressure Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${trendBadge.color}`}
            >
              {trendBadge.icon}
              <span>{trendBadge.label}</span>
              <span className="text-slate-300">({pressureValue})</span>
            </div>
          </div>

          {/* Windows Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Major Period 1 */}
            {solunar.majorPeriods.map((period, idx) => (
              <div
                key={`major-${idx}`}
                className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-3.5 hover:border-emerald-500/60 transition shadow-sm"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                    Major Window #{idx + 1}
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                    2 Hours
                  </span>
                </div>
                <div className="text-base font-extrabold text-slate-100">
                  {period.start} - {period.end}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                  <span>Peak: <strong className="text-slate-200">{period.peak}</strong></span>
                  <span className="text-emerald-300 font-semibold">{period.rating}% Activity</span>
                </div>
              </div>
            ))}

            {/* Minor Periods */}
            {solunar.minorPeriods.map((period, idx) => (
              <div
                key={`minor-${idx}`}
                className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-3.5 hover:border-slate-600 transition shadow-sm"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    Minor Window #{idx + 1}
                  </span>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded-md">
                    1.5 Hours
                  </span>
                </div>
                <div className="text-base font-bold text-slate-200">
                  {period.start} - {period.end}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                  <span>Peak: <strong className="text-slate-300">{period.peak}</strong></span>
                  <span className="text-teal-300 font-semibold">{period.rating}% Activity</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tactical Advice Banner */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-amber-300 font-semibold">Tactical Recommendation: </strong>
              {trendBadge.desc} Plan your heaviest cast volume around the Major window at{' '}
              <strong className="text-slate-100">{solunar.majorPeriods[0]?.peak || 'midday'}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
