import SunCalc from 'suncalc';
import { SolunarData, SolunarPeriod } from '../types';

/**
 * Solunar tables for a given day and place.
 *
 * Feeding windows are anchored to the real lunar transit (moon overhead), its
 * opposite (moon underfoot), and actual moonrise/moonset from SunCalc, rather
 * than a mean-offset approximation — the mean approach drifts by hours because
 * of the Moon's eccentric, inclined orbit.
 */
export function calculateSolunar(date: Date, lat: number, lon: number): SolunarData {
  const moonInfo = getMoonPhaseInfo(date);
  const dayStart = startOfLocalDay(date);

  const { transit, underfoot } = findLunarCulminations(dayStart, lat, lon);
  const { rise, set } = findMoonRiseSet(dayStart, lat, lon);

  const majorPeriods: SolunarPeriod[] = [
    createPeriod(transit, 60, 'major', 90),
    createPeriod(underfoot, 60, 'major', 85),
  ];

  const minorPeriods: SolunarPeriod[] = [];
  if (rise) minorPeriods.push(createPeriod(rise, 45, 'minor', 70));
  if (set) minorPeriods.push(createPeriod(set, 45, 'minor', 65));

  // New and full moons pull hardest; quarters are the weakest of the cycle.
  let baseScore = 60;
  if (moonInfo.code === 'new' || moonInfo.code === 'full') {
    baseScore = 92;
  } else if (moonInfo.phaseName.includes('Gibbous') || moonInfo.phaseName.includes('Crescent')) {
    baseScore = 78;
  } else if (moonInfo.phaseName.includes('Quarter')) {
    baseScore = 65;
  }

  // A major window landing on dawn or dusk stacks two feeding triggers.
  const sunTimes = SunCalc.getTimes(new Date(dayStart.getTime() + 12 * 3600 * 1000), lat, lon);
  const stacksWithTwilight = [transit, underfoot].some(
    (t) => nearWithinMinutes(t, sunTimes.sunrise, 90) || nearWithinMinutes(t, sunTimes.sunset, 90),
  );

  const finalRating = Math.min(
    100,
    Math.max(35, Math.round(baseScore + (stacksWithTwilight ? 6 : 0))),
  );

  let overallQuality: SolunarData['overallQuality'] = 'Fair';
  if (finalRating >= 85) overallQuality = 'Epic';
  else if (finalRating >= 70) overallQuality = 'Good';
  else if (finalRating >= 50) overallQuality = 'Fair';
  else overallQuality = 'Tough';

  return {
    ratingScore: finalRating,
    overallQuality,
    majorPeriods: majorPeriods.sort((a, b) => toMinutes(a.peak) - toMinutes(b.peak)),
    minorPeriods: minorPeriods.sort((a, b) => toMinutes(a.peak) - toMinutes(b.peak)),
    moonPhaseName: moonInfo.phaseName,
    moonPhaseCode: moonInfo.code,
    moonIllumination: moonInfo.illumination,
    moonAgeDays: Math.round(moonInfo.age * 10) / 10,
    moonTransitTime: formatClockTime(transit),
    moonUnderfootTime: formatClockTime(underfoot),
    moonRise: rise ? formatClockTime(rise) : 'No rise today',
    moonSet: set ? formatClockTime(set) : 'No set today',
  };
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/**
 * Scans the local day for the Moon's highest and lowest altitude: transit
 * (overhead) and underfoot. Ten-minute sampling is well inside the tolerance
 * of a one-hour feeding window.
 */
function findLunarCulminations(dayStart: Date, lat: number, lon: number): {
  transit: Date;
  underfoot: Date;
} {
  const stepMs = 10 * 60 * 1000;
  let transit = dayStart;
  let underfoot = dayStart;
  let maxAlt = -Infinity;
  let minAlt = Infinity;

  for (let ms = 0; ms < 24 * 3600 * 1000; ms += stepMs) {
    const when = new Date(dayStart.getTime() + ms);
    const { altitude } = SunCalc.getMoonPosition(when, lat, lon);
    if (altitude > maxAlt) {
      maxAlt = altitude;
      transit = when;
    }
    if (altitude < minAlt) {
      minAlt = altitude;
      underfoot = when;
    }
  }

  return { transit, underfoot };
}

function findMoonRiseSet(dayStart: Date, lat: number, lon: number): {
  rise?: Date;
  set?: Date;
} {
  const times = SunCalc.getMoonTimes(dayStart, lat, lon);
  return {
    rise: times.rise instanceof Date && !Number.isNaN(times.rise.getTime()) ? times.rise : undefined,
    set: times.set instanceof Date && !Number.isNaN(times.set.getTime()) ? times.set : undefined,
  };
}

function nearWithinMinutes(a: Date, b: Date | undefined, minutes: number): boolean {
  if (!b || Number.isNaN(b.getTime())) return false;
  return Math.abs(a.getTime() - b.getTime()) <= minutes * 60 * 1000;
}

function createPeriod(
  center: Date,
  windowMins: number,
  type: 'major' | 'minor',
  rating: number,
): SolunarPeriod {
  return {
    start: formatClockTime(new Date(center.getTime() - windowMins * 60 * 1000)),
    end: formatClockTime(new Date(center.getTime() + windowMins * 60 * 1000)),
    peak: formatClockTime(center),
    type,
    rating,
  };
}

function formatClockTime(date: Date): string {
  const hrs24 = date.getHours();
  const mins = date.getMinutes();
  const period = hrs24 >= 12 ? 'PM' : 'AM';
  const hrs12 = hrs24 % 12 === 0 ? 12 : hrs24 % 12;
  return `${hrs12}:${mins < 10 ? `0${mins}` : mins} ${period}`;
}

function toMinutes(clock: string): number {
  const [time, period] = clock.split(' ');
  const [hourStr, minStr] = time.split(':');
  let hour = Number(hourStr) % 12;
  if (period === 'PM') hour += 12;
  return hour * 60 + Number(minStr);
}

interface MoonPhaseResult {
  phaseName: string;
  code: string;
  illumination: number;
  age: number;
}

const SYNODIC_MONTH_DAYS = 29.53058867;

export function getMoonPhaseInfo(date: Date): MoonPhaseResult {
  const { fraction, phase } = SunCalc.getMoonIllumination(date);
  const age = phase * SYNODIC_MONTH_DAYS;
  const illumination = Math.round(fraction * 100);

  let phaseName = 'New Moon';
  let code = 'new';

  if (age < 1.5 || age > 28.0) {
    phaseName = 'New Moon';
    code = 'new';
  } else if (age < 6.5) {
    phaseName = 'Waxing Crescent';
    code = 'waxing_crescent';
  } else if (age < 8.5) {
    phaseName = 'First Quarter';
    code = 'first_quarter';
  } else if (age < 13.5) {
    phaseName = 'Waxing Gibbous';
    code = 'waxing_gibbous';
  } else if (age < 16.0) {
    phaseName = 'Full Moon';
    code = 'full';
  } else if (age < 21.0) {
    phaseName = 'Waning Gibbous';
    code = 'waning_gibbous';
  } else if (age < 23.0) {
    phaseName = 'Last Quarter';
    code = 'last_quarter';
  } else {
    phaseName = 'Waning Crescent';
    code = 'waning_crescent';
  }

  return { phaseName, code, illumination, age };
}
