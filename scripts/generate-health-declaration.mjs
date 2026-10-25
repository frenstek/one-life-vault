/**
 * Generate OLF Pre-Existing Health and Injury Declaration Form PDF
 * Based on Arete Care template, rebranded for One Life Foundation
 * Usage: node scripts/generate-health-declaration.mjs
 */

import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');
const OUTPUT = 'C:/Users/kevin/Downloads/OLF Pre-Existing Health and Injury Declaration Form.pdf';

// Load logo
const logoData = fs.readFileSync(path.join(PROJECT, 'public/logo.png'));
const logoBase64 = 'data:image/png;base64,' + logoData.toString('base64');

// Constants
const BLUE = [30, 90, 138]; // #1E5A8A
const BLACK = [0, 0, 0];
const GREY = [100, 100, 100];
const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const ML = 25; // left margin
const MR = 20; // right margin
const MT = 28; // top margin (below header)
const MB = 28; // bottom margin (above footer)
const CONTENT_W = PAGE_W - ML - MR; // 165mm
const BLANK = '____________________';
const LONG_BLANK = '________________________________________';

let pageNum = 0;
let footerAdded = false;

const doc = new jsPDF({ unit: 'mm', format: 'a4' });

// ─── Helpers ────────────────────────────────────────────────────────────────

function addHeader() {
  doc.addImage(logoBase64, 'PNG', ML, 6, 28, 14);
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.8);
  doc.line(ML, 22, PAGE_W - MR, 22);
}

function addFooter() {
  if (footerAdded) return;
  footerAdded = true;
  pageNum++;
  const footerY = PAGE_H - 12;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(ML, footerY - 3, PAGE_W - MR, footerY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text(`Document Version 01.01.26  |  ${pageNum}  |  Page`, ML, footerY);

  const centerText = '9C Grasslands Avenue, Craigieburn, VIC, 3064  |  ABN: 55 643 227 061  |  Copyright One Life Foundation 2026';
  doc.text(centerText, PAGE_W / 2, footerY + 3.5, { align: 'center' });
}

function newPage() {
  addFooter();
  doc.addPage();
  footerAdded = false;
  addHeader();
}

function setHeading(size = 12) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size);
  doc.setTextColor(...BLUE);
}

function setBody() {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
}

function setBold() {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
}

function setItalic() {
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
}

/** Write wrapped text and return new Y position */
function writeText(text, x, y, maxW, opts = {}) {
  if (opts.bold) setBold();
  else if (opts.italic) setItalic();
  else setBody();

  if (opts.size) doc.setFontSize(opts.size);

  const lines = doc.splitTextToSize(text, maxW || CONTENT_W);
  const lineH = (opts.lineHeight || 4.5);

  for (const line of lines) {
    if (y > PAGE_H - MB) {
      addFooter();
      newPage();
      y = MT;
    }
    doc.text(line, x, y);
    y += lineH;
  }
  return y;
}

function checkSpace(y, needed) {
  if (y + needed > PAGE_H - MB) {
    addFooter();
    newPage();
    return MT;
  }
  return y;
}

/** Draw a checkbox (empty square) at position */
function drawCheckbox(x, y, size = 3.5) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(x, y - size + 0.5, size, size);
}

/** Draw blank lines for writing */
function drawBlankLines(y, count, lineSpacing = 8) {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  for (let i = 0; i < count; i++) {
    y += lineSpacing;
    if (y > PAGE_H - MB) {
      addFooter();
      newPage();
      y = MT + lineSpacing;
    }
    doc.line(ML, y, PAGE_W - MR, y);
  }
  return y;
}

/** Draw a signature block */
function drawSignatureLine(x, width, y, label) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(x, y, x + width, y);
  setBody();
  doc.setFontSize(9);
  doc.text(label, x, y + 4);
  return y;
}

// ─── PAGE 1: Introduction ────────────────────────────────────────────────────

addHeader();
let y = 36;

// Title
doc.setFont('helvetica', 'bold');
doc.setFontSize(16);
doc.setTextColor(...BLUE);
doc.text('PRE-EXISTING HEALTH AND INJURY', PAGE_W / 2, y, { align: 'center' });
y += 7;
doc.text('DECLARATION FORM', PAGE_W / 2, y, { align: 'center' });
y += 12;

// Opening paragraph
setBody();
y = writeText(
  `Thank you for your application for employment in the position ${BLANK} with One Life Foundation Pty Ltd (ABN 55 643 227 061) (One Life Foundation). Your employment with One Life Foundation is conditional upon you being able to perform the inherent requirements of the Position which are set out in the position description attached to your employment agreement dated ${BLANK}.`,
  ML, y, CONTENT_W
);
y += 4;

// Legislation list intro
y = writeText(
  'To assist One Life Foundation meets its obligations in accordance with:',
  ML, y, CONTENT_W
);
y += 3;

// Numbered legislation items
const legislationItems = [
  'the Accident Compensation Act 1985 (Vic) (ACA Act);',
  'the Workplace Injury Rehabilitation and Compensation Act 2013 (Vic) (WIRC Act);',
  'the Equal Opportunity Act 2010 (Vic); and',
  'the Disability Discrimination Act 1992 (Cth),',
];

for (let i = 0; i < legislationItems.length; i++) {
  const num = `${i + 1}.`;
  setBold();
  const numW = doc.getTextWidth(num + '  ');
  doc.text(num, ML + 8, y);
  setBody();
  doc.text(legislationItems[i], ML + 8 + numW, y);
  y += 5.5;
}

y += 1;
y = writeText(
  'please read this letter carefully, populate the form where required and return it to support@olfndisservices.com.au.',
  ML, y, CONTENT_W
);
y += 5;

// Pre-existing condition disclosure paragraph
y = writeText(
  'In accordance with the sections 82(7)-(9) of the ACA Act and section 41(1) of the WIRC Act, you are required to disclose any pre-existing injuries, illnesses or diseases (Pre-existing Condition) suffered by you which could be accelerated, exacerbated, aggravated or caused to recur or deteriorate by you performing the duties and responsibilities associated with the Position.',
  ML, y, CONTENT_W
);
y += 5;

// Position description reference
y = writeText(
  'In making this disclosure, please refer to the Position Description, which describes the nature of the employment. It includes a list of duties, responsibilities and demands (including any physical demands) associated with the employment.',
  ML, y, CONTENT_W
);
y += 5;

// Reasonable modifications
y = writeText(
  'Where you have a Pre-existing Condition, One Life Foundation will consider whether there are any reasonable modifications that can be made to the environment or tasks associated with the Position to assist you perform your duties and responsibilities.',
  ML, y, CONTENT_W
);
y += 5;

// Warning paragraph
y = writeText(
  'Please note that, if you fail to disclose this information or if you provide false and misleading information in relation to a Pre-existing Condition, One Life Foundation may rely on sections 82(8) and (9) of the ACA Act, as well as section 41(2) of the WIRC Act. Specifically, you and your dependants may not be entitled to any form of workers\u2019 compensation as a result of the recurrence, aggravation, acceleration, exacerbation or deterioration of a pre-existing condition arising out of, in the course of, or due to the nature of your employment. Your employment may also be terminated on the basis of not being able to perform the inherent requirements of the Position and/or for providing a false or misleading declaration.',
  ML, y, CONTENT_W
);
y += 5;

// Change notification
y = writeText(
  'Where there are any changes to your personal capacity to perform the inherent requirements of the Position, you are required to inform One Life Foundation immediately.',
  ML, y, CONTENT_W
);
y += 5;

// Privacy note
y = writeText(
  'The information gathered in this form will be treated in accordance with the Privacy Act 1988 (Cth) and the Health Records Act 2001 (Vic).',
  ML, y, CONTENT_W
);

addFooter();

// ─── PAGE 2: Employee Declaration ────────────────────────────────────────────

newPage();
y = MT;

// Section heading
setHeading(13);
doc.text('EMPLOYEE DECLARATION', ML, y);
const tw = doc.getTextWidth('EMPLOYEE DECLARATION');
doc.setDrawColor(...BLUE);
doc.setLineWidth(0.5);
doc.line(ML, y + 1.5, ML + tw, y + 1.5);
y += 10;

// Declaration intro
setBody();
y = writeText(
  `I ${BLANK} (Print Name) declare that:`,
  ML, y, CONTENT_W
);
y += 5;

// Bullet points
const bulletIndent = ML + 6;
const bulletContentW = CONTENT_W - 6;

// Bullet 1
doc.text('\u2022', ML + 1, y);
y = writeText(
  'I have read and understood this form and the Position Description and have discussed the employment with One Life Foundation. I understand the duties, responsibilities and demands (including any physical demands) of the Position and the employment.',
  bulletIndent, y, bulletContentW
);
y += 4;

// Bullet 2
doc.text('\u2022', ML + 1, y);
y = writeText(
  'I acknowledge that I am required to disclose all Pre-existing Conditions which I believe may be affected by me undertaking the employment.',
  bulletIndent, y, bulletContentW
);
y += 4;

// Bullet 3
doc.text('\u2022', ML + 1, y);
y = writeText(
  'I acknowledge that failure to disclose this information or providing false and misleading information may result in invoking sections 82(7)-(9) of the ACA Act and sections 41(1) and (2) of the WIRC Act, which may disentitle me or my dependants from receiving any worker\u2019s compensation benefits relating to any recurrence, aggravation, acceleration, exacerbation or deterioration of a Pre-existing Condition which I may have arising out of, or in the course of, the employment.',
  bulletIndent, y, bulletContentW
);
y += 8;

// Tick box section heading
setBold();
y = writeText('Please tick the following statement that is applicable:', ML, y, CONTENT_W, { bold: true });
y += 5;

// Checkbox 1
drawCheckbox(ML, y);
setBody();
y = writeText(
  'I have no Pre-existing Conditions that may recur or deteriorate, accelerate or be exacerbated or aggravated by the employment.',
  ML + 7, y, CONTENT_W - 7
);
y += 4;

// OR
setBold();
doc.text('OR', ML + 3, y);
y += 5;

// Checkbox 2
drawCheckbox(ML, y);
setBody();
y = writeText(
  'I have suffered the following Pre-existing Conditions that may recur or deteriorate, accelerate or be exacerbated or aggravated by the employment.',
  ML + 7, y, CONTENT_W - 7
);
y += 6;

// "Please list details" heading
setBold();
y = writeText('Please list details of all Pre-existing Conditions:', ML, y, CONTENT_W, { bold: true });
y += 2;

// 10 blank lines
y = drawBlankLines(y, 10, 7);

addFooter();

// ─── PAGE 3: Impact & PPE + Signatures ───────────────────────────────────────

newPage();
y = MT;

// Impact section heading
setBold();
y = writeText(
  'Please advise how the Pre-existing Condition(s) may affect your employment and what reasonable adjustments may be required to assist you in performing the inherent requirements of the Position:',
  ML, y, CONTENT_W, { bold: true }
);
y += 2;

// Italic instruction
setItalic();
y = writeText(
  'In providing your response, please consider any medications being taken, any ongoing treatments from medical professionals (or otherwise) or any restrictions to receiving vaccinations as may be required by One Life Foundation.',
  ML, y, CONTENT_W, { italic: true }
);
y += 2;

// 6 blank lines
y = drawBlankLines(y, 6, 7);
y += 6;

// PPE section heading
setBold();
y = writeText(
  'Please advise if the Pre-existing Condition(s) may affect your ability to wear the necessary Personal Protective Equipment (PPE) required to perform the inherent requirements of the Position:',
  ML, y, CONTENT_W, { bold: true }
);
y += 2;

// Italic instruction
setItalic();
y = writeText(
  'In providing your response, please set out details of the PPE that you are unable to wear (if any).',
  ML, y, CONTENT_W, { italic: true }
);
y += 2;

// 4 blank lines
y = drawBlankLines(y, 4, 7);
y += 8;

// Consultation instruction
setBody();
y = writeText(
  'Please complete the following in consultation with the General Manager/Director who will witness your signature:',
  ML, y, CONTENT_W, { bold: true }
);
y += 4;

// Acknowledgement
setBody();
y = writeText(
  'I acknowledge and declare that the information provided in this form is true and correct in every particular.',
  ML, y, CONTENT_W
);
y += 8;

// ─── Signature blocks ───────────────────────────────────────────────────────

const colW = 68;
const col1X = ML;
const col2X = ML + colW + 28;

// Employee signature
drawSignatureLine(col1X, colW, y, 'Employee Signature');
drawSignatureLine(col2X, colW, y, 'Print Name of Employee');
y += 12;

// Employee date
setBody();
doc.setFontSize(10);
doc.text('Dated:  _____/_____/_____', col1X, y);
y += 12;

// Witness signature
drawSignatureLine(col1X, colW, y, 'Witness Signature');
drawSignatureLine(col2X, colW, y, 'Print Name of Witness');
y += 12;

// Witness date
setBody();
doc.setFontSize(10);
doc.text('Dated:  _____/_____/_____', col1X, y);

addFooter();

// ─── PAGE 4: Additional Comments ─────────────────────────────────────────────

newPage();
y = MT;

// Section heading
setHeading(13);
doc.text('Additional Comments / Requisite Modifications', ML, y);
const tw4 = doc.getTextWidth('Additional Comments / Requisite Modifications');
doc.setDrawColor(...BLUE);
doc.setLineWidth(0.5);
doc.line(ML, y + 1.5, ML + tw4, y + 1.5);
y += 8;

// Italic instruction
setItalic();
y = writeText(
  '(to be completed by the General Manager/Director)',
  ML, y, CONTENT_W, { italic: true }
);
y += 4;

// 8 blank lines
y = drawBlankLines(y, 8, 10);

addFooter();

// ─── Save ───────────────────────────────────────────────────────────────────

const pdfOutput = doc.output('arraybuffer');
fs.writeFileSync(OUTPUT, Buffer.from(pdfOutput));
console.log(`PDF saved to: ${OUTPUT}`);
console.log(`Total pages: ${doc.getNumberOfPages()}`);

// ─── Upload to Supabase Storage ─────────────────────────────────────────────

const SUPABASE_URL = 'https://czdlemutsimvwfpwylxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGxlbXV0c2ltdndmcHd5bHhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjQ3NCwiZXhwIjoyMDkwMjQyNDc0fQ.ZueFz5cozYoC_TNUH_wX5Ak5G2PAdBMzJyrr_0gzPHk';

const storagePath = 'Forms Updated/OLF Pre-Existing Health and Injury Declaration Form.pdf';
const pdfBuffer = Buffer.from(pdfOutput);

try {
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/documents/${encodeURIComponent(storagePath)}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/pdf',
      'x-upsert': 'true',
    },
    body: pdfBuffer,
  });

  if (response.ok) {
    const result = await response.json();
    console.log(`Uploaded to Supabase Storage: documents/${storagePath}`);
    console.log('Upload result:', JSON.stringify(result));
  } else {
    const errorText = await response.text();
    console.error(`Upload failed (${response.status}): ${errorText}`);
  }
} catch (err) {
  console.error('Upload error:', err.message);
}
