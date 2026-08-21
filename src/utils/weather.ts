import { CurrentWeather, HourlyForecastItem, LocationInfo, PressureTrend, SolunarData, TideData } from '../types';

export const FISHTRAP_LAKE_LOCATION: LocationInfo = {
  name: 'Fishtrap Lake',
  region: 'Pikeville, KY, USA',
  lat: 37.4253,
  lon: -82.4182,
};

export const POPULAR_FISHING_LOCATIONS: LocationInfo[] = [
  FISHTRAP_LAKE_LOCATION,
];

export async function fetchWeatherData(
  location: LocationInfo,
  solunar: SolunarData
): Promise<{
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  tides: TideData;
}> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover&hourly=temperature_2m,precipitation_probability,weather_code,surface_pressure,wind_speed_10m,uv_index&daily=sunrise,sunset&timezone=auto&forecast_days=2`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.statusText}`);
    const data = await res.json();

    return parseOpenMeteoData(data, solunar, location);
  } catch (err) {
    console.warn('Using simulated fishing weather due to network limit:', err);
    return generateSimulatedWeatherData(location, solunar);
  }
}

function parseOpenMeteoData(data: any, solunar: SolunarData, location: LocationInfo) {
  const current = data.current || {};
  const hourly = data.hourly || {};
  const daily = data.daily || {};

  const tempF = Math.round((current.temperature_2m * 9) / 5 + 32);
  const feelsLikeF = Math.round((current.apparent_temperature * 9) / 5 + 32);
  const windMph = Math.round(current.wind_speed_10m * 0.621371);
  const windGustsMph = Math.round((current.wind_gusts_10m || current.wind_speed_10m * 1.3) * 0.621371);
  const windDeg = current.wind_direction_10m || 0;
  const pressureHpa = Math.round(current.surface_pressure || 1013);
  const pressureInHg = +(pressureHpa * 0.02953).toFixed(2);

  // Calculate 6-hour pressure change
  let pressureDelta6h = 0;
  let pressureTrend: PressureTrend = 'steady';
  if (hourly.surface_pressure && hourly.surface_pressure.length >= 12) {
    const currentIdx = Math.min(new Date().getHours(), hourly.surface_pressure.length - 1);
    const pastIdx = Math.max(0, currentIdx - 6);
    pressureDelta6h = +(hourly.surface_pressure[currentIdx] - hourly.surface_pressure[pastIdx]).toFixed(1);

    if (pressureDelta6h > 3) pressureTrend = 'rising_fast';
    else if (pressureDelta6h > 1) pressureTrend = 'rising';
    else if (pressureDelta6h < -3) pressureTrend = 'falling_fast';
    else if (pressureDelta6h < -1) pressureTrend = 'falling';
    else pressureTrend = 'steady';
  }

  const weatherCode = current.weather_code || 0;
  const { description, icon } = getWeatherCodeDetails(weatherCode);

  // Water temp approximation (usually slightly buffered compared to air temp)
  const estimatedWaterTemp = Math.round(tempF * 0.85 + 8);

  // Water clarity approximation
  let estimatedWaterClarity: CurrentWeather['estimatedWaterClarity'] = 'Crystal Clear';
  if (windMph > 18 || (current.precipitation && current.precipitation > 2)) {
    estimatedWaterClarity = 'Muddy';
  } else if (windMph > 10 || (current.precipitation && current.precipitation > 0.2)) {
    estimatedWaterClarity = 'Murky';
  } else if (windMph > 6) {
    estimatedWaterClarity = 'Slightly Stained';
  }

  const sunrise = daily.sunrise?.[0] ? formatIsoTime(daily.sunrise[0]) : '06:18 AM';
  const sunset = daily.sunset?.[0] ? formatIsoTime(daily.sunset[0]) : '07:54 PM';

  const currentWeather: CurrentWeather = {
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
    humidity: Math.round(current.relative_humidity_2m || 55),
    uvIndex: Math.round(hourly.uv_index?.[new Date().getHours()] || 5),
    cloudCover: Math.round(current.cloud_cover || 25),
    precipitationProb: Math.round(hourly.precipitation_probability?.[new Date().getHours()] || 10),
    weatherCode,
    weatherDescription: description,
    weatherIconName: icon,
    sunrise,
    sunset,
    estimatedWaterTemp,
    estimatedWaterClarity,
  };

  // Build 24-hour forecast
  const hourlyItems: HourlyForecastItem[] = [];
  const totalHours = Math.min(24, hourly.time?.length || 24);

  for (let i = 0; i < totalHours; i++) {
    const rawTime = hourly.time?.[i];
    const hourDate = rawTime ? new Date(rawTime) : new Date();
    const hourLabel = hourDate.toLocaleTimeString([], { hour: 'numeric' });
    const hTempF = Math.round(((hourly.temperature_2m?.[i] || 20) * 9) / 5 + 32);
    const hWind = Math.round((hourly.wind_speed_10m?.[i] || 10) * 0.621371);
    const hPressure = Math.round(hourly.surface_pressure?.[i] || 1013);
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
  const isCoastal = location.name.toLowerCase().includes('bay') ||
    location.name.toLowerCase().includes('keys') ||
    location.name.toLowerCase().includes('ocean') ||
    location.name.toLowerCase().includes('coast') ||
    location.region.toLowerCase().includes('florida');

  const tides: TideData = generateTideSchedule(isCoastal, new Date());

  return {
    current: currentWeather,
    hourly: hourlyItems,
    tides,
  };
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

function formatIsoTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

function generateTideSchedule(isCoastal: boolean, date: Date): TideData {
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
  solunar: SolunarData
): {
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  tides: TideData;
} {
  const current: CurrentWeather = {
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temp: 72,
    feelsLike: 74,
    windSpeed: 8,
    windGusts: 14,
    windDirectionDeg: 215,
    windDirectionText: 'SW',
    pressureHpa: 1014,
    pressureInHg: 29.94,
    pressureTrend: 'falling',
    pressureDelta6h: -1.8,
    humidity: 58,
    uvIndex: 6,
    cloudCover: 35,
    precipitationProb: 15,
    weatherCode: 2,
    weatherDescription: 'Partly Cloudy & Productive',
    weatherIconName: 'CloudSun',
    sunrise: '06:12 AM',
    sunset: '07:58 PM',
    estimatedWaterTemp: 68,
    estimatedWaterClarity: 'Slightly Stained',
  };

  const hourly: HourlyForecastItem[] = [];
  for (let i = 0; i < 24; i++) {
    const hourLabel = `${i % 12 === 0 ? 12 : i % 12} ${i >= 12 ? 'PM' : 'AM'}`;
    const biteRating = calculateHourlyBiteScore(i, solunar, 'falling', 15, 8);
    let biteCategory: HourlyForecastItem['biteCategory'] = 'Fair';
    if (biteRating >= 85) biteCategory = 'Epic';
    else if (biteRating >= 70) biteCategory = 'Good';
    else if (biteRating >= 50) biteCategory = 'Fair';
    else biteCategory = 'Poor';

    hourly.push({
      time: `${i}:00`,
      hourLabel,
      temp: 68 + Math.round(Math.sin((i / 24) * Math.PI * 2) * 8),
      windSpeed: 7 + (i % 5),
      pressureHpa: 1014 - Math.round(i * 0.1),
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
    tides: generateTideSchedule(true, new Date()),
  };
}
