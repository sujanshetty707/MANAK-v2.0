import { ComplianceRule } from '../types';

export const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    rule_id: 'rule_6_1_a_mfg_details',
    rule_source: 'Legal Metrology Rules 2011, Rule 6(1)(a)',
    category: 'Manufacturer Identity',
    requirement_name: 'Name & Complete Address of Manufacturer / Packer / Importer',
    check_type: 'presence',
    severity_default: 'critical',
    penalty_amount: 2000,
    legal_citation: 'Rule 6(1)(a): Every package shall bear the name and complete address of the manufacturer or packer or importer.',
    explanation_template: 'Manufacturer or packer name and complete physical address with PIN code is mandatory on all principal display panels.'
  },
  {
    rule_id: 'rule_6_1_b_generic_name',
    rule_source: 'Legal Metrology Rules 2011, Rule 6(1)(b)',
    category: 'Product Identity',
    requirement_name: 'Common or Generic Name of the Commodity',
    check_type: 'presence',
    severity_default: 'major',
    penalty_amount: 2000,
    legal_citation: 'Rule 6(1)(b): The common or generic names of the commodity contained in the package shall be clearly stated.',
    explanation_template: 'The package must explicitly state the generic or trade name so consumers clearly recognize the commodity.'
  },
  {
    rule_id: 'rule_6_1_c_net_quantity',
    rule_source: 'Legal Metrology Rules 2011, Rule 6(1)(c) & Rule 12',
    category: 'Net Quantity',
    requirement_name: 'Net Quantity in Standard Units (Weight / Measure)',
    check_type: 'presence',
    severity_default: 'critical',
    penalty_amount: 2000,
    legal_citation: 'Rule 6(1)(c): The net quantity, in terms of standard unit of weight or measure, shall be declared.',
    explanation_template: 'Net quantity must be declared using standard metric units (g, kg, ml, L) without misleading qualifying terms.'
  },
  {
    rule_id: 'rule_6_1_d_mfg_date',
    rule_source: 'Legal Metrology Rules 2011, Rule 6(1)(d) & Rule 6(10)',
    category: 'Date Marking',
    requirement_name: 'Month and Year of Manufacture / Packing / Import',
    check_type: 'presence',
    severity_default: 'major',
    penalty_amount: 2000,
    legal_citation: 'Rule 6(1)(d): Mandatory on physical packages. Rule 6(10): Digital e-commerce listings are exempt from declaring manufacturing/packing date.',
    explanation_template: 'Date of manufacturing/packing is required on physical package labels, but exempt on digital e-commerce listings under Rule 6(10).',
    online_required: false,
    exemption_rule: 'Rule 6(10) E-Commerce Exemption',
    verification_note: 'Not required to appear on the online listing under Rule 6(10).'
  },
  {
    rule_id: 'rule_6_1_e_mrp_format',
    rule_source: 'Legal Metrology Rules 2011, Rule 6(1)(e) & Rule 2(m)',
    category: 'Pricing Declaration',
    requirement_name: 'MRP with "Inclusive of all taxes" Mandatory Phrase',
    check_type: 'format',
    severity_default: 'critical',
    penalty_amount: 2000,
    legal_citation: 'Rule 6(1)(e) & 2(m): The maximum retail price at which the commodity in packaged form may be sold to the ultimate consumer, inclusive of all taxes.',
    explanation_template: 'The retail price must be formatted as "Maximum Retail Price" or "MRP Rs. XX.XX (incl. of all taxes)". Any extra surcharge or omitted tax disclaimer is an offense.'
  },
  {
    rule_id: 'rule_6_2_consumer_care',
    rule_source: 'Legal Metrology Rules 2011, Rule 6(2)',
    category: 'Consumer Redressal',
    requirement_name: 'Consumer Care Contact Details (Phone, Email, Address)',
    check_type: 'presence',
    severity_default: 'minor',
    penalty_amount: 2000,
    legal_citation: 'Rule 6(2): Every package shall bear the name, address, telephone number, and e-mail address of the person who can be contacted by the consumer in case of a complaint.',
    explanation_template: 'Packages must provide clear consumer care contact info including valid phone number and email address for grievances.'
  },
  {
    rule_id: 'rule_7_numeral_height',
    rule_source: 'Legal Metrology Rules 2011, Rule 7(2) Table I',
    category: 'Legibility & Font Size',
    requirement_name: 'Minimum Numeral & Letter Height on Principal Display Panel',
    check_type: 'numeric_range',
    severity_default: 'major',
    penalty_amount: 2000,
    legal_citation: 'Rule 7(2): The height of any numeral in the declaration of net quantity shall not be less than the minimum height specified in Table I (2mm for <=200g, 4mm for 200g-1kg, 6mm for >1kg).',
    explanation_template: 'Declared font/numeral size must meet minimum statutory millimeter threshold based on total package weight.'
  },
  {
    rule_id: 'rule_6_10_country_origin',
    rule_source: 'Legal Metrology Rules 2011, Rule 6(10) Amendment',
    category: 'Origin Declaration',
    requirement_name: 'Country of Origin for Imported / Domestic Goods',
    check_type: 'presence',
    severity_default: 'major',
    penalty_amount: 2000,
    legal_citation: 'Rule 6(10): For imported packages, the country of origin or manufacture shall be declared prominently.',
    explanation_template: 'Country of origin is mandatory, especially for e-commerce listings and imported packaged commodities.'
  }
];

export const RULE_32_PENALTY_RATE = 2000; // Standard compounding fine per section
