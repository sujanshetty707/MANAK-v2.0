import express from 'express';
import cors from 'cors';
import { parseRawLabelText } from '../src/services/labelParser.js';
import { evaluateExtractionAgainstRules } from '../src/services/ruleEngine.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-memory data store for backend API state
const db = {
  inspections: [],
  consumerReports: [],
  users: [
    {
      id: 'usr-officer-01',
      role: 'officer',
      name: 'Insp. R. Kumar',
      badge_id: 'LM-DL-2024-8849',
      zone: 'Zone 4 • Delhi Central'
    },
    {
      id: 'usr-consumer-01',
      role: 'consumer',
      name: 'Ananya Sharma',
      phone: '+91 98765 43210'
    }
  ]
};

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MANAK Compliance API Backend', timestamp: new Date().toISOString() });
});

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { role, id, pass, phone, otp } = req.body;
  if (role === 'officer') {
    const user = db.users.find(u => u.role === 'officer');
    return res.json({
      success: true,
      token: `jwt_officer_${Date.now()}`,
      user: { ...user, badge_id: id || user.badge_id }
    });
  } else if (role === 'consumer') {
    const user = db.users.find(u => u.role === 'consumer');
    return res.json({
      success: true,
      token: `jwt_consumer_${Date.now()}`,
      user: { ...user, phone: phone || user.phone }
    });
  }
  res.status(400).json({ error: 'Invalid user role requested' });
});

// Scan label endpoint
app.post('/api/scan', (req, res) => {
  const { image_base64, raw_text, geo, performed_by } = req.body;

  let labelText = raw_text || '';
  if (!labelText && image_base64) {
    labelText = 'ABC Foods Pvt Ltd, Industrial Area, Pune - 411001. Net Quantity: 500 g. MRP Rs. 149.00 (inclusive of all taxes). Mfg Date: 03/2026. Consumer Care: 1800-111-222, care@abcfoods.com.';
  }

  const extraction = parseRawLabelText(labelText);
  const evaluationResult = evaluateExtractionAgainstRules(extraction);

  const inspectionId = `insp-${Date.now().toString().slice(-6)}`;
  const inspectionRecord = {
    id: inspectionId,
    product: {
      id: `prod-${Date.now().toString().slice(-6)}`,
      title: extraction.generic_name.value ? `${extraction.generic_name.value} Pack` : 'Packaged Commodity',
      brand: extraction.manufacturer.value ? extraction.manufacturer.value.split(',')[0] : 'Manufacturer Declared',
      category: 'Packaged Food / Retail',
      source_type: 'store',
      image_url: 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=600&auto=format&fit=crop&q=80'
    },
    performed_by: performed_by || db.users[0],
    mode: 'scan',
    status: 'verified',
    geo: geo || { lat: 28.6139, lng: 77.2090, address: 'Connaught Place, New Delhi - 110001' },
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    evidence_image: 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=600&auto=format&fit=crop&q=80',
    evidence_hash: `sha256-${Math.random().toString(36).substring(2, 15)}`,
    extraction,
    evaluations: evaluationResult.evaluations,
    is_compliant: evaluationResult.is_compliant,
    total_violations: evaluationResult.total_violations,
    total_penalty: evaluationResult.total_penalty,
    is_signed: true,
    signature_details: {
      signed_by: `${(performed_by?.name || 'Insp. R. Kumar')} (Digital DSC)`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      provider: 'documenso',
      certificate_id: `DSC-IN-LM-${Date.now().toString().slice(-6)}`
    },
    report_id: `MANAK-REP-2026-${Date.now().toString().slice(-5)}`,
    synced: true
  };

  db.inspections.unshift(inspectionRecord);
  res.json({ success: true, record: inspectionRecord });
});

// E-Commerce URL Check endpoint
app.post('/api/url-check', (req, res) => {
  const { platform, url, dom_extract, performed_by } = req.body;

  let title = dom_extract?.title || 'E-Commerce Product Listing';
  let rawText = '';

  if (dom_extract) {
    rawText = `${dom_extract.title || ''} ${dom_extract.mrp_text || ''} ${dom_extract.net_quantity_text || ''} ${dom_extract.manufacturer_text || ''}`;
  } else {
    rawText = `Listing Title: ${title}. Net Quantity: 250 g. MRP Rs. 299/- incl. taxes. Manufacturer: Premier Packagers Pvt Ltd, Delhi.`;
  }

  const extraction = parseRawLabelText(rawText);
  if (platform) {
    extraction.secondary_source = {
      manufacturer: { value: dom_extract?.manufacturer_text || null, source: 'listing_metadata' },
      net_quantity: { value: dom_extract?.net_quantity_text || null, source: 'listing_metadata' }
    };
  }

  const evaluationResult = evaluateExtractionAgainstRules(extraction);
  const inspectionId = `insp-url-${Date.now().toString().slice(-6)}`;

  const inspectionRecord = {
    id: inspectionId,
    product: {
      id: `prod-url-${Date.now().toString().slice(-6)}`,
      title,
      brand: dom_extract?.manufacturer_text ? dom_extract.manufacturer_text.split(',')[0] : 'Online Retailer',
      category: 'E-Commerce Commodity',
      source_type: 'ecommerce',
      ecommerce_platform: platform || 'amazon',
      ecommerce_url: url || 'https://www.amazon.in/dp/B08N5WRWNW',
      image_url: dom_extract?.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
    },
    performed_by: performed_by || db.users[0],
    mode: 'url_check',
    status: 'verified',
    geo: { lat: 28.6139, lng: 77.2090, address: 'Online Audit Session' },
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    evidence_image: dom_extract?.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    evidence_hash: `sha256-url-${Math.random().toString(36).substring(2, 15)}`,
    extraction,
    evaluations: evaluationResult.evaluations,
    is_compliant: evaluationResult.is_compliant,
    total_violations: evaluationResult.total_violations,
    total_penalty: evaluationResult.total_penalty,
    is_signed: true,
    signature_details: {
      signed_by: `${(performed_by?.name || 'Insp. R. Kumar')} (Digital DSC)`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      provider: 'documenso',
      certificate_id: `DSC-IN-LM-${Date.now().toString().slice(-6)}`
    },
    report_id: `MANAK-REP-2026-${Date.now().toString().slice(-5)}`,
    synced: true
  };

  db.inspections.unshift(inspectionRecord);
  res.json({ success: true, record: inspectionRecord });
});

// Inspection History API
app.get('/api/history', (req, res) => {
  const { status, mode, q } = req.query;
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

// Consumer Reports API
app.get('/api/consumer-reports', (req, res) => {
  res.json({ success: true, count: db.consumerReports.length, reports: db.consumerReports });
});

app.post('/api/consumer-report', (req, res) => {
  const reportData = req.body;
  const refId = `MANAK-CR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newReport = {
    id: `cr-${Date.now()}`,
    reference_id: refId,
    inspection_id: reportData.inspection_id || `insp-cr-${Date.now()}`,
    product_name: reportData.product_name || 'Reported Commodity',
    brand: reportData.brand || 'Generic',
    product_image: reportData.product_image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    violations_summary: reportData.violations_summary || ['Suspected packaging violation'],
    consumer_note: reportData.consumer_note || 'Reported via MANAK Consumer App',
    submitted_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    status: 'submitted',
    assigned_officer: 'Insp. R. Kumar (Delhi Central Zone 4)'
  };

  db.consumerReports.unshift(newReport);
  res.json({ success: true, report: newReport });
});

// Offline Sync API
app.post('/api/sync', (req, res) => {
  const { queued_inspections } = req.body;
  if (!Array.isArray(queued_inspections) || queued_inspections.length === 0) {
    return res.json({ success: true, syncedCount: 0, results: [] });
  }

  const results = [];
  for (const item of queued_inspections) {
    const verifiedRecord = {
      ...item,
      status: 'verified',
      synced: true,
      synced_at: new Date().toISOString()
    };
    db.inspections.unshift(verifiedRecord);
    results.push({ local_id: item.id, inspection_id: item.id, status: 'verified' });
  }

  res.json({ success: true, syncedCount: results.length, results });
});

// Report Generation API
app.post('/api/report/:id/generate', (req, res) => {
  const { id } = req.params;
  const inspection = db.inspections.find(i => i.id === id);

  res.json({
    success: true,
    report_id: `MANAK-REP-2026-${Date.now().toString().slice(-5)}`,
    pdf_url: `/reports/${id}.pdf`,
    signed: true,
    signature_provider: 'documenso',
    signed_at: new Date().toISOString()
  });
});

// Legal Metrology Rules Q&A Chatbot API
app.post('/api/chat', (req, res) => {
  const { question } = req.body;
  const q = (question || '').toLowerCase();

  let answer = 'The Legal Metrology (Packaged Commodities) Rules, 2011 mandate clear declarations of Manufacturer, Net Quantity, MRP (inclusive of all taxes), Date of Manufacture, and Consumer Care details on all principal display panels.';

  if (q.includes('numeral') || q.includes('height') || q.includes('font') || q.includes('rule 7')) {
    answer = 'Under Rule 7(2), Table I & II: For packages up to 200g/200ml, minimum numeral height is 2.0mm. For packages >200g up to 1kg, height must be at least 4.0mm. For packages >1kg, height must be at least 6.0mm.';
  } else if (q.includes('mrp') || q.includes('tax') || q.includes('price')) {
    answer = 'Under Rule 6(1)(e), price must be declared as Maximum Retail Price (MRP) Rs. XX.XX inclusive of all taxes. Omitting "inclusive of all taxes" attracts a penalty of ₹2,000 under Rule 32.';
  } else if (q.includes('penalty') || q.includes('fine') || q.includes('rule 32')) {
    answer = 'Rule 32 provides for compounding of offenses with a standard statutory penalty of ₹2,000 per missing or non-compliant mandatory declaration on packaged commodities.';
  }

  res.json({ success: true, question, answer, citation: 'Legal Metrology (Packaged Commodities) Rules, 2011' });
});

app.listen(PORT, () => {
  console.log(`[MANAK Backend] Server running on port ${PORT}`);
});
