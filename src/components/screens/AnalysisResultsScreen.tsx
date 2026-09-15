import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import { generateInspectionPDF } from '../../services/pdfReportGenerator';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Scale,
  ArrowRight,
  FileCode,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Database
} from 'lucide-react';

export const AnalysisResultsScreen: React.FC = () => {
  const {
    navigateTo,
    currentProduct,
    currentEvaluations,
    currentExtraction,
    isCompliant,
    totalViolations,
    totalPenalty,
    finalizeInspection
  } = useApp();

  const [activeTab, setActiveTab] = useState<'checklist' | 'raw'>('checklist');
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showJsonInspector, setShowJsonInspector] = useState(false);

  const handleGenerateReport = () => {
    const record = finalizeInspection(true);
    try {
      generateInspectionPDF(record);
    } catch (e) {
      console.error('Failed to auto-download PDF:', e);
    }
    navigateTo('inspection_report');
  };

  const handleCopyJson = () => {
    if (currentExtraction) {
      navigator.clipboard.writeText(JSON.stringify(currentExtraction, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const handleCopyRawText = () => {
    if (currentExtraction?.raw_ocr_text) {
      navigator.clipboard.writeText(currentExtraction.raw_ocr_text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const rawFields = [
    {
      label: 'Generic Name (Rule 6(1)(b))',
      value: currentExtraction?.generic_name?.value,
      source: currentExtraction?.generic_name?.source,
      confidence: currentExtraction?.generic_name?.confidence,
      required: true
    },
    {
      label: 'Brand Name',
      value: currentProduct?.brand !== 'Unbranded' ? currentProduct?.brand : null,
      source: 'listing',
      confidence: 0.95,
      required: false
    },
    {
      label: 'Manufacturer / Packer (Rule 6(1)(a))',
      value: currentExtraction?.manufacturer?.value,
      source: currentExtraction?.manufacturer?.source,
      confidence: currentExtraction?.manufacturer?.confidence,
      required: true
    },
    {
      label: 'Maximum Retail Price (MRP) (Rule 6(1)(e))',
      value: currentExtraction?.mrp?.value?.amount
        ? `₹${currentExtraction.mrp.value.amount} ${currentExtraction.mrp.value.is_inclusive_taxes ? '(Incl. of all taxes)' : '(Taxes omitted)'}`
        : null,
      source: currentExtraction?.mrp?.source,
      confidence: currentExtraction?.mrp?.confidence,
      required: true
    },
    {
      label: 'Net Quantity (Rule 6(1)(c))',
      value: currentExtraction?.net_quantity?.value?.amount
        ? `${currentExtraction.net_quantity.value.amount} ${currentExtraction.net_quantity.value.unit}`
        : null,
      source: currentExtraction?.net_quantity?.source,
      confidence: currentExtraction?.net_quantity?.confidence,
      required: true
    },
    {
      label: 'Country of Origin (Rule 6(10))',
      value: currentExtraction?.country_of_origin?.value,
      source: currentExtraction?.country_of_origin?.source,
      confidence: currentExtraction?.country_of_origin?.confidence,
      required: true
    },
    {
      label: 'Mfg / Pkg Date (Rule 6(1)(d))',
      value: currentExtraction?.mfg_date?.value,
      source: currentExtraction?.mfg_date?.source,
      confidence: currentExtraction?.mfg_date?.confidence,
      required: false,
      note: 'Exempt on e-commerce listings under Rule 6(10)'
    },
    {
      label: 'Consumer Care Helpline (Rule 6(2))',
      value: currentExtraction?.consumer_care?.value
        ? [
            currentExtraction.consumer_care.value.phone && `📞 ${currentExtraction.consumer_care.value.phone}`,
            currentExtraction.consumer_care.value.email && `✉️ ${currentExtraction.consumer_care.value.email}`,
            currentExtraction.consumer_care.value.address && `📍 ${currentExtraction.consumer_care.value.address}`
          ].filter(Boolean).join(' | ')
        : null,
      source: currentExtraction?.consumer_care?.source,
      confidence: currentExtraction?.consumer_care?.confidence,
      required: true
    }
  ];

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
          <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-col space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate max-w-[240px]">
                <img
                  src={selectedImage || currentProduct?.image_url}
                  alt={currentProduct?.title}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0 bg-white"
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

            {/* Multi-Image Listing Gallery Bar */}
            {currentProduct?.images && currentProduct.images.length > 1 && (
              <div className="pt-1 border-t border-slate-200/50">
                <div className="text-[9px] uppercase font-bold text-slate-400 mono mb-1 flex items-center justify-between">
                  <span>Listing Packaging Panels Analyzed ({currentProduct.images.length} Images):</span>
                </div>
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 hide-scrollbar">
                  {currentProduct.images.slice(0, 6).map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`w-9 h-9 rounded-md border overflow-hidden flex-shrink-0 transition-all ${
                        (selectedImage || currentProduct.image_url) === img
                          ? 'border-manak-navy ring-2 ring-blue-400/40 scale-105'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Listing panel ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Segmented View Switcher: Checklist vs Raw Extraction */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'checklist'
                ? 'bg-white text-manak-navy shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-manak-navy" />
            <span>Statutory Checklist</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                totalViolations > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {currentEvaluations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'raw'
                ? 'bg-white text-manak-navy shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-blue-600" />
            <span>Raw Extraction</span>
            {currentExtraction?.generic_name?.value ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>

        {/* TAB 1: Statutory Checklist View */}
        {activeTab === 'checklist' && (
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
                const isExempt = evalItem.status === 'exempt';

                return (
                  <div
                    key={evalItem.rule_id}
                    className={`bg-white rounded-xl border transition-all ${
                      isViol
                        ? 'border-red-200/90 shadow-subtle'
                        : isUnverifiable
                        ? 'border-amber-200/90'
                        : isExempt
                        ? 'border-blue-200/90'
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
                          ) : isExempt ? (
                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
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
                              : isExempt
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isViol ? 'Violation' : isUnverifiable ? 'Unverified' : isExempt ? 'Exempt (Rule 6(10))' : 'Pass'}
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
        )}

        {/* TAB 2: Raw Extraction View (Live Inspector) */}
        {activeTab === 'raw' && (
          <section className="space-y-3">
            {/* Context & Source Header */}
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  Extraction Pipeline Data
                </span>
                <span className="text-[10px] mono text-slate-400">
                  {currentProduct?.source_type === 'ecommerce' ? 'E-Commerce Scrape + Vision' : 'Camera OCR'}
                </span>
              </div>

              {currentProduct?.ecommerce_url && (
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 truncate max-w-[220px] mono">{currentProduct.ecommerce_url}</span>
                  <a
                    href={currentProduct.ecommerce_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 text-[10px] font-bold"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Extracted Fields Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Legal Metrology Entities Extracted</span>
                <span className="text-[10px] text-slate-400 mono">8 Parameters</span>
              </div>

              <div className="divide-y divide-slate-100">
                {rawFields.map((f, idx) => (
                  <div key={idx} className="p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 text-[11px]">{f.label}</span>
                      {f.value ? (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>Extracted {f.confidence ? `(${Math.round(f.confidence * 100)}%)` : ''}</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                          <XCircle className="w-2.5 h-2.5" />
                          <span>Missing / Omitted</span>
                        </span>
                      )}
                    </div>

                    <div className="text-slate-900 font-medium text-[11px] break-words bg-slate-50/70 p-2 rounded border border-slate-100">
                      {f.value || <span className="text-slate-400 italic">Not declared in listing text or images</span>}
                    </div>

                    {f.note && (
                      <span className="text-[9.5px] text-slate-400 italic block">{f.note}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Analyzed Images Gallery (if images were parsed) */}
            {currentProduct?.images && currentProduct.images.length > 0 && (
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    Listing Images Processed ({currentProduct.images.length})
                  </span>
                  <span className="text-[10px] text-slate-400 mono">Multi-Modal Vision</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {currentProduct.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`rounded-lg border overflow-hidden cursor-pointer relative group aspect-square bg-slate-50 ${
                        (selectedImage || currentProduct.image_url) === img ? 'ring-2 ring-manak-navy' : ''
                      }`}
                    >
                      <img src={img} alt={`Panel ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-mono px-1 rounded">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scraped Text / OCR Stream Viewer */}
            {currentExtraction?.raw_ocr_text && (
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    Scraped Page Text &amp; Specifications
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRawText}
                    className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-mono"
                  >
                    {copiedText ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto p-2.5 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono leading-relaxed whitespace-pre-wrap select-all">
                  {currentExtraction.raw_ocr_text}
                </div>
              </div>
            )}

            {/* Raw JSON Inspector */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowJsonInspector(!showJsonInspector)}
                className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-purple-600" />
                  Inspect Full Extraction JSON Payload
                </span>
                {showJsonInspector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showJsonInspector && (
                <div className="p-3 bg-slate-950 text-emerald-400 space-y-2">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCopyJson}
                      className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 font-mono bg-slate-800 px-2 py-1 rounded"
                    >
                      {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedJson ? 'Copied JSON' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  <pre className="text-[9.5px] font-mono overflow-x-auto p-2 bg-slate-900 rounded max-h-60 text-slate-200">
                    {JSON.stringify(currentExtraction, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Review & Edit Manual Fallback Button */}
            <button
              type="button"
              onClick={() => navigateTo('review_extraction')}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-manak-navy" />
              <span>Manually Adjust / Edit Extracted Fields</span>
            </button>
          </section>
        )}
      </main>

      {/* Bottom Sticky Action Bar */}
      <footer className="bg-white border-t border-slate-200/90 p-3.5 pb-[calc(max(14px,env(safe-area-inset-bottom,0px))+4px)] shadow-nav relative z-20 flex-shrink-0">
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
