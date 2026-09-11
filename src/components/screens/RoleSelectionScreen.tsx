import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, UserCheck, ArrowRight, FileText, Smartphone, Lock } from 'lucide-react';

export const RoleSelectionScreen: React.FC = () => {
  const { selectRole } = useApp();

  return (
    <div className="w-full h-full bg-[#F5F6F8] flex flex-col justify-between overflow-y-auto hide-scrollbar">
      {/* Top Navy Banner */}
      <div className="bg-[#1B3A6B] text-white pt-8 pb-7 px-5 rounded-b-[24px] shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
        <div className="flex items-center space-x-2 text-blue-200 text-xs font-semibold mono mb-1">
          <ShieldCheck className="w-4 h-4 text-manak-orange" />
          <span>NATIONAL LEGAL METROLOGY PORTAL</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Select Access Role</h1>
        <p className="text-xs text-blue-100/80 mt-1">
          Dual-mode verification under Packaged Commodities Rules 2011
        </p>
      </div>

      {/* Role Cards Container */}
      <div className="p-4 space-y-4 my-auto">
        {/* Officer Card */}
        <div
          onClick={() => selectRole('officer')}
          className="bg-white rounded-2xl p-4 border-2 border-slate-200/90 hover:border-manak-navy shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-[0.99] group"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-manak-navy/10 group-hover:bg-manak-navy text-manak-navy group-hover:text-white flex items-center justify-center transition-colors">
              <Lock className="w-6 h-6" />
            </div>
            <span className="bg-blue-50 text-manak-navy border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mono">
              Enforcement Mode
            </span>
          </div>

          <div className="mt-3">
            <h2 className="text-base font-bold text-slate-900 group-hover:text-manak-navy transition-colors">
              Government Official
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              For Legal Metrology Inspectors & Officers. Perform physical label audits, generate signed evidentiary reports, and monitor market compliance.
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-manak-navy font-semibold">
            <span className="text-[11px] text-slate-400 font-normal">Login via Employee ID</span>
            <div className="flex items-center space-x-1 text-manak-orange group-hover:translate-x-1 transition-transform">
              <span>Officer Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Consumer Card */}
        <div
          onClick={() => selectRole('consumer')}
          className="bg-white rounded-2xl p-4 border-2 border-slate-200/90 hover:border-manak-green shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-[0.99] group"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-manak-green text-manak-green group-hover:text-white flex items-center justify-center transition-colors">
              <UserCheck className="w-6 h-6" />
            </div>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mono">
              Citizen Portal
            </span>
          </div>

          <div className="mt-3">
            <h2 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
              Consumer / Citizen
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Check packaged goods in retail stores or online links. Verify mandatory MRP, net weight, and report misleading labels directly to enforcement.
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
            <span className="text-[11px] text-slate-400 font-normal">Fast Mobile OTP access</span>
            <div className="flex items-center space-x-1 text-emerald-600 group-hover:translate-x-1 transition-transform">
              <span>Citizen Check</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 text-center">
        <p className="text-[10px] text-slate-400 mono">
          Governed by GSR 202(E) • Ministry of Consumer Affairs
        </p>
      </div>
    </div>
  );
};
