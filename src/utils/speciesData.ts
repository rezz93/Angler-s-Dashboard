import { CurrentWeather, SolunarData, TargetSpecies } from '../types';

export const BASE_SPECIES_LIST: Omit<TargetSpecies, 'activityRating' | 'activityTier'>[] = [
  {
    id: 'largemouth_bass',
    name: 'Largemouth Bass',
    scientificName: 'Micropterus salmoides',
    category: 'Freshwater',
    depthZone: '4 - 15 ft (Fishtrap coves, timber & secondary points)',
    topLures: ['3/8 oz Bladed Chatterbait', 'Texas-rigged 5" Senko / Craw', 'Squarebill 1.5 Crankbait', 'Deep Diving 6XD Crankbait'],
    bestColors: ['Green Pumpkin', 'Watermelon Red', 'Black & Blue', 'Sexy Shad'],
    technique: 'Cast tight to submerged timber, shoreline brush, and rock transitions. During summer pool, target 8–14 ft ledges along Levisa Fork creek channels.',
    proTip: 'Midday bass at Fishtrap Lake suspend off steep rock bluff walls and creek channel bends—target shaded transitions during peak solunar windows.',
  },
  {
    id: 'smallmouth_bass',
    name: 'Smallmouth Bass',
    scientificName: 'Micropterus dolomieu',
    category: 'Freshwater',
    depthZone: '8 - 25 ft (Dam riprap, main lake rocky points & humps)',
    topLures: ['1/5 oz Ned Rig (TRD)', '3.5" Tube Jig', 'Drop Shot Finesse Worm', 'Deep Suspending Jerkbait'],
    bestColors: ['Green Pumpkin Gobie', 'Smoke Purple Flake', 'Ghost Minnow', 'Brown Craw'],
    technique: 'Drift over rocky shoals and drag bottom baits slowly. Pause 4–6 seconds between subtle twitches on boulder transitions near deep water.',
    proTip: 'Bronzebacks love current and rocky structure near the dam and lower basin. Target wind-blown riprap when breeze pushes baitfish against structure.',
  },
  {
    id: 'crappie',
    name: 'Crappie (Black & White)',
    scientificName: 'Pomoxis nigromaculatus / P. annularis',
    category: 'Freshwater',
    depthZone: '6 - 18 ft (Submerged brush piles, timber & bridge pilings)',
    topLures: ['1/16 oz Marabou Jig', '2" Bobby Garland Baby Shad', 'Live Minnows on Slip Bobber', '1/32 oz Micro Tube Jig'],
    bestColors: ['Monkey Milk', 'Electric Chicken', 'Chartreuse Pearl', 'Pink / White'],
    technique: 'Slow pendulum vertical jigging past brush piles and stake beds along Fishtrap creek arms (Grapevine and Hurricane Creek).',
    proTip: 'Crappie always feed looking upward—keep your minnow or jig 1 to 2 feet above marked brush on your fish finder.',
  },
  {
    id: 'panfish',
    name: 'Panfish (Bluegill & Sunfish)',
    scientificName: 'Lepomis macrochirus / L. microlophus',
    category: 'Freshwater',
    depthZone: '2 - 10 ft (Shallow coves, dock pilings & weedlines)',
    topLures: ['Live Crickets / Redworms', '1/64 oz Micro Beetle Spin', 'Trout Magnet on Float', 'Tiny Popping Bug (Fly/Spin)'],
    bestColors: ['Natural Earthworm', 'Chartreuse / Black', 'Pearl White', 'Yellow / Black Stripe'],
    technique: 'Suspend live bait 2–4 feet below a sensitive pencil float near shoreline timber, dock slips, and gravel bedding banks.',
    proTip: 'Great action all season in sheltered Fishtrap coves; look for circular sandy dish nests and shaded shoreline bank vegetation.',
  },
  {
    id: 'catfish',
    name: 'Catfish (Channel, Flathead & Blue)',
    scientificName: 'Ictalurus punctatus / Pylodictis olivaris / I. furcatus',
    category: 'Freshwater',
    depthZone: '15 - 45 ft (Deep river channel bends, mud flats & dam tailwater)',
    topLures: ['Fresh Cut Gizzard Shad', 'Live Bluegill (for Flatheads)', 'Chicken Liver on Circle Hook', 'Stink / Dip Bait on Sponge Rig'],
    bestColors: ['Fresh Bloody Cut', 'Garlic / Anise infused scent'],
    technique: 'Fan-cast 3–4 rods staggered across the main Levisa Fork river channel with heavy 2–3 oz slip sinkers and 5/0 circle hooks.',
    proTip: 'Nighttime and cloudy afternoon inflow periods trigger heavy feeding runs as big blues and channel cats cruise onto shallow flats to feed on shad.',
  },
  {
    id: 'striped_bass',
    name: 'Freshwater Striped Bass & Hybrid Stripers',
    scientificName: 'Morone saxatilis / Morone chrysops x saxatilis',
    category: 'Freshwater',
    depthZone: '12 - 35 ft (Open water basins, deep channel humps & dam tailrace)',
    topLures: ['1/2 - 1 oz Bucktail Jig with Shad Trailer', 'Alabama / Umbrella Rig', '5" Paddle Tail Swimbait', 'Deep Diving Bandit / Red Fin', 'Topwater Walking Bait (Spook)'],
    bestColors: ['Bone White', 'Silver Flash / Blueback', 'Chartreuse Shad', 'Chrome / Black Back'],
    technique: 'Troll deep open-water channels near Fishtrap Dam and Levisa Fork; watch for surface schooling "boils" at dawn and dusk to cast topwater and swimbaits directly into breaking fish.',
    proTip: 'Fishtrap freshwater stripers and wipers shadow roaming schools of gizzard shad. Use your sonar to find bait balls in 20–35 ft depths, or fish the tailwaters when spillway discharge generates high-oxygen current.',
  }
];

export function getComputedSpeciesList(
  weather: CurrentWeather,
  solunar: SolunarData
): TargetSpecies[] {
  return BASE_SPECIES_LIST.map((sp) => {
    let score = solunar.ratingScore;

    // Environmental water temperature adjustments
    if (sp.id === 'striped_bass') {
      if (weather.estimatedWaterTemp >= 60 && weather.estimatedWaterTemp <= 76) score += 14;
      if (weather.windSpeed >= 8) score += 8; // Stripers feed in wind chop and current
    } else if (sp.id === 'largemouth_bass') {
      if (weather.estimatedWaterTemp >= 64 && weather.estimatedWaterTemp <= 80) score += 12;
    } else if (sp.id === 'smallmouth_bass') {
      if (weather.estimatedWaterTemp >= 58 && weather.estimatedWaterTemp <= 74) score += 10;
    } else if (sp.id === 'crappie') {
      if (weather.estimatedWaterTemp >= 55 && weather.estimatedWaterTemp <= 72) score += 10;
    } else if (sp.id === 'catfish') {
      if (weather.estimatedWaterTemp >= 68) score += 15; // Cats love warm summer water
    } else if (sp.id === 'panfish') {
      if (weather.estimatedWaterTemp >= 65) score += 10;
    }

    // Barometric adjustments
    if (weather.pressureTrend === 'falling' || weather.pressureTrend === 'falling_fast') {
      score += 10;
    } else if (weather.pressureTrend === 'rising_fast') {
      score -= 10;
    }

    // Wind adjustments
    if (weather.windSpeed >= 6 && weather.windSpeed <= 16) {
      score += 5;
    }

    const finalRating = Math.min(98, Math.max(25, Math.round(score)));

    let activityTier: TargetSpecies['activityTier'] = 'Moderate';
    if (finalRating >= 80) activityTier = 'Hot Bite';
    else if (finalRating >= 55) activityTier = 'Moderate';
    else activityTier = 'Slow Bite';

    return {
      ...sp,
      activityRating: finalRating,
      activityTier,
    };
  });
}

