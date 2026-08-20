import { LocationInfo } from '../types';

export interface GeocodedWater {
  name: string;
  region: string;
  lat: number;
  lon: number;
  country?: string;
  state?: string;
  type?: string;
}

// Extensive curated list of iconic fishing lakes and waters across North America & beyond
export const EXTENSIVE_FISHING_WATERS_DB: LocationInfo[] = [
  // Kentucky & Surrounding Waters
  { name: 'Fishtrap Lake', region: 'Pikeville, KY, USA', lat: 37.4253, lon: -82.4182 },
  { name: 'Dewey Lake', region: 'Prestonsburg, KY, USA', lat: 37.72, lon: -82.72 },
  { name: 'Yatesville Lake', region: 'Louisa, KY, USA', lat: 38.15, lon: -82.68 },
  { name: 'Cave Run Lake', region: 'Morehead, KY, USA', lat: 38.12, lon: -83.53 },
  { name: 'Lake Cumberland', region: 'Jamestown / Russell Springs, KY, USA', lat: 36.95, lon: -84.95 },
  { name: 'Kentucky Lake', region: 'Gilbertsville / Land Between the Lakes, KY, USA', lat: 36.85, lon: -88.25 },
  { name: 'Lake Barkley', region: 'Grand Rivers, KY, USA', lat: 36.98, lon: -88.03 },
  { name: 'Dale Hollow Lake', region: 'Celina / Burkesville, TN / KY, USA', lat: 36.53, lon: -85.35 },
  { name: 'Barren River Lake', region: 'Lucas / Glasgow, KY, USA', lat: 36.89, lon: -86.13 },
  { name: 'Green River Lake', region: 'Campbellsville, KY, USA', lat: 37.25, lon: -85.34 },
  { name: 'Nolin River Lake', region: 'Mammoth Cave, KY, USA', lat: 37.28, lon: -86.25 },
  { name: 'Rough River Lake', region: 'Falls of Rough, KY, USA', lat: 37.61, lon: -86.51 },
  { name: 'Taylorsville Lake', region: 'Taylorsville / Spencer Co, KY, USA', lat: 38.03, lon: -85.34 },
  { name: 'Herrington Lake', region: 'Harrodsburg / Danville, KY, USA', lat: 37.78, lon: -84.72 },
  { name: 'Laurel River Lake', region: 'London / Corbin, KY, USA', lat: 36.96, lon: -84.28 },
  { name: 'Paintsville Lake', region: 'Paintsville / Staffordsville, KY, USA', lat: 37.83, lon: -82.88 },
  { name: 'Levisa Fork (Big Sandy River)', region: 'Pikeville / Prestonsburg, KY, USA', lat: 37.48, lon: -82.52 },
  { name: 'Tug Fork River', region: 'Pike / Mingo Co, KY / WV, USA', lat: 37.58, lon: -82.28 },
  { name: 'R.D. Bailey Lake', region: 'Wyoming / Mingo Co, WV, USA', lat: 37.60, lon: -81.82 },
  { name: 'Beech Fork Lake', region: 'Wayne / Cabell Co, WV, USA', lat: 38.31, lon: -82.38 },
  { name: 'Summersville Lake', region: 'Summersville, WV, USA', lat: 38.22, lon: -80.88 },
  { name: 'Burnsville Lake', region: 'Burnsville, WV, USA', lat: 38.85, lon: -80.64 },
  { name: 'South Holston Lake', region: 'Bristol, TN / VA, USA', lat: 36.52, lon: -82.09 },
  { name: 'Watauga Lake', region: 'Elizabethton, TN, USA', lat: 36.33, lon: -82.02 },
  { name: 'Norris Lake', region: 'Lafollette / Norris, TN, USA', lat: 36.31, lon: -84.05 },
  { name: 'Center Hill Lake', region: 'Smithville / Lancaster, TN, USA', lat: 36.09, lon: -85.83 },
  { name: 'Chickamauga Lake', region: 'Chattanooga / Dayton, TN, USA', lat: 35.19, lon: -85.23 },
  { name: 'Watts Bar Lake', region: 'Spring City / Kingston, TN, USA', lat: 35.62, lon: -84.78 },
  { name: 'Percy Priest Lake', region: 'Nashville, TN, USA', lat: 36.15, lon: -86.62 },
  { name: 'Old Hickory Lake', region: 'Hendersonville, TN, USA', lat: 36.29, lon: -86.53 },

  // Famous National Bass, Walleye & Saltwater Hotspots
  { name: 'Lake Guntersville', region: 'Guntersville, AL, USA', lat: 34.36, lon: -86.29 },
  { name: 'Lake Okeechobee', region: 'Clewiston, FL, USA', lat: 26.96, lon: -80.83 },
  { name: 'Lake Fork', region: 'Quitman, TX, USA', lat: 32.81, lon: -95.53 },
  { name: 'Sam Rayburn Reservoir', region: 'Jasper, TX, USA', lat: 31.08, lon: -94.10 },
  { name: 'Toledo Bend Reservoir', region: 'Many / Hemphill, LA / TX, USA', lat: 31.57, lon: -93.75 },
  { name: 'Lake of the Ozarks', region: 'Osage Beach, MO, USA', lat: 38.20, lon: -92.62 },
  { name: 'Table Rock Lake', region: 'Branson, MO, USA', lat: 36.59, lon: -93.31 },
  { name: 'Lake Erie (Western Basin)', region: 'Port Clinton / Sandusky, OH, USA', lat: 41.65, lon: -82.80 },
  { name: 'Lake Saint Clair', region: 'Harrison Twp, MI, USA', lat: 42.47, lon: -82.68 },
  { name: 'Lake Champlain', region: 'Burlington / Plattsburgh, VT / NY, USA', lat: 44.53, lon: -73.34 },
  { name: 'Lake of the Woods', region: 'Baudette, MN, USA', lat: 49.00, lon: -94.75 },
  { name: 'Mille Lacs Lake', region: 'Isle / Garrison, MN, USA', lat: 46.24, lon: -93.65 },
  { name: 'Lake Minnetonka', region: 'Wayzata, MN, USA', lat: 44.93, lon: -93.57 },
  { name: 'Lake Winnebago', region: 'Oshkosh / Fond du Lac, WI, USA', lat: 44.02, lon: -88.42 },
  { name: 'St. Lawrence River (1000 Islands)', region: 'Alexandria Bay, NY, USA', lat: 44.33, lon: -75.92 },
  { name: 'Chesapeake Bay', region: 'Annapolis, MD, USA', lat: 38.98, lon: -76.49 },
  { name: 'Florida Keys (Islamorada)', region: 'Islamorada, FL, USA', lat: 24.92, lon: -80.62 },
  { name: 'Kenai River', region: 'Soldotna / Kenai, AK, USA', lat: 60.55, lon: -151.25 },
  { name: 'Columbia River Gorge', region: 'Hood River, OR / WA, USA', lat: 45.71, lon: -121.51 },
  { name: 'Sacramento-San Joaquin Delta', region: 'Stockton, CA, USA', lat: 38.08, lon: -121.68 },
  { name: 'Clear Lake', region: 'Lakeport, CA, USA', lat: 39.02, lon: -122.81 },
  { name: 'Lake Havasu', region: 'Lake Havasu City, AZ, USA', lat: 34.48, lon: -114.36 },
  { name: 'Lake Powell', region: 'Page, AZ / UT, USA', lat: 37.06, lon: -111.48 },
  { name: 'Lake Mead', region: 'Boulder City, NV, USA', lat: 36.14, lon: -114.73 },
  { name: 'Lake Lanier', region: 'Buford / Gainesville, GA, USA', lat: 34.20, lon: -83.99 },
  { name: 'Lake Hartwell', region: 'Anderson, SC / GA, USA', lat: 34.50, lon: -82.85 },
  { name: 'Lake Murray', region: 'Columbia / Lexington, SC, USA', lat: 34.05, lon: -81.28 },
  { name: 'Santee Cooper Lakes (Marion & Moultrie)', region: 'Santee, SC, USA', lat: 33.48, lon: -80.35 },
  { name: 'Lake Norman', region: 'Mooresville / Charlotte, NC, USA', lat: 35.53, lon: -80.93 },
  { name: 'Smith Mountain Lake', region: 'Moneta / Roanoke, VA, USA', lat: 37.08, lon: -79.62 },
  { name: 'Lake Texoma', region: 'Denison / Kingston, TX / OK, USA', lat: 33.89, lon: -96.67 },
  { name: 'Grand Lake O\' the Cherokees', region: 'Grove, OK, USA', lat: 36.56, lon: -94.87 },
  { name: 'Lake Ouachita', region: 'Hot Springs, AR, USA', lat: 34.61, lon: -93.37 },
  { name: 'Bull Shoals Lake', region: 'Bull Shoals, AR / MO, USA', lat: 36.38, lon: -92.58 },
  { name: 'Pickwick Lake', region: 'Counce / Florence, TN / AL / MS, USA', lat: 35.05, lon: -88.24 },
  { name: 'Ross Barnett Reservoir', region: 'Ridgeland / Jackson, MS, USA', lat: 32.44, lon: -90.03 },
  { name: 'Lake Oconee', region: 'Greensboro, GA, USA', lat: 33.46, lon: -83.18 },
  { name: 'Lake Seminole', region: 'Bainbridge, GA / FL, USA', lat: 30.73, lon: -84.87 },
  { name: 'St. Johns River', region: 'Palatka / Astor, FL, USA', lat: 29.64, lon: -81.63 },
  { name: 'Tampa Bay', region: 'Tampa / St. Petersburg, FL, USA', lat: 27.76, lon: -82.53 },
  { name: 'Mosquito Lagoon', region: 'Titusville, FL, USA', lat: 28.78, lon: -80.79 },
  { name: 'Outer Banks (Cape Hatteras)', region: 'Buxton / Hatteras, NC, USA', lat: 35.25, lon: -75.52 },
  { name: 'Montauk Point', region: 'Montauk, Long Island, NY, USA', lat: 41.07, lon: -71.86 },
  { name: 'Cape Cod Bay', region: 'Barnstable / Provincetown, MA, USA', lat: 41.87, lon: -70.36 },
  { name: 'Puget Sound', region: 'Seattle / Tacoma, WA, USA', lat: 47.60, lon: -122.40 },
  { name: 'Lake Tahoe', region: 'Tahoe City / South Lake Tahoe, CA / NV, USA', lat: 39.09, lon: -120.03 },
  { name: 'Loch Ness', region: 'Highlands, Scotland, UK', lat: 57.32, lon: -4.42 },
];

/**
 * Searches for lakes, rivers, reservoirs, and fishing locations worldwide.
 * Uses Open-Meteo Geocoding API with fast local curated DB fallback and merging.
 */
export async function searchLakesAndWaters(query: string): Promise<LocationInfo[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length < 2) {
    return [];
  }

  const queryLower = cleanQuery.toLowerCase();

  // 1. Search local curated database first
  const localMatches = EXTENSIVE_FISHING_WATERS_DB.filter((item) => {
    return (
      item.name.toLowerCase().includes(queryLower) ||
      item.region.toLowerCase().includes(queryLower)
    );
  });

  // 2. Fetch live geocoding results from Open-Meteo Geocoding API
  let liveMatches: LocationInfo[] = [];
  try {
    const encoded = encodeURIComponent(cleanQuery);
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}&count=15&language=en&format=json`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.results)) {
        liveMatches = data.results.map((r: any) => {
          const regionParts: string[] = [];
          if (r.admin2) regionParts.push(r.admin2);
          if (r.admin1) regionParts.push(r.admin1);
          if (r.country) regionParts.push(r.country);

          let displayRegion = regionParts.join(', ');
          if (!displayRegion) displayRegion = 'Water Coordinates';

          // Add descriptor if feature indicates water
          let displayName = r.name;
          if (r.feature_code === 'LK' && !displayName.toLowerCase().includes('lake')) {
            displayName = `${displayName} (Lake)`;
          } else if (r.feature_code === 'RSV' && !displayName.toLowerCase().includes('reservoir') && !displayName.toLowerCase().includes('lake')) {
            displayName = `${displayName} (Reservoir)`;
          } else if (r.feature_code === 'STM' && !displayName.toLowerCase().includes('river') && !displayName.toLowerCase().includes('creek')) {
            displayName = `${displayName} (River/Stream)`;
          } else if (r.feature_code === 'BAY' && !displayName.toLowerCase().includes('bay')) {
            displayName = `${displayName} (Bay)`;
          }

          return {
            name: displayName,
            region: displayRegion,
            lat: +r.latitude.toFixed(4),
            lon: +r.longitude.toFixed(4),
            isCustom: true,
          };
        });
      }
    }
  } catch (err) {
    console.warn('Live geocoding error:', err);
  }

  // 3. Combine and deduplicate
  const combined: LocationInfo[] = [];
  const seen = new Set<string>();

  // Prioritize local curated matches (specifically tailored for fishing)
  for (const loc of localMatches) {
    const key = `${loc.name.toLowerCase()}-${loc.lat.toFixed(2)}-${loc.lon.toFixed(2)}`;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(loc);
    }
  }

  // Append live geocoded results
  for (const loc of liveMatches) {
    const key = `${loc.name.toLowerCase()}-${loc.lat.toFixed(2)}-${loc.lon.toFixed(2)}`;
    const nameOnlyKey = loc.name.toLowerCase();
    
    // Check if duplicate or near duplicate
    const isNearby = combined.some(
      (c) => Math.abs(c.lat - loc.lat) < 0.05 && Math.abs(c.lon - loc.lon) < 0.05
    );

    if (!seen.has(key) && !isNearby) {
      seen.add(key);
      seen.add(nameOnlyKey);
      combined.push(loc);
    }
  }

  return combined;
}
