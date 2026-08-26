export interface LakeHydrologyData {
  lakeName: string;
  location: string;
  source: string;
  poolElevationFt: number;
  elevationDelta24h: number; // ft
  summerPoolFt: number;
  winterPoolFt: number;
  tailwaterElevationFt: number;
  tailwaterStageFt: number;
  inflowCfs: number;
  outflowCfs: number;
  waterTempF: number;
  precip24hrIn?: number;
  storageUtilizedPercent: number;
  floodStoragePercent: number;
  conservationStoragePercent: number;
  statusSummary: string;
  boatingImpactStatus: string;
  updatedTime: string;
  observationDate?: string;
  observationTime?: string;
  measurementTime?: string;
  waterTempTime?: string;
  retrievedAt?: string;
  officialUrl?: string;
  /** True only when the readings above came from a successful CWMS fetch. */
  isLive?: boolean;
  /** Minutes between the newest reading and now; undefined when offline. */
  dataAgeMinutes?: number;
}

const SUMMER_POOL_FT = 757.0;
const WINTER_POOL_FT = 735.0;
const OFFICIAL_URL = 'https://www.lrh-wc.usace.army.mil/wm/?basin/bsa/frl';

/**
 * Placeholder shown for the moment before the first fetch resolves, and when
 * the fetch fails. The numbers are nominal summer-pool values, not readings, so
 * nothing here claims to be current.
 */
export const FISHTRAP_LAKE_HYDROLOGY: LakeHydrologyData = {
  lakeName: 'Fishtrap Lake',
  location: 'Pikeville / Pike County, KY',
  source: 'US Army Corps of Engineers (Huntington District)',
  poolElevationFt: SUMMER_POOL_FT,
  elevationDelta24h: 0,
  summerPoolFt: SUMMER_POOL_FT,
  winterPoolFt: WINTER_POOL_FT,
  tailwaterElevationFt: 671.18,
  tailwaterStageFt: 11.22,
  inflowCfs: 0,
  outflowCfs: 0,
  waterTempF: 0,
  precip24hrIn: 0,
  storageUtilizedPercent: 11,
  floodStoragePercent: 1,
  conservationStoragePercent: 100,
  statusSummary: 'Waiting for USACE telemetry…',
  boatingImpactStatus: 'All primary ramps open (Grapevine & Lick Creek). Courtesy dock accessible.',
  updatedTime: 'Not yet synced',
  observationDate: '—',
  observationTime: '—',
  measurementTime: '—',
  waterTempTime: '—',
  retrievedAt: 'USACE Station #FTPK2',
  officialUrl: OFFICIAL_URL,
  isLive: false,
};

/**
 * CWMS Data API. Unlike the district's `lrh-wc` web-page feed it sends
 * `Access-Control-Allow-Origin: *`, so the browser can read it directly and the
 * dashboard needs no server of its own.
 */
const CWMS_BASE = 'https://cwms-data.usace.army.mil/cwms-data/timeseries';
const OFFICE = 'LRH';

const SERIES = {
  poolElevation: 'Fishtrap-Lake.Elev.Inst.15Minutes.0.OBS',
  inflow: 'Fishtrap-Lake.Flow.Inst.15Minutes.0.OBS',
  precip: 'Fishtrap-Lake.Precip.Total.15Minutes.15Minutes.OBS',
  tailwaterElevation: 'Fishtrap-Outflow.Elev.Inst.15Minutes.0.OBS',
  outflow: 'Fishtrap-Outflow.Flow.Inst.15Minutes.0.OBS',
  tailwaterStage: 'Fishtrap-Outflow.Stage.Inst.15Minutes.0.OBS',
  waterTemp: 'Fishtrap-Outflow.Temp-Water.Inst.1Hour.0.OBS',
} as const;

type SeriesKey = keyof typeof SERIES;

/** [epochMillis, value] pairs, oldest first, nulls dropped. */
type Points = [number, number][];

const LOOKBACK_HOURS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const EASTERN = 'America/New_York';

async function fetchSeries(name: string, signal?: AbortSignal): Promise<Points> {
  const begin = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
  const url =
    `${CWMS_BASE}?name=${encodeURIComponent(name)}&office=${OFFICE}` +
    `&unit=EN&begin=${encodeURIComponent(begin)}&page-size=5000`;

  const res = await fetch(url, {
    signal,
    headers: { Accept: 'application/json;version=2' },
  });
  if (!res.ok) throw new Error(`CWMS ${name} returned ${res.status}`);

  const json: { values?: unknown } = await res.json();
  const rows = Array.isArray(json.values) ? json.values : [];
  const points: Points = [];
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const [time, value] = row as [unknown, unknown];
    if (typeof time !== 'number' || typeof value !== 'number' || !Number.isFinite(value)) continue;
    points.push([time, value]);
  }
  points.sort((a, b) => a[0] - b[0]);
  return points;
}

function latest(points: Points): [number, number] | undefined {
  return points.length ? points[points.length - 1] : undefined;
}

/** The reading closest to 24h before `reference`, used for the daily delta. */
function nearestTo(points: Points, target: number): number | undefined {
  let best: [number, number] | undefined;
  for (const point of points) {
    if (!best || Math.abs(point[0] - target) < Math.abs(best[0] - target)) best = point;
  }
  return best?.[1];
}

function sumSince(points: Points, since: number): number {
  return points.reduce((total, [time, value]) => (time >= since ? total + value : total), 0);
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: EASTERN,
  });
}

function formatTime(ms: number): string {
  return new Date(ms)
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: EASTERN,
    })
    .toLowerCase();
}

function describePool(elevationFt: number, delta24h: number): string {
  const diff = elevationFt - SUMMER_POOL_FT;
  const signed = `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`;
  const level =
    diff > 3 ? 'Above Summer Pool' : diff < -3 ? 'Below Summer Pool' : 'Normal Summer Pool';
  const trend =
    Math.abs(delta24h) < 0.05 ? 'Stable' : delta24h > 0 ? 'Rising' : 'Falling';
  return `${level} (${signed} ft vs rule curve ${SUMMER_POOL_FT.toFixed(2)} ft) - ${trend} Fishing Conditions`;
}

/**
 * Reads the live Fishtrap telemetry straight from CWMS in the browser.
 *
 * Every field falls back to the placeholder above individually, so a single
 * missing series degrades one tile instead of the whole card. `isLive` is only
 * true when the pool elevation — the reading everything else is framed
 * against — actually arrived.
 */
export async function fetchFishtrapHydrology(signal?: AbortSignal): Promise<LakeHydrologyData> {
  const keys = Object.keys(SERIES) as SeriesKey[];
  const settled = await Promise.allSettled(
    keys.map((key) => fetchSeries(SERIES[key], signal)),
  );

  const series = {} as Record<SeriesKey, Points>;
  keys.forEach((key, index) => {
    const result = settled[index];
    if (result.status === 'fulfilled') {
      series[key] = result.value;
    } else {
      series[key] = [];
      console.warn(`CWMS series ${SERIES[key]} unavailable:`, result.reason);
    }
  });

  const pool = latest(series.poolElevation);
  if (!pool) {
    console.warn('CWMS pool elevation unavailable; showing offline placeholder.');
    return FISHTRAP_LAKE_HYDROLOGY;
  }

  const [poolTime, poolElevationFt] = pool;
  const dayAgo = nearestTo(series.poolElevation, poolTime - DAY_MS);
  const elevationDelta24h = dayAgo === undefined ? 0 : poolElevationFt - dayAgo;

  const tempReading = latest(series.waterTemp);
  const outflowReading = latest(series.outflow);
  const fallback = FISHTRAP_LAKE_HYDROLOGY;
  const newest = Math.max(
    poolTime,
    tempReading?.[0] ?? 0,
    outflowReading?.[0] ?? 0,
  );

  return {
    ...fallback,
    poolElevationFt,
    elevationDelta24h,
    inflowCfs: latest(series.inflow)?.[1] ?? fallback.inflowCfs,
    outflowCfs: outflowReading?.[1] ?? fallback.outflowCfs,
    tailwaterElevationFt: latest(series.tailwaterElevation)?.[1] ?? fallback.tailwaterElevationFt,
    tailwaterStageFt: latest(series.tailwaterStage)?.[1] ?? fallback.tailwaterStageFt,
    waterTempF: tempReading?.[1] ?? fallback.waterTempF,
    precip24hrIn: sumSince(series.precip, poolTime - DAY_MS),
    statusSummary: describePool(poolElevationFt, elevationDelta24h),
    updatedTime: `Data as of: ${formatDate(newest)} ${formatTime(newest)} ET`,
    observationDate: formatDate(newest),
    observationTime: `${formatTime(newest)} ET`,
    measurementTime: formatTime(poolTime),
    waterTempTime: tempReading ? formatTime(tempReading[0]) : fallback.waterTempTime,
    retrievedAt: formatTime(Date.now()),
    isLive: true,
    dataAgeMinutes: Math.max(0, Math.round((Date.now() - newest) / 60000)),
  };
}
