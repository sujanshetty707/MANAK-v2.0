import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { parseLabelText } from '../src/services/labelParser';
import { evaluateExtractionAgainstRules } from '../src/services/ruleEngine';
import { extractLabelFromImage } from './services/ocrService';
import { supabaseAdmin } from './services/supabaseAdmin';
import { auditEcommerceUrl } from './services/ecommerceAuditService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// In-memory store (Supabase is primary, this is fallback)
const db: { inspections: any[]; consumerReports: any[] } = {
  inspections: [],
  consumerReports: []
};

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/api/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  try {
    const { error } = await supabaseAdmin.from('compliance_rules').select('count', { count: 'exact', head: true });
    if (!error) dbStatus = 'connected (Supabase Postgres)';
  } catch {
    dbStatus = 'local fallback';
  }

  res.json({
    status: 'ok',
    service: 'MANAK Compliance API Backend',
    database: dbStatus,
    ocrEngine: process.env.GOOGLE_VISION_API_KEY?.startsWith('AIza') ? 'Google Cloud Vision API' : 'Tesseract.js & PCR 2011 Engine',
    timestamp: new Date().toISOString()
  });
});

// ─── Auth ────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const body = req.body || {};
  const { role, id, phone } = body;

  if (role === 'officer') {
    return res.json({
      success: true,
      token: `jwt_officer_${Date.now()}`,
      user: {
        id: `usr-${id || 'officer'}`,
        role: 'officer',
        name: id ? `Officer ${id}` : 'Enforcement Official',
        badge_id: id || 'LM-OFFICER-01',
        zone: 'Legal Metrology Division'
      }
    });
  } else if (role === 'consumer') {
    return res.json({
      success: true,
      token: `jwt_consumer_${Date.now()}`,
      user: {
        id: `usr-${phone || 'citizen'}`,
        role: 'consumer',
        name: 'Citizen User',
        phone: phone || ''
      }
    });
  }
  res.status(400).json({ error: 'Invalid user role' });
});

// ─── Dashboard Stats (backend-driven violation summary) ──────────────────────

app.get('/api/dashboard/stats', async (_req, res) => {
  // Try Supabase first
  try {
    const { data, error } = await supabaseAdmin
      .from('inspections')
      .select('is_compliant, total_violations, total_penalty, mode, status');

    if (!error && data && data.length > 0) {
      const total = data.length;
      const violations = data.filter((i: any) => !i.is_compliant);
      const totalPenalty = violations.reduce((sum: number, i: any) => sum + (i.total_penalty || 0), 0);
      const unsigned = data.filter((i: any) => i.status === 'provisional').length;
      const scanCount = data.filter((i: any) => i.mode === 'scan').length;
      const urlCount = data.filter((i: any) => i.mode === 'url_check').length;

      // Top violation rules across all inspections
      const { data: violationData } = await supabaseAdmin
        .from('inspections')
        .select('compliance_result')
        .eq('is_compliant', false)
        .limit(20);

      const ruleCounts: Record<string, number> = {};
      if (violationData) {
        for (const row of violationData) {
          const evals = (row as any).compliance_result?.evaluations || [];
          for (const e of evals) {
            if (e.status === 'violation') {
              ruleCounts[e.requirement_name] = (ruleCounts[e.requirement_name] || 0) + 1;
            }
          }
        }
      }

      const topViolations = Object.entries(ruleCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ rule: name, count }));

      return res.json({
        success: true,
        source: 'supabase',
        stats: {
          total_inspections: total,
          violations_found: violations.length,
          unsigned_reports: unsigned,
          total_penalty: totalPenalty,
          scan_count: scanCount,
          url_check_count: urlCount,
          top_violations: topViolations
        }
      });
    }
  } catch {
    // fallback to in-memory
  }

  // In-memory fallback
  const total = db.inspections.length;
  const violations = db.inspections.filter(i => !i.is_compliant);
  const totalPenalty = violations.reduce((sum, i) => sum + (i.total_penalty || 0), 0);

  res.json({
    success: true,
    source: 'local',
    stats: {
      total_inspections: total,
      violations_found: violations.length,
      unsigned_reports: db.inspections.filter(i => i.status === 'provisional').length,
      total_penalty: totalPenalty,
      scan_count: db.inspections.filter(i => i.mode === 'scan').length,
      url_check_count: db.inspections.filter(i => i.mode === 'url_check').length,
      top_violations: []
    }
  });
});

// ─── Extract Label (Google Vision OCR & Product Categorization) ─────────────

app.post('/api/extract', async (req, res) => {
  const body = req.body || {};
  // Accept both single image and array of images (for multi-panel packaging)
  const images_base64 = body.images_base64 || body.imagesBase64 || body.images || body.image_base64 || body.imageBase64;
  const raw_text = body.raw_text || body.rawText;

  const hasImages = Array.isArray(images_base64) ? images_base64.length > 0 : !!images_base64;
  if (!hasImages && (!raw_text || !String(raw_text).trim())) {
    return res.status(400).json({ error: 'Provide images_base64 or raw_text label content.' });
  }

  const primaryImage = Array.isArray(images_base64) ? (images_base64[0] || '') : (images_base64 || '');
  const allImages = Array.isArray(images_base64) ? images_base64 : (images_base64 ? [images_base64] : []);

  try {
    const ocrResult = await extractLabelFromImage(images_base64, raw_text);
    const extraction = ocrResult.extraction;
    const product = {
      id: `prod-${Date.now().toString().slice(-6)}`,
      title: extraction.generic_name?.value ? `${extraction.generic_name.value} Pack` : 'Packaged Commodity',
      brand: extraction.manufacturer?.value ? extraction.manufacturer.value.split(',')[0].trim() : 'Declared Manufacturer',
      category: ocrResult.category || 'Packaged Retail Commodity',
      source_type: 'store',
      image_url: primaryImage,
      images: allImages
    };

    res.json({
      success: true,
      extraction,
      product,
      engine: ocrResult.engine
    });
  } catch (err) {
    console.error('Extraction error:', err);
    const fallbackExtraction = parseLabelText(raw_text || '');
    res.json({
      success: true,
      extraction: fallbackExtraction,
      product: {
        id: `prod-${Date.now().toString().slice(-6)}`,
        title: fallbackExtraction.generic_name.value || 'Packaged Commodity',
        brand: fallbackExtraction.manufacturer.value ? fallbackExtraction.manufacturer.value.split(',')[0].trim() : 'Declared Manufacturer',
        category: 'Packaged Retail Commodity',
        source_type: 'store',
        image_url: primaryImage,
        images: allImages
      }
    });
  }
});

// ─── Evaluate Compliance (Runs Rule Engine & Saves Record) ───────────────────

app.post('/api/evaluate', async (req, res) => {
  const body = req.body || {};
  const { extraction, product, image_base64, geo, performed_by, mode } = body;

  if (!extraction) {
    return res.status(400).json({ error: 'Extraction data is required for evaluation.' });
  }

  const evalResult = evaluateExtractionAgainstRules(extraction);
  const inspectionId = `insp-${Date.now().toString().slice(-6)}`;
  const finalProduct = product || {
    id: `prod-${Date.now().toString().slice(-6)}`,
    title: extraction.generic_name?.value ? `${extraction.generic_name.value} Pack` : 'Packaged Commodity',
    brand: extraction.manufacturer?.value ? extraction.manufacturer.value.split(',')[0].trim() : 'Declared Manufacturer',
    category: 'Packaged Retail Commodity',
    source_type: mode === 'url_check' ? 'ecommerce' : 'store',
    image_url: image_base64 || ''
  };

  const record = {
    id: inspectionId,
    product: finalProduct,
    performed_by: performed_by || { name: 'Enforcement Official', badge_id: 'LM-OFFICER-01' },
    mode: mode || 'scan',
    status: 'verified',
    geo: geo || { lat: 0, lng: 0, address: 'Field Audit Location' },
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    evidence_image: image_base64 || finalProduct.image_url || '',
    evidence_hash: `sha256-${Math.random().toString(36).substring(2, 15)}`,
    extraction,
    evaluations: evalResult.evaluations,
    is_compliant: evalResult.is_compliant,
    total_violations: evalResult.total_violations,
    total_penalty: evalResult.total_penalty,
    is_signed: true,
    signature_details: {
      signed_by: `${performed_by?.name || 'Officer'} (Digital DSC)`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      provider: 'documenso',
      certificate_id: `DSC-IN-LM-${Date.now().toString().slice(-6)}`
    },
    report_id: `MANAK-REP-2026-${Date.now().toString().slice(-5)}`,
    synced: true
  };

  // Persist to Supabase
  try {
    await supabaseAdmin.from('inspections').insert({
      id: record.id,
      mode: record.mode,
      status: 'verified',
      geo_lat: record.geo.lat,
      geo_lng: record.geo.lng,
      address: record.geo.address,
      evidence_image: record.evidence_image.length < 500 ? record.evidence_image : '',
      evidence_hash: record.evidence_hash,
      extraction_result: extraction,
      compliance_result: evalResult,
      is_compliant: evalResult.is_compliant,
      total_violations: evalResult.total_violations,
      total_penalty: evalResult.total_penalty,
      is_signed: true,
      report_id: record.report_id
    });
  } catch (err) {
    console.warn('[Supabase] Insert failed, using local store:', (err as Error).message);
  }

  db.inspections.unshift(record);
  res.json({ success: true, record });
});

// ─── Scan Label (All-in-one endpoint maintained for backward compatibility) ──

app.post('/api/scan', async (req, res) => {
  const body = req.body || {};
  const images_base64 = body.images_base64 || body.imagesBase64 || body.images || body.image_base64 || body.imageBase64;
  const { raw_text, geo, performed_by } = body;

  const hasImages = Array.isArray(images_base64) ? images_base64.length > 0 : !!images_base64;
  if (!hasImages && (!raw_text || !String(raw_text).trim())) {
    return res.status(400).json({ error: 'Provide images_base64 or raw_text label content.' });
  }

  const primaryImage = Array.isArray(images_base64) ? (images_base64[0] || '') : (images_base64 || '');
  const allImages = Array.isArray(images_base64) ? images_base64 : (images_base64 ? [images_base64] : []);

  const ocrRes = await extractLabelFromImage(images_base64, raw_text);
  const extraction = ocrRes.extraction;
  const evalResult = evaluateExtractionAgainstRules(extraction);

  const inspectionId = `insp-${Date.now().toString().slice(-6)}`;
  const record = {
    id: inspectionId,
    product: {
      id: `prod-${Date.now().toString().slice(-6)}`,
      title: extraction.generic_name?.value ? `${extraction.generic_name.value} Pack` : 'Packaged Commodity',
      brand: extraction.manufacturer?.value ? extraction.manufacturer.value.split(',')[0].trim() : 'Declared Manufacturer',
      category: ocrRes.category || 'Packaged Retail Commodity',
      source_type: 'store',
      image_url: primaryImage,
      images: allImages
    },
    performed_by: performed_by || { name: 'Enforcement Official', badge_id: 'LM-OFFICER-01' },
    mode: 'scan',
    status: 'verified',
    geo: geo || { lat: 0, lng: 0, address: 'Field Audit Location' },
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    evidence_image: image_base64 || '',
    evidence_hash: `sha256-${Math.random().toString(36).substring(2, 15)}`,
    extraction,
    evaluations: evalResult.evaluations,
    is_compliant: evalResult.is_compliant,
    total_violations: evalResult.total_violations,
    total_penalty: evalResult.total_penalty,
    is_signed: true,
    signature_details: {
      signed_by: `${performed_by?.name || 'Officer'} (Digital DSC)`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      provider: 'documenso',
      certificate_id: `DSC-IN-LM-${Date.now().toString().slice(-6)}`
    },
    report_id: `MANAK-REP-2026-${Date.now().toString().slice(-5)}`,
    synced: true
  };

  // Persist to Supabase
  try {
    await supabaseAdmin.from('inspections').insert({
      id: record.id,
      mode: 'scan',
      status: 'verified',
      geo_lat: record.geo.lat,
      geo_lng: record.geo.lng,
      address: record.geo.address,
      evidence_image: record.evidence_image.length < 500 ? record.evidence_image : '', // Don't store base64 blobs
      evidence_hash: record.evidence_hash,
      extraction_result: extraction,
      compliance_result: evalResult,
      is_compliant: evalResult.is_compliant,
      total_violations: evalResult.total_violations,
      total_penalty: evalResult.total_penalty,
      is_signed: true,
      report_id: record.report_id
    });
  } catch (err) {
    console.warn('[Supabase] Insert failed, using local store:', (err as Error).message);
  }

  db.inspections.unshift(record);
  res.json({ success: true, record });
});

// ─── URL Check ───────────────────────────────────────────────────────────────

app.post('/api/url-check', async (req, res) => {
  const body = req.body || {};
  const { platform, url, dom_extract, performed_by } = body;

  if (!url || !String(url).trim()) {
    return res.status(400).json({ error: 'Provide a product page URL.' });
  }

  try {
    let product: any;
    let extraction: any;

    if (dom_extract) {
      const title = dom_extract?.title || 'E-Commerce Product Listing';
      const rawText = `${dom_extract.title || ''} ${dom_extract.mrp_text || ''} ${dom_extract.net_quantity_text || ''} ${dom_extract.manufacturer_text || ''}`;
      extraction = parseLabelText(rawText);
      product = {
        id: `prod-url-${Date.now().toString().slice(-6)}`,
        title,
        brand: dom_extract?.manufacturer_text ? dom_extract.manufacturer_text.split(',')[0] : 'Online Marketplace Listing',
        category: 'E-Commerce Commodity',
        source_type: 'ecommerce',
        ecommerce_platform: platform || 'other',
        ecommerce_url: url,
        image_url: dom_extract?.images?.[0] || ''
      };
    } else {
      // End-to-end Fetch & Gemini Statutory Extraction Pipeline
      const auditResult = await auditEcommerceUrl({ url, platform, performed_by });
      product = auditResult.product;
      extraction = auditResult.extraction;
    }

    const evalResult = evaluateExtractionAgainstRules(extraction);
    const inspectionId = `insp-url-${Date.now().toString().slice(-6)}`;

    const record = {
      id: inspectionId,
      product,
      performed_by: performed_by || { name: 'Enforcement Official', badge_id: 'LM-OFFICER-01' },
      mode: 'url_check',
      status: 'verified',
      geo: { lat: 0, lng: 0, address: 'Online Audit Session' },
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      evidence_image: product.image_url || '',
      evidence_hash: `sha256-url-${Math.random().toString(36).substring(2, 15)}`,
      extraction,
      evaluations: evalResult.evaluations,
      is_compliant: evalResult.is_compliant,
      total_violations: evalResult.total_violations,
      total_penalty: evalResult.total_penalty,
      is_signed: true,
      signature_details: {
        signed_by: `${performed_by?.name || 'Officer'} (Digital DSC)`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        provider: 'documenso',
        certificate_id: `DSC-IN-LM-${Date.now().toString().slice(-6)}`
      },
      report_id: `MANAK-REP-2026-${Date.now().toString().slice(-5)}`,
      synced: true
    };

    db.inspections.unshift(record);
    return res.json({ success: true, record });
  } catch (err) {
    console.error('[url-check] Error during e-commerce audit:', err);
    return res.status(500).json({
      error: 'Failed to complete e-commerce audit.',
      details: (err as Error).message
    });
  }
});

// ─── Inspection History ──────────────────────────────────────────────────────

app.get('/api/history', async (req, res) => {
  const { status, mode, q } = req.query;

  try {
    const { data, error } = await supabaseAdmin
      .from('inspections')
      .select('*')
      .order('device_timestamp', { ascending: false });
    if (!error && data && data.length > 0) {
      return res.json({ success: true, count: data.length, inspections: data });
    }
  } catch {
    // fallback
  }

  let filtered = [...db.inspections];
  if (status) filtered = filtered.filter(i => i.status === status);
  if (mode) filtered = filtered.filter(i => i.mode === mode);
  if (q) {
    const query = String(q).toLowerCase();
    filtered = filtered.filter(i =>
      i.product.title.toLowerCase().includes(query) ||
      i.product.brand.toLowerCase().includes(query) ||
      i.id.toLowerCase().includes(query)
    );
  }

  res.json({ success: true, count: filtered.length, inspections: filtered });
});

// ─── Consumer Reports ────────────────────────────────────────────────────────

app.get('/api/consumer-reports', (_req, res) => {
  res.json({ success: true, count: db.consumerReports.length, reports: db.consumerReports });
});

app.post('/api/consumer-report', (req, res) => {
  const body = req.body || {};
  const newReport = {
    id: `cr-${Date.now()}`,
    reference_id: body.reference_id || `MANAK-CR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    inspection_id: body.inspection_id || `insp-cr-${Date.now()}`,
    product_name: body.product_name || 'Reported Commodity',
    brand: body.brand || 'Unknown',
    product_image: body.product_image || '',
    violations_summary: body.violations_summary || ['Suspected packaging violation'],
    consumer_note: body.consumer_note || 'Reported via MANAK Consumer App',
    submitted_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    status: 'submitted',
    assigned_officer: 'Legal Metrology Division'
  };

  db.consumerReports.unshift(newReport);
  res.json({ success: true, report: newReport });
});

// ─── Offline Sync ────────────────────────────────────────────────────────────

app.post('/api/sync', (req, res) => {
  const body = req.body || {};
  const queued = body.queued_inspections;
  if (!Array.isArray(queued) || queued.length === 0) {
    return res.json({ success: true, syncedCount: 0, results: [] });
  }

  const results: any[] = [];
  for (const item of queued) {
    const verified = { ...item, status: 'verified', synced: true, synced_at: new Date().toISOString() };
    db.inspections.unshift(verified);
    results.push({ local_id: item.id, inspection_id: item.id, status: 'verified' });
  }

  res.json({ success: true, syncedCount: results.length, results });
});

// ─── Report Generation ──────────────────────────────────────────────────────

app.post('/api/report/:id/generate', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    report_id: `MANAK-REP-2026-${Date.now().toString().slice(-5)}`,
    pdf_url: `/reports/${id}.pdf`,
    signed: true,
    signature_provider: 'documenso',
    signed_at: new Date().toISOString()
  });
});

// ─── Compliance Chat ─────────────────────────────────────────────────────────

app.post('/api/chat', (req, res) => {
  const body = req.body || {};
  const q = (body.question || '').toLowerCase();

  let answer = 'The Legal Metrology (Packaged Commodities) Rules, 2011 mandate clear declarations of Manufacturer, Net Quantity, MRP (inclusive of all taxes), Date of Manufacture, and Consumer Care details on all principal display panels.';
  let citation = 'Legal Metrology (Packaged Commodities) Rules, 2011';

  if (q.includes('numeral') || q.includes('height') || q.includes('font') || q.includes('rule 7')) {
    answer = 'Under Rule 7(2), Table I & II: For packages up to 200g/200ml, minimum numeral height is 2.0mm. For packages >200g up to 1kg, at least 4.0mm. For >1kg, at least 6.0mm.';
  } else if (q.includes('mrp') || q.includes('tax') || q.includes('price')) {
    answer = 'Under Rule 6(1)(e), price must be declared as MRP Rs. XX.XX inclusive of all taxes. Omitting "inclusive of all taxes" attracts ₹2,000 penalty under Rule 32.';
    citation = 'Rule 6(1)(e), Rule 32';
  } else if (q.includes('penalty') || q.includes('fine') || q.includes('rule 32')) {
    answer = 'Rule 32 provides for compounding of offenses with ₹2,000 per missing or non-compliant mandatory declaration.';
    citation = 'Rule 32';
  } else if (q.includes('manufacturer') || q.includes('packer') || q.includes('address')) {
    answer = 'Rule 6(1)(a) requires complete name and full postal address (city, state, PIN) of manufacturer/packer. Incomplete addresses attract ₹2,000 penalty.';
    citation = 'Rule 6(1)(a)';
  }

  res.json({ success: true, question: body.question, answer, citation });
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[MANAK Backend] Server running on port ${PORT}`);
});
