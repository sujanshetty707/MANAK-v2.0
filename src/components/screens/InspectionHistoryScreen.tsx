import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import { BottomNav } from '../common/BottomNav';
import { REPEAT_VIOLATOR_HEATMAP } from '../../data/mockData';
import { Search, Filter, CheckCircle2, AlertTriangle, ChevronRight, MapPin, Flame, ShieldAlert, Camera, ClipboardX, SlidersHorizontal } from 'lucide-react';

export const InspectionHistoryScreen: React.FC = () => {
  const { inspections, navigateTo, setAnalysisData } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'compliant' | 'violation'>('all');
  const [activeTab, setActiveTab] = useState<'history' | 'heatmap'>('history');

  const filteredInspections = inspections.filter(item => {
    const matchesSearch =
      item.product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.report_id && item.report_id.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterMode === 'compliant') return matchesSearch && item.is_compliant;
    if (filterMode === 'violation') return matchesSearch && !item.is_compliant;
    return matchesSearch;
  });

  return (
    <div className="w-full h-full bg-[#F5F6F8] flex flex-col justify-between overflow-hidden">
      <Header title="Inspection Archive &amp; Repository" showBack showLogo />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3 hide-scrollbar">
        {/* Top Tab Switcher: Inspections vs Repeat Violator Heatmap */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-manak-navy shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit History ({inspections.length})
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'heatmap'
                ? 'bg-manak-navy text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-manak-orange" />
            <span>Violator Heatmap</span>
          </button>
        </div>

        {activeTab === 'history' ? (
          <>
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search product, brand, or report ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-manak-navy shadow-subtle"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-full text-[10.5px] font-bold transition-colors ${
                  filterMode === 'all'
                    ? 'bg-manak-navy text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                All ({inspections.length})
              </button>
              <button
                onClick={() => setFilterMode('violation')}
                className={`px-3 py-1 rounded-full text-[10.5px] font-bold transition-colors ${
                  filterMode === 'violation'
                    ? 'bg-manak-red text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                Violations ({inspections.filter(i => !i.is_compliant).length})
              </button>
              <button
                onClick={() => setFilterMode('compliant')}
                className={`px-3 py-1 rounded-full text-[10.5px] font-bold transition-colors ${
                  filterMode === 'compliant'
                    ? 'bg-manak-green text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                Compliant ({inspections.filter(i => i.is_compliant).length})
              </button>
            </div>

            {/* Inspection Records List */}
            <div className="space-y-2">
              {/* Empty: no inspections at all */}
              {inspections.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 space-y-3 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <ClipboardX className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700">No inspections recorded</p>
                    <p className="text-xs text-slate-400 max-w-[220px] leading-relaxed">
                      Completed inspections will appear here after you scan a product or audit a URL.
                    </p>
                  </div>
                  <button
                    onClick={() => navigateTo('scan_camera')}
                    className="mt-2 px-4 py-2.5 rounded-xl bg-manak-navy hover:bg-slate-900 text-white font-bold text-xs flex items-center space-x-2 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-manak-orange" />
                    <span>Scan a Product</span>
                  </button>
                </div>
              )}

              {/* Empty: search/filter returned nothing */}
              {inspections.length > 0 && filteredInspections.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <SlidersHorizontal className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">No matches found</p>
                  <p className="text-xs text-slate-400">Try a different search term or filter.</p>
                  <button
                    onClick={() => { setSearchTerm(''); setFilterMode('all'); }}
                    className="text-xs font-bold text-manak-navy hover:underline mt-1"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {filteredInspections.map(record => (
                <div
                  key={record.id}
                  onClick={() => {
                    setAnalysisData(record.product, record.extraction);
                    navigateTo('inspection_report');
                  }}
                  className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-subtle hover:border-manak-navy cursor-pointer transition-all active:scale-[0.99] group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <img
                        src={record.product.image_url}
                        alt={record.product.title}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] mono text-slate-400 font-semibold">
                            {record.report_id || record.id}
                          </span>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono">
                            {record.mode.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-manak-navy transition-colors">
                          {record.product.title}
                        </h4>
                        <p className="text-[10.5px] text-slate-500">{record.product.brand}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      {record.is_compliant ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Compliant</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[9px] font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{record.total_violations} Violations</span>
                        </span>
                      )}
                      <span className="block text-[9.5px] text-slate-400 mono mt-1">
                        {record.timestamp.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
                    <span className="truncate max-w-[200px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {record.geo.address}
                    </span>
                    <div className="flex items-center space-x-1 text-manak-navy font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>View Report</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Repeat Violator Heatmap Hotspots */
          <div className="space-y-3">
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-900">
              <div className="flex items-center space-x-1.5 font-bold mb-1">
                <ShieldAlert className="w-4 h-4 text-manak-amber" />
                <span>Repeat Non-Compliant Entities (Zone 4)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-950/80">
                Aggregated violation frequencies across retail stores and regional distributors under Section 36 of Legal Metrology Act.
              </p>
            </div>

            <div className="space-y-2">
              {REPEAT_VIOLATOR_HEATMAP.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl p-3 border border-slate-200 shadow-subtle space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.entity}</h4>
                      <p className="text-[10px] text-slate-500">{item.location}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold mono">
                      {item.violations} Violations
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Severity: <strong className="text-red-600">{item.severity}</strong></span>
                    <span>Last Flagged: {item.last_flagged}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
