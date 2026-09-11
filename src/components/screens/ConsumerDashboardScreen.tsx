import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import { BottomNav } from '../common/BottomNav';
import { Camera, ShieldCheck, ChevronRight, FileCheck, AlertCircle, Info, Sparkles, ShoppingBag } from 'lucide-react';

export const ConsumerDashboardScreen: React.FC = () => {
  const { navigateTo, consumerReports } = useApp();

  return (
    <div className="w-full h-full bg-[#F5F6F8] flex flex-col justify-between overflow-hidden">
      <Header showConsumerBadge showLogo />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4 hide-scrollbar">
        {/* Hero Card: Check a Product (Primary Single Action) */}
        <section
          onClick={() => navigateTo('consumer_check')}
          className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white rounded-2xl p-5 shadow-elevated border border-emerald-400/20 cursor-pointer active:scale-[0.99] transition-all relative overflow-hidden group"
        >
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none"></div>
          
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-800 flex items-center justify-center shadow-md">
              <Camera className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase mono tracking-wide text-white">
              Instant Check
            </span>
          </div>

          <div className="mt-4">
            <h2 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span>Scan &amp; Check a Product</span>
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
              Verify printed MRP, net weight, or paste an online product link. Spot violations and file grievances in seconds.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-emerald-100">
            <span>Tap to Scan Label or Paste Link</span>
            <div className="flex items-center space-x-1 text-white group-hover:translate-x-1 transition-transform">
              <span>Start Check</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </section>

        {/* My Reports Quick Overview */}
        <section
          onClick={() => navigateTo('consumer_my_reports')}
          className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-subtle hover:border-emerald-300 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold text-slate-900">My Reported Violations</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
                  {consumerReports.length} Active
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-0.5">
                Track status of complaints routed to legal officers
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </section>

        {/* Packaging Rights & Awareness Tips */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-700" />
              Know Your Packaging Rights (Rules 2011)
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-subtle">
              <span className="text-[10px] font-bold text-emerald-800 uppercase mono block mb-1">
                MRP Rule 6(1)(e)
              </span>
              <p className="text-[11px] text-slate-600 leading-snug">
                Must clearly say <strong>"Inclusive of all taxes"</strong>. No shopkeeper can charge above printed MRP.
              </p>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-subtle">
              <span className="text-[10px] font-bold text-emerald-800 uppercase mono block mb-1">
                Consumer Care
              </span>
              <p className="text-[11px] text-slate-600 leading-snug">
                Every pack must have a valid customer contact phone number and email address for complaints.
              </p>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};
