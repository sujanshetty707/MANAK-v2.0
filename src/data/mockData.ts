import { Product, ExtractionResult, InspectionRecord, ConsumerReport } from '../types';

export const SAMPLE_PRODUCTS: Array<{
  product: Product;
  extraction: ExtractionResult;
  description: string;
  expectedStatus: 'compliant' | 'violation';
}> = [
  {
    description: "Britannia Good Day Butter Cookies 200g (Compliant Label)",
    expectedStatus: 'compliant',
    product: {
      id: 'prod-001',
      source_type: 'store',
      title: 'Good Day Butter Cookies',
      brand: 'Britannia',
      category: 'Biscuits & Bakery',
      barcode: '8901063012481',
      image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=60',
      manufacturer_raw: 'Britannia Industries Ltd., 5/1A Hungerford Street, Kolkata - 700017, West Bengal'
    },
    extraction: {
      manufacturer: {
        value: 'Britannia Industries Ltd., 5/1A Hungerford St, Kolkata - 700017, West Bengal',
        source: 'ocr',
        confidence: 0.96
      },
      generic_name: {
        value: 'Butter Cookies',
        source: 'ocr',
        confidence: 0.98
      },
      net_quantity: {
        value: { amount: 200, unit: 'g' },
        source: 'ocr',
        confidence: 0.95
      },
      mrp: {
        value: {
          amount: 40.00,
          raw_text: 'MRP Rs. 40.00 (Incl. of all taxes)',
          is_inclusive_taxes: true
        },
        source: 'ocr',
        confidence: 0.97
      },
      mfg_date: {
        value: '08/2026',
        source: 'ocr',
        confidence: 0.92
      },
      expiry_date: {
        value: '02/2027',
        source: 'ocr',
        confidence: 0.90
      },
      consumer_care: {
        value: {
          phone: '1800-425-4449',
          email: 'feedback@britindia.com',
          address: 'Executive - Consumer Care, Britannia Industries Ltd, Kolkata - 700017'
        },
        source: 'ocr',
        confidence: 0.94
      },
      country_of_origin: {
        value: 'India',
        source: 'ocr',
        confidence: 0.93
      },
      numeral_height_mm: {
        value: 2.8,
        reference_detected: true,
        note: 'Calibrated with standard reference card in frame (Min required for 200g: 2.0mm)'
      },
      raw_ocr_text: 'BRITANNIA GOOD DAY BUTTER COOKIES \nNet Wt: 200g \nPkg Mfd: 08/2026 Use by: 02/2027 \nMRP Rs. 40.00 (Incl. of all taxes) \nPkd By: Britannia Industries Ltd. 5/1A Hungerford St, Kolkata 700017 \nConsumer Care: 1800-425-4449 feedback@britindia.com \nCountry of Origin: India'
    }
  },
  {
    description: "Desi Swad Special Garam Masala 100g (3 Violations Detected)",
    expectedStatus: 'violation',
    product: {
      id: 'prod-002',
      source_type: 'store',
      title: 'Special Garam Masala 100g',
      brand: 'Desi Swad Foods',
      category: 'Spices & Condiments',
      barcode: '8904001928312',
      image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=60',
      manufacturer_raw: 'Packed by Desi Swad, Shed 12, Industrial Area'
    },
    extraction: {
      manufacturer: {
        value: 'Packed by Desi Swad, Shed 12 (Incomplete Address - Missing City/PIN)',
        source: 'ocr',
        confidence: 0.82
      },
      generic_name: {
        value: 'Garam Masala Powder',
        source: 'ocr',
        confidence: 0.94
      },
      net_quantity: {
        value: { amount: 100, unit: 'g' },
        source: 'ocr',
        confidence: 0.89
      },
      mrp: {
        value: {
          amount: 65.00,
          raw_text: 'MRP Rs. 65.00', // Missing 'inclusive of all taxes'
          is_inclusive_taxes: false
        },
        source: 'ocr',
        confidence: 0.91
      },
      mfg_date: {
        value: '07/2026',
        source: 'ocr',
        confidence: 0.88
      },
      consumer_care: {
        value: null, // Missing consumer care
        source: 'ocr',
        confidence: 0.0
      },
      country_of_origin: {
        value: 'India',
        source: 'ocr',
        confidence: 0.85
      },
      numeral_height_mm: {
        value: 1.2,
        reference_detected: true,
        note: 'Sub-standard numeral height detected: 1.2mm (Minimum required: 2.0mm)'
      },
      raw_ocr_text: 'DESI SWAD SPECIAL GARAM MASALA \nNet Wt 100g \nBatch: DS-441 Mfd: 07/2026 \nMRP Rs. 65.00 \nMfd by Desi Swad, Shed 12'
    }
  },
  {
    description: "Tata Salt Vacuum Evaporated 1kg (Compliant Label)",
    expectedStatus: 'compliant',
    product: {
      id: 'prod-003',
      source_type: 'store',
      title: 'Tata Salt Vacuum Evaporated',
      brand: 'Tata Consumer Products',
      category: 'Grocery & Staples',
      barcode: '8901030004921',
      image_url: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=60',
      manufacturer_raw: 'Tata Consumer Products Ltd., 1 Bishop Lefroy Road, Kolkata - 700020'
    },
    extraction: {
      manufacturer: {
        value: 'Tata Consumer Products Ltd., 1 Bishop Lefroy Road, Kolkata, West Bengal - 700020',
        source: 'ocr',
        confidence: 0.98
      },
      generic_name: {
        value: 'Iodised Salt',
        source: 'ocr',
        confidence: 0.97
      },
      net_quantity: {
        value: { amount: 1000, unit: 'g' },
        source: 'ocr',
        confidence: 0.96
      },
      mrp: {
        value: {
          amount: 28.00,
          raw_text: 'MRP Rs. 28.00 (inclusive of all taxes)',
          is_inclusive_taxes: true
        },
        source: 'ocr',
        confidence: 0.98
      },
      mfg_date: {
        value: '09/2026',
        source: 'ocr',
        confidence: 0.95
      },
      consumer_care: {
        value: {
          phone: '1800-345-1720',
          email: 'care@tataconsumer.com',
          address: 'Senior Manager - Consumer Grievances, Tata Consumer Products Ltd.'
        },
        source: 'ocr',
        confidence: 0.96
      },
      country_of_origin: {
        value: 'India',
        source: 'ocr',
        confidence: 0.95
      },
      numeral_height_mm: {
        value: 4.5,
        reference_detected: true,
        note: 'Height 4.5mm meets requirement for 1kg pack size (Min 4.0mm)'
      },
      raw_ocr_text: 'TATA SALT IODISED VACUUM EVAPORATED \nNet Quantity: 1 kg (1000g) \nPkg Mfd: 09/2026 \nMRP Rs. 28.00 (inclusive of all taxes) \nMkt By: Tata Consumer Products Ltd, Kolkata 700020 \nCare: 1800-345-1720 care@tataconsumer.com \nCountry of Origin: India'
    }
  },
  {
    description: "Amazon.in Listing: Organic Extra Virgin Olive Oil 500ml (E-Commerce Check)",
    expectedStatus: 'violation',
    product: {
      id: 'prod-004',
      source_type: 'ecommerce',
      ecommerce_platform: 'amazon',
      ecommerce_url: 'https://www.amazon.in/dp/B08X7VKL9Q',
      title: 'Organico Imported Extra Virgin Olive Oil 500ml Glass Bottle',
      brand: 'Organico',
      category: 'Oils & Vinegars',
      image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60',
      manufacturer_raw: 'Imported by Global Traders, Mumbai'
    },
    extraction: {
      manufacturer: {
        value: 'Global Traders, Office 4B, Nariman Point, Mumbai - 400021',
        source: 'dom',
        confidence: 0.93
      },
      generic_name: {
        value: 'Extra Virgin Olive Oil',
        source: 'dom',
        confidence: 0.95
      },
      net_quantity: {
        value: { amount: 500, unit: 'ml' },
        source: 'dom',
        confidence: 0.96
      },
      mrp: {
        value: {
          amount: 899.00,
          raw_text: '₹899.00 (₹179.80 / 100 ml) Inclusive of all taxes',
          is_inclusive_taxes: true
        },
        source: 'dom',
        confidence: 0.98
      },
      mfg_date: {
        value: null, // E-commerce listing missing date of import
        source: 'dom',
        confidence: 0.0
      },
      consumer_care: {
        value: {
          email: 'support@globaltraders.in',
          phone: '+91 22 2288 9900'
        },
        source: 'dom',
        confidence: 0.91
      },
      country_of_origin: {
        value: null, // Missing mandatory Country of Origin on e-commerce listing (Rule 6(10))
        source: 'dom',
        confidence: 0.0
      },
      numeral_height_mm: {
        value: null,
        reference_detected: false,
        note: 'Digital listing — physical height check not applicable'
      },
      raw_ocr_text: 'DOM Extract from Amazon.in Product Page B08X7VKL9Q \nTitle: Organico Imported Extra Virgin Olive Oil 500ml \nPrice: INR 899.00 \nImporter: Global Traders, Mumbai \nCountry of Origin: [MISSING] \nDate of Import: [MISSING]'
    }
  }
];

export const MOCK_HISTORY: InspectionRecord[] = [
  {
    id: 'insp-8849-01',
    product: SAMPLE_PRODUCTS[1].product,
    performed_by: {
      id: 'usr-officer-01',
      name: 'Insp. R. Kumar',
      badge_id: 'LM-DL-2024-8849',
      role: 'officer',
      zone: 'Zone 4 • Delhi Central'
    },
    mode: 'scan',
    status: 'verified',
    geo: {
      lat: 28.6139,
      lng: 77.2090,
      address: 'Shop 14, Khan Market, New Delhi - 110003'
    },
    timestamp: '2026-09-11 11:24:00',
    evidence_image: SAMPLE_PRODUCTS[1].product.image_url,
    evidence_hash: 'sha256-a9f8c4e7b1d92301fef4821a8c9b4e112d09f7a6',
    extraction: SAMPLE_PRODUCTS[1].extraction,
    evaluations: [
      {
        rule_id: 'rule_6_1_a_mfg_details',
        rule_source: 'Legal Metrology Rules 2011, Rule 6(1)(a)',
        requirement_name: 'Name & Complete Address of Manufacturer',
        category: 'Manufacturer Identity',
        status: 'violation',
        severity: 'critical',
        found_value: 'Packed by Desi Swad, Shed 12 (Incomplete Address)',
        expected_value: 'Complete name with physical premises & PIN code',
        explanation: 'Mandatory PIN code and city are absent from the packaging address.',
        citation: 'Rule 6(1)(a) Packaged Commodities Rules 2011',
        penalty: 2000
      },
      {
        rule_id: 'rule_6_1_e_mrp_format',
        rule_source: 'Legal Metrology Rules 2011, Rule 6(1)(e)',
        requirement_name: 'MRP Inclusive of All Taxes Phrase',
        category: 'Pricing Declaration',
        status: 'violation',
        severity: 'critical',
        found_value: 'MRP Rs. 65.00',
        expected_value: 'MRP Rs. 65.00 (incl. of all taxes)',
        explanation: 'The compulsory statutory declaration "inclusive of all taxes" is omitted.',
        citation: 'Rule 6(1)(e) & Rule 2(m)',
        penalty: 2000
      },
      {
        rule_id: 'rule_6_2_consumer_care',
        rule_source: 'Legal Metrology Rules 2011, Rule 6(2)',
        requirement_name: 'Consumer Care Contact Details',
        category: 'Consumer Redressal',
        status: 'violation',
        severity: 'minor',
        found_value: null,
        expected_value: 'Valid grievance phone and email address',
        explanation: 'No consumer care phone number or contact person declared.',
        citation: 'Rule 6(2) Consumer Redressal Mandate',
        penalty: 2000
      }
    ],
    is_compliant: false,
    total_violations: 3,
    total_penalty: 6000,
    is_signed: true,
    signature_details: {
      signed_by: 'Insp. R. Kumar (Digital Token DSC-8849)',
      timestamp: '2026-09-11 11:28:40',
      provider: 'documenso',
      certificate_id: 'DSC-IN-LM-2026-991823'
    },
    report_id: 'MANAK-REP-2026-00491',
    synced: true
  },
  {
    id: 'insp-8849-02',
    product: SAMPLE_PRODUCTS[0].product,
    performed_by: {
      id: 'usr-officer-01',
      name: 'Insp. R. Kumar',
      badge_id: 'LM-DL-2024-8849',
      role: 'officer',
      zone: 'Zone 4 • Delhi Central'
    },
    mode: 'scan',
    status: 'verified',
    geo: {
      lat: 28.6219,
      lng: 77.2140,
      address: 'Modern Supermarket, Connaught Place, New Delhi - 110001'
    },
    timestamp: '2026-09-11 10:15:20',
    evidence_image: SAMPLE_PRODUCTS[0].product.image_url,
    evidence_hash: 'sha256-e8271abf94c20891d019ab764f2091c890123efd',
    extraction: SAMPLE_PRODUCTS[0].extraction,
    evaluations: [
      {
        rule_id: 'rule_6_1_a_mfg_details',
        rule_source: 'Legal Metrology Rules 2011, Rule 6(1)(a)',
        requirement_name: 'Name & Complete Address of Manufacturer',
        category: 'Manufacturer Identity',
        status: 'compliant',
        severity: 'critical',
        found_value: 'Britannia Industries Ltd., Kolkata - 700017',
        expected_value: 'Complete name and address',
        explanation: 'Compliant with Rule 6(1)(a).',
        citation: 'Rule 6(1)(a)',
        penalty: 0
      },
      {
        rule_id: 'rule_6_1_e_mrp_format',
        rule_source: 'Legal Metrology Rules 2011, Rule 6(1)(e)',
        requirement_name: 'MRP Inclusive of All Taxes Phrase',
        category: 'Pricing Declaration',
        status: 'compliant',
        severity: 'critical',
        found_value: 'MRP Rs. 40.00 (Incl. of all taxes)',
        expected_value: 'MRP with tax disclaimer',
        explanation: 'Compliant with Rule 6(1)(e).',
        citation: 'Rule 6(1)(e)',
        penalty: 0
      }
    ],
    is_compliant: true,
    total_violations: 0,
    total_penalty: 0,
    is_signed: true,
    signature_details: {
      signed_by: 'Insp. R. Kumar',
      timestamp: '2026-09-11 10:18:10',
      provider: 'documenso',
      certificate_id: 'DSC-IN-LM-2026-991772'
    },
    report_id: 'MANAK-REP-2026-00490',
    synced: true
  }
];

export const MOCK_CONSUMER_REPORTS: ConsumerReport[] = [
  {
    id: 'cr-01',
    reference_id: 'MANAK-CR-2026-9812',
    inspection_id: 'insp-8849-01',
    product_name: 'Desi Swad Special Garam Masala 100g',
    brand: 'Desi Swad Foods',
    product_image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=60',
    violations_summary: ['Omitted "Inclusive of all taxes" disclaimer', 'Missing Customer Care Contact details'],
    consumer_note: 'Bought from local grocery shop; store owner was overcharging Rs. 10 above printed MRP.',
    submitted_at: '2026-09-11 09:30:00',
    status: 'under_review',
    assigned_officer: 'Insp. R. Kumar (Delhi Central Zone 4)',
    officer_remark: 'Physical inspection completed at vendor premises. Compounding notice issued.'
  },
  {
    id: 'cr-02',
    reference_id: 'MANAK-CR-2026-9804',
    inspection_id: 'insp-cr-02',
    product_name: 'Imported Dark Chocolate 150g',
    brand: 'Alpen Cocoa',
    product_image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&auto=format&fit=crop&q=60',
    violations_summary: ['Missing Indian Importer Sticker', 'No MRP in Indian Rupees (INR)'],
    consumer_note: 'Found in high-end specialty store without any Indian importer declaration or INR price tag.',
    submitted_at: '2026-09-10 16:45:00',
    status: 'action_taken',
    assigned_officer: 'Insp. S. Verma (South Delhi)',
    officer_remark: 'Case registered under Section 36 of Legal Metrology Act 2009 for non-standard imported packaging.'
  }
];

export const REPEAT_VIOLATOR_HEATMAP = [
  { entity: 'Desi Swad Food Products', location: 'Okhla Phase III, New Delhi', violations: 14, last_flagged: '2 days ago', severity: 'High' },
  { entity: 'Apex Quick Imports LLP', location: 'Andheri East, Mumbai', violations: 9, last_flagged: 'Today', severity: 'High' },
  { entity: 'Royal Herbals & Wellness', location: 'Peenya, Bengaluru', violations: 6, last_flagged: '5 days ago', severity: 'Medium' },
  { entity: 'Shri Balaji Traders', location: 'Chandni Chowk, Old Delhi', violations: 5, last_flagged: '1 week ago', severity: 'Medium' }
];
