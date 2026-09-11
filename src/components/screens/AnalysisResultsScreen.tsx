import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import { CheckCircle2, AlertTriangle, HelpCircle, FileText, ChevronDown, ChevronUp, Scale, ShieldAlert, ArrowRight } from 'lucide-react';

export const AnalysisResultsScreen: React.FC = () => {
  const {
    navigateTo,
    currentProduct,
    currentEvaluations,
    isCompliant,
    totalViolations,
    totalPenalty,
    finalizeInspection
  } = useApp();

  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const handleGenerateReport = () => {
    finalizeInspection(true);
    navigateTo('inspection_report');
  };

  return (
    <div className="w-full h-full bg-[#F5F6F8] flex flex-col justify-between overflow-hidden">
      <Header title="Statutory Compliance Audit" showBack showLogo />

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 hide-scrollbar">
        {/* Compliance Verdict Card */}
        <section
          className={`rounded-2xl p-4 border shadow-sm ${
            isCompliant
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              : 'bg-red-50/90 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isCompliant ? 'bg-emerald-600 text-white' : 'bg-manak-red text-white'
                }`}
              >
                {isCompliant ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wide">
                  {isCompliant ? 'Fully Compliant Package' : `${totalViolations} Statutory Violations`}
                </h2>
                <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                  {isCompliant
                    ? 'All mandatory 2011 declarations verified.'
                    : 'Non-compliance detected under GSR 202(E).'}
                </p>
              </div>
            </div>

            {!isCompliant && (
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase mono block font-semibold">Compounding Fine</span>
                <span className="text-sm font-black text-manak-red mono">₹{totalPenalty.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* Scanned Subject Summary */}
          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 truncate max-w-[220px]">
              <img
                src={currentProduct?.image_url}
                alt={currentProduct?.title}
                className="w-8 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
              />
              <div className="truncate">
                <span className="font-bold text-slate-900 block truncate">{currentProduct?.title}</span>
                <span className="text-[10px] text-slate-500 block truncate">{currentProduct?.brand}</span>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-700">
              {currentProduct?.source_type === 'ecommerce' ? 'E-Commerce' : 'Physical Store'}
            </span>
          </div>
        </section>

        {/* Declarations Checklist Section */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-manak-navy" />
              Statutory Declarations Checklist (Rule 6, 7 &amp; 12)
            </h3>
            <span className="text-[10px] text-slate-400 mono">{currentEvaluations.length} Clauses</span>
          </div>

          <div className="space-y-2">
            {currentEvaluations.map(evalItem => {
              const isExpanded = expandedRule === evalItem.rule_id;
              const isViol = evalItem.status === 'violation';
              const isUnverifiable = evalItem.status === 'unverifiable';

              return (
                <div
                  key={evalItem.rule_id}
                  className={`bg-white rounded-xl border transition-all ${
                    isViol
                      ? 'border-red-200/90 shadow-subtle'
                      : isUnverifiable
                      ? 'border-amber-200/90'
                      : 'border-slate-200/80'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => setExpandedRule(isExpanded ? null : evalItem.rule_id)}
                    className="p-3 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5 max-w-[240px]">
                      <div className="flex-shrink-0">
                        {isViol ? (
                          <div className="w-5 h-5 rounded-full bg-red-100 text-manak-red flex items-center justify-center">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        ) : isUnverifiable ? (
                          <div className="w-5 h-5 rounded-full bg-amber-100 text-manak-amber flex items-center justify-center">
                            <HelpCircle className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-manak-green flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-[9.5px] uppercase font-mono text-slate-400 block -mb-0.5">
                          {evalItem.rule_source.split(',')[1] || evalItem.rule_source}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {evalItem.requirement_name}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase mono ${
                          isViol
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : isUnverifiable
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isViol ? 'Violation' : isUnverifiable ? 'Unverified' : 'Pass'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Drawer */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 text-xs border-t border-slate-100 space-y-2 bg-slate-50/50 rounded-b-xl">
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="p-2 rounded-lg bg-white border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase mono block">Extracted Value:</span>
                          <span className="font-semibold text-slate-800 break-words mt-0.5 block">
                            {evalItem.found_value || 'None / Omitted'}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase mono block">Statutory Mandate:</span>
                          <span className="font-semibold text-slate-800 break-words mt-0.5 block">
                            {evalItem.expected_value}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-[11px] text-slate-700">
                        <span className="font-bold text-manak-navy block text-[10px] uppercase mono">RAG Legal Citation &amp; Analysis:</span>
                        <p className="mt-0.5 leading-relaxed">{evalItem.explanation}</p>
                        <p className="mt-1 font-mono text-[9.5px] text-blue-900/80 italic">{evalItem.citation}</p>
                      </div>

                      {isViol && (
                        <div className="flex justify-between items-center text-[10px] mono px-1 text-red-700 font-bold">
                          <span>Statutory Fine: Rule 32</span>
                          <span>₹{evalItem.penalty}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Bottom Sticky Action Bar */}
      <footer className="bg-white border-t border-slate-200/90 p-3.5 shadow-nav relative z-20 flex-shrink-0">
        <button
          onClick={handleGenerateReport}
          className="w-full py-3.5 px-4 rounded-xl bg-manak-navy hover:bg-slate-900 active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all"
        >
          <FileText className="w-4 h-4 text-manak-orange" />
          <span>Generate Official Evidentiary Report</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
};
