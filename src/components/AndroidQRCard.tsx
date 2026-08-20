import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  QrCode,
  Laptop,
  Copy,
  Check,
  ExternalLink,
  Download,
  Sparkles,
  ChevronRight,
  Monitor,
  PlusCircle
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface AndroidQRCardProps {
  onOpenFullView?: () => void;
  onOpenModal?: (tab: 'android' | 'pc') => void;
}

export const AndroidQRCard: React.FC<AndroidQRCardProps> = ({ onOpenFullView, onOpenModal }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall();

  useEffect(() => {
    const url =
      typeof window !== 'undefined' && window.location.origin && window.location.origin.startsWith('http')
        ? window.location.origin
        : 'https://ais-dev-fkxyu7iu6ivgxqxms2psil-116799203877.us-east1.run.app';
    setTargetUrl(url);

    QRCode.toDataURL(url, {
      width: 240,
      margin: 2,
      color: {
        dark: '#042f2e',
        light: '#f0fdf4',
      },
      errorCorrectionLevel: 'H',
    })
      .then((data) => setQrDataUrl(data))
      .catch((err) => console.error('QR code generation error:', err));
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'anglers_daily_qr.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div
      id="android-qr-dashboard-banner"
      className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden"
    >
      <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
        {/* Left Info */}
        <div className="space-y-3 flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black tracking-wide uppercase">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android QR</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold tracking-wide">
              <Laptop className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chrome PC Desktop PWA</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 leading-tight">
            Launch on Android Phone & Google Chrome PC
          </h2>

          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Scan with your Android camera or install directly to Google Chrome on PC for dedicated standalone windows, full telemetry on the water, and offline access.
          </p>

          {/* Quick Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
            {isInstallable && !isInstalled && (
              <button
                id="banner-install-pc-btn"
                onClick={() => triggerInstall()}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-950/50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Install to Chrome PC</span>
              </button>
            )}

            <button
              id="qr-banner-copy-btn"
              onClick={handleCopy}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Link Copied!' : 'Copy Direct Link'}</span>
            </button>

            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              <span>Open in Chrome Tab</span>
            </a>

            {onOpenFullView && (
              <button
                id="qr-banner-expand-btn"
                onClick={onOpenFullView}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950/50"
              >
                <span>Mobile & PC Hub</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right QR Display */}
        <div className="shrink-0 flex flex-col items-center gap-2 bg-slate-950/90 p-4 rounded-2xl border border-emerald-500/40 shadow-xl">
          <div className="p-2.5 bg-emerald-50 rounded-xl shadow-inner border border-emerald-200">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code for Android & Chrome"
                className="w-36 h-36 sm:w-40 sm:h-40 rounded-lg object-contain"
              />
            ) : (
              <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>
          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5" />
            Scan with Android Camera
          </span>
        </div>
      </div>
    </div>
  );
};
