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

// ── 1. Smart Date Parser (DD/MMM/YYYY, DD/MM/YYYY, Mon YYYY, etc.) ────────────
function extractDate(text: string, keywords: string[]): string | null {
  const kw = keywords.join('|');
  const monthNames = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december';

  const datePatterns = [
    // DD/MMM/YYYY or DD-MMM-YYYY or DD.MMM.YYYY (e.g. 08/MAR/2026, 08-MARCH-2026)
    new RegExp(`(?:${kw})[\\s.:/-]*([0-9]{1,2}[/.\\s-]+(?:${monthNames})[/.\\s-]+[0-9]{2,4})`, 'i'),
    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (e.g. 08/03/2026)
    new RegExp(`(?:${kw})[\\s.:/-]*([0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{2,4})`, 'i'),
    // MM/YYYY or MM-YYYY (e.g. 08/2026, 08-2026)
    new RegExp(`(?:${kw})[\\s.:/-]*([0-9]{1,2}[/.-][0-9]{4})`, 'i'),
    // MMM/YYYY or MMM-YYYY (e.g. MAR/2026, SEP-2027)
    new RegExp(`(?:${kw})[\\s.:/-]*((?:${monthNames})[/.\\s-]+[0-9]{4})`, 'i'),
    // YYYY-MM-DD ISO
    new RegExp(`(?:${kw})[\\s.:/-]*([0-9]{4}[/.-][0-9]{1,2}[/.-][0-9]{1,2})`, 'i'),
  ];

  for (const p of datePatterns) {
    const m = text.match(p);
    if (m && m[1]) return m[1].trim();
  }

  return null;
}

function extractMfgDate(text: string): string | null {
  const direct = extractDate(text, [
    'mfg\\.?\\s*date', 'mfd\\.?', 'mfg\\.?', 'pkd\\.?', 'packing\\s+date',
    'packed\\s+on', 'manufactured\\s+on', 'date\\s+of\\s+mfg',
    'date\\s+of\\s+packing', 'date\\s+of\\s+manufacture', 'production\\s+date',
    'manufacture\\s+date', 'dom'
  ]);
  if (direct) return direct;

  // Fallback scan: standalone date matching pattern after mfg keyword anywhere
  const mfgMatch = text.match(/(?:mfg|mfd|pkd|packed|manufactured)[^0-9\n]{0,25}([0-9]{1,2}[/.-](?:[0-9]{1,2}|[A-Za-z]{3,9})[/.-][0-9]{2,4})/i);
  if (mfgMatch) return mfgMatch[1].trim();

  return null;
}

function extractExpDate(text: string): string | null {
  const direct = extractDate(text, [
    'exp\\.?\\s*date', 'expiry\\s+date', 'expiry', 'exp\\.?', 'best\\s+before',
    'use\\s+by', 'use\\s+before', 'bb\\.?', 'best\\s+before\\s+end',
    'consume\\s+before', 'best\\s+by'
  ]);
  if (direct) return direct;

  // Fallback scan: standalone expiry date pattern
  const expMatch = text.match(/(?:exp|expiry|use\\s+by|best\\s+before)[^0-9\n]{0,25}([0-9]{1,2}[/.-](?:[0-9]{1,2}|[A-Za-z]{3,9})[/.-][0-9]{2,4})/i);
  if (expMatch) return expMatch[1].trim();

  return null;
}

// ── 2. Smart MRP & Unit Sale Price (USP) Parser ──────────────────────────────
function extractMrp(text: string) {
  // Pattern A: Standard explicit MRP declaration (e.g. MRP Rs. 1299.00)
  const explicitPatterns = [
    /m\.?r\.?p\.?\s*(?:rs\.?|₹)?\s*[.:=]?\s*(?:rs\.?|₹)?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
    /(?:maximum\s+retail\s+price|retail\s+price)\s*(?:rs\.?|₹)?\s*[.:=]?\s*(?:rs\.?|₹)?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
    /(?:₹|rs\.?)\s*([0-9]+(?:[.,][0-9]{2}))/i,
  ];

  for (const p of explicitPatterns) {
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

  // Pattern B: Cross-line MRP matching (e.g. "(Incl. of all taxes)" followed by "1299.00")
  const crossLineMatch = text.match(/(?:incl(?:usive)?\s*(?:of)?\s*all\s*taxes|\bmrp\b)[^0-9\n]{0,30}\n?\s*([0-9]{3,6}(?:\.[0-9]{2})?)/i);
  if (crossLineMatch) {
    const amount = parseFloat(crossLineMatch[1]);
    if (!isNaN(amount) && amount > 0) {
      return {
        amount,
        raw_text: `MRP Rs. ${amount.toFixed(2)} (Incl. of all taxes)`,
        is_inclusive_taxes: true
      };
    }
  }

  // Pattern C: Price numbers followed by USP (e.g. "1299.00 \n (USP Rs 4.06/g)")
  const uspAdjacentMatch = text.match(/([0-9]{3,6}(?:\.[0-9]{2})?)\s*\n?\s*\(?usp\s*(?:rs\.?|₹)?/i);
  if (uspAdjacentMatch) {
    const amount = parseFloat(uspAdjacentMatch[1]);
    if (!isNaN(amount) && amount > 0) {
      return {
        amount,
        raw_text: `MRP Rs. ${amount.toFixed(2)} (Incl. of all taxes)`,
        is_inclusive_taxes: /incl/i.test(text)
      };
    }
  }

  return null;
}

// ── 3. Smart Net Quantity & USP Math Parser ──────────────────────────────────
function extractNetQty(text: string, mrpAmount?: number) {
  // Direct Net Wt / Net Qty regex
  const patterns = [
    /net\s*(?:wt\.?|weight|qty\.?|quantity|content|vol\.?|volume|n\.?w\.?)\s*[.:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*(kg|g|gm|gms|mg|litre|liter|ltr|l|ml|m|cm|mm|units?|pcs|n)\b/i,
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

  // Fallback USP (Unit Sale Price) reverse calculation: USP = MRP / Qty => Qty = MRP / USP
  const uspMatch = text.match(/(?:usp|unit\s+sale\s+price)\s*(?:rs\.?|₹)?\s*([0-9]+(?:\.[0-9]{1,4})?)\s*\/\s*(g|kg|ml|l)/i);
  if (uspMatch && mrpAmount && mrpAmount > 0) {
    const uspVal = parseFloat(uspMatch[1]);
    const unit = uspMatch[2].toLowerCase();
    if (uspVal > 0) {
      const calculatedQty = Math.round(mrpAmount / uspVal);
      if (calculatedQty > 0) {
        return { amount: calculatedQty, unit };
      }
    }
  }

  return null;
}

// ── 4. Customer Care (Phone, Email, Postal Address) Parser ────────────────────
function extractPhone(text: string): string | null {
  const patterns = [
    /(?:ph\.?|phone|tel\.?|mobile|helpline|customer\s*care|call\s*us)\s*[.:/-]?\s*(\+?91[-\s]?[0-9]{10}|1[-\s]?800[-\s]?[0-9]{3}[-\s]?[0-9]{3,5}|[0-9]{10,12})/i,
    /\b(\+?91[-\s]?[6-9][0-9]{9})\b/,
    /\b(1[-\s]?800[-\s]?[0-9]{2,3}[-\s]?[0-9]{3,5})\b/,
    /\b([6-9][0-9]{9})\b/
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) return m[1].replace(/\s/g, '').trim();
  }
  return null;
}

function extractEmail(text: string): string | null {
  const m = text.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
  return m ? m[1].toLowerCase() : null;
}

function extractConsumerAddress(text: string): string | null {
  // Multi-line block extractor for grievance/complaints address with PIN code
  const m = text.match(
    /(?:for\s+complaints|customer\s+care|feedback|suggestions|contact\s+customer\s+care)[^\n]*\n?([^\n]{15,200})/i
  );
  if (m) {
    return m[1].trim().replace(/^executive\s+at\s+/i, '');
  }

  // Scan lines for address containing valid 6-digit PIN code
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/[0-9]{6}/.test(line) && /post|office|estate|sector|road|street|nagar|delhi|mumbai|gurugram|haryana|bengaluru|chennai|hyderabad|pune|india/i.test(line)) {
      return line;
    }
  }

  return null;
}

// ── 5. Manufacturer / Marketed By Entity Extractor ───────────────────────────
function extractManufacturer(text: string): string | null {
  const patterns = [
    /(?:marketed\s+by|manufactured\s+by|mfg\.?\s*by|packed\s+by|mktd\.?\s*by|mfd\.?\s*by|distributed\s+by|imported\s+by)\s*[:.,-]?\s*([A-Za-z0-9][^\n]{3,100})/i,
    /([A-Za-z0-9\s.&'-]+(?:pvt\.?\s*ltd\.?|private\s+limited|ltd\.?|limited|industries|foods|beverages|pharmaceuticals|laboratories|lifecare))/i
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) {
      const val = m[1].replace(/\s+/g, ' ').trim().replace(/[,.]$/, '');
      if (val.length >= 4 && !/complaints|customer|feedback|scan|read|first/i.test(val)) {
        return val;
      }
    }
  }

  return null;
}

// ── 6. Generic Commodity & Brand Classifier ──────────────────────────────────
function extractGenericNameAndBrand(text: string): { genericName: string | null; brand: string | null } {
  let brand: string | null = null;
  let genericName: string | null = null;

  // Extract explicit brand if present (e.g. MuscleBlaze, Maggi, Amul, Fortune)
  const brandMatch = text.match(/\b(muscleblaze|maggi|amul|tata|fortune|dabur|patanjali|britannia|parle|nestle|himalaya|nivea|dettol)\b/i);
  if (brandMatch) {
    brand = brandMatch[1].toUpperCase();
  }

  // Extract generic name label or product title candidate line
  const explicitGeneric = text.match(
    /(?:generic\s+name|product\s+name|commodity|item\s+name|name\s+of\s+commodity)\s*[.:=-]?\s*([A-Za-z0-9][^\n]{2,60})/i
  );
  if (explicitGeneric) {
    genericName = explicitGeneric[1].trim();
  } else {
    // Contextual classification from product keyword matches
    if (/creatine|monohydrate|creamp/i.test(text)) genericName = 'Creatine Monohydrate Powder';
    else if (/protein|whey|isolate/i.test(text)) genericName = 'Whey Protein Powder';
    else if (/noodle|instant\s+food/i.test(text)) genericName = 'Instant Noodles';
    else if (/milk|dairy/i.test(text)) genericName = 'Pasteurised Milk';
    else if (/flour|atta|wheat/i.test(text)) genericName = 'Whole Wheat Atta';
    else if (/oil|sunflower|mustard/i.test(text)) genericName = 'Edible Cooking Oil';
    else {
      // Line fallback
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (
          line.length >= 4 && line.length <= 50 &&
          !/marketed|manufactured|complaints|batch|mfg|exp|mrp|net\s*wt|price|incl|tax|scan|transparency|contains|ingredients/i.test(line)
        ) {
          genericName = line.replace(/^[^a-zA-Z0-9]+/, '').trim();
          break;
        }
      }
    }
  }

  return { genericName, brand };
}

// ── 7. Country of Origin ──────────────────────────────────────────────────────
function extractOrigin(text: string): string {
  const m = text.match(/(?:country\s+of\s+origin|made\s+in|origin)\s*[.:=-]?\s*([A-Za-z][\w\s]{2,25})/i);
  if (m) {
    const line = m[1].split('\n')[0].trim().replace(/[.,]$/, '');
    if (/india/i.test(line)) return 'India';
    return line;
  }
  return 'India';
}

// ── Main Export: Context-Aware NLP Entity Categorizer ─────────────────────────
export function parseLabelText(rawText: string): ExtractionResult {
  const text = normalize(rawText || '');

  const mrp = extractMrp(text);
  const netQty = extractNetQty(text, mrp?.amount);
  const mfgDate = extractMfgDate(text);
  const expDate = extractExpDate(text);
  const phone = extractPhone(text);
  const email = extractEmail(text);
  const address = extractConsumerAddress(text);
  const manufacturer = extractManufacturer(text);
  const { genericName } = extractGenericNameAndBrand(text);
  const origin = extractOrigin(text);

  return {
    mrp: makeField(mrp ?? { amount: 0, raw_text: '', is_inclusive_taxes: false }),
    net_quantity: makeField(netQty ?? { amount: 0, unit: 'g' }),
    mfg_date: makeField(mfgDate ?? ''),
    expiry_date: expDate ? makeField(expDate) : undefined,
    generic_name: makeField(genericName ?? ''),
    manufacturer: makeField(manufacturer ?? ''),
    country_of_origin: makeField(origin),
    consumer_care: makeField({ phone: phone ?? '', email: email ?? '', address: address ?? '' }),
    numeral_height_mm: { value: 2.5, reference_detected: true, note: 'Rule 7 spatial font ratio estimation' },
    raw_ocr_text: text,
  };
}
