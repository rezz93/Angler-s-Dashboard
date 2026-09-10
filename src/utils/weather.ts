import SunCalc from 'suncalc';
import {
  CurrentWeather,
  DayOutlook,
  HourlyForecastItem,
  LocationInfo,
  PressureTrend,
  SolunarData,
  TideData,
} from '../types';
import { FrontalSeries } from './weatherFronts';

interface OpenMeteoCurrent {
  temperature_2m?: number;
  relative_humidity_2m?: number;
  apparent_temperature?: number;
  precipitation?: number;
  weather_code?: number;
  surface_pressure?: number;
  pressure_msl?: number;
  wind_speed_10m?: number;
  wind_direction_10m?: number;
  wind_gusts_10m?: number;
  cloud_cover?: number;
}

interface OpenMeteoHourly {
  time?: string[];
  temperature_2m?: number[];
  apparent_temperature?: number[];
  relative_humidity_2m?: number[];
  cloud_cover?: number[];
  precipitation_probability?: number[];
  weather_code?: number[];
  surface_pressure?: number[];
  pressure_msl?: number[];
  wind_speed_10m?: number[];
  wind_gusts_10m?: number[];
  wind_direction_10m?: number[];
  uv_index?: number[];
}

interface OpenMeteoResponse {
  current?: OpenMeteoCurrent;
  hourly?: OpenMeteoHourly;
  daily?: { sunrise?: string[]; sunset?: string[] };
}

export const FISHTRAP_LAKE_LOCATION: LocationInfo = {
  name: 'Fishtrap Lake',
  region: 'Pikeville, KY, USA',
  lat: 37.4253,
  lon: -82.4182,
  timeZone: 'America/New_York',
};

export const POPULAR_FISHING_LOCATIONS: LocationInfo[] = [
  FISHTRAP_LAKE_LOCATION,
];

/** How far the date picker may roam, bounded by what Open-Meteo returns in one call. */
export const PAST_DAYS_AVAILABLE = 3;
export const FORECAST_DAYS_AVAILABLE = 7;

/** Hour of day (0-23) as it reads at the water, not on the device. */
export function localHour(date: Date, timeZone?: string): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hour12: false }).format(date),
  );
}

/** Calendar day key (YYYY-MM-DD) as it reads at the water, not on the device. */
export function localDateKey(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export async function fetchWeatherData(
  location: LocationInfo,
  solunar: SolunarData,
  targetDate: Date = new Date(),
): Promise<{
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  tides: TideData;
  frontalSeries?: FrontalSeries;
}> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover` +
      `&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,cloud_cover,precipitation_probability,weather_code,pressure_msl,wind_speed_10m,wind_gusts_10m,wind_direction_10m,uv_index` +
      `&daily=sunrise,sunset&timezone=auto&past_days=${PAST_DAYS_AVAILABLE}&forecast_days=${FORECAST_DAYS_AVAILABLE}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.statusText}`);
    const data = (await res.json()) as OpenMeteoResponse;

    return parseOpenMeteoData(data, solunar, location, targetDate);
  } catch (err) {
    console.warn('Using simulated fishing weather due to network limit:', err);
    return generateSimulatedWeatherData(location, solunar, targetDate);
  }
}

function parseOpenMeteoData(
  data: OpenMeteoResponse,
  solunar: SolunarData,
  location: LocationInfo,
  targetDate: Date,
) {
  const current: OpenMeteoCurrent = data.current || {};
  const hourly: OpenMeteoHourly = data.hourly || {};
  const daily = data.daily || {};
  const hourlyPressure = hourly.pressure_msl ?? hourly.surface_pressure;

  // Open-Meteo returns times already local to the lake, so the day is selected by
  // string prefix rather than by re-deriving an offset.
  const dayKey = localDateKey(targetDate, location.timeZone);
  const todayKey = localDateKey(new Date(), location.timeZone);
  const isToday = dayKey === todayKey;
  const dayIndices = (hourly.time ?? [])
    .map((t, i) => (t.startsWith(dayKey) ? i : -1))
    .filter((i) => i >= 0);
  const dayStart = dayIndices[0] ?? 0;

  // Today reads from the observation block; any other day reads that day's forecast,
  // sampled early afternoon so the headline reflects the fishable part of the day.
  const sampleIdx = isToday
    ? dayStart + localHour(new Date(), location.timeZone)
    : dayStart + Math.min(14, Math.max(0, dayIndices.length - 1));
  const sampleAt = <T,>(series: T[] | undefined): T | undefined => series?.[sampleIdx];

  const tempC = (isToday ? current.temperature_2m : sampleAt(hourly.temperature_2m)) ?? 20;
  const apparentC =
    (isToday ? current.apparent_temperature : sampleAt(hourly.apparent_temperature)) ?? tempC;
  const windKph = (isToday ? current.wind_speed_10m : sampleAt(hourly.wind_speed_10m)) ?? 0;
  const gustKph = (isToday ? current.wind_gusts_10m : sampleAt(hourly.wind_gusts_10m)) ?? windKph * 1.3;
  const tempF = Math.round((tempC * 9) / 5 + 32);
  const feelsLikeF = Math.round((apparentC * 9) / 5 + 32);
  const windMph = Math.round(windKph * 0.621371);
  const windGustsMph = Math.round(gustKph * 0.621371);
  const windDeg = (isToday ? current.wind_direction_10m : sampleAt(hourly.wind_direction_10m)) ?? 0;
  // Sea-level pressure, so the reading matches a barometer and the WPC surface
  // analysis; station pressure at this elevation reads ~40 hPa lower.
  const pressureHpa = Math.round(
    (isToday ? current.pressure_msl ?? current.surface_pressure : sampleAt(hourlyPressure)) ?? 1013,
  );
  const pressureInHg = +(pressureHpa * 0.02953).toFixed(2);

  // 6-hour pressure change leading up to the sampled hour
  let pressureDelta6h = 0;
  let pressureTrend: PressureTrend = 'steady';
  if (hourlyPressure && hourlyPressure.length > 6) {
    const endIdx = Math.min(sampleIdx, hourlyPressure.length - 1);
    const startIdx = Math.max(0, endIdx - 6);
    pressureDelta6h = +(hourlyPressure[endIdx] - hourlyPressure[startIdx]).toFixed(1);

    if (pressureDelta6h > 3) pressureTrend = 'rising_fast';
    else if (pressureDelta6h > 1) pressureTrend = 'rising';
    else if (pressureDelta6h < -3) pressureTrend = 'falling_fast';
    else if (pressureDelta6h < -1) pressureTrend = 'falling';
    else pressureTrend = 'steady';
  }

  const weatherCode = (isToday ? current.weather_code : sampleAt(hourly.weather_code)) ?? 0;
  const { description, icon } = getWeatherCodeDetails(weatherCode);

  const estimatedWaterTemp = estimateWaterTempF(tempF);
  const precipitation = isToday ? current.precipitation ?? 0 : 0;
  const precipitationProb = Math.round(sampleAt(hourly.precipitation_probability) ?? 10);

  // Water clarity approximation
  let estimatedWaterClarity: CurrentWeather['estimatedWaterClarity'] = 'Crystal Clear';
  if (windMph > 18 || precipitation > 2 || precipitationProb > 70) {
    estimatedWaterClarity = 'Muddy';
  } else if (windMph > 10 || precipitation > 0.2 || precipitationProb > 40) {
    estimatedWaterClarity = 'Murky';
  } else if (windMph > 6) {
    estimatedWaterClarity = 'Slightly Stained';
  }

  // Only the selected day's entry is usable; a miss must not silently fall back to
  // another day's sun times.
  const dailyIdx = (daily.sunrise ?? []).findIndex((t) => t.startsWith(dayKey));
  const dailySun =
    dailyIdx >= 0
      ? { sunrise: daily.sunrise?.[dailyIdx], sunset: daily.sunset?.[dailyIdx] }
      : { sunrise: undefined, sunset: undefined };
  const fallbackSun = SunCalc.getTimes(targetDate, location.lat, location.lon);
  const sunrise = dailySun.sunrise
    ? formatIsoTime(dailySun.sunrise)
    : formatIsoTime(fallbackSun.sunrise.toISOString(), location.timeZone);
  const sunset = dailySun.sunset
    ? formatIsoTime(dailySun.sunset)
    : formatIsoTime(fallbackSun.sunset.toISOString(), location.timeZone);

  const prevDayKey = localDateKey(
    new Date(new Date(`${dayKey}T12:00`).getTime() - 24 * 60 * 60 * 1000),
    location.timeZone,
  );
  const prevDayIndices = (hourly.time ?? [])
    .map((t, i) => (t.startsWith(prevDayKey) ? i : -1))
    .filter((i) => i >= 0);

  const outlook = buildDayOutlook({
    hourly,
    dayIndices,
    prevDayIndices,
    sampleIdx,
    isToday,
    rainNow: precipitation > 0 || (weatherCode >= 51 && weatherCode !== 71),
  });

  const currentWeather: CurrentWeather = {
    time: isToday
      ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : formatIsoTime(hourly.time?.[sampleIdx] ?? `${dayKey}T14:00`),
    temp: tempF,
    feelsLike: feelsLikeF,
    windSpeed: windMph,
    windGusts: windGustsMph,
    windDirectionDeg: windDeg,
    windDirectionText: getCompassDirection(windDeg),
    pressureHpa,
    pressureInHg,
    pressureTrend,
    pressureDelta6h,
    humidity: Math.round(
      (isToday ? current.relative_humidity_2m : sampleAt(hourly.relative_humidity_2m)) ?? 55,
    ),
    uvIndex: Math.round(sampleAt(hourly.uv_index) ?? 5),
    cloudCover: Math.round((isToday ? current.cloud_cover : sampleAt(hourly.cloud_cover)) ?? 25),
    precipitationProb,
    weatherCode,
    weatherDescription: description,
    weatherIconName: icon,
    sunrise,
    sunset,
    estimatedWaterTemp,
    estimatedWaterClarity,
    isForecast: !isToday,
    dateKey: dayKey,
    outlook,
  };

  // Build the selected day's 24 hours
  const hourlyItems: HourlyForecastItem[] = [];

  for (const i of dayIndices.length ? dayIndices : [...Array(24).keys()]) {
    const rawTime = hourly.time?.[i];
    const hourDate = rawTime ? new Date(rawTime) : new Date();
    const hourLabel = hourDate.toLocaleTimeString([], { hour: 'numeric' });
    const hTempF = Math.round(((hourly.temperature_2m?.[i] ?? 20) * 9) / 5 + 32);
    const hWind = Math.round((hourly.wind_speed_10m?.[i] || 10) * 0.621371);
    const hPressure = Math.round(hourlyPressure?.[i] || 1013);
    const hPrecip = Math.round(hourly.precipitation_probability?.[i] || 0);
    const hCode = hourly.weather_code?.[i] || 0;
    const { description: hDesc } = getWeatherCodeDetails(hCode);

    // Compute Bite rating based on Solunar major/minor, dawn/dusk, pressure trend
    const hr = hourDate.getHours();
    let biteRating = calculateHourlyBiteScore(hr, solunar, pressureTrend, hPrecip, hWind);

    let biteCategory: HourlyForecastItem['biteCategory'] = 'Fair';
    if (biteRating >= 85) biteCategory = 'Epic';
    else if (biteRating >= 70) biteCategory = 'Good';
    else if (biteRating >= 50) biteCategory = 'Fair';
    else biteCategory = 'Poor';

    const isMajor = isHourInPeriods(hr, solunar.majorPeriods);
    const isMinor = isHourInPeriods(hr, solunar.minorPeriods);

    hourlyItems.push({
      time: rawTime || `${i}:00`,
      hourLabel,
      temp: hTempF,
      windSpeed: hWind,
      pressureHpa: hPressure,
      precipitationProb: hPrecip,
      weatherCode: hCode,
      weatherDescription: hDesc,
      biteRating,
      biteCategory,
      isMajor,
      isMinor,
    });
  }

  // Tides (marine or coastal check)
  const isCoastal = isCoastalLocation(location);

  const tides: TideData = generateTideSchedule(isCoastal);

  const frontalSeries: FrontalSeries | undefined = hourly.time
    ? {
        times: hourly.time,
        pressureHpa: hourlyPressure || [],
        windDirectionDeg: hourly.wind_direction_10m || [],
        tempC: hourly.temperature_2m || [],
      }
    : undefined;

  return {
    current: currentWeather,
    hourly: hourlyItems,
    tides,
    frontalSeries,
  };
}

/**
 * One sentence describing where the day is heading, shared by the tactical
 * statement, the AI prompt and the frontal outlook so they cannot disagree.
 */
export function summarizeDayOutlook(weather: CurrentWeather, isToday: boolean): string {
  const o = weather.outlook;
  if (!o) return '';
  const parts: string[] = [];

  if (o.rainNow) {
    parts.push('rain is falling now');
  }
  if (o.precipWindow) {
    parts.push(
      `${o.precipWindow.startLabel === o.precipWindow.endLabel
        ? `rain chances peak near ${o.precipWindow.startLabel}`
        : `rain chances run ${o.precipWindow.startLabel}–${o.precipWindow.endLabel}`} at up to ${o.precipWindow.peakProb}%`,
    );
  } else if (o.maxPrecipProb >= 20) {
    parts.push(`rain chances stay capped near ${o.maxPrecipProb}%`);
  } else {
    parts.push('no meaningful rain chance in the hourly forecast');
  }

  if (o.tempVsPrevDayF != null && Math.abs(o.tempVsPrevDayF) >= 4) {
    parts.push(
      `${Math.abs(o.tempVsPrevDayF)}°F ${o.tempVsPrevDayF < 0 ? 'colder' : 'warmer'} than the previous day`,
    );
  }
  if (o.windShiftText) parts.push(`wind veering ${o.windShiftText}`);

  const lead = isToday ? 'Rest of today' : 'Through the day';
  return `${lead}: ${parts.join(', ')} (high ${o.highF}°F / low ${o.lowF}°F).`;
}

/**
 * Reads the rest of the selected day out of the hourly series so the briefing can
 * talk about what is coming (rain, a colder air mass, a wind shift) instead of
 * only the hour it sampled.
 */
function buildDayOutlook({
  hourly,
  dayIndices,
  prevDayIndices,
  sampleIdx,
  isToday,
  rainNow,
}: {
  hourly: OpenMeteoHourly;
  dayIndices: number[];
  prevDayIndices: number[];
  sampleIdx: number;
  isToday: boolean;
  rainNow: boolean;
}): DayOutlook | undefined {
  if (!dayIndices.length) return undefined;

  const tempsC = dayIndices.map((i) => hourly.temperature_2m?.[i]).filter((v): v is number => v != null);
  if (!tempsC.length) return undefined;
  const toF = (c: number) => Math.round((c * 9) / 5 + 32);

  const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
  const prevTempsC = prevDayIndices
    .map((i) => hourly.temperature_2m?.[i])
    .filter((v): v is number => v != null);
  const tempVsPrevDayF = prevTempsC.length
    ? Math.round(((mean(tempsC) - mean(prevTempsC)) * 9) / 5)
    : undefined;

  // Today's spent hours no longer matter for planning; another day is read whole.
  const aheadIndices = isToday ? dayIndices.filter((i) => i >= sampleIdx) : dayIndices;
  const remaining = aheadIndices.length ? aheadIndices : dayIndices;
  const probAt = (i: number) => Math.round(hourly.precipitation_probability?.[i] ?? 0);
  const maxPrecipProb = remaining.reduce((max, i) => Math.max(max, probAt(i)), 0);

  let precipWindow: DayOutlook['precipWindow'];
  const startPos = remaining.findIndex((i) => probAt(i) >= 40);
  if (startPos >= 0) {
    let endPos = startPos;
    while (endPos + 1 < remaining.length && probAt(remaining[endPos + 1]) >= 40) endPos += 1;
    const window = remaining.slice(startPos, endPos + 1);
    precipWindow = {
      startLabel: hourLabelAt(hourly, window[0]),
      endLabel: hourLabelAt(hourly, window[window.length - 1]),
      peakProb: window.reduce((max, i) => Math.max(max, probAt(i)), 0),
    };
  }

  const dirAt = (i: number) => hourly.wind_direction_10m?.[i];
  const fromDir = dirAt(remaining[0]);
  const toDir = dirAt(remaining[remaining.length - 1]);
  const windShiftText =
    fromDir != null && toDir != null && angleGap(fromDir, toDir) >= 45
      ? `${getCompassDirection(fromDir)} → ${getCompassDirection(toDir)}`
      : undefined;

  return {
    highF: toF(Math.max(...tempsC)),
    lowF: toF(Math.min(...tempsC)),
    rainNow,
    maxPrecipProb,
    precipWindow,
    tempVsPrevDayF,
    windShiftText,
  };
}

function hourLabelAt(hourly: OpenMeteoHourly, index: number): string {
  const raw = hourly.time?.[index];
  if (!raw) return '';
  return new Date(raw).toLocaleTimeString([], { hour: 'numeric' });
}

function angleGap(a: number, b: number): number {
  const diff = Math.abs(((a - b) % 360 + 360) % 360);
  return diff > 180 ? 360 - diff : diff;
}

function calculateHourlyBiteScore(
  hour: number,
  solunar: SolunarData,
  pressureTrend: PressureTrend,
  precipProb: number,
  windSpeed: number
): number {
  let score = 45;

  // 1. Dawn & Dusk golden hours (5AM-7AM & 6PM-8PM)
  if ((hour >= 5 && hour <= 7) || (hour >= 18 && hour <= 20)) {
    score += 25;
  }

  // 2. Solunar Major / Minor
  if (isHourInPeriods(hour, solunar.majorPeriods)) {
    score += 30;
  } else if (isHourInPeriods(hour, solunar.minorPeriods)) {
    score += 18;
  }

  // 3. Barometric pressure trend effect
  if (pressureTrend === 'falling' || pressureTrend === 'falling_fast') {
    score += 15; // Pre-front feeding spree!
  } else if (pressureTrend === 'steady') {
    score += 5;
  } else if (pressureTrend === 'rising_fast') {
    score -= 10; // Post-front lockjaw
  }

  // 4. Wind factor (mild breeze is great, calm is okay, gale is tough)
  if (windSpeed >= 5 && windSpeed <= 14) {
    score += 8; // Good surface disturbance
  } else if (windSpeed > 22) {
    score -= 12;
  }

  // 5. Rain/thunder risk
  if (precipProb > 70) {
    score -= 5;
  }

  return Math.min(99, Math.max(15, Math.round(score)));
}

function isHourInPeriods(hour: number, periods: { start: string; end: string }[]): boolean {
  for (const p of periods) {
    const startHour = parseHourString(p.start);
    const endHour = parseHourString(p.end);
    if (startHour <= endHour) {
      if (hour >= startHour && hour <= endHour) return true;
    } else {
      // wraps midnight
      if (hour >= startHour || hour <= endHour) return true;
    }
  }
  return false;
}

function parseHourString(timeStr: string): number {
  const parts = timeStr.split(' ');
  const time = parts[0].split(':');
  let h = parseInt(time[0], 10);
  const period = parts[1];
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h;
}

export function getCompassDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return directions[index];
}

function formatIsoTime(isoStr: string, timeZone?: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone });
  } catch {
    return '06:30 AM';
  }
}

export function getWeatherCodeDetails(code: number): { description: string; icon: string } {
  switch (code) {
    case 0:
      return { description: 'Clear Blue Skies', icon: 'Sun' };
    case 1:
      return { description: 'Mainly Clear', icon: 'SunMedium' };
    case 2:
      return { description: 'Partly Cloudy', icon: 'CloudSun' };
    case 3:
      return { description: 'Overcast Skies', icon: 'Cloud' };
    case 45:
    case 48:
      return { description: 'Foggy & Misty', icon: 'CloudFog' };
    case 51:
    case 53:
    case 55:
      return { description: 'Light Drizzle', icon: 'CloudDrizzle' };
    case 61:
    case 63:
    case 65:
      return { description: 'Steady Rain', icon: 'CloudRain' };
    case 71:
    case 73:
    case 75:
      return { description: 'Snow Flurries', icon: 'CloudSnow' };
    case 80:
    case 81:
    case 82:
      return { description: 'Passing Rain Showers', icon: 'CloudRainWind' };
    case 95:
    case 96:
    case 99:
      return { description: 'Thunderstorm Warning', icon: 'CloudLightning' };
    default:
      return { description: 'Fair Conditions', icon: 'CloudSun' };
  }
}

function isCoastalLocation(location: LocationInfo): boolean {
  const name = location.name.toLowerCase();
  return (
    name.includes('bay') ||
    name.includes('keys') ||
    name.includes('ocean') ||
    name.includes('coast') ||
    location.region.toLowerCase().includes('florida')
  );
}

function generateTideSchedule(isCoastal: boolean): TideData {
  if (!isCoastal) {
    return {
      isCoastal: false,
      events: [],
      currentStatus: 'Inland / Non-Tidal Freshwater Lake or River',
    };
  }

  // Generate 4 semi-diurnal tides
  const events = [
    { time: '04:15 AM', height: 4.8, type: 'High' as const },
    { time: '10:32 AM', height: 0.6, type: 'Low' as const },
    { time: '04:48 PM', height: 5.2, type: 'High' as const },
    { time: '11:10 PM', height: 0.3, type: 'Low' as const },
  ];

  return {
    isCoastal: true,
    events,
    currentStatus: 'Incoming Tide (+0.8 ft/hr) - Prime for Inshore Ambush Points',
  };
}

function generateSimulatedWeatherData(
  location: LocationInfo,
  solunar: SolunarData,
  targetDate: Date = new Date(),
): {
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  tides: TideData;
} {
  const now = new Date();
  const isToday = localDateKey(targetDate, location.timeZone) === localDateKey(now, location.timeZone);
  const sunTimes = SunCalc.getTimes(targetDate, location.lat, location.lon);
  const temp = seasonalNormalTempF(targetDate);

  const current: CurrentWeather = {
    time: isToday
      ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '02:00 PM',
    temp,
    feelsLike: temp + 2,
    windSpeed: 8,
    windGusts: 14,
    windDirectionDeg: 215,
    windDirectionText: 'SW',
    pressureHpa: 1016,
    pressureInHg: 30.0,
    pressureTrend: 'steady',
    pressureDelta6h: 0,
    humidity: 58,
    uvIndex: 5,
    cloudCover: 35,
    precipitationProb: 15,
    weatherCode: 2,
    weatherDescription: 'Partly Cloudy (modelled — live weather unavailable)',
    weatherIconName: 'CloudSun',
    // SunCalc returns absolute instants, so they are rendered in the lake's zone to match
    // the live Open-Meteo times (which already arrive local to the lake).
    sunrise: formatIsoTime(sunTimes.sunrise.toISOString(), location.timeZone),
    sunset: formatIsoTime(sunTimes.sunset.toISOString(), location.timeZone),
    estimatedWaterTemp: estimateWaterTempF(temp),
    estimatedWaterClarity: 'Slightly Stained',
    isSimulated: true,
    isForecast: !isToday,
    dateKey: localDateKey(targetDate, location.timeZone),
  };

  const hourly: HourlyForecastItem[] = [];
  for (let i = 0; i < 24; i++) {
    const hourLabel = `${i % 12 === 0 ? 12 : i % 12} ${i >= 12 ? 'PM' : 'AM'}`;
    const biteRating = calculateHourlyBiteScore(i, solunar, 'steady', 15, 8);
    let biteCategory: HourlyForecastItem['biteCategory'] = 'Fair';
    if (biteRating >= 85) biteCategory = 'Epic';
    else if (biteRating >= 70) biteCategory = 'Good';
    else if (biteRating >= 50) biteCategory = 'Fair';
    else biteCategory = 'Poor';

    hourly.push({
      time: `${i}:00`,
      hourLabel,
      temp: temp - 4 + Math.round(Math.sin((i / 24) * Math.PI * 2) * 8),
      windSpeed: 7 + (i % 5),
      pressureHpa: 1016,
      precipitationProb: 10 + (i % 20),
      weatherCode: 2,
      weatherDescription: 'Partly Cloudy',
      biteRating,
      biteCategory,
      isMajor: isHourInPeriods(i, solunar.majorPeriods),
      isMinor: isHourInPeriods(i, solunar.minorPeriods),
    });
  }

  return {
    current,
    hourly,
    tides: generateTideSchedule(isCoastalLocation(location)),
  };
}

/**
 * Reservoir surface temperature lags air temperature and stays far closer to the
 * annual mean, so the estimate is damped toward 50°F rather than tracking air 1:1.
 * Only a fallback — the USACE sensor reading is preferred wherever it is available.
 */
function estimateWaterTempF(airTempF: number): number {
  return Math.round(50 + (airTempF - 50) * 0.6);
}

/** Rough monthly normal high for the Pikeville, KY area, used only as a placeholder. */
function seasonalNormalTempF(date: Date): number {
  const normals = [43, 48, 57, 67, 75, 82, 85, 85, 79, 68, 56, 46];
  return normals[date.getMonth()];
}
