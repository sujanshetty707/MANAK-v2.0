import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PIPELINE_STAGES, PipelineStage } from '../../services/ocrSimulation';
import { Shield, Sparkles, CheckCircle2, Cpu, AlertTriangle, RefreshCw } from 'lucide-react';

export const ExtractionProcessingScreen: React.FC = () => {
  const { navigateTo, currentProduct, userRole, goBack } = useApp();
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index++;
      // Simulate a ~5% OCR failure at stage 2 (parsing)
      if (index === 2 && Math.random() < 0.05) {
        clearInterval(interval);
        setFailed(true);
        return;
      }
      if (index < PIPELINE_STAGES.length) {
        setCurrentStageIdx(index);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          if (userRole === 'consumer') {
            navigateTo('consumer_report');
          } else {
            navigateTo('analysis_results');
          }
        }, 500);
      }
    }, 650);

    return () => clearInterval(interval);
  }, [navigateTo, userRole, retryKey]);

  const handleRetry = () => {
    setFailed(false);
    setCurrentStageIdx(0);
    setRetryKey(k => k + 1);
  };

  const currentStage: PipelineStage = PIPELINE_STAGES[currentStageIdx] || PIPELINE_STAGES[0];

  if (failed) {
    return (
      <div className="w-full h-full bg-[#1B3A6B] text-white flex flex-col justify-between px-6 pt-[calc(max(20px,env(safe-area-inset-top,0px))+6px)] pb-[calc(max(20px,env(safe-area-inset-bottom,0px))+6px)] relative overflow-hidden select-none">
        {/* Background Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <header className="flex justify-between items-center z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-400/30">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <span className="text-[10px] text-red-200 uppercase font-mono block">MANAK Engine</span>
              <h1 className="text-xs font-bold text-white tracking-wider">EXTRACTION FAILED</h1>
            </div>
          </div>
        </header>

        {/* Failure Message */}
        <main className="flex flex-col items-center justify-center my-auto space-y-5 z-10 text-center px-4">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-white">OCR Parsing Inconclusive</h2>
            <p className="text-xs text-blue-100/70 leading-relaxed max-w-xs">
              Unable to accurately detect mandatory declarations due to low contrast, glare, or motion blur. Please try again with clear lighting.
            </p>
          </div>

          <div className="flex flex-col w-full max-w-xs gap-2.5 pt-2">
            <button
              onClick={handleRetry}
              className="w-full py-3 bg-manak-orange hover:bg-manak-orange/90 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry OCR Extraction</span>
            </button>
            <button
              onClick={goBack}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white/80 text-xs font-medium rounded-xl border border-white/20 transition-all"
            >
              Back to Scanner
            </button>
          </div>
        </main>

        <footer className="text-center z-10">
          <p className="text-[10px] text-blue-200/50 mono">
            Legal Metrology Act 2009 • Error Code: OCR_PARSE_INSUFFICIENT_DENSITY
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#1B3A6B] text-white flex flex-col justify-between px-6 pt-[calc(max(20px,env(safe-area-inset-top,0px))+6px)] pb-[calc(max(20px,env(safe-area-inset-bottom,0px))+6px)] relative overflow-hidden select-none">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-0 w-48 h-48 bg-manak-orange/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <header className="flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
            <Shield className="w-4 h-4 text-manak-orange" />
          </div>
          <div>
            <span className="text-[10px] text-blue-200 uppercase font-mono block">MANAK Engine</span>
            <h1 className="text-xs font-bold text-white tracking-wider">PIPELINE EXECUTION</h1>
          </div>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/20 mono text-blue-200">
          STAGES {currentStageIdx + 1}/5
        </span>
      </header>

      {/* Center Radar Scanner Animation */}
      <main className="flex flex-col items-center justify-center my-auto space-y-6 z-10 text-center">
        {/* Animated Scanner Preview */}
        <div className="relative w-44 h-44 rounded-3xl overflow-hidden border-2 border-blue-400/40 shadow-2xl bg-slate-900 flex items-center justify-center">
          {currentProduct?.image_url && (
            <img
              src={currentProduct.image_url}
              alt="Scan Preview"
              className="w-full h-full object-cover filter brightness-[0.8] contrast-125"
            />
          )}

          {/* Scanner Overlay Line */}
          <div className="absolute inset-0 bg-gradient-to-b from-manak-orange/30 via-transparent to-blue-500/30 animate-pulse pointer-events-none"></div>
          <div className="absolute w-full h-1 bg-manak-orange shadow-[0_0_15px_#E8622C] animate-scan-line"></div>

          {/* Center Chip */}
          <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/20">
            <Cpu className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        {/* Processing State Description */}
        <div className="space-y-1.5 max-w-xs">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-400/30 text-xs font-semibold text-blue-200 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-manak-orange animate-bounce" />
            <span>{currentStage.name}</span>
          </div>

          <p className="text-[11.5px] text-blue-100/80 leading-relaxed font-sans min-h-[36px]">
            {currentStage.detail}
          </p>
        </div>

        {/* Progress Tracker Steps */}
        <div className="w-full max-w-xs space-y-2">
          <div className="w-full h-2 bg-slate-900/80 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-manak-orange via-yellow-400 to-manak-green transition-all duration-500 rounded-full"
              style={{ width: `${currentStage.progress}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[10px] mono text-blue-200/80">
            <span>OCR &amp; Rule Engine</span>
            <span>{currentStage.progress}%</span>
          </div>
        </div>
      </main>

      {/* Bottom Legal Note */}
      <footer className="text-center z-10">
        <p className="text-[10px] text-blue-200/60 mono">
          Evaluating 8 Mandatory Clauses of Legal Metrology Act 2009
        </p>
      </footer>
    </div>
  );
};
