/**
 * Generate OLF Employee Confidentiality Agreement PDF
 * Based on Arete Care template, rebranded for One Life Foundation
 * Usage: node scripts/generate-confidentiality-agreement.mjs
 */

import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');
const OUTPUT = 'C:/Users/kevin/Downloads/OLF Employee Confidentiality Agreement.pdf';

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
  // Logo top-left
  doc.addImage(logoBase64, 'PNG', ML, 6, 28, 14);
  // Blue accent line
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.8);
  doc.line(ML, 22, PAGE_W - MR, 22);
}

function addFooter() {
  if (footerAdded) return;
  footerAdded = true;
  pageNum++;
  const footerY = PAGE_H - 12;

  // Top line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(ML, footerY - 3, PAGE_W - MR, footerY - 3);

  // Left: version + page
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text(`Document Version 01.01.26  |  ${pageNum}  |  Page`, ML, footerY);

  // Center: address + ABN + copyright
  const centerText = '9C Grasslands Avenue, Craigieburn, VIC, 3064  |  ABN: 55 643 227 061  |  Copyright One Life Foundation 2026';
  doc.text(centerText, PAGE_W / 2, footerY + 3.5, { align: 'center' });
}

function newPage() {
  addFooter(); // ensure current page has footer before moving on
  doc.addPage();
  footerAdded = false;
  addHeader();
}

function setHeading(size = 12) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size);
  doc.setTextColor(...BLUE);
}

function setSubHeading(size = 10.5) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size);
  doc.setTextColor(...BLACK);
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

/** Write a clause number + text on same line, wrapped */
function writeClause(num, text, x, y, indent = 0) {
  setBold();
  const numW = doc.getTextWidth(num + '  ');
  doc.text(num, x + indent, y);

  setBody();
  const textX = x + indent + numW;
  const maxW = CONTENT_W - indent - numW;
  const lines = doc.splitTextToSize(text, maxW);
  const lineH = 4.5;

  for (let i = 0; i < lines.length; i++) {
    if (y > PAGE_H - MB) {
      addFooter();
      newPage();
      y = MT;
    }
    doc.text(lines[i], i === 0 ? textX : textX, y);
    y += lineH;
  }
  return y;
}

/** Write a lettered sub-item like (a) text */
function writeSub(letter, text, y, baseIndent = 10) {
  setBody();
  const label = `(${letter})`;
  const labelW = doc.getTextWidth(label + '  ');
  const x = ML + baseIndent;

  doc.text(label, x, y);
  const textX = x + labelW;
  const maxW = CONTENT_W - baseIndent - labelW;
  const lines = doc.splitTextToSize(text, maxW);
  const lineH = 4.5;

  for (let i = 0; i < lines.length; i++) {
    if (y > PAGE_H - MB) {
      addFooter();
      newPage();
      y = MT;
    }
    doc.text(lines[i], textX, y);
    y += lineH;
  }
  return y;
}

/** Write a roman numeral sub-item like (i) text */
function writeRoman(numeral, text, y, baseIndent = 20) {
  setBody();
  const label = `(${numeral})`;
  const labelW = doc.getTextWidth(label + '  ');
  const x = ML + baseIndent;

  doc.text(label, x, y);
  const textX = x + labelW;
  const maxW = CONTENT_W - baseIndent - labelW;
  const lines = doc.splitTextToSize(text, maxW);
  const lineH = 4.5;

  for (let i = 0; i < lines.length; i++) {
    if (y > PAGE_H - MB) {
      addFooter();
      newPage();
      y = MT;
    }
    doc.text(lines[i], textX, y);
    y += lineH;
  }
  return y;
}

/** Draw a section heading with underline */
function sectionHeading(text, y) {
  if (y > PAGE_H - MB - 15) {
    addFooter();
    newPage();
    y = MT;
  }
  setHeading(13);
  doc.text(text, ML, y);
  const tw = doc.getTextWidth(text);
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.5);
  doc.line(ML, y + 1.5, ML + tw, y + 1.5);
  return y + 8;
}

function checkSpace(y, needed) {
  if (y + needed > PAGE_H - MB) {
    addFooter();
    newPage();
    return MT;
  }
  return y;
}

// ─── PAGE 1: Title & Parties ────────────────────────────────────────────────

addHeader();
let y = 36;

// Title
doc.setFont('helvetica', 'bold');
doc.setFontSize(18);
doc.setTextColor(...BLUE);
doc.text('EMPLOYEE CONFIDENTIALITY', PAGE_W / 2, y, { align: 'center' });
y += 8;
doc.text('AGREEMENT', PAGE_W / 2, y, { align: 'center' });
y += 14;

// Date line
setBody();
y = writeText(`This Confidentiality Agreement is made on ${LONG_BLANK}.`, ML, y, CONTENT_W);
y += 6;

// Parties heading
y = sectionHeading('Parties', y);

// OLF party
setBold();
y = writeText('One Life Foundation Pty Ltd (ABN 55 643 227 061)', ML, y, CONTENT_W, { bold: true });
setBody();
y = writeText('of 9C Grasslands Avenue, Craigieburn VIC 3064 in the State of Victoria', ML, y, CONTENT_W);
y += 2;
setItalic();
y = writeText('(One Life Foundation)', ML, y, CONTENT_W, { italic: true });
y += 4;

// "and"
setBody();
y = writeText('and', ML, y, CONTENT_W);
y += 4;

// Employee party
setBold();
y = writeText(`${LONG_BLANK} of ${LONG_BLANK}`, ML, y, CONTENT_W, { bold: true });
setBody();
y = writeText('in the State of Victoria', ML, y, CONTENT_W);
y += 2;
setItalic();
y = writeText('(Employee)', ML, y, CONTENT_W, { italic: true });
y += 8;

// Background
y = sectionHeading('BACKGROUND', y);

const backgrounds = [
  ['A.', 'One Life Foundation carries on the businesses of a registered disability support service provider providing services under the National Disability Insurance Scheme (NDIS), including Supported Independent Living (SIL), community participation, and high intensity daily personal activities.'],
  ['B.', `The Employee is employed by One Life Foundation under an employment agreement dated ${BLANK} (Employment Agreement).`],
  ['C.', 'During the course of the Employee\'s employment, the Employee will be exposed to, or be given access to, Confidential Information in order to allow the Employee to perform the Employee\'s duties. One Life Foundation has disclosed or will disclose that information on a confidential basis to the Employee for that purpose.'],
  ['D.', 'The Employee has agreed to keep that information strictly confidential, in accordance with the terms of this Confidentiality Agreement.'],
];

for (const [letter, text] of backgrounds) {
  y = checkSpace(y, 20);
  setBold();
  doc.text(letter, ML, y);
  setBody();
  const textX = ML + 8;
  const lines = doc.splitTextToSize(text, CONTENT_W - 8);
  for (let i = 0; i < lines.length; i++) {
    if (y > PAGE_H - MB) {
      addFooter();
      newPage();
      y = MT;
    }
    doc.text(lines[i], textX, y);
    y += 4.5;
  }
  y += 3;
}

addFooter();

// ─── PAGE 2-3: Operative Provisions — Definitions ───────────────────────────

newPage();
y = MT;

// OPERATIVE PROVISIONS heading
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.setTextColor(...BLUE);
doc.text('OPERATIVE PROVISIONS', PAGE_W / 2, y, { align: 'center' });
y += 10;

y = sectionHeading('1. Definitions and Interpretation', y);

y = writeText('1.1  Definitions', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('In this Confidentiality Agreement, the following definitions apply unless the context requires otherwise:', ML, y, CONTENT_W);
y += 4;

const definitions = [
  ['Approved Purpose', 'means use by the Employee solely for the purpose of carrying out the Employee\'s duties and responsibilities under the Employment Agreement.'],
  ['One Life Foundation', 'means One Life Foundation Pty Ltd (ABN 55 643 227 061).'],
  ['Associated Entity', 'has the same meaning given to that term in section 50AAA of the Corporations Act.'],
  ['Authorised Person', 'means a person nominated by One Life Foundation from time to time as a person authorised to receive Confidential Information for the Approved Purpose.'],
  ['Client', 'means all clients, customers, participants and their guardians, family members and carers of One Life Foundation or any member of the Group, including any person receiving services under the NDIS.'],
  ['Client Information', 'means all information about past, current, and prospective Clients, including without limitation names, addresses, contact details, personal information, health information, medical records, NDIS plan information, support needs, and service delivery records.'],
];

for (const [term, meaning] of definitions) {
  y = checkSpace(y, 16);
  setBold();
  const termText = term;
  doc.text(termText, ML + 5, y);
  setBody();
  const fullText = `${termText} ${meaning}`;
  const lines = doc.splitTextToSize(fullText, CONTENT_W - 5);
  // Re-render with bold term
  for (let i = 0; i < lines.length; i++) {
    if (y > PAGE_H - MB) {
      addFooter();
      newPage();
      y = MT;
    }
    // For first line, bold the term part
    if (i === 0) {
      setBold();
      doc.text(termText + ' ', ML + 5, y);
      const termW = doc.getTextWidth(termText + ' ');
      setBody();
      // Get remaining text on first line
      const firstLineRemaining = lines[0].substring(termText.length + 1);
      doc.text(firstLineRemaining, ML + 5 + termW, y);
    } else {
      setBody();
      doc.text(lines[i], ML + 5, y);
    }
    y += 4.5;
  }
  y += 2;
}

// Confidential Information definition (long one with sub-items)
y = checkSpace(y, 12);
setBold();
doc.text('Confidential Information', ML + 5, y);
setBody();
const ciIntro = 'Confidential Information means any information that is by its nature confidential or that the Employee knows or ought to know is confidential, and includes without limitation:';
const termW_ci = doc.getTextWidth('Confidential Information ');
const ciLines = doc.splitTextToSize('Confidential Information ' + ciIntro, CONTENT_W - 5);
for (let i = 0; i < ciLines.length; i++) {
  if (y > PAGE_H - MB) {
    addFooter();
    newPage();
    y = MT;
  }
  if (i === 0) {
    setBold();
    doc.text('Confidential Information ', ML + 5, y);
    setBody();
    doc.text(ciLines[0].substring('Confidential Information '.length), ML + 5 + termW_ci, y);
  } else {
    doc.text(ciLines[i], ML + 5, y);
  }
  y += 4.5;
}
y += 1;

const ciItems = [
  'trade secrets and intellectual property of One Life Foundation or any member of the Group;',
  'financial and accounting information, products, services, pricing structures, plans, and strategies;',
  'personal, business, and financial information relating to employees, directors, contractors, and clients of One Life Foundation or any member of the Group;',
  'personnel records, processes, handbooks, manuals, policies, and procedures;',
  'Client Information;',
  'Client lists;',
  'Supplier Information;',
  'Supplier lists;',
  'information disclosed by Clients or Suppliers to One Life Foundation or any member of the Group;',
  'information that is subject to obligations of confidence owed by One Life Foundation or any member of the Group to any third party;',
  'information relating to the Employee\'s employment with One Life Foundation;',
  'any information designated as confidential by One Life Foundation; and',
  'any document or material marked as confidential or which the Employee could reasonably be expected to regard as confidential,',
];

const letters = 'abcdefghijklmnopqrstuvwxyz';
for (let i = 0; i < ciItems.length; i++) {
  y = checkSpace(y, 10);
  y = writeSub(letters[i], ciItems[i], y, 10);
  y += 1;
}

y += 2;
y = writeText('but does not include information that:', ML + 5, y, CONTENT_W - 5);
y += 1;

const ciExclusions = [
  'is in or becomes part of the public domain other than through a breach of this Confidentiality Agreement or any other obligation of confidence owed to One Life Foundation;',
  'was published or publicly available before the date of this Confidentiality Agreement;',
  'was known by the Employee before disclosure by One Life Foundation and was not subject to any obligation of confidence at the time of disclosure;',
  'is subsequently received by the Employee from a third party who is not under an obligation of confidence to One Life Foundation in respect of that information; or',
  'relates to the Employee\'s terms and conditions of employment, to the extent that the Fair Work Act 2009 (Cth) permits the Employee to disclose such information.',
];

for (let i = 0; i < ciExclusions.length; i++) {
  y = checkSpace(y, 10);
  y = writeSub(letters[i], ciExclusions[i], y, 10);
  y += 1;
}

y += 3;

// More definitions
const definitions2 = [
  ['Corporations Act', 'means the Corporations Act 2001 (Cth).'],
  ['Employee', `means ${LONG_BLANK}.`],
  ['Employment Agreement', `means the employment agreement between One Life Foundation and the Employee dated ${BLANK}.`],
  ['Group', 'means:'],
];

for (const [term, meaning] of definitions2) {
  y = checkSpace(y, 12);
  setBold();
  doc.text(term, ML + 5, y);
  setBody();
  const fullText = `${term} ${meaning}`;
  const lines = doc.splitTextToSize(fullText, CONTENT_W - 5);
  for (let i = 0; i < lines.length; i++) {
    if (y > PAGE_H - MB) {
      addFooter();
      newPage();
      y = MT;
    }
    if (i === 0) {
      setBold();
      doc.text(term + ' ', ML + 5, y);
      const tw = doc.getTextWidth(term + ' ');
      setBody();
      doc.text(lines[0].substring(term.length + 1), ML + 5 + tw, y);
    } else {
      setBody();
      doc.text(lines[i], ML + 5, y);
    }
    y += 4.5;
  }

  if (term === 'Group') {
    y += 1;
    y = writeSub('a', 'One Life Foundation; and', y, 10);
    y += 1;
    y = writeSub('b', 'any Associated Entity of One Life Foundation.', y, 10);
  }
  y += 2;
}

const definitions3 = [
  ['Intellectual Property', 'has the same meaning given to that term in the Employment Agreement.'],
  ['Related Bodies Corporate', 'has the same meaning given to that term in section 50 of the Corporations Act.'],
  ['Supplier', 'means any supplier, vendor, contractor, or service provider that has a business relationship with One Life Foundation or any member of the Group.'],
  ['Supplier Information', 'means all information about past, current, and prospective Suppliers, including without limitation names, addresses, contact details, business information, pricing, terms of trade, and contractual arrangements.'],
];

for (const [term, meaning] of definitions3) {
  y = checkSpace(y, 12);
  setBold();
  doc.text(term, ML + 5, y);
  setBody();
  const fullText = `${term} ${meaning}`;
  const lines = doc.splitTextToSize(fullText, CONTENT_W - 5);
  for (let i = 0; i < lines.length; i++) {
    if (y > PAGE_H - MB) {
      addFooter();
      newPage();
      y = MT;
    }
    if (i === 0) {
      setBold();
      doc.text(term + ' ', ML + 5, y);
      const tw = doc.getTextWidth(term + ' ');
      setBody();
      doc.text(lines[0].substring(term.length + 1), ML + 5 + tw, y);
    } else {
      setBody();
      doc.text(lines[i], ML + 5, y);
    }
    y += 4.5;
  }
  y += 2;
}

// 1.2 Interpretation
y += 3;
y = checkSpace(y, 10);
y = writeText('1.2  Interpretation', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('In this Confidentiality Agreement, unless the context requires otherwise:', ML, y, CONTENT_W);
y += 3;

const interpItems = [
  'headings are for convenience only and do not affect the interpretation of this Confidentiality Agreement;',
  'the singular includes the plural and vice versa;',
  'a reference to a party includes that party\'s executors, administrators, successors and permitted assigns;',
  'a reference to legislation includes any amendment to that legislation, any legislation substituted for it, and any subordinate legislation made under it;',
  'where an expression is defined, another part of speech or grammatical form of that expression has a corresponding meaning; and',
  'a reference to "includes" or "including" means includes or including without limitation.',
];

for (let i = 0; i < interpItems.length; i++) {
  y = checkSpace(y, 10);
  y = writeSub(letters[i], interpItems[i], y, 10);
  y += 1.5;
}

// ─── Section 2: Use of Confidential Information ─────────────────────────────

y += 4;
y = sectionHeading('2. Use of Confidential Information', y);

y = writeText('2.1  Keep information confidential', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('The Employee must:', ML, y, CONTENT_W);
y += 3;

const useItems = [
  'keep the Confidential Information strictly confidential;',
  'not directly or indirectly disclose, publish, or otherwise make available any Confidential Information except as expressly permitted by this Confidentiality Agreement;',
  'not use any Confidential Information except for the Approved Purpose;',
  'take all reasonable steps to ensure that the Confidential Information is not disclosed or made available to any person other than an Authorised Person;',
  'not copy, reproduce, or reduce to writing any Confidential Information except as may be reasonably necessary for the Approved Purpose;',
  'take all reasonable steps to protect the Confidential Information from theft, loss, damage, or unauthorised access;',
  'comply with all reasonable directions given by One Life Foundation from time to time in relation to the protection of the Confidential Information; and',
  'not do or permit anything to be done that may infringe, damage, or put at risk the rights of One Life Foundation or any member of the Group in the Confidential Information.',
];

for (let i = 0; i < useItems.length; i++) {
  y = checkSpace(y, 12);
  y = writeSub(letters[i], useItems[i], y, 10);
  y += 1.5;
}

y += 3;
y = checkSpace(y, 12);
y = writeText('2.2  Notify of unauthorised disclosure', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('The Employee must immediately notify One Life Foundation upon becoming aware of any actual or suspected unauthorised disclosure, copying, use, or loss of any Confidential Information, including the circumstances surrounding the disclosure.', ML, y, CONTENT_W);
y += 5;

y = checkSpace(y, 20);
y = writeText('2.3  Disclosure to Authorised Persons', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('The Employee may disclose Confidential Information to an Authorised Person, provided that:', ML, y, CONTENT_W);
y += 3;
y = writeSub('a', 'the disclosure is strictly necessary for the Approved Purpose; and', y, 10);
y += 1.5;
y = writeSub('b', 'the Employee takes all reasonable steps to ensure that the Authorised Person is aware that the information is confidential and undertakes to comply with obligations no less onerous than those set out in this Confidentiality Agreement.', y, 10);
y += 5;

y = checkSpace(y, 12);
y = writeText('2.4  Provide list of Authorised Persons', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('One Life Foundation will provide the Employee with a list of Authorised Persons from time to time, and may vary that list at its discretion.', ML, y, CONTENT_W);

// ─── Section 3: Exceptions ──────────────────────────────────────────────────

y += 6;
y = sectionHeading('3. Exceptions — Permitted Disclosures', y);

y = writeText('The obligations of confidentiality in clause 2 do not apply to disclosure of Confidential Information:', ML, y, CONTENT_W);
y += 3;

y = writeSub('a', 'to the extent required:', y, 10);
y += 1.5;
y = writeRoman('i', 'by any applicable law, regulation, or governmental order;', y, 20);
y += 1.5;
y = writeRoman('ii', 'by the rules of any stock exchange on which securities of One Life Foundation or any Related Body Corporate are listed; or', y, 20);
y += 1.5;
y = writeRoman('iii', 'by any court, tribunal, authority, or regulatory body having jurisdiction over the Employee,', y, 20);
y += 2;
y = writeText('provided that the Employee gives One Life Foundation prompt written notice of the requirement to disclose (to the extent permitted by law) and takes all reasonable steps to minimise the extent of the disclosure; or', ML + 10, y, CONTENT_W - 10);
y += 3;
y = writeSub('b', 'with the prior written consent of One Life Foundation.', y, 10);

// ─── Section 4: Ownership ───────────────────────────────────────────────────

y += 8;
y = sectionHeading('4. Ownership of Confidential Information', y);

y = writeSub('a', 'The Employee acknowledges and agrees that all Confidential Information is and remains the property of One Life Foundation (or the relevant member of the Group or third party, as the case may be). Nothing in this Confidentiality Agreement grants the Employee any right, title, or interest in or to any Confidential Information.', y, 10);
y += 3;
y = writeSub('b', 'Any Intellectual Property created by the Employee during the course of the Employee\'s employment that relates to or incorporates any Confidential Information is the property of One Life Foundation and is dealt with in accordance with the Employment Agreement.', y, 10);

// ─── Section 5: Return of Confidential Information ──────────────────────────

y += 8;
y = sectionHeading('5. Return of Confidential Information', y);

y = writeSub('a', 'Upon the request of One Life Foundation, or upon the termination or expiry of the Employee\'s employment (whichever occurs first), the Employee must immediately:', y, 10);
y += 1.5;
y = writeRoman('i', 'deliver to One Life Foundation all documents, records, files, materials, equipment, and any other property of One Life Foundation or any member of the Group that contains or relates to Confidential Information and that is in the possession, custody, or control of the Employee; and', y, 20);
y += 1.5;
y = writeRoman('ii', 'permanently delete or destroy all copies of Confidential Information stored electronically or otherwise in the possession, custody, or control of the Employee, and certify in writing to One Life Foundation that the Employee has complied with this obligation.', y, 20);
y += 3;
y = writeSub('b', 'This clause 5 does not require the Employee to return or destroy information that the Employee is required to retain by law, provided that any such information remains subject to the obligations of confidence in this Confidentiality Agreement.', y, 10);

// ─── Section 6: Damages Insufficient ────────────────────────────────────────

y += 8;
y = checkSpace(y, 25);
y = sectionHeading('6. Damages Insufficient', y);

y = writeText('The Employee acknowledges and agrees that:', ML, y, CONTENT_W);
y += 3;
y = writeSub('a', 'the Confidential Information is valuable and proprietary to One Life Foundation;', y, 10);
y += 1.5;
y = writeSub('b', 'damages may not be an adequate remedy for any breach of this Confidentiality Agreement; and', y, 10);
y += 1.5;
y = writeSub('c', 'One Life Foundation is entitled to seek and obtain injunctive relief or specific performance, in addition to any other remedy available at law or in equity, for any actual or threatened breach of this Confidentiality Agreement.', y, 10);

// ─── Section 7: Indemnity ───────────────────────────────────────────────────

newPage();
y = MT;

y = sectionHeading('7. Indemnity', y);

y = writeText('The Employee indemnifies and holds harmless One Life Foundation and each member of the Group against all losses, liabilities, costs, damages, and expenses (including legal costs on a solicitor-client basis) suffered or incurred by One Life Foundation or any member of the Group arising directly or indirectly from any breach by the Employee of any obligation under this Confidentiality Agreement.', ML, y, CONTENT_W);

// ─── Section 8: Term and Termination ────────────────────────────────────────

y += 8;
y = sectionHeading('8. Term and Termination', y);

y = writeText('8.1  Term', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeSub('a', 'This Confidentiality Agreement commences on the date it is executed by both parties and continues for the duration of the Employee\'s employment with One Life Foundation.', y, 10);
y += 1.5;
y = writeSub('b', 'The obligations of confidence under this Confidentiality Agreement survive the termination or expiry of this Confidentiality Agreement and the termination or expiry of the Employee\'s employment with One Life Foundation, and continue to bind the Employee indefinitely.', y, 10);

y += 5;
y = writeText('8.2  Termination', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('One Life Foundation may terminate this Confidentiality Agreement at any time by giving written notice to the Employee. Termination of this Confidentiality Agreement does not affect any accrued rights or obligations of either party.', ML, y, CONTENT_W);

y += 5;
y = writeText('8.3  Consequences of termination', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('Upon termination of this Confidentiality Agreement:', ML, y, CONTENT_W);
y += 3;
y = writeSub('a', 'the Employee must comply with clause 5 (Return of Confidential Information);', y, 10);
y += 1.5;
y = writeSub('b', 'the obligations of confidence under this Confidentiality Agreement continue to apply in accordance with clause 8.1(b); and', y, 10);
y += 1.5;
y = writeSub('c', 'any provision of this Confidentiality Agreement which is expressed to or by its nature survives termination will continue in full force and effect.', y, 10);

// ─── Section 9: Notices ─────────────────────────────────────────────────────

y += 8;
y = sectionHeading('9. Notices and other Communications', y);

y = writeText('9.1  Service of Notices', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeSub('a', 'A notice or other communication connected with this Confidentiality Agreement (Notice) must be in writing and must be delivered by hand, sent by prepaid post, or sent by email to the address of the party set out in clause 9.2 or to any other address that a party may notify to the other from time to time.', y, 10);
y += 2;
y = writeSub('b', 'A Notice is taken to be received:', y, 10);
y += 1.5;
y = writeRoman('i', 'if delivered by hand, on the date of delivery;', y, 20);
y += 1.5;
y = writeRoman('ii', 'if sent by prepaid post, 3 Business Days after posting (or 7 Business Days if sent to or from a place outside Australia); or', y, 20);
y += 1.5;
y = writeRoman('iii', 'if sent by email, at the time shown in the delivery confirmation report generated by the sender\'s email system.', y, 20);

y += 5;
y = checkSpace(y, 40);
y = writeText('9.2  Party details', ML, y, CONTENT_W, { bold: true });
y += 4;

// OLF details
setBold();
y = writeText('One Life Foundation:', ML + 5, y, CONTENT_W - 5, { bold: true });
y += 1;
setBody();
y = writeText('Contact person:   Harsimran Singh', ML + 10, y, CONTENT_W - 10);
y = writeText('Address:              9C Grasslands Avenue, Craigieburn VIC 3064', ML + 10, y, CONTENT_W - 10);
y = writeText('Email:                  support@olfndisservices.com.au', ML + 10, y, CONTENT_W - 10);
y += 4;

// Employee details
setBold();
y = writeText('Employee:', ML + 5, y, CONTENT_W - 5, { bold: true });
y += 1;
setBody();
y = writeText(`Full name:           ${LONG_BLANK}`, ML + 10, y, CONTENT_W - 10);
y = writeText(`Address:              ${LONG_BLANK}`, ML + 10, y, CONTENT_W - 10);
y = writeText(`Email:                  ${LONG_BLANK}`, ML + 10, y, CONTENT_W - 10);

// ─── Section 10: Miscellaneous ──────────────────────────────────────────────

newPage();
y = MT;

y = sectionHeading('10. Miscellaneous', y);

y = writeText('10.1  Alterations', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('This Confidentiality Agreement may only be altered, varied, or amended by a document signed by each of the parties.', ML, y, CONTENT_W);
y += 5;

y = writeText('10.2  Approvals and consents', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('Where this Confidentiality Agreement requires any approval or consent to be given by One Life Foundation, that approval or consent may be given conditionally or unconditionally, or may be withheld, in the absolute discretion of One Life Foundation.', ML, y, CONTENT_W);
y += 5;

y = writeText('10.3  Assignment', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeSub('a', 'The Employee must not assign or transfer any of the Employee\'s rights or obligations under this Confidentiality Agreement without the prior written consent of One Life Foundation.', y, 10);
y += 1.5;
y = writeSub('b', 'One Life Foundation may assign or transfer any of its rights or obligations under this Confidentiality Agreement to any member of the Group without the consent of the Employee.', y, 10);
y += 5;

y = writeText('10.4  Counterparts', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('This Confidentiality Agreement may be executed in any number of counterparts, each of which when executed is an original. Together, all counterparts make up one instrument.', ML, y, CONTENT_W);
y += 5;

y = writeText('10.5  Electronic Signature', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('The parties agree that this Confidentiality Agreement may be executed by electronic signature and that such electronic signatures shall be deemed to be original signatures for all purposes.', ML, y, CONTENT_W);
y += 5;

y = writeText('10.6  No merger', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('The rights and obligations of the parties under this Confidentiality Agreement do not merge on the completion of any transaction under this Confidentiality Agreement. They survive the execution and delivery of any assignment or other document entered into for the purpose of implementing any transaction.', ML, y, CONTENT_W);
y += 5;

y = writeText('10.7  Severability', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('If any provision of this Confidentiality Agreement is held to be invalid, illegal, or unenforceable in any jurisdiction, that provision is to be read down for the purposes of that jurisdiction, if possible, so as to be valid, legal, and enforceable. If it cannot be read down, the provision is to be severed and the remaining provisions of this Confidentiality Agreement continue in full force and effect.', ML, y, CONTENT_W);
y += 5;

y = checkSpace(y, 20);
y = writeText('10.8  Waiver', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('A right arising under this Confidentiality Agreement may only be waived in writing signed by the party granting the waiver. A failure or delay by a party in exercising a right under this Confidentiality Agreement does not operate as a waiver of that right. A single or partial exercise of a right does not preclude any other or further exercise of that right or the exercise of any other right.', ML, y, CONTENT_W);
y += 5;

y = checkSpace(y, 20);
y = writeText('10.9  Governing law and jurisdiction', ML, y, CONTENT_W, { bold: true });
y += 2;
y = writeText('This Confidentiality Agreement is governed by the laws of the State of Victoria. Each party irrevocably and unconditionally submits to the exclusive jurisdiction of the courts of the State of Victoria and courts of appeal from them.', ML, y, CONTENT_W);

addFooter();

// ─── EXECUTION PAGE ─────────────────────────────────────────────────────────

newPage();
y = MT;

// Execution heading
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.setTextColor(...BLUE);
doc.text('EXECUTION', PAGE_W / 2, y, { align: 'center' });
y += 10;

setBody();
y = writeText(`Executed as an agreement on ${LONG_BLANK}.`, ML, y, CONTENT_W);
y += 10;

// OLF execution block
setBold();
doc.setFontSize(10);
y = writeText('EXECUTED by ONE LIFE FOUNDATION PTY LTD', ML, y, CONTENT_W, { bold: true });
y = writeText('(ABN 55 643 227 061)', ML, y, CONTENT_W, { bold: true });
setBody();
y = writeText('pursuant to Section 127 of the Corporations Act 2001 (Cth):', ML, y, CONTENT_W);
y += 10;

// Director signature block
doc.setDrawColor(0, 0, 0);
doc.setLineWidth(0.3);

// Left column - Director
const colW = 70;
const col1X = ML;
const col2X = ML + colW + 25;

doc.line(col1X, y, col1X + colW, y);
y += 5;
setBody();
doc.text('Signature of Director', col1X, y);

doc.line(col2X, y - 5, col2X + colW, y - 5);
doc.text('Signature of Director / Secretary', col2X, y);
y += 10;

doc.line(col1X, y, col1X + colW, y);
y += 5;
doc.text('Full Name', col1X, y);

doc.line(col2X, y - 5, col2X + colW, y - 5);
doc.text('Full Name', col2X, y);
y += 10;

doc.line(col1X, y, col1X + colW, y);
y += 5;
doc.text('Address', col1X, y);

doc.line(col2X, y - 5, col2X + colW, y - 5);
doc.text('Address', col2X, y);
y += 15;

// Employee execution block
setBold();
y = writeText(`SIGNED, SEALED AND DELIVERED by the said ${LONG_BLANK}`, ML, y, CONTENT_W, { bold: true });
setBody();
y = writeText('in the presence of:', ML, y, CONTENT_W);
y += 15;

// Employee signature
doc.line(col1X, y, col1X + colW, y);
y += 5;
doc.text('Signature of Employee', col1X, y);

doc.line(col2X, y - 5, col2X + colW, y - 5);
doc.text('Signature of Witness', col2X, y);
y += 10;

doc.line(col1X, y, col1X + colW, y);
y += 5;
doc.text('Print Name', col1X, y);

doc.line(col2X, y - 5, col2X + colW, y - 5);
doc.text('Print Name', col2X, y);
y += 10;

doc.line(col1X, y, col1X + colW, y);
y += 5;
doc.text('Date', col1X, y);

doc.line(col2X, y - 5, col2X + colW, y - 5);
doc.text('Print Address', col2X, y);

addFooter();

// ─── Save ───────────────────────────────────────────────────────────────────

const pdfOutput = doc.output('arraybuffer');
fs.writeFileSync(OUTPUT, Buffer.from(pdfOutput));
console.log(`PDF saved to: ${OUTPUT}`);
console.log(`Total pages: ${doc.getNumberOfPages()}`);
