import { SolunarData, SolunarPeriod } from '../types';

/**
 * Calculates Solunar theory tables, moon phases, and major/minor feeding periods.
 */
export function calculateSolunar(date: Date, lat: number, lon: number): SolunarData {
  const moonInfo = getMoonPhaseInfo(date);
  
  // Approximate solar and lunar transit times based on date and longitude
  // Longitude offset in hours: -180 to 180 => -12 to +12 hours
  const dayOfYear = getDayOfYear(date);
  
  // Base lunar transit calculation (moves ~50 minutes later every day)
  const moonAge = moonInfo.age;
  const baseTransitMinutes = ((moonAge * 50.4 + (lon * 4)) % 1440 + 1440) % 1440;
  
  const transitHour = Math.floor(baseTransitMinutes / 60);
  const transitMin = Math.floor(baseTransitMinutes % 60);
  const underfootMinutes = (baseTransitMinutes + 720) % 1440;
  const underfootHour = Math.floor(underfootMinutes / 60);
  const underfootMin = Math.floor(underfootMinutes % 60);

  // Minor periods (Moonrise & Moonset, approximately 6 hours offset from transit)
  const riseMinutes = (baseTransitMinutes + 360) % 1440;
  const setMinutes = (baseTransitMinutes + 1080) % 1440;

  const major1: SolunarPeriod = createPeriod(baseTransitMinutes, 60, 'major', 90);
  const major2: SolunarPeriod = createPeriod(underfootMinutes, 60, 'major', 85);
  const minor1: SolunarPeriod = createPeriod(riseMinutes, 45, 'minor', 70);
  const minor2: SolunarPeriod = createPeriod(setMinutes, 45, 'minor', 65);

  // Solunar base quality score (New Moon and Full Moon have highest gravitational pull & fish activity)
  let baseScore = 60;
  if (moonInfo.phaseName === 'New Moon' || moonInfo.phaseName === 'Full Moon') {
    baseScore = 92;
  } else if (moonInfo.phaseName.includes('Gibbous') || moonInfo.phaseName.includes('Crescent')) {
    baseScore = 78;
  } else if (moonInfo.phaseName.includes('Quarter')) {
    baseScore = 65;
  }

  // Adjust score slightly by latitude day variation
  const seasonalBoost = Math.sin((dayOfYear / 365) * Math.PI * 2) * 5;
  const finalRating = Math.min(100, Math.max(35, Math.round(baseScore + seasonalBoost)));

  let overallQuality: SolunarData['overallQuality'] = 'Fair';
  if (finalRating >= 85) overallQuality = 'Epic';
  else if (finalRating >= 70) overallQuality = 'Good';
  else if (finalRating >= 50) overallQuality = 'Fair';
  else overallQuality = 'Tough';

  return {
    ratingScore: finalRating,
    overallQuality,
    majorPeriods: [major1, major2].sort((a, b) => a.start.localeCompare(b.start)),
    minorPeriods: [minor1, minor2].sort((a, b) => a.start.localeCompare(b.start)),
    moonPhaseName: moonInfo.phaseName,
    moonPhaseCode: moonInfo.code,
    moonIllumination: moonInfo.illumination,
    moonAgeDays: Math.round(moonInfo.age * 10) / 10,
    moonTransitTime: formatTimeFromMinutes(baseTransitMinutes),
    moonUnderfootTime: formatTimeFromMinutes(underfootMinutes),
    moonRise: formatTimeFromMinutes(riseMinutes),
    moonSet: formatTimeFromMinutes(setMinutes),
  };
}

function createPeriod(centerMin: number, windowMins: number, type: 'major' | 'minor', rating: number): SolunarPeriod {
  const startMin = (centerMin - windowMins + 1440) % 1440;
  const endMin = (centerMin + windowMins) % 1440;

  return {
    start: formatTimeFromMinutes(startMin),
    end: formatTimeFromMinutes(endMin),
    peak: formatTimeFromMinutes(centerMin),
    type,
    rating,
  };
}

function formatTimeFromMinutes(totalMinutes: number): string {
  const hrs24 = Math.floor(totalMinutes / 60) % 24;
  const mins = Math.floor(totalMinutes % 60);
  const period = hrs24 >= 12 ? 'PM' : 'AM';
  const hrs12 = hrs24 % 12 === 0 ? 12 : hrs24 % 12;
  const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hrs12}:${minsStr} ${period}`;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

interface MoonPhaseResult {
  phaseName: string;
  code: string;
  illumination: number;
  age: number;
}

export function getMoonPhaseInfo(date: Date): MoonPhaseResult {
  // Known reference new moon: January 11, 2024 at 11:57 UTC
  const refDate = new Date(Date.UTC(2024, 0, 11, 11, 57));
  const synodicMonth = 29.53058867; // days
  const diffMs = date.getTime() - refDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const cyclePosition = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
  const phaseRatio = cyclePosition / synodicMonth; // 0 to 1

  // Illumination percentage
  const illumination = Math.round((1 - Math.cos(phaseRatio * 2 * Math.PI)) / 2 * 100);

  let phaseName = 'New Moon';
  let code = 'new';

  if (cyclePosition < 1.5 || cyclePosition > 28.0) {
    phaseName = 'New Moon';
    code = 'new';
  } else if (cyclePosition < 6.5) {
    phaseName = 'Waxing Crescent';
    code = 'waxing_crescent';
  } else if (cyclePosition < 8.5) {
    phaseName = 'First Quarter';
    code = 'first_quarter';
  } else if (cyclePosition < 13.5) {
    phaseName = 'Waxing Gibbous';
    code = 'waxing_gibbous';
  } else if (cyclePosition < 16.0) {
    phaseName = 'Full Moon';
    code = 'full';
  } else if (cyclePosition < 21.0) {
    phaseName = 'Waning Gibbous';
    code = 'waning_gibbous';
  } else if (cyclePosition < 23.0) {
    phaseName = 'Last Quarter';
    code = 'last_quarter';
  } else {
    phaseName = 'Waning Crescent';
    code = 'waning_crescent';
  }

  return {
    phaseName,
    code,
    illumination,
    age: cyclePosition,
  };
}
