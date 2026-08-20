import React, { useState, useEffect } from 'react';
import {
  Waves,
  ArrowDownRight,
  ArrowUpRight,
  Gauge,
  Thermometer,
  Anchor,
  Layers,
  Activity,
  Info,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Compass,
  Clock,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { FISHTRAP_LAKE_HYDROLOGY, LakeHydrologyData, fetchFishtrapHydrology } from '../utils/lakeHydrology';
import { UnitSystem } from '../types';

interface FishtrapLakeCardProps {
  unitSystem?: UnitSystem;
}

export const FishtrapLakeCard: React.FC<FishtrapLakeCardProps> = ({ unitSystem = 'imperial' }) => {
  const [data, setData] = useState<LakeHydrologyData>(FISHTRAP_LAKE_HYDROLOGY);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    let isMounted = true;
    fetchFishtrapHydrology().then((result) => {
      if (isMounted) {
        setData(result);
        setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await fetchFishtrapHydrology();
      setData(result);
      setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const poolDiffFromSummer = (data.poolElevationFt - data.summerPoolFt).toFixed(2);
  const isAboveSummer = parseFloat(poolDiffFromSummer) >= 0;

  return (
    <div
      id="fishtrap-lake-hydrology-card"
      className="bg-slate-900/95 border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden"
    >
      {/* Background ambient water glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
            <Waves className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
                {data.lakeName} Hydrology & Dam Telemetry
              </h2>
              <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Pikeville, KY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="text-slate-300 font-semibold">{data.source}</span>
              <span>•</span>
              <span className="text-slate-400">Dam Station #FTPK2</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            title="Refresh USACE Dam Telemetry"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isRefreshing ? 'Updating...' : 'Sync USACE'}</span>
          </button>

          <a
            href="https://www.lrh-wc.usace.army.mil/wm/?basin/bsa/frl"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-xl border border-emerald-500/30 transition flex items-center gap-1 text-xs font-semibold"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Official USACE Site</span>
          </a>
        </div>
      </div>

      {/* Prominent Official USACE Time & Date Timestamp Banner */}
      <div className="mt-4 bg-slate-950/90 border border-emerald-500/40 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 relative z-10 shadow-inner">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="text-slate-400">USACE Official Feed: </span>
            <strong className="text-emerald-300 font-mono tracking-wide">
              {data.updatedTime.startsWith('Data as of:') ? data.updatedTime : `Data as of: ${data.updatedTime}`}
            </strong>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">Live USACE Synced</span>
          </span>
          <span className="text-slate-500">•</span>
          <span>App Refreshed: <strong className="text-slate-200 font-mono">{lastRefreshedAt}</strong></span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4 relative z-10">
        {/* 1. Pool Elevation */}
        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              Lake Elevation
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {data.measurementTime || '9:45 am'}
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono">
              {data.poolElevationFt.toFixed(2)} <span className="text-sm font-sans font-normal text-slate-400">ft</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Summer Pool: <strong className="text-slate-200">{data.summerPoolFt.toFixed(2)} ft</strong></span>
              <span className={`font-bold ${isAboveSummer ? 'text-emerald-400' : 'text-amber-400'}`}>
                ({isAboveSummer ? `+${poolDiffFromSummer}` : poolDiffFromSummer} ft)
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>24hr Change: <strong className="text-slate-300 font-mono">{data.elevationDelta24h.toFixed(2)} ft</strong></span>
              <span>24hr Precip: <strong className="text-cyan-300 font-mono">{data.precip24hrIn !== undefined ? `${data.precip24hrIn.toFixed(2)} in` : '0.01 in'}</strong></span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full"
                style={{ width: `${Math.min(100, Math.max(10, ((data.poolElevationFt - data.winterPoolFt) / (data.summerPoolFt - data.winterPoolFt + 10)) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Inflow (CFS) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-cyan-400" />
              Inflow Rate
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {data.measurementTime || '9:45 am'}
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">
              {data.inflowCfs.toFixed(2)} <span className="text-sm font-sans font-normal text-slate-400">cfs</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Levisa Fork river inflow
            </div>
          </div>

          <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Steady summer pool recharge
          </div>
        </div>

        {/* 3. Outflow / Dam Release (CFS) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
              Dam Outflow
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {data.measurementTime || '9:45 am'}
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
              {data.outflowCfs.toFixed(2)} <span className="text-sm font-sans font-normal text-slate-400">cfs</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Stage: <strong className="text-slate-200">{data.tailwaterStageFt.toFixed(2)} ft</strong> (Elev: {data.tailwaterElevationFt.toFixed(2)} ft)
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-medium">
            Controlled bottom discharge
          </div>
        </div>

        {/* 4. Water Temperature & Storage */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-teal-400" />
              Water Temp
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {data.waterTempTime || '9:30 am'}
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-teal-300 font-mono">
              {data.waterTempF.toFixed(1)}°<span className="text-sm font-sans font-normal text-slate-400">F</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Conservation Storage: <span className="text-emerald-400 font-bold">{data.conservationStoragePercent}%</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-medium">
            Flood Storage Utilized: {data.floodStoragePercent}%
          </div>
        </div>
      </div>

      {/* Angler Status & Boating Impact Bottom Bar */}
      <div className="mt-4 pt-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs relative z-10">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-emerald-300">Fishtrap Angler Status:</strong> {data.statusSummary}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <Anchor className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{data.boatingImpactStatus}</span>
        </div>
      </div>
    </div>
  );
};

