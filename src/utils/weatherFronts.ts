/**
 * Surface frontal analysis for Fishtrap Lake.
 *
 * Front positions come from the WPC Coded Surface Bulletin (product COD/SUS) and the
 * local NWS forecast discussion, both served by api.weather.gov with permissive CORS
 * and no API key, so this works on static GitHub Pages hosting with no backend.
 *
 * Coded bulletin coordinates are whole degrees (~70 mi), so distance and bearing are
 * approximations: passage timing is derived from the hourly model series instead.
 * Nothing here invents a boundary — when no analysis is available the status says so.
 */

export type FrontType = 'COLD' | 'WARM' | 'STNRY' | 'OCFNT' | 'TROF';

export interface FrontPoint {
  lat: number;
  lon: number;
}

export interface FrontBoundary {
  type: FrontType;
  points: FrontPoint[];
}

export interface NearestFront {
  type: FrontType;
  label: string;
  distanceMi: number;
  bearingDeg: number;
  bearingText: string;
}

export interface PressureCenter {
  kind: 'High' | 'Low';
  pressureHpa: number;
  distanceMi: number;
  bearingText: string;
}

export interface FrontalPassage {
  /** Local hour label the modelled boundary starts moving through, e.g. "4 PM". */
  startLabel: string;
  endLabel: string;
  pressureMinHpa: number;
  windShiftDeg: number;
  tempChangeF: number;
}

/** Hourly model fields needed to spot a frontal passage; supplied by weather.ts. */
export interface FrontalSeries {
  times: string[];
  pressureHpa: number[];
  windDirectionDeg: number[];
  tempC: number[];
}

export interface FrontsData {
  status: 'ok' | 'none' | 'error';
  /** Valid time of the WPC analysis. */
  validTime?: string;
  fetchedAt: string;
  isStale: boolean;
  nearest?: NearestFront;
  /** True fronts (not troughs) analysed within the search radius. */
  frontsNearbyCount: number;
  pressureCenter?: PressureCenter;
  passage?: FrontalPassage;
  /** Front-related sentences lifted from the NWS forecast discussion. */
  discussion?: string;
  discussionOffice?: string;
  error?: string;
}

export const FRONT_MAP_IMAGE = 'https://www.wpc.ncep.noaa.gov/sfc/namussfcwbg.gif';
export const FRONT_MAP_PAGE = 'https://www.wpc.ncep.noaa.gov/html/sfc2.shtml';

const API_ROOT = 'https://api.weather.gov';
const CACHE_KEY = 'anglers_weather_fronts_v1';
const SEARCH_RADIUS_MI = 400;
const STALE_AFTER_MS = 4 * 60 * 60 * 1000;

const FRONT_LABELS: Record<FrontType, string> = {
  COLD: 'Cold Front',
  WARM: 'Warm Front',
  STNRY: 'Stationary Front',
  OCFNT: 'Occluded Front',
  TROF: 'Surface Trough',
};

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

function toCompass(deg: number): string {
  return COMPASS[Math.round(((deg % 360) / 22.5)) % 16];
}

function haversineMi(a: FrontPoint, b: FrontPoint): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function bearingDeg(from: FrontPoint, to: FrontPoint): number {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLon = ((to.lon - from.lon) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

/**
 * Bulletin coordinates pack whole degrees of latitude and west longitude into one
 * token: "3782" is 37N 82W, "43100" is 43N 100W.
 */
function decodeCoordinate(token: string): FrontPoint | undefined {
  if (!/^\d{4,6}$/.test(token)) return undefined;
  const lat = Number(token.slice(0, 2));
  const lon = Number(token.slice(2));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;
  if (lat > 90 || lon > 180) return undefined;
  return { lat, lon: -lon };
}

export function parseCodedSurfaceBulletin(text: string): {
  boundaries: FrontBoundary[];
  centers: { kind: 'High' | 'Low'; pressureHpa: number; point: FrontPoint }[];
  validTime?: string;
} {
  const boundaries: FrontBoundary[] = [];
  const centers: { kind: 'High' | 'Low'; pressureHpa: number; point: FrontPoint }[] = [];
  let validTime: string | undefined;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const validMatch = /^VALID\s+(\d{6})Z/.exec(line);
    if (validMatch) {
      validTime = decodeValidTime(validMatch[1]);
      continue;
    }

    const [keyword, ...tokens] = line.split(/\s+/);

    if (keyword === 'HIGHS' || keyword === 'LOWS') {
      const kind = keyword === 'HIGHS' ? 'High' : 'Low';
      for (let i = 0; i + 1 < tokens.length; i += 2) {
        const pressureHpa = Number(tokens[i]);
        const point = decodeCoordinate(tokens[i + 1]);
        if (point && Number.isFinite(pressureHpa)) centers.push({ kind, pressureHpa, point });
      }
      continue;
    }

    if (keyword in FRONT_LABELS) {
      const points = tokens.map(decodeCoordinate).filter((p): p is FrontPoint => !!p);
      if (points.length >= 2) boundaries.push({ type: keyword as FrontType, points });
    }
  }

  return { boundaries, centers, validTime };
}

/** "090215Z" is day 02 of the current month at 15Z (the leading field is the product day). */
function decodeValidTime(token: string): string | undefined {
  const day = Number(token.slice(2, 4));
  const hour = Number(token.slice(4, 6));
  if (!day || Number.isNaN(hour)) return undefined;
  const now = new Date();
  const guess = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, hour));
  // A day number well ahead of today means the bulletin belongs to the previous month.
  if (guess.getTime() - now.getTime() > 5 * 24 * 60 * 60 * 1000) {
    guess.setUTCMonth(guess.getUTCMonth() - 1);
  }
  return guess.toISOString();
}

/** Densifies each segment so distance to the drawn line is measured, not just to vertices. */
function nearestOnBoundary(origin: FrontPoint, boundary: FrontBoundary) {
  let best = { distanceMi: Infinity, point: boundary.points[0] };
  for (let i = 0; i < boundary.points.length - 1; i += 1) {
    const a = boundary.points[i];
    const b = boundary.points[i + 1];
    const steps = 8;
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const point = { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t };
      const distanceMi = haversineMi(origin, point);
      if (distanceMi < best.distanceMi) best = { distanceMi, point };
    }
  }
  return best;
}

export function findNearestFront(
  origin: FrontPoint,
  boundaries: FrontBoundary[],
): { nearest?: NearestFront; frontsNearbyCount: number } {
  let nearest: NearestFront | undefined;
  let frontsNearbyCount = 0;

  for (const boundary of boundaries) {
    const { distanceMi, point } = nearestOnBoundary(origin, boundary);
    if (distanceMi > SEARCH_RADIUS_MI) continue;
    if (boundary.type !== 'TROF') frontsNearbyCount += 1;

    // True fronts outrank troughs; within the same class the closest one wins.
    const rank = boundary.type === 'TROF' ? 1 : 0;
    const currentRank = nearest ? (nearest.type === 'TROF' ? 1 : 0) : 2;
    if (rank > currentRank) continue;
    if (nearest && rank === currentRank && distanceMi >= nearest.distanceMi) continue;

    const deg = bearingDeg(origin, point);
    nearest = {
      type: boundary.type,
      label: FRONT_LABELS[boundary.type],
      distanceMi: Math.round(distanceMi),
      bearingDeg: Math.round(deg),
      bearingText: toCompass(deg),
    };
  }

  return { nearest, frontsNearbyCount };
}

function findNearestCenter(
  origin: FrontPoint,
  centers: { kind: 'High' | 'Low'; pressureHpa: number; point: FrontPoint }[],
): PressureCenter | undefined {
  let best: PressureCenter | undefined;
  for (const center of centers) {
    const distanceMi = haversineMi(origin, center.point);
    if (best && distanceMi >= best.distanceMi) continue;
    best = {
      kind: center.kind,
      pressureHpa: center.pressureHpa,
      distanceMi: Math.round(distanceMi),
      bearingText: toCompass(bearingDeg(origin, center.point)),
    };
  }
  return best;
}

function hourLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString([], { hour: 'numeric' });
}

function angleDelta(a: number, b: number): number {
  const diff = Math.abs(((b - a + 540) % 360) - 180);
  return diff;
}

/**
 * Flags a modelled frontal passage: a pressure minimum inside the next 24 hours that
 * comes with a wind shift and a temperature change on the far side of it.
 */
export function detectFrontalPassage(series?: FrontalSeries): FrontalPassage | undefined {
  if (!series || series.times.length < 12) return undefined;

  const now = Date.now();
  const startIdx = Math.max(
    0,
    series.times.findIndex((t) => new Date(t).getTime() >= now),
  );
  const endIdx = Math.min(series.times.length - 1, startIdx + 24);
  if (endIdx - startIdx < 6) return undefined;

  let troughIdx = -1;
  let troughPressure = Infinity;
  for (let i = startIdx + 1; i < endIdx - 1; i += 1) {
    const p = series.pressureHpa[i];
    if (!Number.isFinite(p)) continue;
    const isLocalMin = p <= series.pressureHpa[i - 1] && p <= series.pressureHpa[i + 1];
    if (isLocalMin && p < troughPressure) {
      troughPressure = p;
      troughIdx = i;
    }
  }
  if (troughIdx < 0) return undefined;

  const beforeIdx = Math.max(startIdx, troughIdx - 3);
  const afterIdx = Math.min(endIdx, troughIdx + 3);
  const windShiftDeg = Math.round(
    angleDelta(series.windDirectionDeg[beforeIdx], series.windDirectionDeg[afterIdx]),
  );
  const tempChangeF = Math.round(((series.tempC[afterIdx] - series.tempC[beforeIdx]) * 9) / 5);
  const pressureRise = series.pressureHpa[afterIdx] - troughPressure;

  const significant = windShiftDeg >= 50 || tempChangeF <= -5 || pressureRise >= 2;
  if (!significant) return undefined;

  return {
    startLabel: hourLabel(series.times[troughIdx]),
    endLabel: hourLabel(series.times[afterIdx]),
    pressureMinHpa: Math.round(troughPressure),
    windShiftDeg,
    tempChangeF,
  };
}

interface ProductListResponse {
  '@graph'?: { id?: string; issuanceTime?: string }[];
}

interface ProductResponse {
  productText?: string;
}

interface PointsResponse {
  properties?: { gridId?: string };
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/ld+json' } });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return (await res.json()) as T;
}

async function fetchLatestProductText(
  path: string,
  signal?: AbortSignal,
): Promise<{ text: string; issuanceTime?: string }> {
  const list = await getJson<ProductListResponse>(`${API_ROOT}/products/types/${path}`, signal);
  const latest = list['@graph']?.[0];
  if (!latest?.id) throw new Error(`No ${path} product available`);
  const product = await getJson<ProductResponse>(`${API_ROOT}/products/${latest.id}`, signal);
  return { text: product.productText || '', issuanceTime: latest.issuanceTime };
}

async function resolveOffice(origin: FrontPoint, signal?: AbortSignal): Promise<string> {
  try {
    const points = await getJson<PointsResponse>(`${API_ROOT}/points/${origin.lat},${origin.lon}`, signal);
    return points.properties?.gridId || 'JKL';
  } catch {
    return 'JKL';
  }
}

/** Pulls the sentences of the forecast discussion that actually talk about boundaries. */
export function extractFrontDiscussion(text: string): string | undefined {
  const body = text.replace(/\s*\n\s*/g, ' ');
  const sentences = body.split(/(?<=[.!?])\s+/);
  const relevant = sentences.filter((s) => /\b(front|frontal|boundary|trough|air mass|airmass)\b/i.test(s));
  if (relevant.length === 0) return undefined;
  return relevant.slice(0, 3).join(' ').slice(0, 700).trim();
}

function readCache(): FrontsData | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const cached = JSON.parse(raw) as FrontsData;
    return {
      ...cached,
      isStale: Date.now() - new Date(cached.fetchedAt).getTime() > STALE_AFTER_MS,
    };
  } catch {
    return undefined;
  }
}

function writeCache(data: FrontsData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked: caching is best-effort only.
  }
}

export function getCachedFrontsData(): FrontsData | undefined {
  return readCache();
}

export async function fetchFrontsData(
  origin: FrontPoint,
  series?: FrontalSeries,
  signal?: AbortSignal,
): Promise<FrontsData> {
  const passage = detectFrontalPassage(series);
  const fetchedAt = new Date().toISOString();

  try {
    const bulletin = await fetchLatestProductText('COD/locations/SUS', signal);
    const { boundaries, centers, validTime } = parseCodedSurfaceBulletin(bulletin.text);
    const { nearest, frontsNearbyCount } = findNearestFront(origin, boundaries);

    let discussion: string | undefined;
    let discussionOffice: string | undefined;
    try {
      const office = await resolveOffice(origin, signal);
      const afd = await fetchLatestProductText(`AFD/locations/${office}`, signal);
      discussion = extractFrontDiscussion(afd.text);
      discussionOffice = office;
    } catch {
      // The discussion is supplementary; front positions still stand without it.
    }

    const data: FrontsData = {
      status: nearest ? 'ok' : 'none',
      validTime: validTime || bulletin.issuanceTime,
      fetchedAt,
      isStale: false,
      nearest,
      frontsNearbyCount,
      pressureCenter: findNearestCenter(origin, centers),
      passage,
      discussion,
      discussionOffice,
    };
    writeCache(data);
    return data;
  } catch (err) {
    const cached = readCache();
    if (cached) return { ...cached, passage: passage ?? cached.passage };
    return {
      status: 'error',
      fetchedAt,
      isStale: false,
      frontsNearbyCount: 0,
      passage,
      error: err instanceof Error ? err.message : 'Frontal analysis unavailable',
    };
  }
}

/** One-line factual summary shared by the Conditions panel and the AI prompt. */
export function summarizeFronts(data?: FrontsData): string {
  if (!data || data.status === 'error') return 'Frontal analysis unavailable';
  if (data.status === 'none' || !data.nearest) {
    return 'No analyzed frontal boundary within 400 mi';
  }
  const { label, distanceMi, bearingText } = data.nearest;
  const timing = data.passage
    ? `; modelled wind shift ${data.passage.startLabel}–${data.passage.endLabel}`
    : '';
  return `${label} ${distanceMi} mi to the ${bearingText}${timing}`;
}
