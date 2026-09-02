export type UnitSystem = 'imperial' | 'metric';

export interface LocationInfo {
  name: string;
  region: string;
  lat: number;
  lon: number;
  isCustom?: boolean;
  isGps?: boolean;
}

export type PressureTrend = 'rising_fast' | 'rising' | 'steady' | 'falling' | 'falling_fast';

export interface CurrentWeather {
  time: string;
  temp: number;
  feelsLike: number;
  windSpeed: number;
  windGusts: number;
  windDirectionDeg: number;
  windDirectionText: string;
  pressureHpa: number;
  pressureInHg: number;
  pressureTrend: PressureTrend;
  pressureDelta6h: number;
  humidity: number;
  uvIndex: number;
  cloudCover: number;
  precipitationProb: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIconName: string;
  sunrise: string;
  sunset: string;
  estimatedWaterTemp: number;
  estimatedWaterClarity: 'Crystal Clear' | 'Slightly Stained' | 'Murky' | 'Muddy';
  /** True when the live weather API was unreachable and these values are modelled. */
  isSimulated?: boolean;
}

export interface HourlyForecastItem {
  time: string;
  hourLabel: string;
  temp: number;
  windSpeed: number;
  pressureHpa: number;
  precipitationProb: number;
  weatherCode: number;
  weatherDescription: string;
  biteRating: number; // 0 - 100
  biteCategory: 'Poor' | 'Fair' | 'Good' | 'Epic';
  isMajor: boolean;
  isMinor: boolean;
}

export interface SolunarPeriod {
  start: string;
  end: string;
  peak: string;
  type: 'major' | 'minor';
  rating: number;
}

export interface SolunarData {
  ratingScore: number; // 0 - 100
  overallQuality: 'Tough' | 'Fair' | 'Good' | 'Epic';
  majorPeriods: SolunarPeriod[];
  minorPeriods: SolunarPeriod[];
  moonPhaseName: string;
  moonPhaseCode: string;
  moonIllumination: number; // 0 - 100%
  moonAgeDays: number;
  moonTransitTime: string;
  moonUnderfootTime: string;
  moonRise: string;
  moonSet: string;
}

export interface TideEvent {
  time: string;
  height: number; // feet
  type: 'High' | 'Low';
}

export interface TideData {
  isCoastal: boolean;
  events: TideEvent[];
  currentStatus: string;
}

export interface TargetSpecies {
  id: string;
  name: string;
  scientificName: string;
  category: 'Freshwater' | 'Saltwater' | 'Coldwater';
  activityRating: number; // 0 - 100
  activityTier: 'Hot Bite' | 'Moderate' | 'Slow Bite';
  depthZone: string;
  topLures: string[];
  bestColors: string[];
  technique: string;
  proTip: string;
}

export interface CatchRecord {
  id: string;
  species: string;
  weight?: number; // in lbs
  length?: number; // in inches
  lureOrBait: string;
  locationName: string;
  waterDepthFt?: number;
  timestamp: string;
  notes?: string;
  photoUrl?: string;
  isTrophy?: boolean;
  weatherSnapshot?: {
    temp: number;
    pressureTrend: string;
    moonPhase: string;
    solunarScore: number;
  };
}

export interface TackleRecommendation {
  category: string;
  title: string;
  gearSetup: string;
  reason: string;
  colorRecommendation: string;
  recommendedLures: string[];
}
