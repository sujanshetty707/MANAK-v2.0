import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import { BottomNav } from '../common/BottomNav';
import { Camera, Link2, AlertTriangle, CheckCircle2, ChevronRight, TrendingUp, ShieldAlert, FileText, Inbox } from 'lucide-react';

export const OfficerDashboardScreen: React.FC = () => {
  const { navigateTo, inspections, setAnalysisData, consumerReports } = useApp();
  const pendingGrievances = consumerReports.filter(r => r.status !== 'action_taken' && r.status !== 'dismissed').length;

  const totalInspectionsToday = 14;
  const violationsFound = inspections.filter(i => !i.is_compliant).length;
  const pendingReports = inspections.filter(i => !i.is_signed).length;

  return (
    <div className="w-full h-full bg-[#F5F6F8] flex flex-col justify-between overflow-hidden">
      <Header showOfficerBadge showLogo />

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 hide-scrollbar">
        {/* Section: 3 Summary Stat Cards */}
        <section>
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mono">
              Today's Field Activity
            </h2>
            <span className="text-[10px] text-slate-400 mono">Updated Live</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Stat 1 */}
            <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-600 leading-tight">
                  Inspections<br />Today
                </span>
                <div className="w-5 h-5 rounded-md bg-manak-navy/10 text-manak-navy flex items-center justify-center">
                  <TrendingUp className="w-3 h-3" />
                </div>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-extrabold text-slate-900 mono">{totalInspectionsToday}</span>
                <span className="text-[9px] text-emerald-600 font-bold">+3</span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-600 leading-tight">
                  Violations<br />Flagged
                </span>
                <div className="w-5 h-5 rounded-md bg-red-50 text-manak-red flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3" />
                </div>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-extrabold text-manak-red mono">{violationsFound}</span>
                <span className="text-[9px] text-red-500 font-bold">Acted</span>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-600 leading-tight">
                  Pending<br />Reports
                </span>
                <div className="w-5 h-5 rounded-md bg-amber-50 text-manak-amber flex items-center justify-center">
                  <FileText className="w-3 h-3" />
                </div>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-extrabold text-manak-amber mono">{pendingReports}</span>
                <span className="text-[9px] text-amber-600 font-bold">Review</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Two Core Action Buttons */}
        <section className="space-y-2.5">
          <div
            onClick={() => navigateTo('scan_camera')}
            className="bg-gradient-to-br from-manak-navy via-slate-900 to-[#142C52] text-white rounded-2xl p-4 shadow-elevated border border-blue-400/20 cursor-pointer active:scale-[0.99] transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-manak-orange text-white flex items-center justify-center shadow-md">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-bold text-white tracking-wide">Scan Product Label</span>
                    <span className="text-[9px] bg-manak-orange/30 text-orange-200 px-1.5 py-0.2 rounded font-mono font-bold">
                      CAMERA OCR
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-100/80 mt-0.5">
                    Live camera capture + Rule 7 numeral height check
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigateTo('check_url')}
            className="bg-white text-slate-900 rounded-2xl p-3.5 border border-slate-200/90 shadow-subtle hover:border-slate-300 cursor-pointer active:scale-[0.99] transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-manak-navy flex items-center justify-center border border-blue-100">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-900">Check E-Commerce URL</span>
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                      DOM PARSER
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">
                    Audit Amazon, Flipkart, Blinkit marketplace listings
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </section>

        {/* Section: Repeat Violator Alert Hotspot */}
        <section className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 flex items-start space-x-2.5">
          <ShieldAlert className="w-5 h-5 text-manak-amber flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950">Repeat Violator Alert</span>
              <span className="text-[9px] font-bold uppercase bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded mono">
                Zone 4 Hotspot
              </span>
            </div>
            <p className="text-[10.5px] text-amber-900/80 mt-0.5 leading-snug">
              <strong>Desi Swad Foods</strong> has 14 recorded labeling non-compliances this month in Central Delhi.
            </p>
          </div>
        </section>

        {/* Section: Citizen Grievance Queue */}
        <section
          onClick={() => navigateTo('officer_consumer_reports')}
          className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-subtle hover:border-manak-navy cursor-pointer transition-all group flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              pendingGrievances > 0
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold text-slate-900">Citizen Grievance Queue</h3>
                {pendingGrievances > 0 && (
                  <span className="text-[9.5px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded-full uppercase mono">
                    {pendingGrievances} New
                  </span>
                )}
              </div>
              <p className="text-[10.5px] text-slate-500 mt-0.5">
                Consumer reports routed to Zone 4 for action
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </section>

        {/* Section: Recent Field Inspections */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 tracking-tight">Recent Inspections</h3>
            <button
              onClick={() => navigateTo('inspection_history')}
              className="text-[11px] font-semibold text-manak-navy hover:underline"
            >
              View All ({inspections.length})
            </button>
          </div>

          <div className="space-y-2">
            {inspections.slice(0, 3).map(record => (
              <div
                key={record.id}
                onClick={() => {
                  setAnalysisData(record.product, record.extraction);
                  navigateTo('analysis_results');
                }}
                className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-subtle hover:border-blue-300 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={record.product.image_url}
                      alt={record.product.title}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                        {record.product.title}
                      </h4>
                      <p className="text-[10px] text-slate-500">{record.product.brand} • {record.timestamp.split(' ')[0]}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {record.is_compliant ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9.5px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Compliant</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[9.5px] font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{record.total_violations} Violations</span>
                      </span>
                    )}
                    <span className="block text-[9.5px] text-slate-400 mono mt-0.5">
                      {record.status === 'verified' ? 'Signed' : 'Provisional'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};
