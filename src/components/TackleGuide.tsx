import React, { useState } from 'react';
import {
  Waves,
  Shield,
  Zap,
  Target,
  Sparkles,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { CurrentWeather, SolunarData, UnitSystem } from '../types';

interface TackleGuideProps {
  weather: CurrentWeather;
  solunar: SolunarData;
  unitSystem: UnitSystem;
}

export const TackleGuide: React.FC<TackleGuideProps> = ({
  weather,
  solunar,
  unitSystem,
}) => {
  const [activeRodIndex, setActiveRodIndex] = useState(0);

  // Dynamic tactical gear setups based on environmental factors
  const isFallingPressure = weather.pressureTrend.includes('falling');
  const isHighWind = weather.windSpeed > 12;
  const isMurky = weather.estimatedWaterClarity === 'Murky' || weather.estimatedWaterClarity === 'Muddy';

  const tackleSetups = [
    {
      role: 'Rod #1: Primary Power / Reaction Bait',
      recommendedFor: isFallingPressure ? 'Aggressive pre-front reaction strikes' : 'Active search cadence',
      rod: '7\'1" Medium-Heavy Fast Action Baitcasting',
      reel: '7.1:1 Gear Ratio High-Speed Reel',
      line: isMurky ? '50 lb Braid to 17 lb Monofilament' : '15 lb 100% Fluorocarbon',
      terminal: 'Crosslock Snap or Direct Palomar Knot',
      lureSet: [
        '3/8 oz Bladed Jig (Chatterbait) with 3.8" Paddle Tail',
        '1/2 oz Double Willow Spinnerbait (White/Chartreuse)',
        'Squarebill 1.5 Crankbait (Dives 3-5 ft)',
      ],
      colorRule: isMurky ? 'Dark silhouettes (Black/Blue, Junebug) or high-vis Chartreuse' : 'Natural Ghost Shad or Green Pumpkin',
      cadence: isFallingPressure ? 'Fast burn with aggressive rod rips to trigger instinct strikes' : 'Medium steady roll contacting cover',
    },
    {
      role: 'Rod #2: Bottom Contact / Finesse Cover',
      recommendedFor: 'Midday lulls & high pressure bottom huggers',
      rod: '7\'0" Medium Fast Action Spinning',
      reel: '2500 / 3000 Series Spinning Reel',
      line: '10 lb Braid main line with 8 lb Fluorocarbon leader (7 ft FG knot)',
      terminal: '1/0 EWG Hook or 1/15 oz Ned Mushroom Jighead',
      lureSet: [
        'Ned Rig (2.75" TRD in Green Pumpkin / Copperhead)',
        'Weightless 5" Stickbait (Wacky Rig with O-Ring)',
        '3.5" Drop Shot Roboworm on #2 ReBarb Hook',
      ],
      colorRule: 'Green Pumpkin, Watermelon Red Flake, Morning Dawn',
      cadence: 'Deadstick for 5-8 seconds. Subtle shake without moving the weight off bottom.',
    },
    {
      role: 'Rod #3: Deep Structure / Drop-off Hunter',
      recommendedFor: 'Suspended fish over main lake points & channels',
      rod: '7\'4" Heavy Moderate-Fast Action Casting',
      reel: '6.3:1 Winch / High-Torque Casting Reel',
      line: '12 lb - 14 lb Low-Stretch Fluorocarbon',
      terminal: '1/2 oz Football Jig with wire weedguard',
      lureSet: [
        '1/2 oz Football Jig with Chunk Trailer',
        'Deep Diving Crankbait (12 - 18 ft depth range)',
        '3/4 oz Underspin with Keitech Swimbait',
      ],
      colorRule: 'Brown/Purple, Crawfish Orange, Ayu, Threadfin Shad',
      cadence: 'Slow dragging across rock transitions. Maintain bottom contact feel at all times.',
    },
    {
      role: 'Rod #4: Low-Light & Surface Ambush',
      recommendedFor: 'Dawn, Dusk, and Solunar Major Windows',
      rod: '7\'3" Heavy Fast Action Casting',
      reel: '7.3:1 - 8.1:1 High-Speed Reel for rapid line pickup',
      line: '50 - 65 lb Braided Line (Zero stretch)',
      terminal: 'Non-slip Loop Knot or heavy Palomar',
      lureSet: [
        'Hollow Body Frog over lily pads & matted vegetation',
        'Whopper Plopper 110 (Bone White / Loon Black)',
        'Walk-the-dog Topwater Spook',
      ],
      colorRule: 'Black / Dark Belly for low light contrast; Bone White for bright surface glare',
      cadence: 'Rhythmic chug and pause 2-3 seconds near heavy brush or weed edges.',
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Waves className="w-5 h-5 text-emerald-400" />
          Tactical Deck Rigging & Tackle Box Guide
        </h2>
        <p className="text-xs text-slate-400">
          Optimal rod setups, line weights, and terminal knots tuned for today's {weather.pressureTrend} barometer, {weather.windSpeed} mph wind, and {weather.estimatedWaterClarity.toLowerCase()} water.
        </p>
      </div>

      {/* Setup Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tackleSetups.map((setup, idx) => (
          <button
            key={idx}
            onClick={() => setActiveRodIndex(idx)}
            className={`text-left p-3.5 rounded-2xl border transition-all ${
              activeRodIndex === idx
                ? 'bg-slate-800 border-emerald-500/80 shadow-lg shadow-emerald-950/50 scale-[1.02]'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className={activeRodIndex === idx ? 'text-emerald-400' : 'text-slate-400'}>
                Rod Setup #{idx + 1}
              </span>
              {activeRodIndex === idx && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <div className="text-sm font-bold text-slate-100 line-clamp-1">{setup.role.split(':')[1]}</div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{setup.recommendedFor}</div>
          </button>
        ))}
      </div>

      {/* Active Rod Detailed Card */}
      {tackleSetups[activeRodIndex] && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Active Tactical Profile
              </span>
              <h3 className="text-xl font-extrabold text-slate-100">
                {tackleSetups[activeRodIndex].role}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Targeted for: {tackleSetups[activeRodIndex].recommendedFor}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold">
                ✓ Ready for Launch
              </span>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Specs */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-teal-400" />
                Hardware Configuration
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Rod Blank:</span>
                  <strong className="text-slate-100">{tackleSetups[activeRodIndex].rod}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Reel & Ratio:</span>
                  <strong className="text-slate-100">{tackleSetups[activeRodIndex].reel}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Line Spool:</span>
                  <strong className="text-slate-100">{tackleSetups[activeRodIndex].line}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Terminal Knot:</span>
                  <strong className="text-slate-100">{tackleSetups[activeRodIndex].terminal}</strong>
                </div>
              </div>
            </div>

            {/* Right Tactical Recommendations */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" />
                Lure Selection & Cadence
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Recommended Lures:</span>
                  <ul className="space-y-1">
                    {tackleSetups[activeRodIndex].lureSet.map((lure, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {lure}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-800/60">
                  <span className="text-slate-400 block text-[11px]">Color Selection:</span>
                  <p className="text-slate-200 font-medium">{tackleSetups[activeRodIndex].colorRule}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Cadence & Presentation:</span>
                  <p className="text-emerald-300 font-medium">{tackleSetups[activeRodIndex].cadence}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
