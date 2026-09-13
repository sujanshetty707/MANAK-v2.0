import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import { Camera, Link2, Upload, Sparkles, ArrowRight, Globe, Loader2, AlertCircle } from 'lucide-react';
import { extractLabelApi, checkUrlApi } from '../../services/api';
import { compressImage } from '../../utils/imageUtils';

export const ConsumerCheckProductScreen: React.FC = () => {
  const { navigateTo, startScanExtraction, setExtractionReviewData, consumerProfile } = useApp();
  const [activeMode, setActiveMode] = useState<'scan' | 'url'>('scan');
  const [urlInput, setUrlInput] = useState('');
  const [customText, setCustomText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartCheck = async () => {
    setErrorMsg(null);

    if (activeMode === 'scan' && selectedImages.length === 0 && !customText.trim()) {
      setErrorMsg('Please upload at least 1 product photo (Front and Back packaging photos recommended).');
      return;
    }
    if (activeMode === 'url' && !urlInput.trim()) {
      setErrorMsg('Please paste a product web link.');
      return;
    }

    if (activeMode === 'scan') {
      startScanExtraction({
        image_base64: selectedImages[0] || undefined,
        images_base64: selectedImages.length > 0 ? selectedImages : undefined,
        raw_text: customText
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await checkUrlApi({
        url: urlInput,
        performed_by: consumerProfile
      });
      if (res?.record) {
        setExtractionReviewData(res.record.product, res.record.extraction);
      }
      navigateTo('review_extraction');
    } catch (err) {
      console.warn('Consumer check API error:', err);
      setErrorMsg('Extraction request failed. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setErrorMsg(null);

      for (const file of files) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const raw = event.target?.result as string;
          if (raw) {
            const compressed = await compressImage(raw, 3072, 0.95).catch(() => raw);
            setSelectedImages(prev => {
              const next = [...prev, compressed];
              setActiveImageIdx(next.length - 1);
              return next;
            });
          }
        };
        reader.readAsDataURL(file);
      }
      e.target.value = '';
    }
  };

  const removeImage = (idxToRemove: number) => {
    setSelectedImages(prev => {
      const next = prev.filter((_, idx) => idx !== idxToRemove);
      if (activeImageIdx >= next.length) {
        setActiveImageIdx(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const currentViewImage = selectedImages[activeImageIdx] || null;

  return (
    <div className="w-full h-full bg-[#F5F6F8] flex flex-col justify-between overflow-hidden">
      <Header title="Check a Packaged Product" showBack showLogo />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-[calc(max(16px,env(safe-area-inset-bottom,0px))+4px)] space-y-4 hide-scrollbar flex flex-col justify-between">
        {/* Segmented Mode Switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl shadow-inner">
          <button
            onClick={() => { setActiveMode('scan'); setErrorMsg(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeMode === 'scan'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Scan Package Photos</span>
          </button>
          <button
            onClick={() => { setActiveMode('url'); setErrorMsg(null); }}
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

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {activeMode === 'scan' ? (
          /* Camera Scan UI */
          <div className="space-y-3 my-auto">
            <div className="relative w-full h-52 rounded-2xl overflow-hidden border-2 border-dashed border-emerald-500/40 bg-slate-900 flex items-center justify-center shadow-sm">
              {currentViewImage ? (
                <img
                  src={currentViewImage}
                  alt={`Product Scan Panel ${activeImageIdx + 1}`}
                  className="w-full h-full object-cover filter brightness-[0.95]"
                />
              ) : (
                <div className="text-center p-4 space-y-2">
                  <Camera className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">Upload photos of the product label</p>
                  <p className="text-[11px] text-slate-400">Front and Back panels can be uploaded together</p>
                </div>
              )}

              <label className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold flex items-center space-x-1 cursor-pointer hover:bg-black">
                <Upload className="w-3.5 h-3.5" />
                <span>{selectedImages.length > 0 ? '+ Add Side' : 'Upload Photos'}</span>
                <input type="file" accept="image/*" multiple onChange={handleCustomUpload} className="hidden" />
              </label>

              {selectedImages.length > 1 && (
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-mono">
                  Panel {activeImageIdx + 1} of {selectedImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {selectedImages.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {selectedImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      activeImageIdx === idx ? 'border-emerald-600 scale-105' : 'border-slate-300 opacity-70'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(idx);
                      }}
                      className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <label className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 flex flex-col items-center justify-center text-emerald-700 cursor-pointer text-[10px] font-bold">
                  <span>+ Photo</span>
                  <input type="file" accept="image/*" multiple onChange={handleCustomUpload} className="hidden" />
                </label>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Optional Printed Label Text
              </label>
              <textarea
                rows={2}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Optional: Paste or type printed declarations..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
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
                  placeholder="Paste product web page URL (https://...)"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Start Check CTA */}
        <button
          onClick={handleStartCheck}
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{isLoading ? 'Verifying Declarations...' : 'Verify Statutory Declarations'}</span>
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </button>
      </main>
    </div>
  );
};
