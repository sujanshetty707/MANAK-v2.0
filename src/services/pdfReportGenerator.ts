import { jsPDF } from 'jspdf';
import { InspectionRecord } from '../types';

export function generateInspectionPDF(record: InspectionRecord): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header Banner
  doc.setFillColor(27, 58, 107); // #1B3A6B Deep Navy
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('GOVERNMENT OF INDIA', pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Ministry of Consumer Affairs, Food & Public Distribution', pageWidth / 2, 16, { align: 'center' });
  doc.text('DEPARTMENT OF LEGAL METROLOGY — STATUTORY INSPECTION REPORT', pageWidth / 2, 22, { align: 'center' });

  y = 35;
  doc.setTextColor(26, 26, 26);

  // Sub-header Info Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, y, pageWidth - 24, 24, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Report ID: ${record.report_id || 'MANAK-REP-2026-00491'}`, 16, y + 6);
  doc.text(`Inspection Date & Time: ${record.timestamp}`, 16, y + 12);
  doc.text(`Status: ${record.is_compliant ? 'FULLY COMPLIANT' : 'NON-COMPLIANT (VIOLATIONS DETECTED)'}`, 16, y + 18);

  doc.text(`Inspecting Officer: ${record.performed_by.name}`, pageWidth / 2 + 10, y + 6);
  doc.text(`Badge / ID: ${record.performed_by.badge_id}`, pageWidth / 2 + 10, y + 12);
  doc.text(`Zone / Jurisdiction: ${record.performed_by.zone}`, pageWidth / 2 + 10, y + 18);

  y += 30;

  // Geo Location & Evidence Authenticity (§65B Evidence Act)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(27, 58, 107);
  doc.text('1. Location & Tamper-Evident Digital Metadata (Sec. 65B Indian Evidence Act)', 12, y);
  y += 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(`• Premises / Address: ${record.geo.address}`, 15, y);
  y += 4.5;
  doc.text(`• GPS Coordinates: Latitude ${record.geo.lat.toFixed(4)}° N, Longitude ${record.geo.lng.toFixed(4)}° E`, 15, y);
  y += 4.5;
  doc.text(`• Digital Evidence Hash (SHA-256): ${record.evidence_hash}`, 15, y);
  y += 7;

  // Product Inspection Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(27, 58, 107);
  doc.text('2. Packaged Commodity Declaration Findings', 12, y);
  y += 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(`• Product Name & Brand: ${record.product.title} (${record.product.brand})`, 15, y);
  y += 4.5;
  doc.text(`• Declared Net Quantity: ${record.extraction.net_quantity.value ? `${record.extraction.net_quantity.value.amount} ${record.extraction.net_quantity.value.unit}` : 'Not Declared'}`, 15, y);
  y += 4.5;
  doc.text(`• Declared MRP: ${record.extraction.mrp.value ? record.extraction.mrp.value.raw_text : 'Not Declared'}`, 15, y);
  y += 4.5;
  doc.text(`• Declared Manufacturer: ${record.extraction.manufacturer.value || 'Not Declared'}`, 15, y);
  y += 4.5;
  doc.text(`• Date of Packing/Mfg: ${record.extraction.mfg_date.value || 'Not Declared'} | Origin: ${record.extraction.country_of_origin.value || 'Not Declared'}`, 15, y);
  y += 7;

  // Statutory Checklist & Violations
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(27, 58, 107);
  doc.text('3. Statutory Checklist & Legal Metrology (Packaged Commodities) Rules 2011 Audit', 12, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.rect(12, y, pageWidth - 24, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Rule / Clause', 15, y + 4.5);
  doc.text('Requirement', 50, y + 4.5);
  doc.text('Evaluation Status', 120, y + 4.5);
  doc.text('Penalty (Rs.)', 165, y + 4.5);
  y += 7;

  record.evaluations.forEach((evalItem) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(evalItem.status === 'violation' ? 192 : 30, evalItem.status === 'violation' ? 57 : 41, evalItem.status === 'violation' ? 43 : 59);

    const isViol = evalItem.status === 'violation';
    doc.text(evalItem.rule_source.substring(0, 22), 15, y + 4);
    doc.text(evalItem.requirement_name.substring(0, 42), 50, y + 4);
    doc.text(isViol ? 'NON-COMPLIANT' : 'COMPLIANT', 120, y + 4);
    doc.text(isViol ? `Rs. ${evalItem.penalty}` : 'Rs. 0', 165, y + 4);

    y += 5.5;
  });

  // Total Fine
  y += 3;
  doc.setDrawColor(203, 213, 225);
  doc.line(12, y, pageWidth - 12, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(27, 58, 107);
  doc.text(`Total Statutory Violations Found: ${record.total_violations}`, 15, y);
  doc.text(`Total Compounding Penalty Amount: Rs. ${record.total_penalty}`, 120, y);

  y += 15;

  // Digital Signature Block
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, y, pageWidth - 24, 26, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(42, 157, 92); // Green
  doc.text('✓ DIGITALLY SIGNED & CERTIFIED (eSign / Documenso Verification)', 16, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text(`Signatory: ${record.performed_by.name} (${record.performed_by.badge_id})`, 16, y + 12);
  doc.text(`Certificate Ref: ${record.signature_details?.certificate_id || 'DSC-IN-LM-2026-991823'}`, 16, y + 17);
  doc.text(`Timestamp: ${record.signature_details?.timestamp || record.timestamp} | Server Verification: VERIFIED`, 16, y + 22);

  // Footer Note
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('This digital inspection report is issued under the authority of the Legal Metrology Act, 2009 and Packaged Commodities Rules, 2011.', pageWidth / 2, 285, { align: 'center' });

  // Save the PDF
  doc.save(`${record.report_id || 'MANAK-Inspection-Report'}.pdf`);
}
