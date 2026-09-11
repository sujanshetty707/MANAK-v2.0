import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import { SAMPLE_PRODUCTS } from '../../data/mockData';
import { Camera, Zap, Upload, Check, Info, Scan, Sparkles, Layers, Aperture, ChevronLeft } from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const CameraScanScreen: React.FC = () => {
  const { navigateTo, setAnalysisData, goBack } = useApp();
  const [torch, setTorch] = useState(false);
  const [selectedSampleIdx, setSelectedSampleIdx] = useState<number>(1); // default to non-compliant for demo
  const [scaleCalibrated, setScaleCalibrated] = useState<boolean>(true);
  const isNative = Capacitor.isNativePlatform();

  const handleCapture = () => {
    const sample = SAMPLE_PRODUCTS[selectedSampleIdx];
    setAnalysisData(sample.product, sample.extraction);
    navigateTo('ocr_processing');
  };

  const handleNativeOrShutter = async () => {
    if (isNative) {
      try {
        const photo = await CapCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera
        });

        if (photo.dataUrl) {
          const sample = SAMPLE_PRODUCTS[selectedSampleIdx];
          const customProduct = {
            ...sample.product,
            image_url: photo.dataUrl
          };
          setAnalysisData(customProduct, sample.extraction);
          navigateTo('ocr_processing');
          return;
        }
      } catch (e) {
        console.warn('Native camera capture dismissed or failed:', e);
      }
    }
    // Fallback to demo sample capture
    handleCapture();
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sample = SAMPLE_PRODUCTS[selectedSampleIdx];
      const reader = new FileReader();
      reader.onload = (event) => {
        const customProduct = {
          ...sample.product,
          image_url: (event.target?.result as string) || sample.product.image_url
        };
        setAnalysisData(customProduct, sample.extraction);
        navigateTo('ocr_processing');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col justify-between overflow-hidden relative">
      {/* Top Overlay Controls with Safe Area Inset */}
      <div className="absolute top-0 left-0 w-full z-30 bg-gradient-to-b from-black/85 via-black/40 to-transparent pt-[max(14px,env(safe-area-inset-top))] pb-4 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={goBack}
            className="p-2 rounded-xl bg-black/40 hover:bg-black/60 active:scale-95 text-white backdrop-blur-md border border-white/20 transition-all"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-mono tracking-wider block font-bold">
              PCR 2011 Scanner
            </span>
            <h1 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Physical Package Audit
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTorch(!torch)}
            className={`p-2 rounded-xl backdrop-blur-md border transition-all active:scale-95 ${
              torch
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                : 'bg-black/40 text-white border-white/20 hover:bg-black/60'
            }`}
            title="Torch Light"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Camera Viewfinder with Realistic Live Elements */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Background Image / Live Stream Simulation */}
        <img
          src={SAMPLE_PRODUCTS[selectedSampleIdx].product.image_url}
          alt="Product Label"
          className="w-full h-full object-cover filter brightness-[0.88] contrast-105"
        />

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-radial-vignette pointer-events-none"></div>

        {/* Viewfinder Bounding Box with Corner Accents */}
        <div className="absolute w-[82%] h-[68%] border-2 border-dashed border-white/60 rounded-2xl flex flex-col justify-between p-3 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
          {/* Top Corners */}
          <div className="flex justify-between">
            <div className="w-6 h-6 border-t-4 border-l-4 border-manak-orange -mt-3.5 -ml-3.5 rounded-tl-lg"></div>
            <div className="w-6 h-6 border-t-4 border-r-4 border-manak-orange -mt-3.5 -mr-3.5 rounded-tr-lg"></div>
          </div>

          {/* Animated Laser Scan Line */}
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-manak-orange to-transparent relative animate-scan-line shadow-[0_0_12px_#E8622C]"></div>

          {/* Bottom Corners */}
          <div className="flex justify-between">
            <div className="w-6 h-6 border-b-4 border-l-4 border-manak-orange -mb-3.5 -ml-3.5 rounded-bl-lg"></div>
            <div className="w-6 h-6 border-b-4 border-r-4 border-manak-orange -mb-3.5 -mr-3.5 rounded-br-lg"></div>
          </div>
        </div>

        {/* Rule 7 Scale Reference Coin/Card Indicator Badge */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
          <div
            onClick={() => setScaleCalibrated(!scaleCalibrated)}
            className={`cursor-pointer px-3 py-1 rounded-full text-[10px] font-mono font-semibold flex items-center space-x-1.5 backdrop-blur-md border shadow-lg transition-all ${
              scaleCalibrated
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-amber-950/80 border-amber-500 text-amber-300'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{scaleCalibrated ? 'Rule 7 Scale: 1mm Ref Calibrated' : 'Tap to Calibrate Scale'}</span>
          </div>
        </div>
      </div>

      {/* Bottom Controls Drawer */}
      <div className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4 pb-[max(16px,env(safe-area-inset-bottom))] space-y-3 z-30 transition-all">
        {/* Sample Pack Picker */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1.5">
            <span className="font-semibold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-manak-orange" />
              Demo Test Packaging:
            </span>
            <span className="mono text-[10px] text-slate-400">
              {SAMPLE_PRODUCTS[selectedSampleIdx].expectedStatus === 'compliant' ? '✓ Compliant' : '⚠ Violations'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {SAMPLE_PRODUCTS.slice(0, 3).map((item, idx) => (
              <button
                key={item.product.id}
                onClick={() => setSelectedSampleIdx(idx)}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-medium truncate border transition-all text-left ${
                  selectedSampleIdx === idx
                    ? 'bg-manak-navy border-blue-400 text-white shadow-sm ring-1 ring-blue-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <span className="block font-bold truncate">{item.product.brand}</span>
                <span className="text-[9px] text-slate-400 block truncate">{item.product.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions: Custom Upload & Primary Capture Button */}
        <div className="flex items-center space-x-3 pt-1">
          {/* File Upload Button */}
          <label className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 cursor-pointer text-slate-200 transition-colors flex items-center justify-center">
            <Upload className="w-5 h-5 text-slate-300" />
            <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
          </label>

          {/* Capture & Run OCR Engine Button */}
          <button
            onClick={handleNativeOrShutter}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-manak-orange to-orange-600 hover:from-orange-500 hover:to-orange-700 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg transition-all"
          >
            {isNative ? <Aperture className="w-5 h-5 animate-spin-slow" /> : <Camera className="w-5 h-5" />}
            <span>{isNative ? 'Take Photo & Run OCR' : 'Capture & Run 2011 Rules OCR'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
