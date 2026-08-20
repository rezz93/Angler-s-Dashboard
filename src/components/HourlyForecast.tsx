import React, { useState } from 'react';
import {
  Sun,
  SunMedium,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudRainWind,
  CloudLightning,
  Wind,
  Droplets,
  Zap,
  Clock,
  Fish
} from 'lucide-react';
import { HourlyForecastItem, UnitSystem } from '../types';

interface HourlyForecastProps {
  hourly: HourlyForecastItem[];
  unitSystem: UnitSystem;
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({
  hourly,
  unitSystem,
}) => {
  const [selectedHourIdx, setSelectedHourIdx] = useState<number>(() => {
    const currentHour = new Date().getHours();
    return Math.min(currentHour, hourly.length - 1);
  });

  const selectedItem = hourly[selectedHourIdx] || hourly[0];

  const renderWeatherIcon = (iconName: string, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'Sun':
        return <Sun className={`${className} text-amber-400`} />;
      case 'SunMedium':
        return <SunMedium className={`${className} text-amber-300`} />;
      case 'CloudSun':
        return <CloudSun className={`${className} text-amber-200`} />;
      case 'CloudFog':
        return <CloudFog className={`${className} text-slate-400`} />;
      case 'CloudDrizzle':
        return <CloudDrizzle className={`${className} text-cyan-400`} />;
      case 'CloudRain':
      case 'CloudRainWind':
        return <CloudRain className={`${className} text-blue-400`} />;
      case 'CloudSnow':
        return <CloudSnow className={`${className} text-slate-200`} />;
      case 'CloudLightning':
        return <CloudLightning className={`${className} text-amber-500`} />;
      default:
        return <Cloud className={`${className} text-slate-300`} />;
    }
  };

  const getBiteBarColor = (score: number) => {
    if (score >= 85) return 'bg-gradient-to-t from-emerald-600 to-amber-400';
    if (score >= 70) return 'bg-gradient-to-t from-emerald-600 to-teal-400';
    if (score >= 50) return 'bg-gradient-to-t from-blue-600 to-cyan-400';
    return 'bg-gradient-to-t from-slate-700 to-slate-500';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">
            24-Hour Fishing Bite & Weather Forecast
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Epic / Major (80+)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> Good (70+)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Fair (50+)
          </span>
        </div>
      </div>

      {/* Interactive Horizontal Scrollable Timeline */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 pb-2">
        <div className="flex items-end gap-2 min-w-[750px] sm:min-w-full pt-4 px-1">
          {hourly.map((item, idx) => {
            const isSelected = idx === selectedHourIdx;
            const barHeightPct = Math.max(20, item.biteRating);

            return (
              <button
                key={`hour-${idx}`}
                onClick={() => setSelectedHourIdx(idx)}
                className={`flex-1 flex flex-col items-center p-2 rounded-2xl transition group relative ${
                  isSelected
                    ? 'bg-slate-800 border-2 border-emerald-400/80 shadow-md shadow-emerald-950/60 scale-[1.03]'
                    : 'bg-slate-800/40 border border-slate-700/40 hover:bg-slate-800/80'
                }`}
              >
                {/* Solunar Tag */}
                {item.isMajor && (
                  <span className="absolute -top-3 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 rounded-full shadow-sm">
                    MAJOR
                  </span>
                )}
                {item.isMinor && !item.isMajor && (
                  <span className="absolute -top-3 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-teal-600 text-white rounded-full">
                    MINOR
                  </span>
                )}

                {/* Hour Label */}
                <span className="text-xs font-semibold text-slate-300 mb-1">
                  {item.hourLabel}
                </span>

                {/* Weather Icon */}
                <div className="my-1">
                  {renderWeatherIcon(
                    item.weatherCode <= 1
                      ? 'Sun'
                      : item.weatherCode === 2
                      ? 'CloudSun'
                      : item.weatherCode >= 61
                      ? 'CloudRain'
                      : 'Cloud',
                    'w-4 h-4'
                  )}
                </div>

                {/* Temp */}
                <span className="text-xs font-bold text-slate-200 my-0.5">
                  {unitSystem === 'imperial'
                    ? `${item.temp}°`
                    : `${Math.round(((item.temp - 32) * 5) / 9)}°`}
                </span>

                {/* Bite Rating Bar */}
                <div className="w-full bg-slate-950/60 rounded-full h-20 flex items-end p-1 my-1">
                  <div
                    style={{ height: `${barHeightPct}%` }}
                    className={`w-full rounded-full transition-all duration-300 ${getBiteBarColor(
                      item.biteRating
                    )}`}
                  />
                </div>

                {/* Score */}
                <span className="text-[11px] font-bold text-slate-300">
                  {item.biteRating}
                </span>

                {/* Rain Probability */}
                {item.precipitationProb > 0 ? (
                  <span className="text-[10px] text-blue-400 font-medium flex items-center gap-0.5 mt-0.5">
                    <Droplets className="w-2.5 h-2.5" />
                    {item.precipitationProb}%
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                    {item.windSpeed} {unitSystem === 'imperial' ? 'mph' : 'kmh'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Hour Tactical Detail Strip */}
      {selectedItem && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl">
              <Fish className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100">
                  {selectedItem.hourLabel} Window
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    selectedItem.biteRating >= 80
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : selectedItem.biteRating >= 60
                      ? 'bg-teal-500/20 text-teal-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {selectedItem.biteCategory} Activity ({selectedItem.biteRating}/100)
                </span>
                {selectedItem.isMajor && (
                  <span className="bg-emerald-600 text-slate-950 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                    Solunar Major Peak
                  </span>
                )}
              </div>
              <p className="text-slate-400 mt-0.5">
                Conditions: {selectedItem.weatherDescription} • Wind {selectedItem.windSpeed}{' '}
                {unitSystem === 'imperial' ? 'mph' : 'km/h'} • Barometer {selectedItem.pressureHpa} hPa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-300 font-medium">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Air Temp</span>
              <strong className="text-slate-100 text-sm">
                {unitSystem === 'imperial'
                  ? `${selectedItem.temp}°F`
                  : `${Math.round(((selectedItem.temp - 32) * 5) / 9)}°C`}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Precip Risk</span>
              <strong className="text-slate-100 text-sm">{selectedItem.precipitationProb}%</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Wind</span>
              <strong className="text-slate-100 text-sm">
                {selectedItem.windSpeed} {unitSystem === 'imperial' ? 'mph' : 'km/h'}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
