import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Sparkles, Cpu, ChevronLeft, Eye, Scan, RefreshCw, AlertTriangle } from 'lucide-react';
import { extractLabelApi } from '../../services/api';

const OCR_STAGES = [
  { name: 'Image Preprocessing & Edge Enhancement', detail: 'Optimizing contrast, perspective, and anti-glare filtering...', progress: 25 },
  { name: 'Google Vision OCR Region Bounding Analysis', detail: 'Detecting printed text regions across principal display panel...', progress: 55 },
  { name: 'Packaging Statutory Declarations Extraction', detail: 'Extracting Manufacturer, Net Wt, MRP, Dates, and Consumer Care...', progress: 85 },
  { name: 'Scale Calibration & Verification', detail: 'Calibrating numeral height (Rule 7) and compiling extracted text...', progress: 100 }
];

export const OcrExtractionScreen: React.FC = () => {
  const { pendingScanPayload, setExtractionReviewData, currentProduct, navigateTo, goBack } = useApp();
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let stageInterval: any = null;

    // Animate OCR stages fast while calling API
    stageInterval = setInterval(() => {
      setCurrentStageIdx(prev => (prev < OCR_STAGES.length - 1 ? prev + 1 : prev));
    }, 150);

    const runExtraction = async () => {
      try {
        const payload = pendingScanPayload || {};
        const primaryImg = payload.images_base64?.[0] || payload.image_base64;
        const allImages = payload.images_base64 || (primaryImg ? [primaryImg] : []);

        const res = await extractLabelApi({
          image_base64: primaryImg,
          images_base64: allImages.length > 0 ? allImages : undefined,
          raw_text: payload.raw_text
        });

        if (!isMounted) return;

        if (res?.extraction) {
          setCurrentStageIdx(OCR_STAGES.length - 1);
          setTimeout(() => {
            if (isMounted) {
              setExtractionReviewData(
                res.product || {
                  id: `prod-${Date.now().toString().slice(-6)}`,
                  title: res.extraction.generic_name?.value ? `${res.extraction.generic_name.value} Pack` : 'Packaged Commodity',
                  brand: res.extraction.manufacturer?.value ? res.extraction.manufacturer.value.split(',')[0].trim() : 'Declared Manufacturer',
                  category: 'Packaged Retail Commodity',
                  source_type: 'store',
                  image_url: primaryImg || undefined,
                  images: allImages
                },
                res.extraction
              );
              navigateTo('review_extraction');
            }
          }, 50);
        } else {
          setErrorMsg('OCR service did not return valid text. Please retry.');
        }
      } catch (err) {
        console.warn('OCR extraction screen error:', err);
        if (isMounted) {
          setErrorMsg('Failed to process label image via Google Vision OCR.');
        }
      }
    };

    runExtraction();

    return () => {
      isMounted = false;
      if (stageInterval) clearInterval(stageInterval);
    };
  }, [pendingScanPayload]);

  const currentStage = OCR_STAGES[currentStageIdx] || OCR_STAGES[0];

  return (
    <div className="w-full h-full bg-[#0F172A] text-white flex flex-col justify-between px-6 pt-[calc(max(20px,env(safe-area-inset-top,0px))+6px)] pb-[calc(max(20px,env(safe-area-inset-bottom,0px))+6px)] relative overflow-hidden select-none">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-0 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header with Back Navigation */}
      <header className="flex justify-between items-center z-20">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={goBack}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 transition-all"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-400/30">
              <Scan className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] text-amber-300 uppercase font-mono block">Google Vision OCR</span>
              <h1 className="text-xs font-bold text-white tracking-wider">TEXT EXTRACTION</h1>
            </div>
          </div>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/20 mono text-amber-300 font-bold">
          STEP 1 OF 3
        </span>
      </header>

      {/* Main OCR Viewfinder & Animation */}
      <main className="flex flex-col items-center justify-center my-auto space-y-6 z-10 text-center">
        {/* Animated Scanner Window */}
        <div className="relative w-48 h-48 rounded-3xl overflow-hidden border-2 border-amber-400/40 shadow-2xl bg-slate-950 flex items-center justify-center">
          {currentProduct?.image_url || pendingScanPayload?.image_base64 ? (
            <img
              src={pendingScanPayload?.image_base64 || currentProduct?.image_url}
              alt="Package Scanning"
              className="w-full h-full object-cover filter brightness-[0.9] contrast-125"
            />
          ) : (
            <div className="p-4 text-center space-y-2">
              <Eye className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
              <span className="text-[11px] text-slate-400 font-mono block">Extracting Text from Label...</span>
            </div>
          )}

          {/* Scanner Animated Overlay Lines */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/30 via-transparent to-blue-500/30 animate-pulse pointer-events-none"></div>
          <div className="absolute w-full h-1 bg-amber-400 shadow-[0_0_18px_#F59E0B] animate-scan-line"></div>

          {/* Bounding Box Highlights */}
          <div className="absolute inset-4 border border-amber-400/40 rounded-xl border-dashed animate-pulse pointer-events-none"></div>

          {/* Center Chip */}
          <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-amber-400/30">
            <Cpu className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        {/* Processing State Info */}
        {errorMsg ? (
          <div className="space-y-3 max-w-xs">
            <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={goBack}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Back to Scanner</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1.5 max-w-xs">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-400/40 text-xs font-semibold text-amber-200 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>{currentStage.name}</span>
            </div>

            <p className="text-[11.5px] text-slate-300 leading-relaxed font-sans min-h-[36px]">
              {currentStage.detail}
            </p>
          </div>
        )}

        {/* Progress Tracker Steps */}
        {!errorMsg && (
          <div className="w-full max-w-xs space-y-2">
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-500 rounded-full"
                style={{ width: `${currentStage.progress}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-[10px] mono text-slate-400">
              <span>Google Vision OCR Processing</span>
              <span>{currentStage.progress}%</span>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer Note */}
      <footer className="text-center z-10">
        <p className="text-[10px] text-slate-400 mono">
          Extracting Printed Packaging Declarations for Legal Metrology Audit
        </p>
      </footer>
    </div>
  );
};
