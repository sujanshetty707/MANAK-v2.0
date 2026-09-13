import { ExtractionResult, ExtractionField } from '../types';

const makeField = <T>(val: T, conf = 0.9): ExtractionField<T> => ({
  value: val,
  source: 'ocr',
  confidence: conf,
});

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ── MRP ──────────────────────────────────────────────────────────────────────
function extractMrp(text: string) {
  const patterns = [
    /m\.?r\.?p\.?\s*(?:rs\.?|₹)?\s*[.:=]?\s*(?:rs\.?|₹)?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
    /(?:maximum\s+retail\s+price|retail\s+price|unit\s+sale\s+price|usp)\s*(?:rs\.?|₹)?\s*[.:=]?\s*(?:rs\.?|₹)?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
    /(?:₹|rs\.?)\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const amount = parseFloat(m[1].replace(',', '.'));
      if (!isNaN(amount) && amount > 0) {
        return {
          amount,
          raw_text: m[0].trim(),
          is_inclusive_taxes: /incl(?:usive)?.*tax|incl\./i.test(text),
        };
      }
    }
  }
  return null;
}

// ── Net Quantity ─────────────────────────────────────────────────────────────
function extractNetQty(text: string) {
  const patterns = [
    /net\.?\s*(?:wt\.?|weight|qty\.?|quantity|content|vol\.?|volume|n\.?w\.?)\s*[.:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*(kg|g|gm|gms|mg|litre|liter|ltr|l|ml|m|cm|mm|units?|pcs|n)\b/i,
    /\b([0-9]+(?:\.[0-9]+)?)\s*(kg|g|gm|gms|mg|litre|liter|ltr|l|ml)\b/i,
    /\b([0-9]+)\s*(units?|pcs|n)\b/i
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const amount = parseFloat(m[1]);
      let unit = m[2].toLowerCase()
        .replace('gms', 'g').replace('gm', 'g')
        .replace('litre', 'l').replace('liter', 'l').replace('ltr', 'l');
      if (!isNaN(amount) && amount > 0) return { amount, unit };
    }
  }
  return null;
}

// ── Dates ────────────────────────────────────────────────────────────────────
function extractDate(text: string, keywords: string[]): string | null {
  const kw = keywords.join('|');
  const datePatterns = [
    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    new RegExp(`(?:${kw})[\\s.:/-]*([0-9]{1,2}[/\\-.][0-9]{1,2}[/\\-.][0-9]{2,4})`, 'i'),
    // MM/YYYY or MM-YYYY
    new RegExp(`(?:${kw})[\\s.:/-]*([0-9]{1,2}[/\\-.][0-9]{4})`, 'i'),
    // Mon YYYY e.g. Jan 2026 or JAN-2026
    new RegExp(`(?:${kw})[\\s.:/-]*([A-Za-z]{3}[\\s\\-.][0-9]{4})`, 'i'),
    // DD Mon YYYY
    new RegExp(`(?:${kw})[\\s.:/-]*([0-9]{1,2}\\s+[A-Za-z]{3}\\s+[0-9]{4})`, 'i'),
    // YYYY-MM-DD ISO
    new RegExp(`(?:${kw})[\\s.:/-]*([0-9]{4}[/\\-.][0-9]{1,2}[/\\-.][0-9]{1,2})`, 'i'),
  ];
  for (const p of datePatterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

function extractMfgDate(text: string): string | null {
  return extractDate(text, [
    'mfg\\.?\\s*date', 'mfd\\.?', 'mfg\\.?', 'pkd\\.?', 'packing\\s+date',
    'packed\\s+on', 'manufactured\\s+on', 'date\\s+of\\s+mfg',
    'date\\s+of\\s+packing', 'date\\s+of\\s+manufacture', 'production\\s+date',
    'manufacture\\s+date', 'dom',
  ]);
}

function extractExpDate(text: string): string | null {
  return extractDate(text, [
    'exp\\.?\\s*date', 'expiry\\s+date', 'expiry', 'exp\\.?', 'best\\s+before',
    'use\\s+by', 'use\\s+before', 'bb\\.?', 'best\\s+before\\s+end',
    'consume\\s+before', 'best\\s+by',
  ]);
}

// ── Customer Care ────────────────────────────────────────────────────────────
function extractPhone(text: string): string | null {
  const patterns = [
    /(?:toll[-\s]?free|helpline|consumer\s+care|customer\s+care|customer\s+service|careline|call\s+us|contact\s+us|phone|ph\.?|tel\.?)\s*[.:/-]?\s*(\+?91[-\s]?[0-9]{10}|1[-\s]?800[-\s]?[0-9]{3}[-\s]?[0-9]{3,5}|[0-9]{10,12})/i,
    /\b(1[-\s]?800[-\s]?[0-9]{2,3}[-\s]?[0-9]{3,5})\b/,
    /\b(\+91[-\s]?[6-9][0-9]{9})\b/,
    /\b(0?[6-9][0-9]{9})\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].replace(/\s/g, '').trim();
  }
  return null;
}

function extractEmail(text: string): string | null {
  const m = text.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
  return m ? m[1] : null;
}

function extractManufacturer(text: string): string | null {
  const m = text.match(
    /(?:manufactured\s+(?:and\s+)?(?:packed\s+)?by|mfg(?:\.|ured)?\s+by|packed\s+by|marketed\s+by|mfd\s+by|distributed\s+by|imported\s+by|manufactured\s+for)\s*[:.,-]?\s*([A-Za-z0-9][^\n]{3,120})/i
  );
  if (m) return m[1].replace(/\s+/g, ' ').trim().replace(/[,.]$/, '');
  return null;
}

function extractGenericName(text: string): string | null {
  const m = text.match(
    /(?:generic\s+name|product\s+name|commodity|item\s+name|name\s+of\s+commodity|name\s+of\s+the\s+commodity|article)\s*[.:=-]?\s*([A-Za-z0-9][^\n]{2,60})/i
  );
  if (m) return m[1].trim();

  // Fallback: check candidate lines for product title
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (
      line.length >= 3 &&
      line.length <= 60 &&
      !/net\s*wt|mrp|mfg|exp|batch|pkd|packed|manuf|consumer|care|call|email|phone|country|origin|price|incl|tax|lic|fssai/i.test(line)
    ) {
      return line.replace(/^[^a-zA-Z0-9]+/, '').trim();
    }
  }

  return null;
}

function extractOrigin(text: string): string {
  const m = text.match(
    /(?:country\s+of\s+origin|made\s+in|origin)\s*[.:=-]?\s*([A-Za-z][\w\s]{2,25})/i
  );
  if (m) return m[1].trim().replace(/[.,]$/, '');
  return /\bindia\b/i.test(text) ? 'India' : '';
}

function extractConsumerAddress(text: string): string | null {
  const m = text.match(
    /(?:consumer\s+care\s+address|customer\s+care\s+address|feedback\s+address)\s*[:\s]+([^\n]{10,150})/i
  );
  if (m) return m[1].trim();
  const lines = text.split('\n');
  for (const line of lines) {
    if (/[0-9]{6}/.test(line) && !/manuf|packed|marketed|mfg|mfd/i.test(line)) {
      return line.trim();
    }
  }
  return null;
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function parseLabelText(rawText: string): ExtractionResult {
  const text = normalize(rawText || '');

  const mrp = extractMrp(text);
  const netQty = extractNetQty(text);
  const mfgDate = extractMfgDate(text);
  const expDate = extractExpDate(text);
  const phone = extractPhone(text);
  const email = extractEmail(text);
  const manufacturer = extractManufacturer(text);
  const genericName = extractGenericName(text);
  const origin = extractOrigin(text);
  const address = extractConsumerAddress(text);

  return {
    mrp: makeField(mrp ?? { amount: 0, raw_text: '', is_inclusive_taxes: false }),
    net_quantity: makeField(netQty ?? { amount: 0, unit: '' }),
    mfg_date: makeField(mfgDate ?? ''),
    expiry_date: expDate ? makeField(expDate) : undefined,
    generic_name: makeField(genericName ?? ''),
    manufacturer: makeField(manufacturer ?? ''),
    country_of_origin: makeField(origin),
    consumer_care: makeField({ phone: phone ?? '', email: email ?? '', address: address ?? '' }),
    numeral_height_mm: { value: null, reference_detected: false, note: 'Not detected from OCR' },
    raw_ocr_text: text,
  };
}
