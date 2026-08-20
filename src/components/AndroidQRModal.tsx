import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Smartphone,
  Laptop,
  Copy,
  Check,
  ExternalLink,
  Share2,
  X,
  Sparkles,
  Download,
  Monitor,
  Command,
  Maximize2,
  Minimize2,
  PlusCircle
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface AndroidQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'android' | 'pc';
}

export const AndroidQRModal: React.FC<AndroidQRModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'android',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'android' | 'pc'>(initialTab);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall();

  useEffect(() => {
    if (initialTab) setActiveSubTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    const url =
      typeof window !== 'undefined' && window.location.origin && window.location.origin.startsWith('http')
        ? window.location.origin
        : 'https://ais-dev-fkxyu7iu6ivgxqxms2psil-116799203877.us-east1.run.app';
    setCurrentUrl(url);

    QRCode.toDataURL(url, {
      width: 380,
      margin: 3,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = qrDataUrl;
    downloadAnchor.download = 'anglers_daily_qr.png';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      id="android-qr-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="android-qr-modal-content"
        className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Ambient Glows */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              {activeSubTab === 'android' ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-1.5">
                {activeSubTab === 'android' ? 'Android Mobile Quick Access' : 'Chrome PC & Desktop Setup'}
                <span className="text-[10px] uppercase font-extrabold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  {activeSubTab === 'android' ? 'Mobile QR' : 'Chrome PC'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {activeSubTab === 'android'
                  ? 'Scan with Google Lens or Android Camera'
                  : 'Install standalone app on Google Chrome PC'}
              </p>
            </div>
          </div>

          <button
            id="close-qr-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Switcher Tabs */}
        <div className="mt-4 flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            id="modal-tab-android"
            onClick={() => setActiveSubTab('android')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
              activeSubTab === 'android'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android / Mobile QR</span>
          </button>
          <button
            id="modal-tab-pc"
            onClick={() => setActiveSubTab('pc')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
              activeSubTab === 'pc'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Chrome PC & Desktop</span>
          </button>
        </div>

        {/* TAB 1: ANDROID QR */}
        {activeSubTab === 'android' && (
          <div className="mt-4 flex flex-col items-center justify-center relative z-10 space-y-4">
            <div className="p-3.5 bg-white rounded-2xl shadow-xl shadow-emerald-950/60 border-2 border-emerald-400/80 flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR code to open Angler's Daily Dashboard on Android"
                  className="w-52 h-52 rounded-lg object-contain"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-500 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Quick Steps for Android */}
            <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-start gap-2 text-slate-300">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>Point your Android Camera or Google Lens at this QR code.</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>Tap the prompt to open in Google Chrome on your phone.</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Tap Chrome menu (⋮) → <strong className="text-emerald-300">"Install app"</strong> or <strong className="text-emerald-300">"Add to Home screen"</strong>.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CHROME PC */}
        {activeSubTab === 'pc' && (
          <div className="mt-4 space-y-4 relative z-10">
            {/* Chrome PC 1-Click Install or Open */}
            <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Monitor className="w-4 h-4" />
                  Chrome PC Native App
                </span>
                {isInstalled && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                    ✓ Installed
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Run Angler's Daily as a standalone window without browser toolbars, with desktop notifications and instant launch from your Windows taskbar or Mac Dock.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {isInstallable && !isInstalled && (
                  <button
                    id="chrome-pc-install-btn"
                    onClick={() => triggerInstall()}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Install to Chrome PC</span>
                  </button>
                )}

                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>Open Fullscreen Tab</span>
                </a>

                <button
                  onClick={toggleFullscreen}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-cyan-400" />}
                  <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (F11)'}</span>
                </button>
              </div>
            </div>

            {/* How to Install on Chrome PC Steps */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 text-xs text-slate-300">
              <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                How to Install in Google Chrome on PC / Mac:
              </h4>

              <div className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Look at the right side of Chrome's URL address bar for the <strong className="text-emerald-300">"Install app" icon (⊕ or 💻)</strong> and click it.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Or click Chrome's top-right menu <strong className="text-slate-100">(⋮)</strong> → <strong className="text-emerald-300">"Save and share"</strong> → <strong className="text-emerald-300">"Install Angler's Daily Dashboard"</strong>.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Launch anytime from your desktop shortcut or taskbar pin!
                </span>
              </div>
            </div>

            {/* Chrome PC Hotkeys */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 text-xs space-y-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-teal-400">
                <Command className="w-3.5 h-3.5" />
                PC Keyboard Shortcuts
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[10px]">1 - 6</kbd> Switch views</div>
                <div><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[10px]">N</kbd> New catch record</div>
                <div><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[10px]">U</kbd> Toggle °F / °C</div>
                <div><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[10px]">G</kbd> Refresh GPS</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions: URL Copy & Download */}
        <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 relative z-10">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs">
            <span className="text-slate-400 truncate flex-1 font-mono text-[11px]">
              {currentUrl}
            </span>
            <button
              id="copy-mobile-url-btn"
              onClick={handleCopyLink}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold flex items-center gap-1 transition shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {activeSubTab === 'android' && (
              <button
                id="download-qr-btn"
                onClick={handleDownloadQR}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Save QR PNG</span>
              </button>
            )}

            <button
              id="done-qr-modal-btn"
              onClick={onClose}
              className="flex-1 py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-emerald-950/40"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
