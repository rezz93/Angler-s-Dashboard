/**
 * Calendar and water-temperature context so briefings describe the season the
 * angler is actually in, instead of defaulting to summer patterns year round.
 */

export type SeasonName = 'Winter' | 'Spring' | 'Summer' | 'Fall';

export interface SeasonContext {
  season: SeasonName;
  /** e.g. "mid September (early fall)" */
  label: string;
  /** e.g. "Sep 2, 2026" */
  dateLabel: string;
  /** Seasonal pattern the water temperature actually supports. */
  phase: string;
}

const MONTH_SEASONS: SeasonName[] = [
  'Winter', // Jan
  'Winter',
  'Spring',
  'Spring',
  'Spring',
  'Summer', // Jun
  'Summer',
  'Summer',
  'Fall', // Sep
  'Fall',
  'Fall',
  'Winter',
];

function partOfMonth(day: number): string {
  if (day <= 10) return 'early';
  if (day <= 20) return 'mid';
  return 'late';
}

/**
 * Water temperature drives fish behaviour more than the calendar, so the phase
 * is derived from the measured lake temperature and disambiguated by whether
 * the year is warming or cooling.
 */
function describePhase(season: SeasonName, waterTempF?: number): string {
  const warming = season === 'Spring' || season === 'Summer';

  if (waterTempF === undefined || waterTempF <= 0) {
    switch (season) {
      case 'Winter':
        return 'cold-water season: fish grouped deep and slow-moving';
      case 'Spring':
        return 'spring warming: pre-spawn through spawn movement toward shallow cover';
      case 'Summer':
        return 'summer pattern: thermocline sets up, fish on deep structure and shade';
      default:
        return 'fall transition: water still holds summer heat early on, and bait schools pull into the creek arms as it cools';
    }
  }

  if (waterTempF < 45) return 'cold water (<45°F): lethargic fish stacked on deep wintering structure';
  if (waterTempF < 55) {
    return warming
      ? 'pre-spawn staging (45-55°F): fish moving up channel swings toward spawning flats'
      : 'late-fall cooldown (45-55°F): fish following the last shad schools before winter';
  }
  if (waterTempF < 68) {
    return warming
      ? 'spawn window (55-68°F): bass on shallow gravel and pockets, crappie in brush'
      : 'fall feed-up (55-68°F): schooling activity on points and creek mouths';
  }
  if (waterTempF < 80) {
    return warming
      ? 'post-spawn to early summer (68-80°F): fish transitioning to main-lake structure'
      : 'early-fall transition (68-80°F): fish shifting off summer depths toward bait';
  }
  return 'peak warm water (>80°F): fish deep, in shade, or in oxygenated current';
}

export function getSeasonContext(date: Date, waterTempF?: number): SeasonContext {
  const season = MONTH_SEASONS[date.getMonth()];
  const monthName = date.toLocaleDateString(undefined, { month: 'long' });
  const part = partOfMonth(date.getDate());

  return {
    season,
    label: `${part} ${monthName} (${season.toLowerCase()})`,
    dateLabel: date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    phase: describePhase(season, waterTempF),
  };
}
