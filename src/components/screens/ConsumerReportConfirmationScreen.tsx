import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import { CheckCircle2, ShieldCheck, Clock, User, ArrowRight, Home, FileCheck } from 'lucide-react';

export const ConsumerReportConfirmationScreen: React.FC = () => {
  const { navigateTo, consumerReports } = useApp();
  const latestReport = consumerReports[0] || {
    reference_id: 'MANAK-CR-2026-9812',
    submitted_at: '2026-09-11 11:32 IST',
    assigned_officer: 'Insp. R. Kumar (Delhi Central Zone 4)',
    product_name: 'Desi Swad Special Garam Masala 100g'
  };

  return (
    <div className="w-full h-full bg-[#F5F6F8] flex flex-col justify-between overflow-y-auto hide-scrollbar">
      <Header title="Report Acknowledged" showLogo />

      <main className="p-4 space-y-4 my-auto text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-lg border-2 border-emerald-300 animate-bounce">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 uppercase mono bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Grievance Formally Registered
          </span>
          <h2 className="text-lg font-bold text-slate-900">Report Successfully Submitted</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Your complaint has been logged and assigned to the local Legal Metrology Inspector.
          </p>
        </div>

        {/* Reference ID Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-subtle text-left space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <span className="text-[9.5px] uppercase font-mono text-slate-400 block">Reference ID</span>
              <span className="text-sm font-extrabold text-emerald-800 mono tracking-tight">
                {latestReport.reference_id}
              </span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded mono">
              Assigned
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Subject:</span>
              <span className="font-semibold">{latestReport.product_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Officer:</span>
              <span className="font-semibold text-manak-navy">Insp. R. Kumar (Zone 4)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Jurisdiction:</span>
              <span className="font-semibold">Delhi Central</span>
            </div>
          </div>

          {/* Tracking Flow Mini Timeline */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[10.5px] font-bold text-slate-700 block">Status Progress:</span>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center space-x-2 text-emerald-800 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">1</span>
                <span>Report Submitted &amp; Verified</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-800 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">2</span>
                <span>Officer Assigned (Field Queue)</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px]">3</span>
                <span>Physical Store Inspection &amp; Notice</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => navigateTo('consumer_my_reports')}
            className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all"
          >
            <FileCheck className="w-4 h-4" />
            <span>Track in My Reports</span>
          </button>

          <button
            onClick={() => navigateTo('consumer_dashboard')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Back to Citizen Home</span>
          </button>
        </div>
      </main>

      <footer className="p-3 pb-[max(16px,env(safe-area-inset-bottom,0px))] text-center">
        <p className="text-[10px] text-slate-400 mono">
          Updates will be notified to +91 98765 43210
        </p>
      </footer>
    </div>
  );
};
