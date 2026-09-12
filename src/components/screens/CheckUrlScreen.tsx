import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import { BottomNav } from '../common/BottomNav';
import { SAMPLE_PRODUCTS } from '../../data/mockData';
import { Link2, Globe, ArrowRight, Sparkles, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const CheckUrlScreen: React.FC = () => {
  const { navigateTo, setAnalysisData } = useApp();
  const [url, setUrl] = useState('https://www.amazon.in/dp/B08X7VKL9Q');
  const [platform, setPlatform] = useState<'amazon' | 'flipkart' | 'blinkit' | 'other'>('amazon');
  const [urlError, setUrlError] = useState<string | null>(null);

  const SUPPORTED = ['amazon.in', 'flipkart.com', 'blinkit.com'];

  const validate = (u: string): string | null => {
    if (!u.trim()) return 'Please enter a product URL.';
    try { new URL(u); } catch { return 'Enter a valid URL starting with https://'; }
    if (!u.startsWith('https://')) return 'Only secure (https://) URLs are supported.';
    const isSupported = SUPPORTED.some(p => u.includes(p));
    if (!isSupported) return `Unsupported platform. Supported: Amazon.in, Flipkart, Blinkit.`;
    return null;
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setUrlError(null);
    if (newUrl.includes('amazon')) setPlatform('amazon');
    else if (newUrl.includes('flipkart')) setPlatform('flipkart');
    else if (newUrl.includes('blinkit')) setPlatform('blinkit');
    else setPlatform('other');
  };

  const handleAudit = () => {
    const err = validate(url);
    if (err) { setUrlError(err); return; }
    const isViolating = url.includes('amazon') || url.includes('olive');
    const sample = isViolating ? SAMPLE_PRODUCTS[3] : SAMPLE_PRODUCTS[0];

    const customizedProduct = {
      ...sample.product,
      source_type: 'ecommerce' as const,
      ecommerce_platform: platform === 'other' ? 'amazon' : platform,
      ecommerce_url: url
    };

    setAnalysisData(customizedProduct, sample.extraction);
    navigateTo('ocr_processing');
  };

  return (
    <div className="w-full h-full bg-[#F5F6F8] flex flex-col justify-between overflow-hidden">
      <Header title="E-Commerce Compliance Check" showBack showLogo />

      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-4 hide-scrollbar">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-manak-navy mono bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
              DOM-Level Content Extractor
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Audit Marketplace Listing</h2>
          <p className="text-xs text-slate-500">
            Audit mandatory statutory declarations on e-commerce platforms under Legal Metrology Rule 6(10) & E-Commerce Rules.
          </p>
        </div>

        {/* URL Input Box */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-subtle space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Product Page URL
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={url}
                onChange={e => handleUrlChange(e.target.value)}
                placeholder="https://www.amazon.in/dp/..."
                className={`w-full pl-9 pr-14 py-2.5 rounded-xl border text-xs text-slate-800 font-mono focus:outline-none transition-colors ${
                  urlError
                    ? 'border-red-400 focus:border-red-500 bg-red-50/40'
                    : 'border-slate-200 focus:border-manak-navy'
                }`}
              />
              <button
                type="button"
                onClick={() => handleUrlChange('https://www.amazon.in/dp/B08X7VKL9Q')}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-slate-600 font-semibold"
              >
                Sample
              </button>
            </div>

            {/* Validation Error */}
            {urlError && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{urlError}</span>
              </div>
            )}
          </div>

          {/* Platform Detected Badge */}
          <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-500">Detected Adapter:</span>
            <span className="font-bold text-manak-navy uppercase mono text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-manak-green" />
              {platform.toUpperCase()} DOM ADAPTER v1.4
            </span>
          </div>

          {/* Quick Links Carousel */}
          <div>
            <span className="text-[10.5px] font-semibold text-slate-600 block mb-1.5">
              Quick Test Marketplace Links:
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleUrlChange('https://www.amazon.in/dp/B08X7VKL9Q')}
                className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 text-xs text-slate-700 transition-colors flex items-center justify-between"
              >
                <span className="truncate max-w-[240px]">Amazon: Imported Olive Oil (Missing Origin)</span>
                <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded">Non-Compliant</span>
              </button>
              <button
                type="button"
                onClick={() => handleUrlChange('https://www.flipkart.com/tata-salt-1kg/p/itm4920')}
                className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 text-xs text-slate-700 transition-colors flex items-center justify-between"
              >
                <span className="truncate max-w-[240px]">Flipkart: Tata Salt 1kg Pack</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded">Compliant</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAudit}
            className="w-full py-3 px-4 rounded-xl bg-manak-navy hover:bg-slate-900 active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4 text-manak-orange" />
            <span>Extract & Run Statutory Audit</span>
          </button>
        </div>

        <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 flex items-start space-x-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-manak-navy flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Direct DOM extraction prevents anti-scraping fragility by inspecting live marketplace seller metadata and primary image OCR.
          </p>
        </div>

        <footer className="pt-2 pb-1 text-center">
          <p className="text-[10px] text-slate-400 mono">
            Governed by Rule 6(10) of Legal Metrology (Packaged Commodities) Rules
          </p>
        </footer>
      </main>

      <BottomNav />
    </div>
  );
};
