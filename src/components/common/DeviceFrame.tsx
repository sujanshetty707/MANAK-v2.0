import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Smartphone, Monitor, Wifi, WifiOff, Shield } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export const DeviceFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isNative = Capacitor.isNativePlatform();
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 || isNative;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768 || isNative);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isNative]);

  const {
    deviceFrame,
    toggleDeviceFrame,
    isOffline,
    toggleOffline,
    userRole,
    selectRole,
    navigateTo,
    offlineQueueCount
  } = useApp();

  // On a real phone or viewport < 768px, render clean edge-to-edge native interface
  if (isNative || isMobileScreen) {
    return (
      <div className="w-full h-[100dvh] min-h-[100dvh] bg-[#F5F6F8] overflow-hidden flex flex-col select-none">
        {children}
      </div>
    );
  }

  // On Desktop browser: render paired developer workstation frame
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-4 md:p-6 select-none font-sans">
      {/* Top Diagnostics Bar */}
      <aside aria-label="Demo diagnostics controls" className="w-full max-w-4xl mb-4 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-manak-navy flex items-center justify-center text-manak-orange border border-blue-400/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold tracking-wider text-slate-200">MANAK DEV SHELL</span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">SIH26034 • Legal Metrology (2011 Rules)</span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-700"></div>

          {/* Role Indicator & Fast Switch */}
          <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 px-1.5 font-medium">Role:</span>
            <button
              onClick={() => {
                selectRole('officer');
                navigateTo('officer_dashboard');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                userRole === 'officer'
                  ? 'bg-manak-navy text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Officer
            </button>
            <button
              onClick={() => {
                selectRole('consumer');
                navigateTo('consumer_dashboard');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                userRole === 'consumer'
                  ? 'bg-manak-green text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Consumer
            </button>
            <button
              onClick={() => navigateTo('role_select')}
              className="px-1.5 py-0.5 text-slate-400 hover:text-slate-200 text-[10px]"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleOffline}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              isOffline
                ? 'bg-amber-950/60 border-amber-600/80 text-amber-300 animate-pulse'
                : 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
            }`}
            title="Simulate Offline Store Conditions"
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span className="font-semibold text-[11px]">
              {isOffline ? `Offline Mode (${offlineQueueCount} Queued)` : 'Online (Cloud OCR)'}
            </span>
          </button>

          <button
            onClick={toggleDeviceFrame}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
          >
            {deviceFrame ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{deviceFrame ? 'Fullscreen' : 'Mobile 400px'}</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 flex justify-center ${
          deviceFrame
            ? 'max-w-[400px] h-[840px] max-h-[calc(100vh-80px)] bg-slate-900 border-[6px] border-slate-800 rounded-[38px] p-1.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden ring-1 ring-slate-700/50'
            : 'max-w-xl h-[86vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden'
        }`}
      >
        {/* Device Notch Bar (in Mobile preview mode on desktop) */}
        {deviceFrame && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full z-50 flex items-center justify-end px-3 pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700"></div>
          </div>
        )}

        <div className="w-full h-full bg-[#F5F6F8] rounded-[28px] overflow-hidden flex flex-col justify-between relative select-none">
          {children}
        </div>
      </div>
    </div>
  );
};
