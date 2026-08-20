import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  QrCode,
  Laptop,
  Monitor,
  Copy,
  Check,
  ExternalLink,
  Download,
  Sparkles,
  Command,
  PlusCircle,
  Link as LinkIcon,
  Maximize2,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const AndroidQRView: React.FC = () => {
  const defaultUrl =
    typeof window !== 'undefined' && window.location.origin && window.location.origin.startsWith('http')
      ? window.location.origin
      : 'https://ais-dev-fkxyu7iu6ivgxqxms2psil-116799203877.us-east1.run.app';

  const [activeTab, setActiveTab] = useState<'mobile' | 'pc'>('mobile');
  const [targetUrl, setTargetUrl] = useState<string>(defaultUrl);
  const [customInputUrl, setCustomInputUrl] = useState<string>(defaultUrl);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [colorTheme, setColorTheme] = useState<'dark' | 'emerald' | 'amber'>('dark');

  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall();

  const themeColors = {
    dark: { dark: '#000000', light: '#ffffff' },
    emerald: { dark: '#022c22', light: '#ecfdf5' },
    amber: { dark: '#451a03', light: '#fffbeb' },
  };

  useEffect(() => {
    QRCode.toDataURL(targetUrl, {
      width: 420,
      margin: 3,
      color: themeColors[colorTheme],
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [targetUrl, colorTheme]);

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInputUrl.trim()) {
      setTargetUrl(customInputUrl.trim());
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'anglers_daily_qr.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Globe className="w-6 h-6 text-emerald-400" />
            Android Mobile & Google Chrome PC Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access, install, and sync Angler's Daily Dashboard across Android smartphones, tablets, and Google Chrome on PC.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'Link Copied!' : 'Copy Direct URL'}</span>
          </button>

          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in Standalone Tab</span>
          </a>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 max-w-md">
        <button
          onClick={() => setActiveTab('mobile')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
            activeTab === 'mobile'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Android Mobile QR</span>
        </button>
        <button
          onClick={() => setActiveTab('pc')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
            activeTab === 'pc'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Chrome PC & Desktop</span>
        </button>
      </div>

      {/* VIEW 1: ANDROID MOBILE */}
      {activeTab === 'mobile' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left QR Display (5 cols) */}
          <div className="md:col-span-5 bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center space-y-4">
            <div className="w-full flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <QrCode className="w-4 h-4" /> Mobile QR Code
              </span>
              <div className="flex items-center gap-1.5">
                {(['emerald', 'dark', 'amber'] as const).map((th) => (
                  <button
                    key={th}
                    onClick={() => setColorTheme(th)}
                    title={`Use ${th} theme`}
                    className={`w-4 h-4 rounded-full border transition ${
                      colorTheme === th ? 'border-white scale-110' : 'border-transparent opacity-60'
                    } ${
                      th === 'emerald'
                        ? 'bg-emerald-400'
                        : th === 'dark'
                        ? 'bg-slate-300'
                        : 'bg-amber-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Rendered QR Image */}
            <div className="p-4 bg-white rounded-2xl shadow-xl border-2 border-emerald-400/80 flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Live QR Code to access Angler's Daily Dashboard on Android"
                  className="w-64 h-64 rounded-lg object-contain"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            <button
              onClick={handleDownloadQR}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download High-Res QR PNG</span>
            </button>
          </div>

          {/* Right URL & Android Steps (7 cols) */}
          <div className="md:col-span-7 space-y-5">
            {/* Target URL Selector */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-emerald-400" />
                Live Scanned URL Destination
              </h3>
              <p className="text-xs text-slate-400">
                The QR code encodes this URL. You can customize it or reset to the current app host:
              </p>

              <form onSubmit={handleApplyCustomUrl} className="flex gap-2">
                <input
                  type="text"
                  value={customInputUrl}
                  onChange={(e) => setCustomInputUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  Update
                </button>
              </form>
            </div>

            {/* Android Instructions */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3.5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Step-by-Step Android Launch
              </h3>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-100 block">Scan QR Code</strong>
                    <p className="text-slate-400 mt-0.5">
                      Point Android Camera or Google Lens directly at the QR code above.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-100 block">Launch in Google Chrome Mobile</strong>
                    <p className="text-slate-400 mt-0.5">
                      Tap the detected URL to load the dashboard in Chrome.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-100 block">Install to Home Screen</strong>
                    <p className="text-slate-400 mt-0.5">
                      Tap Chrome menu (⋮) → select <span className="text-emerald-300 font-semibold">"Install app"</span> or <span className="text-emerald-300 font-semibold">"Add to Home screen"</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CHROME PC & DESKTOP */}
      {activeTab === 'pc' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Chrome PC Actions (6 cols) */}
          <div className="md:col-span-6 bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <Monitor className="w-4 h-4" />
                Google Chrome PC Desktop Mode
              </span>
              {isInstalled && (
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Installed
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-100">
              Desktop Application Experience
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Install Angler's Daily Dashboard as a native desktop application in Google Chrome for Windows, macOS, or Linux. Features zero browser clutter, taskbar pinning, offline caching, and responsive widescreen charts.
            </p>

            {/* Quick Action Buttons */}
            <div className="space-y-2.5 pt-2">
              {isInstallable && !isInstalled && (
                <button
                  id="pwa-install-chrome-pc"
                  onClick={() => triggerInstall()}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 transition-all hover:scale-[1.02]"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>1-Click Install to Chrome PC</span>
                </button>
              )}

              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>Launch in Standalone Chrome Tab (No iFrame)</span>
              </a>
            </div>

            {/* Chrome PC Install Guide */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                How to Install Directly from Chrome Address Bar:
              </h4>

              <ol className="space-y-2 text-slate-300 list-decimal list-inside leading-relaxed">
                <li>
                  Open the app in Google Chrome (<a href={targetUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">click here</a>).
                </li>
                <li>
                  Click the <strong>"Install Angler's Daily"</strong> icon <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-mono text-[10px]">⊕</span> located on the right side of Chrome's URL bar.
                </li>
                <li>
                  Or open Chrome menu <strong className="text-slate-100">⋮</strong> → <strong className="text-emerald-300">"Save and share"</strong> → <strong className="text-emerald-300">"Install Angler's Daily Dashboard"</strong>.
                </li>
              </ol>
            </div>
          </div>

          {/* Right Panel: PC Hotkeys & Capabilities (6 cols) */}
          <div className="md:col-span-6 space-y-5">
            {/* Keyboard Shortcuts Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Command className="w-4 h-4 text-teal-400" />
                Chrome PC Desktop Keyboard Shortcuts
              </h3>
              <p className="text-xs text-slate-400">
                Speed through your fishing telemetry with single-key desktop hotkeys:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-slate-300">Dashboard View</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 font-mono font-bold text-[11px]">1</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-slate-300">Conditions Radar</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 font-mono font-bold text-[11px]">2</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-slate-300">Fishtrap Lake Hub</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 font-mono font-bold text-[11px]">3</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-slate-300">Species Radar</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 font-mono font-bold text-[11px]">4</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-slate-300">Catch Journal</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 font-mono font-bold text-[11px]">5</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-slate-300">AI Angler Guide</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 font-mono font-bold text-[11px]">6</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-slate-300">Log New Catch</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-teal-300 font-mono font-bold text-[11px]">N</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-slate-300">Toggle °F / °C</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-teal-300 font-mono font-bold text-[11px]">U</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-slate-300">Refresh GPS</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-teal-300 font-mono font-bold text-[11px]">G</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-slate-300">Close / Cancel</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono font-bold text-[11px]">ESC</kbd>
                </div>
              </div>
            </div>

            {/* Desktop multi-screen notes */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2 text-xs text-slate-300">
              <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-cyan-400" />
                Widescreen Multi-Monitor Angler Stations
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Angler's Daily auto-scales to 4K displays and ultrawide monitors. Perfect for continuous display in tackle rooms, marinas, charter offices, and boat cabin consoles.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
