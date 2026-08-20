import React, { useState } from 'react';
import {
  Fish,
  Camera,
  Scale,
  Ruler,
  MapPin,
  Sparkles,
  Trophy,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CatchRecord, CurrentWeather, LocationInfo, SolunarData, UnitSystem } from '../types';

interface CatchLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCatch: (catchData: Omit<CatchRecord, 'id'>) => void;
  currentLocation: LocationInfo;
  currentWeather: CurrentWeather;
  currentSolunar: SolunarData;
  unitSystem: UnitSystem;
  prefillSpecies?: string;
  prefillLure?: string;
}

export const CatchLogModal: React.FC<CatchLogModalProps> = ({
  isOpen,
  onClose,
  onSaveCatch,
  currentLocation,
  currentWeather,
  currentSolunar,
  unitSystem,
  prefillSpecies = '',
  prefillLure = '',
}) => {
  const [species, setSpecies] = useState(prefillSpecies || 'Largemouth Bass');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [lureOrBait, setLureOrBait] = useState(prefillLure || '3/8 oz Chatterbait');
  const [locationName, setLocationName] = useState(currentLocation.name);
  const [waterDepthFt, setWaterDepthFt] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isTrophy, setIsTrophy] = useState(false);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numericWeight = parseFloat(weight);
    const numericLength = parseFloat(length);
    const numericDepth = parseFloat(waterDepthFt);

    if (isTrophy) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899'],
      });
    }

    onSaveCatch({
      species: species.trim() || 'Unknown Fish',
      weight: !isNaN(numericWeight) ? numericWeight : undefined,
      length: !isNaN(numericLength) ? numericLength : undefined,
      lureOrBait: lureOrBait.trim() || 'Standard Rig',
      locationName: locationName.trim() || currentLocation.name,
      waterDepthFt: !isNaN(numericDepth) ? numericDepth : undefined,
      timestamp: new Date().toISOString(),
      notes: notes.trim() || undefined,
      photoUrl: photoUrl || undefined,
      isTrophy,
      weatherSnapshot: {
        temp: currentWeather.temp,
        pressureTrend: currentWeather.pressureTrend,
        moonPhase: currentSolunar.moonPhaseName,
        solunarScore: currentSolunar.ratingScore,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Fish className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Log New Catch</h3>
              <p className="text-[11px] text-slate-400">
                Auto-attaches current solunar & weather conditions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Species Selector / Input */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Species Name</label>
            <input
              type="text"
              required
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="e.g. Largemouth Bass, Freshwater Striped Bass, Crappie"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {[
                'Largemouth Bass',
                'Smallmouth Bass',
                'Crappie (Black & White)',
                'Freshwater Striped Bass & Hybrid Stripers',
                'Catfish (Channel, Flathead & Blue)',
                'Panfish (Bluegill & Sunfish)',
              ].map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSpecies(sp)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                    species === sp
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* Weight and Length Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Weight ({unitSystem === 'imperial' ? 'lbs' : 'kg'})
              </label>
              <div className="relative">
                <Scale className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 5.4"
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Length ({unitSystem === 'imperial' ? 'inches' : 'cm'})
              </label>
              <div className="relative">
                <Ruler className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  step="0.1"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="e.g. 21.5"
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Lure / Bait & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Lure / Bait Used</label>
              <input
                type="text"
                required
                value={lureOrBait}
                onChange={(e) => setLureOrBait(e.target.value)}
                placeholder="e.g. 3/8 oz Chatterbait, Ned Rig"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Water Depth (ft)</label>
              <input
                type="number"
                step="0.5"
                value={waterDepthFt}
                onChange={(e) => setWaterDepthFt(e.target.value)}
                placeholder="e.g. 6.5"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Location / Spot</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. North Point Shoreline"
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Catch Photo (Optional)</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer text-slate-300 hover:text-white transition">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Choose / Take Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {photoUrl && (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-emerald-500">
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center text-rose-400 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Angler Notes & Structure</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bit on the fall right next to the submerged cypress tree on a weedline."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Trophy Checkbox */}
          <div className="flex items-center gap-2.5 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <input
              type="checkbox"
              id="trophy-catch-check"
              checked={isTrophy}
              onChange={(e) => setIsTrophy(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700 cursor-pointer"
            />
            <label htmlFor="trophy-catch-check" className="cursor-pointer text-slate-200 font-semibold flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              Mark as Trophy Catch / Personal Record
            </label>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Save to Journal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
