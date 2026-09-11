import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import { SAMPLE_PRODUCTS } from '../../data/mockData';
import { Camera, Link2, Upload, Sparkles, ArrowRight, Globe } from 'lucide-react';

export const ConsumerCheckProductScreen: React.FC = () => {
  const { navigateTo, setAnalysisData } = useApp();
  const [activeMode, setActiveMode] = useState<'scan' | 'url'>('scan');
  const [selectedSampleIdx, setSelectedSampleIdx] = useState<number>(1);
  const [urlInput, setUrlInput] = useState('https://www.amazon.in/dp/B08X7VKL9Q');

  const handleStartCheck = () => {
    if (activeMode === 'scan') {
      const sample = SAMPLE_PRODUCTS[selectedSampleIdx];
      setAnalysisData(sample.product, sample.extraction);
    } else {
      const isViolating = urlInput.includes('amazon') || urlInput.includes('olive');
      const sample = isViolating ? SAMPLE_PRODUCTS[3] : SAMPLE_PRODUCTS[0];
      setAnalysisData({
        ...sample.product,
        source_type: 'ecommerce',
        ecommerce_url: urlInput
      }, sample.extraction);
    }
    navigateTo('ocr_processing');
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sample = SAMPLE_PRODUCTS[selectedSampleIdx];
      const reader = new FileReader();
      reader.onload = (event) => {
        const customProduct = {
          ...sample.product,
          image_url: event.target?.result as string || sample.product.image_url
        };
        setAnalysisData(customProduct, sample.extraction);
        navigateTo('ocr_processing');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full h-full bg-[#F5F6F8] flex flex-col justify-between overflow-hidden">
      <Header title="Check a Packaged Product" showBack showLogo />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar flex flex-col justify-between">
        {/* Segmented Mode Switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl shadow-inner">
          <button
            onClick={() => setActiveMode('scan')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeMode === 'scan'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Scan Package Photo</span>
          </button>
          <button
            onClick={() => setActiveMode('url')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeMode === 'url'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Paste Online Link</span>
          </button>
        </div>

        {activeMode === 'scan' ? (
          /* Camera Scan UI */
          <div className="space-y-3 my-auto">
            {/* Camera View Box */}
            <div className="relative w-full h-56 rounded-2xl overflow-hidden border-2 border-dashed border-emerald-400/50 bg-slate-900 flex items-center justify-center shadow-md">
              <img
                src={SAMPLE_PRODUCTS[selectedSampleIdx].product.image_url}
                alt="Product Scan"
                className="w-full h-full object-cover filter brightness-[0.9]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none"></div>

              {/* Viewfinder Frame */}
              <div className="absolute w-[80%] h-[75%] border-2 border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_#2A9D5C] animate-scan-line"></div>
              </div>

              {/* Upload file badge */}
              <label className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold flex items-center space-x-1 cursor-pointer hover:bg-black/80">
                <Upload className="w-3.5 h-3.5" />
                <span>Choose Photo</span>
                <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
              </label>
            </div>

            {/* Choose Sample Pack */}
            <div>
              <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                Select a demo test package:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_PRODUCTS.slice(0, 3).map((item, idx) => (
                  <button
                    key={item.product.id}
                    onClick={() => setSelectedSampleIdx(idx)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      selectedSampleIdx === idx
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 text-slate-750'
                    }`}
                  >
                    <span className="text-[10px] block truncate">{item.product.brand}</span>
                    <span className="text-[9px] text-slate-400 block truncate">{item.product.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* E-commerce URL input */
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-subtle space-y-3 my-auto">
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                E-Commerce Product Link
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://www.amazon.in/dp/..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-semibold block">Quick Test Link:</span>
              <button
                type="button"
                onClick={() => setUrlInput('https://www.amazon.in/dp/B08X7VKL9Q')}
                className="w-full text-left p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:bg-emerald-50 truncate"
              >
                Amazon: Organico Olive Oil 500ml (Missing Country of Origin)
              </button>
            </div>
          </div>
        )}

        {/* Start Check CTA */}
        <button
          onClick={handleStartCheck}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Verify Product Declarations</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </main>
    </div>
  );
};
