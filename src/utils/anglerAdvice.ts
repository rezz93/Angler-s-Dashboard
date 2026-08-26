/**
 * Shared angler-advice logic used by both the browser client and the Express server,
 * so the static GitHub Pages build produces the same briefings as a hosted server.
 */

export interface AnglerConditions {
  location?: string;
  weather?: string;
  airTemp?: string;
  pressure?: string;
  pressureTrend?: string;
  waterTemp?: string;
  inflowOutflow?: string;
  poolElevation?: string;
  windSpeed?: string;
  windDirection?: string;
  solunarScore?: string | number;
  solunarQuality?: string;
  moonPhase?: string;
  solunarBestTimes?: string;
  targetSpecies?: string;
}

export const ANGLER_SYSTEM_INSTRUCTION = `You are a legendary Master Angler, tournament fishing guide, and fisheries biologist with deep expertise in Pikeville, Kentucky and Fishtrap Lake (USACE reservoir on the Levisa Fork).
Target species for this lake include: Largemouth Bass, Smallmouth Bass, Crappie (Black & White), Panfish (Bluegill/Sunfish), Catfish (Channel, Flathead, Blue), and Freshwater Striped Bass / Hybrid Stripers.
You provide direct, precise, actionable answers to the angler's exact question based on official USACE Huntington District real-time water temperature, pool elevation, barometer trend, wind, and solunar feeding windows.
Always include explicit statements about:
1. Expected Weather Conditions: How current and forecasted weather (barometer, wind, sky condition, temperature) affect fish behavior and positioning today.
2. Solunar Best Times for the Day: Exact peak feeding windows (Major and Minor solunar periods, dawn/dusk transitions) and how the angler should schedule their key presentations during these times.
Format your response with clear headings, bullet points, specific lure setups, exact depths, colors, and retrieve cadences.
Directly answer whatever the user asked without repeating generic template summaries.`;

export function buildConditionsContext(conditions?: AnglerConditions): string {
  if (!conditions) return '';
  return `\n\nCURRENT FISHTRAP LAKE & PIKEVILLE CONDITIONS & EXPECTED WEATHER:
- Location: ${conditions.location || 'Fishtrap Lake, Pikeville KY'}
- Official USACE Lake Water Temp: ${conditions.waterTemp || 'unavailable'}
- Expected Weather: ${conditions.weather || 'unavailable'}, Air Temp: ${conditions.airTemp || 'unavailable'}
- Barometric Pressure: ${conditions.pressure || 'unavailable'} (${conditions.pressureTrend || 'steady'})
- Wind: ${conditions.windSpeed || 'unavailable'} from ${conditions.windDirection || 'unavailable'}
- Pool Elevation: ${conditions.poolElevation || 'unavailable'}
- Solunar Best Times for Today: ${conditions.solunarBestTimes || 'unavailable'}
- Solunar Score: ${conditions.solunarScore ?? 'unavailable'}/100 (${conditions.solunarQuality || 'unavailable'})
- Moon Phase: ${conditions.moonPhase || 'unavailable'}
- Inflow/Outflow: ${conditions.inflowOutflow || 'unavailable'}
- Target Species: ${conditions.targetSpecies || 'Bass, Crappie, Panfish, Catfish, Freshwater Stripers'}`;
}

export function generateHeuristicAdvice(prompt: string, conditions?: AnglerConditions): string {
  const q = prompt.toLowerCase();
  const pTrend = conditions?.pressureTrend?.toLowerCase() || 'steady';
  const waterTemp = conditions?.waterTemp || 'unavailable';
  const wind = conditions?.windSpeed || 'unavailable';
  const moon = conditions?.moonPhase || 'Current Moon';

  // 1. Freshwater Stripers & Hybrid Striped Bass (Fishtrap Lake)
  if (q.includes('striper') || q.includes('striped') || q.includes('wiper') || q.includes('hybrid')) {
    return `### 🎣 Freshwater Striped Bass & Hybrid Tactics (Fishtrap Lake)

**Fishtrap Lake Striper Pattern:**
• **Current Habitat:** Freshwater stripers and hybrid wipers roam the deep open-water channels near **Fishtrap Dam**, the **Levisa Fork channel bends**, and high-oxygen spillway tailwaters.
• **Target Depth:** **15 to 32 ft** suspended below roaming schools of gizzard shad. Use electronics to locate bait balls.
• **Top Lure Presentations:**
  1. **Trolling / Vertical:** 3/4 oz to 1 oz White Bucktail Jig tipped with a 4" paddle-tail or live gizzard shad.
  2. **Schooling Boils (Dawn/Dusk):** 5" Walking Topwater Spook or Sebile Magic Swimmer cast into breaking surface blitzes.
  3. **Deep Channels:** Alabama / Umbrella rig with 1/4 oz heads and pearl shad trailers slow-trolled at 2.2 mph.
• **Tactical Pro Tip:** When USACE releases water at the dam (outflow current active), fish the immediate tailwater eddies where stripers stage facing upstream to ambush disoriented shad.`;
  }

  // 2. Crappie Tactics & Brush Piles
  if (q.includes('crappie') || q.includes('brush') || q.includes('slab')) {
    return `### 🎣 Crappie Blueprint for Fishtrap Lake

**Structure & Depth Zone:**
• **Target Depth:** **8 to 16 ft** over submerged timber, cedar brush piles, and bridge pilings in **Grapevine Creek** and **Hurricane Creek** arms.
• **Feeding Habit:** Crappie eyes are fixed upward—always position your lure **1 to 2 feet above** the structure.
• **Top Recommended Setups:**
  1. **1/16 oz Marabou Jig** in *Monkey Milk*, *Electric Chicken*, or *Pink/White* on 4 lb test fluorocarbon.
  2. **2" Bobby Garland Baby Shad** with slow vertical pendulum cadence.
  3. **Live Minnow on Slip Bobber Rig** pegged right over the top crown of timber.
• **Barometer Strategy (${pTrend}):** If the barometer is stable or falling, work aggressive horizontal sweeps; under high post-front pressure, deadstick the jig with subtle rod shakes.`;
  }

  // 3. Panfish & Bluegill
  if (q.includes('panfish') || q.includes('bluegill') || q.includes('sunfish') || q.includes('shellcracker') || q.includes('bream')) {
    return `### 🎣 Panfish & Bluegill Strategy (Fishtrap Lake & Coves)

**Location & Depths:**
• **Target Depth:** **2 to 8 ft** around shaded boat docks, shoreline rock pockets, overhanging trees, and gravel bedding banks.
• **Top Setups:**
  1. **Live Crickets or Redworms** on a #6 Aberdeen hook, 2–3 ft below a light balsa pencil float.
  2. **1/64 oz Micro Beetle Spin** (Black/Yellow or Chartreuse) on ultralight spinning tackle (2–4 lb line).
  3. **1/32 oz Trout Magnet** with micro split shot worked along shaded dock pilings.
• **Tactical Note:** Great action all summer long in sheltered coves; fish the shaded bank in late afternoon during peak solunar periods.`;
  }

  // 4. Catfish (Channel, Flathead, Blue)
  if (q.includes('catfish') || q.includes('cat') || q.includes('flathead') || q.includes('blue cat') || q.includes('channel cat')) {
    return `### 🎣 Catfish River & Channel Strategy (Levisa Fork & Fishtrap)

**Structure & Night/Day Holding:**
• **Target Depth:** **18 to 42 ft** in deep river bends, submerged rock humps, and mud-to-rock transition shelves.
• **Top Baits & Rigging:**
  1. **Big Flatheads:** Live 4–5" Bluegill on a 6/0 circle hook with 2 oz slip sinker anchored near deep timber.
  2. **Blues & Channel Cats:** Fresh Cut Gizzard Shad or chicken liver on a Carolina slip-sinker rig.
  3. **High Inflow Tactics:** When water discharge is elevated, cast right onto the edges of current seams where food washes down.
• **Solunar Pro Tip:** Catfish feeding runs peak in twilight into dark, coinciding with Major Solunar periods.`;
  }

  // 5. Largemouth & Smallmouth Bass
  if (q.includes('bass') || q.includes('largemouth') || q.includes('smallmouth') || q.includes('smallie') || q.includes('bronze')) {
    return `### 🎣 Fishtrap Bass Master Tactical Guide

**Bass Locations & Patterns:**
• **Largemouth (4–14 ft):** Primary creek channels, standing timber in cove pockets, and shaded side of rock bluffs.
  - *Top Setup:* 3/8 oz Bladed Chatterbait in Green Pumpkin, or Texas-rigged 5" Stickbait pitched into wood cover.
• **Smallmouth (10–25 ft):** Main lake rocky points, boulder banks, and dam riprap with active breeze.
  - *Top Setup:* 1/5 oz Ned Rig (TRD in PB&J/Gobie) or Drop Shot with 4.5" Roboworm dragged slowly over rock breaks.
• **Current Barometer Alert (${pTrend}):** ${
      pTrend.includes('falling')
        ? 'Barometer is falling! Bass are moving shallow to feed aggressively—power fish secondary points with squarebills and spinnerbaits.'
        : 'Barometer is high/stable—slow down presentation and make bottom contact with finesse jigs and ned rigs.'
    }`;
  }

  // 6. Lure Colors & Water Clarity
  if (q.includes('color') || q.includes('clarity') || q.includes('muddy') || q.includes('stained') || q.includes('clear')) {
    return `### 🎣 Pro Color Selection Guide for Today's Water

**Water Clarity Rules for Fishtrap Lake:**
• **Stained / Murky Water (0–2 ft visibility):**
  - *Reaction Lures:* High-contrast **Black & Blue**, **Chartreuse/White**, or **Firetiger** with loud thumping blades.
  - *Bottom Baits:* **Black & Blue Flake**, **Junebug**, or **Dark Melon** for maximum silhouette visibility.
• **Clear / Summer Pool (3–6 ft visibility):**
  - *Reaction Lures:* **Ghost Minnow**, **Natural Sexy Shad**, or **Translucent Bluegill**.
  - *Soft Plastics:* **Green Pumpkin**, **Watermelon Red Flake**, or **Smoke Purple**.
• **Pro Tip:** In low light or dawn/dusk, dark colors cast the strongest silhouette against the surface light.`;
  }

  // 7. Depth & Sonar
  if (q.includes('depth') || q.includes('deep') || q.includes('shallow') || q.includes('sonar')) {
    return `### 🎣 Water Column & Depth Blueprint

**Current Fishtrap Lake Depth Zones (Water Temp: ${waterTemp}):**
• **Surface to 6 ft:** Dawn/dusk topwater and shallow weed/timber feeding (Panfish, early Bass blitzes).
• **8 to 16 ft (Prime Thermal Ledge):** Crappie suspended in brush, Largemouth holding on secondary creek drops.
• **18 to 35 ft (Deep Channels & Structure):** Smallmouth on rocky points, Stripers tracking shad schools, Catfish in river bends.
• **Tactical Rule:** Always target the upper 1/3 of brush piles where predatory species look upward to ambush prey.`;
  }

  // 8. Wind & Weather / Levisa Fork
  if (q.includes('wind') || q.includes('weather') || q.includes('levisa') || q.includes('temp') || q.includes('rain') || q.includes('barometer')) {
    return `### 🎣 Environmental & Wind Strategy for Pikeville Waters

**Live Weather Analysis:**
• **Wind Speed (${wind}):** Wind creates "current" on Fishtrap Lake. Always position your boat downwind and cast into wind-blown rocky points where baitfish are trapped.
• **Water Temp (${waterTemp}):** Warm summer thermoclines concentrate sportfish around deep structure and oxygenated tailwaters.
• **Barometric Trend (${pTrend}):** ${
      pTrend.includes('falling')
        ? 'Aggressive pre-frontal feeding! Use fast-moving reaction baits.'
        : 'Fish are locked tight to cover. Focus on slow finesse bottom presentations.'
    }
• **Solunar Phase (${moon}):** Target peak bite windows when solunar gravitational pull aligns with morning/evening low light.`;
  }

  // 9. General Custom Question Fallback
  return `### 🎣 AI Master Angler Tactical Response

**Analysis for "${prompt}":**
• **Location Insight:** Fishtrap Lake (USACE #FTPK2) on the Levisa Fork features steep rocky shorelines, deep creek channels (Grapevine/Hurricane), and rich baitfish populations.
• **Current Conditions:** Barometer is ${pTrend}, water temp is ~${waterTemp}, and wind is ${wind}.
• **Recommended Game Plan:**
  1. **Early Morning / Solunar Peaks:** Work windblown points and main lake ledges with reaction baits (Chatterbaits, Spooks, Swimbaits).
  2. **Midday Sun:** Shift to 10–20 ft depths targeting shaded rock bluffs, submerged brush piles, and drop-offs with finesse Ned rigs or 1/16 oz crappie jigs.
  3. **Night / Tailwater:** Target deep channel bends for catfish and stripers tracking baitfish schools.

*Tight lines and make every cast count on Fishtrap!*`;
}
