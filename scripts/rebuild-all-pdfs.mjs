/**
 * rebuild-all-pdfs.mjs
 *
 * Properly regenerates 13 OLF policy/procedure PDFs.
 * Downloads from Supabase, extracts text with position data via pdfjs-dist,
 * classifies lines using BOTH font metrics AND content patterns,
 * then rebuilds with jsPDF using proper formatting.
 *
 * Usage: node scripts/rebuild-all-pdfs.mjs
 * Usage: node scripts/rebuild-all-pdfs.mjs --only Form114
 * Usage: node scripts/rebuild-all-pdfs.mjs --only OLF-TG-HI-001
 */

import { createClient } from '@supabase/supabase-js';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pkg from 'jspdf';
const { jsPDF } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');

// ─── Config ──────────────────────────────────────────────────────────────────
const SUPA_URL = 'https://czdlemutsimvwfpwylxh.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGxlbXV0c2ltdndmcHd5bHhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjQ3NCwiZXhwIjoyMDkwMjQyNDc0fQ.ZueFz5cozYoC_TNUH_wX5Ak5G2PAdBMzJyrr_0gzPHk';
const sb = createClient(SUPA_URL, SUPA_KEY);
const DOWNLOADS = 'C:/Users/kevin/Downloads';

// Parse --only flag
const onlyArg = process.argv.find(a => a.startsWith('--only'));
const onlyFilter = onlyArg ? process.argv[process.argv.indexOf(onlyArg) + 1] : null;

// ─── Colors (RGB 0-255) ─────────────────────────────────────────────────────
const BLUE = [30, 90, 138];        // #1E5A8A
const TEAL = [15, 118, 110];       // #0F766E
const WHITE = [255, 255, 255];
const BLACK = [33, 33, 33];
const DARK_GREY = [51, 51, 51];
const MED_GREY = [102, 102, 102];
const LIGHT_GREY = [240, 244, 248]; // #F0F4F8
const HEADER_BG = [240, 244, 248];
const TABLE_HEADER_BG = [30, 90, 138];
const TABLE_ALT_ROW = [248, 250, 252];
const TABLE_BORDER = [220, 225, 230];
const CALLOUT_BG = [255, 248, 230];
const CALLOUT_BORDER = [230, 180, 50];
const ALERT_BG = [255, 240, 240];
const ALERT_BORDER = [220, 50, 50];
const INFO_BG = [240, 247, 255];
const INFO_BORDER = [59, 130, 246];
const SUCCESS_BG = [240, 253, 244];
const SUCCESS_BORDER = [34, 197, 94];
const SECTION_LINE = [30, 90, 138];

// ─── Page dimensions ─────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 15;
const MARGIN_R = 15;
const MARGIN_T = 42;   // space below header
const MARGIN_B = 22;   // space above footer
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

// ─── Logo ────────────────────────────────────────────────────────────────────
const logoPath = path.join(PROJECT, 'public', 'logo.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoDataUrl = 'data:image/png;base64,' + logoBase64;

// ─── Auditor portal folder IDs ──────────────────────────────────────────────
const FOLDERS = {
  m1: 'bd49260a-30be-4689-ba20-d60f1146bd95',
  m3: '4298ed63-bb7d-4b93-85e0-9ae063030880',
  m6: 'd491d546-c2d2-45bd-8561-0795493ec768',
  m7: 'efc3c35b-597b-4fc2-9828-f87f5b076799',
  hi: 'cfa8179f-d329-423d-8da4-4161e6f1e42b',
};

// ─── Documents config ────────────────────────────────────────────────────────
const DOCUMENTS = [
  {
    name: 'Form05.Business Plan 2026-2028.pdf',
    storage: 'Policies and Procedures/Core 2 - Governance & Operations/Form05.Business Plan 2026-2028.pdf',
    auditFolders: [FOLDERS.m3],
    docNo: 'Form05',
    category: 'Strategic Planning',
    type: 'policy',
  },
  {
    name: 'Form103.Business Continuity Plan.pdf',
    storage: 'Policies and Procedures/Core 2 - Governance & Operations/Form103.Business Continuity Plan.pdf',
    auditFolders: [FOLDERS.m3, FOLDERS.m7],
    docNo: 'Form103',
    category: 'Policy & Procedure / Business Continuity',
    type: 'policy',
  },
  {
    name: 'Form104.Digital Compliance Monitoring Policy.pdf',
    storage: 'Policies and Procedures/Core 2 - Governance & Operations/Form104.Digital Compliance Monitoring Policy.pdf',
    auditFolders: [FOLDERS.m3],
    docNo: 'Form104',
    category: 'Policy & Procedure / Quality Management',
    type: 'policy',
  },
  {
    name: 'Form105.Digital Registers Management Policy.pdf',
    storage: 'Policies and Procedures/Core 2 - Governance & Operations/Form105.Digital Registers Management Policy.pdf',
    auditFolders: [FOLDERS.m3],
    docNo: 'Form105',
    category: 'Policy & Procedure / Quality Management',
    type: 'policy',
  },
  {
    name: 'Form109.Worker Screening and Recruitment Procedure.pdf',
    storage: 'Policies and Procedures/Core 2 - Governance & Operations/Form109.Worker Screening and Recruitment Procedure.pdf',
    auditFolders: [FOLDERS.m6],
    docNo: 'Form109',
    category: 'Policy & Procedure / Human Resources',
    type: 'policy',
  },
  {
    name: 'Form110.Clinical Governance Framework.pdf',
    storage: 'Policies and Procedures/Module 1 - High Intensity/Form110.Clinical Governance Framework.pdf',
    auditFolders: [FOLDERS.hi],
    docNo: 'Form110',
    category: 'Policy & Procedure / Clinical Governance',
    type: 'policy',
  },
  {
    name: 'Form111.OLF Code of Conduct.pdf',
    storage: 'Policies and Procedures/Core 1 - Rights & Responsibilities/Form111.OLF Code of Conduct.pdf',
    auditFolders: [FOLDERS.m1],
    docNo: 'Form111',
    category: 'Policy & Procedure / Governance',
    type: 'policy',
  },
  {
    name: 'Form112.Insurance Register.pdf',
    storage: 'Policies and Procedures/Core 2 - Governance & Operations/Form112.Insurance Register.pdf',
    auditFolders: [FOLDERS.m3],
    docNo: 'Form112',
    category: 'Register / Governance & Compliance',
    type: 'policy',
  },
  {
    name: 'Form113.Professional Development Policy.pdf',
    storage: 'Policies and Procedures/Core 2 - Governance & Operations/Form113.Professional Development Policy.pdf',
    auditFolders: [FOLDERS.m6],
    docNo: 'Form113',
    category: 'Policy & Procedure / Human Resources',
    type: 'policy',
  },
  {
    name: 'Form114.Performance Management Procedure.pdf',
    storage: 'Policies and Procedures/Core 2 - Governance & Operations/Form114.Performance Management Procedure.pdf',
    auditFolders: [FOLDERS.m6],
    docNo: 'Form114',
    category: 'Policy & Procedure / Human Resources',
    type: 'policy',
  },
  {
    name: 'OLF-TG-HI-001 Urinary Catheter Care Guide.pdf',
    storage: 'Training Resources/OLF-TG-HI-001 Urinary Catheter Care Guide.pdf',
    auditFolders: [FOLDERS.hi],
    docNo: 'OLF-TG-HI-001',
    category: 'Training Guide / High Intensity',
    type: 'training',
  },
  {
    name: 'OLF-TG-HI-002 Wound Care Guide.pdf',
    storage: 'Training Resources/OLF-TG-HI-002 Wound Care Guide.pdf',
    auditFolders: [FOLDERS.hi],
    docNo: 'OLF-TG-HI-002',
    category: 'Training Guide / High Intensity',
    type: 'training',
  },
  {
    name: 'OLF-TG-HI-003 Diabetes Management Guide.pdf',
    storage: 'Training Resources/OLF-TG-HI-003 Diabetes Management Guide.pdf',
    auditFolders: [FOLDERS.hi],
    docNo: 'OLF-TG-HI-003',
    category: 'Training Guide / High Intensity',
    type: 'training',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract raw text items with position/font data from PDF buffer.
 * Returns array of pages, each with array of items.
 */
async function extractRawItems(pdfBuffer) {
  const doc = await getDocument({
    data: new Uint8Array(pdfBuffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
    disableAutoFetch: true,
    disableStream: true,
  }).promise;

  const pages = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items = [];
    for (const item of tc.items) {
      if (!item.str) continue;
      items.push({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        fontSize: Math.abs(item.transform[0]),
        fontName: item.fontName || '',
        width: item.width || 0,
      });
    }
    pages.push({ pageNum: p, items });
  }
  return pages;
}

/**
 * Group items into lines by y-coordinate (±3pt tolerance).
 * Returns sorted lines (top to bottom in reading order).
 */
function groupIntoLines(items) {
  if (items.length === 0) return [];

  // Sort by y descending (top first), then x ascending
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  const lines = [];
  let currentLine = [sorted[0]];
  let currentY = sorted[0].y;

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (Math.abs(item.y - currentY) <= 3) {
      currentLine.push(item);
    } else {
      currentLine.sort((a, b) => a.x - b.x);
      lines.push(currentLine);
      currentLine = [item];
      currentY = item.y;
    }
  }
  if (currentLine.length > 0) {
    currentLine.sort((a, b) => a.x - b.x);
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Check if a line is part of the header/footer (should be filtered out).
 */
function isHeaderFooter(items, y) {
  const text = items.map(i => i.text).join('').trim();
  if (!text) return true;

  // Position-based: y > 740 is header zone, y < 45 is footer zone (PDF coords, A4 = 842pt)
  if (y > 740) return true;
  if (y < 45) return true;

  // Content patterns
  if (text.includes('One Life Foundation Pty Ltd') && text.includes('ABN:')) return true;
  if (/^Page \d+ of \d+$/.test(text)) return true;
  if (text.includes('Copyright One Life Foundation')) return true;
  if (text.includes('DOC NO') && text.includes('VERSION')) return true;

  return false;
}

/**
 * Extract body content from a PDF, filtering headers/footers.
 * Returns array of line objects with text, metadata, and multi-column info.
 */
function extractBodyContent(pages) {
  const allLines = [];

  for (const page of pages) {
    const lineGroups = groupIntoLines(page.items);

    for (const lineItems of lineGroups) {
      const avgY = lineItems.reduce((s, i) => s + i.y, 0) / lineItems.length;
      if (isHeaderFooter(lineItems, avgY)) continue;

      // Detect if this line has multiple distinct x-position clusters (table columns)
      const xPositions = lineItems.map(i => Math.round(i.x));
      const minX = Math.min(...xPositions);

      // Determine dominant font properties
      const totalChars = lineItems.reduce((s, i) => s + i.text.length, 0);
      let boldChars = 0;
      let maxFontSize = 0;
      let avgFontSize = 0;
      for (const item of lineItems) {
        const isBold = item.fontName.includes('f1') || item.fontName.toLowerCase().includes('bold');
        if (isBold) boldChars += item.text.length;
        if (item.fontSize > maxFontSize) maxFontSize = item.fontSize;
        avgFontSize += item.fontSize * item.text.length;
      }
      avgFontSize = totalChars > 0 ? avgFontSize / totalChars : 0;
      const isBold = boldChars > totalChars * 0.5;

      // Join all text items with appropriate spacing
      let fullText = '';
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        if (i > 0) {
          const gap = item.x - (lineItems[i-1].x + (lineItems[i-1].width || 0));
          // If gap > ~20pt, it's likely a column separator
          if (gap > 20) {
            fullText += '  \t  '; // tab-like separator for table detection
          } else if (gap > 3 && !fullText.endsWith(' ')) {
            fullText += ' ';
          }
        }
        fullText += item.text;
      }
      fullText = fullText.trim();
      if (!fullText) continue;

      allLines.push({
        text: fullText,
        y: avgY,
        x: minX,
        fontSize: avgFontSize,
        maxFontSize,
        isBold,
        pageNum: page.pageNum,
        itemCount: lineItems.length,
        hasMultipleColumns: fullText.includes('\t'),
      });
    }
  }

  return allLines;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a text looks like a section heading title (not a sentence).
 * Headings: "Purpose", "Scope", "Performance Review Cycle", "Rating Scale"
 * NOT headings: "The worker completes the self-assessmentWorker" (concatenated table cells)
 * NOT headings: "The worker submits a written appeal..." (body sentence)
 */
function looksLikeSectionTitle(text) {
  // Remove the number prefix
  const afterNum = text.replace(/^\d+[\.\s]+/, '').trim();

  // Too long to be a heading
  if (afterNum.length > 60) return false;

  // Contains concatenated words (table cell artifacts) like "Self-The" or "ProfessionalActively"
  if (/[a-z][A-Z]/.test(afterNum) && !/[-]/.test(afterNum.match(/[a-z][A-Z]/)?.[0]?.[0] || '')) {
    // Check if it's a real camelCase-like join (artifact) vs hyphenated word
    const joins = afterNum.match(/[a-z][A-Z]/g) || [];
    if (joins.length > 0) return false;
  }

  // If it ends with common sentence-enders, it's body text
  if (afterNum.match(/\.\s*$/) && afterNum.length > 40) return false;

  // If it's a full sentence (contains lots of lowercase words), it's body text
  const words = afterNum.split(/\s+/);
  if (words.length > 8) return false;

  // Title-case pattern: most words start with capital (at least 50%)
  const capWords = words.filter(w => /^[A-Z]/.test(w) || w.length <= 3).length;
  if (capWords / words.length < 0.4 && words.length > 3) return false;

  return true;
}

/**
 * Classify each line into a semantic type.
 * Returns a structured content array with type, text, and formatting info.
 */
function classifyContent(lines) {
  const content = [];
  let titleFound = false;
  let inTable = false;
  let tableBuffer = [];
  let metaDone = false; // tracks when we've moved past metadata section

  function flushTable() {
    if (tableBuffer.length > 0) {
      content.push({ type: 'table', rows: [...tableBuffer] });
      tableBuffer = [];
    }
    inTable = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.text;
    const pg = line.pageNum;

    // ── Skip garbage from bad extraction ──
    if (t === "!' !' !'" || t === '!' || t.match(/^[!']+$/)) continue;
    if (/^[!'.\s]+$/.test(t)) continue;  // any combination of ! and '
    if (t === 'One Life Foundation' && line.fontSize >= 14) continue;
    if (t.includes('ABN: 55 643 227 061') && !t.includes('9C Grasslands')) continue;
    // Skip redundant cover page lines (address, org type, doc number repeats)
    if (t === 'NDIS Registered Provider' && pg === 1) continue;
    if (t === 'Supported Independent Living (SIL)' && pg === 1) continue;
    if (t === '9C Grasslands Avenue, Craigieburn VIC 3064' && pg === 1) continue;
    if (/^Doc No:\s*Form\d+\s+Version:/.test(t)) continue;
    // Skip "One Life Foundation Pty Ltd Business Plan..." header text
    if (t.match(/^One Life Foundation Pty Ltd\s+(Business|Code|Insurance|Clinical|Digital|Worker|Performance|Professional)/) && pg <= 2) continue;
    // Skip "C O N F I D E N T I A L" or other spaced-out text
    if (/^[A-Z]\s[A-Z]\s[A-Z]\s/.test(t) && t.length < 30) continue;
    // Skip "Ongoing Cycle" + "Repeats annually" etc that are diagram artifacts
    if (t === 'Ongoing Cycle' || t === 'Repeats annually') continue;
    // Skip standalone timestamps like "3 months from start 6 months 12 months"
    if (/^\d+ months from start/.test(t)) continue;
    // Skip tick mark artifacts from diagrams
    if (line.maxFontSize >= 14 && /^[!''✓✗\s]+$/.test(t)) continue;

    // ── Detect document title (fs >= 14 on first 2 pages) ──
    if (line.maxFontSize >= 14 && !titleFound && pg <= 2 && !t.match(/^[!'.\s]+$/) && t.length > 3) {
      flushTable();
      titleFound = true;
      content.push({ type: 'title', text: t });
      continue;
    }

    // ── Fallback title: detect known document names at any font size on page 1 ──
    if (!titleFound && pg === 1) {
      const titlePatterns = [
        /^Business Continuity Plan$/,
        /^Business Plan$/,
        /^Digital Compliance Monitoring Policy$/,
        /^Digital Registers Management Policy$/,
        /^Worker Screening and Recruitment Procedure$/,
        /^Clinical Governance Framework$/,
        /^Code of Conduct$/,
        /^Insurance Register$/,
        /^Professional Development Policy$/,
        /^Performance Management Procedure$/,
      ];
      if (titlePatterns.some(p => p.test(t))) {
        flushTable();
        titleFound = true;
        content.push({ type: 'title', text: t });
        continue;
      }
    }

    // ── Training guide header line ──
    if (pg === 1 && t.startsWith('TRAINING GUIDE Module')) {
      flushTable();
      content.push({ type: 'doc_header', text: t });
      continue;
    }

    // ── Training guide subtitle line (ALL CAPS with em-dash) ──
    if (pg === 1 && t === t.toUpperCase() && t.length > 20 && (t.includes('—') || t.includes('GUIDE'))) {
      flushTable();
      content.push({ type: 'subtitle', text: t });
      continue;
    }

    // ── Metadata table rows (on page 1, key-value pairs) ──
    if (pg === 1 && !metaDone) {
      const metaPatterns = [
        /^Document (Owner|ID|Number)/i,
        /^(Version|Approved By|Applies To|Related Standards|Review Date|Policy Reference|Classification|Participant)\b/i,
      ];
      if (metaPatterns.some(p => p.test(t))) {
        flushTable();
        // Clean up duplicate version text
        let cleaned = t;
        cleaned = cleaned.replace(/(\d+\.\d+\s*—\s*\w+\s*\d{4})\d+\.\d+\s*—\s*\w+\s*\d{4}/, '$1');
        cleaned = cleaned.replace(/((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s*\([^)]+\))(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s*\([^)]+\)/, '$1');

        const labelMatch = cleaned.match(/^(Document Owner|Document ID|Document Number|Version|Approved By|Applies To|Related Standards|Review Date|Policy Reference|Classification|Participant)\s+(.*)/i);
        if (labelMatch) {
          content.push({ type: 'meta_row', label: labelMatch[1], value: labelMatch[2] });
        } else {
          content.push({ type: 'meta_row', label: cleaned, value: '' });
        }
        continue;
      }
      // Also catch "One Life Foundation" and "In-Dwelling Catheter..." subtitle lines on page 1
      if (t === 'One Life Foundation' && line.fontSize < 14) {
        content.push({ type: 'meta_row', label: 'Organisation', value: 'One Life Foundation' });
        continue;
      }
      if (t.match(/^In-Dwelling|^Wound|^Diabetes|^Blood Glucose/) && pg === 1) {
        content.push({ type: 'subtitle', text: t });
        continue;
      }
    }

    // ── Detect sub-headings with fs > 10 and bold (e.g. "3.1 Probation Review") ──
    if (line.maxFontSize >= 10 && line.isBold && t.match(/^\d+\.\d+/)) {
      flushTable();
      metaDone = true;
      content.push({ type: 'heading2', text: t });
      continue;
    }

    // ── Detect sub-sub headings (e.g. "4.2.1 Something") ──
    if (t.match(/^\d+\.\d+\.\d+\s+/) && (line.isBold || line.maxFontSize >= 9.5)) {
      flushTable();
      metaDone = true;
      content.push({ type: 'heading3', text: t });
      continue;
    }

    // ── Main section heading detection ──
    // Pattern: "1 Purpose", "2 Scope", "10 Review", "1. Purpose and Scope"
    // Key: must pass looksLikeSectionTitle() to avoid false positives
    if (t.match(/^\d{1,2}[\.\s]\s*[A-Z]/) && !t.match(/^\d+\.\d+/) && t.length < 100) {
      if (looksLikeSectionTitle(t)) {
        flushTable();
        metaDone = true;
        content.push({ type: 'heading1', text: t });
        continue;
      }
    }

    // ── Callout box headers (ALL CAPS, recognized patterns) ──
    if (t === t.toUpperCase() && t.length >= 5 && t.length < 80 &&
        !t.match(/^\d/) && t.match(/[A-Z]{3,}/) &&
        !t.includes('|') && !t.includes('\t')) {
      const isCallout = /^(SCOPE|NOTE|CRITICAL|WARNING|NEVER|EMERGENCY|DELEGATION|SUPPLY|TRANSITION|IMPORTANT|KEY|REMINDER|TIP|TRAINING|CLINICAL|OVERVIEW|SUMMARY|CLASSIFICATION|REVIEW|RECORDING|RISK|INFECTION|HAND HYGIENE|COMMUNICATION|DISPOSAL|DOCUMENTATION|ONGOING|MONITORING|SUPPLY CHECK|CATHETER|WOUND|DIABETES|BLOOD|INSULIN|HYPO|HYPER|FOOT CARE|MEDICATION)/.test(t) ||
          (t.split(' ').length <= 5 && t.match(/^[A-Z\s&\/\-]+$/) && t.length <= 40);
      if (isCallout) {
        flushTable();
        // Look ahead for callout body
        const calloutLines = [t];
        let j = i + 1;
        while (j < lines.length && j - i < 8) {
          const next = lines[j];
          if (next.text.match(/^\d+[\.\s]\s*[A-Z]/) && looksLikeSectionTitle(next.text)) break;
          if (next.text === next.text.toUpperCase() && next.text.length >= 5 && next.text.match(/[A-Z]{3,}/)) break;
          if (next.maxFontSize >= 10 && next.isBold) break;
          if (next.pageNum !== lines[j-1].pageNum && next.y > 700) break;
          calloutLines.push(next.text);
          j++;
        }
        content.push({ type: 'callout', lines: calloutLines });
        i = j - 1;
        continue;
      }
    }

    // ── Table detection (tab-separated columns) ──
    if (line.hasMultipleColumns || t.includes('\t')) {
      const cells = t.split(/\t+/).map(c => c.trim()).filter(c => c);
      if (cells.length >= 2) {
        if (!inTable) {
          flushTable();
          inTable = true;
        }
        tableBuffer.push(cells);
        continue;
      }
    }

    // ── If we're in a table, check for continuation lines ──
    if (inTable) {
      const prevRow = tableBuffer[tableBuffer.length - 1];
      if (prevRow && t.length < 80 && !t.match(/^\d+[\.\s]/) && !t.match(/^[A-Z][A-Z]/) && !t.includes('\t')) {
        const lastCell = prevRow[prevRow.length - 1];
        prevRow[prevRow.length - 1] = lastCell + ' ' + t;
        continue;
      }
      flushTable();
    }

    // ── Bullet points ──
    if (t.match(/^[•●▪◦‣\-–]\s/)) {
      flushTable();
      content.push({ type: 'bullet', text: t.replace(/^[•●▪◦‣\-–]\s*/, '') });
      continue;
    }

    // ── Lettered list items ──
    if (t.match(/^[a-z]\)\s/) || t.match(/^\([a-z]\)\s/)) {
      flushTable();
      content.push({ type: 'bullet', text: t });
      continue;
    }

    // ── Numbered list items in body (e.g. "1. The worker submits...") ──
    // Distinguished from headings by being full sentences (long text)
    if (t.match(/^\d+\.\s+[A-Z]/) && t.length > 50 && !line.isBold) {
      flushTable();
      content.push({ type: 'numbered_item', text: t });
      continue;
    }

    // ── Numbered step (short, in a sequence) ──
    if (t.match(/^\d+\s+[A-Z]/) && !t.match(/^\d+\.\d+/) && !looksLikeSectionTitle(t)) {
      flushTable();
      content.push({ type: 'body', text: t, isBold: line.isBold });
      continue;
    }

    // ── Regular body text ──
    flushTable();
    content.push({ type: 'body', text: t, isBold: line.isBold });
  }

  flushTable();
  return content;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Draw the OLF header on the current page.
 */
function drawHeader(doc, config) {
  const { docNo, category, type } = config;
  const headerColor = type === 'training' ? TEAL : BLUE;

  // Blue/teal banner - 22mm high
  doc.setFillColor(...headerColor);
  doc.rect(0, 0, PAGE_W, 22, 'F');

  // Logo
  try {
    doc.addImage(logoDataUrl, 'PNG', 6, 3.5, 28, 14);
  } catch (e) {
    doc.setTextColor(...WHITE);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('OLF', 10, 12);
  }

  // "One Life Foundation"
  doc.setTextColor(...WHITE);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('One Life Foundation', 38, 10.5);

  // ABN line
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('ABN: 55 643 227 061  |  NDIS Registered Provider', 38, 16);

  // Category text right-aligned
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const catParts = category.split(' / ');
  catParts.forEach((part, idx) => {
    doc.text(part, PAGE_W - MARGIN_R, 9 + (idx * 5), { align: 'right' });
  });

  // Light grey metadata row - 7mm
  doc.setFillColor(...HEADER_BG);
  doc.rect(0, 22, PAGE_W, 7, 'F');

  // Thin line under metadata
  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.3);
  doc.line(0, 29, PAGE_W, 29);

  // Metadata labels/values
  const metaY = 27;
  const colW = CONTENT_W / 4;
  const meta = [
    ['DOC NO:', docNo],
    ['VERSION:', '1.0'],
    ['EFFECTIVE DATE:', '1 January 2026'],
    ['REVIEW DATE:', '1 January 2027'],
  ];

  meta.forEach(([label, value], idx) => {
    const x = MARGIN_L + (idx * colW);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MED_GREY);
    doc.text(label, x, metaY);
    const labelW = doc.getTextWidth(label);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_GREY);
    doc.text(' ' + value, x + labelW, metaY);
  });
}

/**
 * Draw footer on a page.
 */
function drawFooter(doc, pageNum, totalPages) {
  const footerY = PAGE_H - 10;

  // Line above footer
  doc.setDrawColor(210, 215, 220);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_L, footerY - 3, PAGE_W - MARGIN_R, footerY - 3);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MED_GREY);

  doc.text('One Life Foundation Pty Ltd  |  ABN: 55 643 227 061  |  9C Grasslands Avenue, Craigieburn VIC 3064', MARGIN_L, footerY);
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN_R, footerY, { align: 'right' });
  doc.text('Copyright One Life Foundation 2026', PAGE_W / 2, footerY + 4, { align: 'center' });
}

/**
 * Main rendering function: takes classified content and produces a jsPDF document.
 */
function renderPdf(contentItems, config) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const accentColor = config.type === 'training' ? TEAL : BLUE;

  let curY = MARGIN_T;
  let pageCount = 1;

  // ── Helpers ──

  function newPage() {
    doc.addPage();
    pageCount++;
    drawHeader(doc, config);
    curY = MARGIN_T;
  }

  function ensureSpace(needed) {
    if (curY + needed > PAGE_H - MARGIN_B) {
      newPage();
    }
  }

  /** Render wrapped text, returns lines consumed */
  function writeText(text, x, fontSize, fontStyle, color, maxWidth, lineHeight) {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(...color);
    const lh = lineHeight || (fontSize * 0.42);
    const wrapped = doc.splitTextToSize(text, maxWidth);
    for (const line of wrapped) {
      ensureSpace(lh + 1);
      doc.text(line, x, curY);
      curY += lh;
    }
    return wrapped.length;
  }

  /** Draw a horizontal line */
  function drawLine(x1, y, x2, color, width) {
    doc.setDrawColor(...color);
    doc.setLineWidth(width || 0.3);
    doc.line(x1, y, x2, y);
  }

  // ── Draw header on first page ──
  drawHeader(doc, config);

  // ── Render each content item ──
  for (let i = 0; i < contentItems.length; i++) {
    const item = contentItems[i];

    switch (item.type) {

      case 'title': {
        ensureSpace(18);
        curY += 5;
        writeText(item.text, MARGIN_L, 16, 'bold', accentColor, CONTENT_W, 6.5);
        curY += 2;
        // Thin accent line under title
        drawLine(MARGIN_L, curY, MARGIN_L + 60, accentColor, 0.8);
        curY += 4;
        break;
      }

      case 'doc_header': {
        ensureSpace(8);
        curY += 2;
        writeText(item.text, MARGIN_L, 8, 'bold', MED_GREY, CONTENT_W, 3.5);
        curY += 1;
        break;
      }

      case 'subtitle': {
        ensureSpace(10);
        curY += 1;
        writeText(item.text, MARGIN_L, 11, 'bold', DARK_GREY, CONTENT_W, 5);
        curY += 3;
        break;
      }

      case 'meta_row': {
        ensureSpace(7);
        // Draw a subtle row with label in grey bg, value in white
        const rowH = 6;
        const labelW = 50;

        // Label cell - light grey background
        doc.setFillColor(235, 238, 242);
        doc.rect(MARGIN_L, curY - 4, labelW, rowH, 'F');
        // Border
        doc.setDrawColor(...TABLE_BORDER);
        doc.setLineWidth(0.2);
        doc.rect(MARGIN_L, curY - 4, labelW, rowH, 'S');

        // Value cell - white background
        doc.setFillColor(255, 255, 255);
        doc.rect(MARGIN_L + labelW, curY - 4, CONTENT_W - labelW, rowH, 'F');
        doc.rect(MARGIN_L + labelW, curY - 4, CONTENT_W - labelW, rowH, 'S');

        // Label text
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK_GREY);
        doc.text(item.label, MARGIN_L + 2, curY - 0.5);

        // Value text
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...BLACK);
        // Truncate if too long
        const maxValW = CONTENT_W - labelW - 4;
        const valLines = doc.splitTextToSize(item.value, maxValW);
        doc.text(valLines[0] || '', MARGIN_L + labelW + 2, curY - 0.5);

        curY += rowH - 2;
        break;
      }

      case 'heading1': {
        ensureSpace(14);
        curY += 8;

        // Left accent bar
        doc.setFillColor(...accentColor);
        doc.rect(MARGIN_L, curY - 4.5, 2, 7, 'F');

        // Heading text
        writeText(item.text, MARGIN_L + 5, 12, 'bold', accentColor, CONTENT_W - 5, 5);
        curY += 1;

        // Subtle line underneath
        drawLine(MARGIN_L + 5, curY, PAGE_W - MARGIN_R, [...TABLE_BORDER], 0.3);
        curY += 3;
        break;
      }

      case 'heading2': {
        ensureSpace(10);
        curY += 5;
        writeText(item.text, MARGIN_L + 2, 10, 'bold', DARK_GREY, CONTENT_W - 2, 4.5);
        curY += 2;
        break;
      }

      case 'heading3': {
        ensureSpace(8);
        curY += 3;
        writeText(item.text, MARGIN_L + 5, 9, 'bold', DARK_GREY, CONTENT_W - 5, 4);
        curY += 1.5;
        break;
      }

      case 'callout': {
        const lines = item.lines;
        const header = lines[0];
        const body = lines.slice(1);

        // Determine callout style
        let bgColor, borderColor;
        if (/CRITICAL|WARNING|NEVER|EMERGENCY|DO NOT/.test(header)) {
          bgColor = ALERT_BG; borderColor = ALERT_BORDER;
        } else if (/NOTE|SCOPE|DELEGATION|SUPPLY|TRANSITION|OVERVIEW|CLASSIFICATION/.test(header)) {
          bgColor = INFO_BG; borderColor = INFO_BORDER;
        } else if (/TIP|SUCCESS|COMPLETE/.test(header)) {
          bgColor = SUCCESS_BG; borderColor = SUCCESS_BORDER;
        } else {
          bgColor = CALLOUT_BG; borderColor = CALLOUT_BORDER;
        }

        // Estimate box height
        doc.setFontSize(8);
        let totalBodyLines = 0;
        for (const bl of body) {
          totalBodyLines += doc.splitTextToSize(bl, CONTENT_W - 12).length;
        }
        const boxH = 8 + (totalBodyLines * 3.8) + 4;
        ensureSpace(boxH + 4);
        curY += 3;

        const boxY = curY - 3;

        // Draw box background
        doc.setFillColor(...bgColor);
        doc.roundedRect(MARGIN_L, boxY, CONTENT_W, boxH, 1.5, 1.5, 'F');

        // Left accent border
        doc.setFillColor(...borderColor);
        doc.rect(MARGIN_L, boxY, 2, boxH, 'F');

        // Header text
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...borderColor);
        doc.text(header, MARGIN_L + 6, curY);
        curY += 4;

        // Body text
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK_GREY);
        doc.setFontSize(8);
        for (const bl of body) {
          const wrapped = doc.splitTextToSize(bl, CONTENT_W - 12);
          for (const wl of wrapped) {
            doc.text(wl, MARGIN_L + 6, curY);
            curY += 3.5;
          }
        }
        curY += 3;
        break;
      }

      case 'table': {
        const rows = item.rows;
        if (rows.length === 0) break;

        const numCols = Math.max(...rows.map(r => r.length));
        if (numCols < 2) {
          // Single column "table" - just render as body text
          for (const row of rows) {
            writeText(row.join(' '), MARGIN_L, 8.5, 'normal', DARK_GREY, CONTENT_W, 3.8);
            curY += 1;
          }
          break;
        }

        // Calculate column widths proportionally
        const colWidths = [];
        for (let c = 0; c < numCols; c++) {
          let maxLen = 0;
          for (const row of rows) {
            if (row[c]) maxLen = Math.max(maxLen, row[c].length);
          }
          colWidths.push(maxLen);
        }
        const totalLen = colWidths.reduce((s, w) => s + w, 0) || 1;
        const colMM = colWidths.map(w => Math.max(20, (w / totalLen) * CONTENT_W));
        // Normalize to fit content width
        const totalMM = colMM.reduce((s, w) => s + w, 0);
        const scale = CONTENT_W / totalMM;
        const finalCols = colMM.map(w => w * scale);

        ensureSpace(8 + rows.length * 6);
        curY += 2;

        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          const isHeader = r === 0;
          const rowH = 7;

          ensureSpace(rowH + 1);

          // Row background
          if (isHeader) {
            doc.setFillColor(...accentColor);
          } else if (r % 2 === 0) {
            doc.setFillColor(...TABLE_ALT_ROW);
          } else {
            doc.setFillColor(255, 255, 255);
          }

          let xPos = MARGIN_L;
          for (let c = 0; c < numCols; c++) {
            const cellW = finalCols[c] || 30;
            doc.rect(xPos, curY - 4.5, cellW, rowH, 'F');

            // Cell border
            doc.setDrawColor(...TABLE_BORDER);
            doc.setLineWidth(0.15);
            doc.rect(xPos, curY - 4.5, cellW, rowH, 'S');

            // Cell text
            const cellText = row[c] || '';
            doc.setFontSize(7);
            doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
            doc.setTextColor(isHeader ? 255 : DARK_GREY[0], isHeader ? 255 : DARK_GREY[1], isHeader ? 255 : DARK_GREY[2]);

            const clipped = doc.splitTextToSize(cellText, cellW - 3);
            doc.text(clipped[0] || '', xPos + 1.5, curY - 0.5);

            xPos += cellW;
          }
          curY += rowH - 2;
        }
        curY += 3;
        break;
      }

      case 'bullet': {
        ensureSpace(6);
        // Bullet dot
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK_GREY);
        doc.text('\u2022', MARGIN_L + 4, curY);

        // Bullet text
        const bulletText = item.text.replace(/^[•●▪◦‣\-–]\s*/, '');
        writeText(bulletText, MARGIN_L + 8, 8.5, 'normal', DARK_GREY, CONTENT_W - 8, 3.8);
        curY += 1.5;
        break;
      }

      case 'numbered_step':
      case 'numbered_item': {
        ensureSpace(6);
        // Extract number and text
        const stepMatch = item.text.match(/^(\d+)[.\s]\s*(.*)/s);
        if (stepMatch) {
          const [, num, text] = stepMatch;
          // Number in accent color
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...accentColor);
          doc.text(num + '.', MARGIN_L + 3, curY);
          // Step text
          writeText(text, MARGIN_L + 10, 8.5, 'normal', DARK_GREY, CONTENT_W - 10, 3.8);
        } else {
          writeText(item.text, MARGIN_L + 3, 8.5, 'normal', DARK_GREY, CONTENT_W - 3, 3.8);
        }
        curY += 2;
        break;
      }

      case 'body':
      default: {
        ensureSpace(5);
        const style = item.isBold ? 'bold' : 'normal';
        writeText(item.text, MARGIN_L, 8.5, style, DARK_GREY, CONTENT_W, 3.8);
        curY += 2;
        break;
      }
    }
  }

  // ── Add footers to all pages ──
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawFooter(doc, p, total);
  }

  return doc;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOAD HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function uploadToDocuments(storagePath, pdfBytes) {
  await sb.storage.from('documents').remove([storagePath]);
  const { error } = await sb.storage.from('documents').upload(
    storagePath, pdfBytes, { contentType: 'application/pdf' }
  );
  if (error) throw new Error('Documents upload failed: ' + error.message);
}

async function uploadToAuditorPortal(folderIds, fileName, pdfBytes) {
  for (const folderId of folderIds) {
    const portalPath = folderId + '/' + fileName;
    const { data: listing } = await sb.storage.from('auditor-portal').list(folderId, { limit: 500 });
    const exists = listing?.some(f => f.name === fileName);
    if (exists) {
      await sb.storage.from('auditor-portal').remove([portalPath]);
    }
    const { error } = await sb.storage.from('auditor-portal').upload(
      portalPath, pdfBytes, { contentType: 'application/pdf' }
    );
    if (error) {
      console.log(`  [!] Auditor portal upload to ${folderId.substring(0, 8)}... failed: ${error.message}`);
    } else {
      console.log(`  [+] Uploaded to auditor-portal/${folderId.substring(0, 8)}...`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function processDocument(docConfig) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${docConfig.name}`);
  console.log(`${'─'.repeat(60)}`);

  // 1. Download
  process.stdout.write('  [1/6] Downloading from Supabase... ');
  const { data, error } = await sb.storage.from('documents').download(docConfig.storage);
  if (error) throw new Error('Download failed: ' + error.message);
  const pdfBuffer = Buffer.from(await data.arrayBuffer());
  console.log(`${(pdfBuffer.length / 1024).toFixed(0)} KB`);

  // 2. Extract raw items
  process.stdout.write('  [2/6] Extracting text with positions... ');
  const pages = await extractRawItems(pdfBuffer);
  const totalItems = pages.reduce((s, p) => s + p.items.length, 0);
  console.log(`${pages.length} pages, ${totalItems} items`);

  // 3. Extract body content (filter headers/footers, group into lines)
  process.stdout.write('  [3/6] Extracting body content... ');
  const bodyLines = extractBodyContent(pages);
  console.log(`${bodyLines.length} content lines`);

  // 4. Classify
  process.stdout.write('  [4/6] Classifying content... ');
  const classified = classifyContent(bodyLines);
  const typeCounts = {};
  for (const c of classified) {
    typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  }
  console.log(Object.entries(typeCounts).map(([k, v]) => `${k}:${v}`).join(', '));

  // 5. Render new PDF
  process.stdout.write('  [5/6] Rendering PDF... ');
  const newDoc = renderPdf(classified, docConfig);
  const pdfOutput = Buffer.from(newDoc.output('arraybuffer'));
  const newPages = newDoc.getNumberOfPages();
  console.log(`${newPages} pages, ${(pdfOutput.length / 1024).toFixed(0)} KB`);

  // Compare page counts
  if (Math.abs(newPages - pages.length) > 3) {
    console.log(`  [!] WARNING: Page count changed significantly (${pages.length} -> ${newPages})`);
  }

  // 6. Save locally
  const dlPath = path.join(DOWNLOADS, docConfig.name);
  fs.writeFileSync(dlPath, pdfOutput);
  console.log(`  [+] Saved to Downloads/${docConfig.name}`);

  // 7. Upload to Supabase
  process.stdout.write('  [6/6] Uploading to Supabase... ');
  await uploadToDocuments(docConfig.storage, pdfOutput);
  console.log('documents OK');

  if (docConfig.auditFolders.length > 0) {
    await uploadToAuditorPortal(docConfig.auditFolders, docConfig.name, pdfOutput);
  }

  console.log(`  [OK] ${docConfig.name} complete!`);
  return true;
}

async function main() {
  console.log('='.repeat(70));
  console.log('  OLF PDF Rebuild — Proper Formatting with jsPDF');
  console.log('  ' + new Date().toISOString());
  if (onlyFilter) console.log(`  Filter: --only ${onlyFilter}`);
  console.log('='.repeat(70));

  const docs = onlyFilter
    ? DOCUMENTS.filter(d => d.docNo === onlyFilter || d.name.includes(onlyFilter))
    : DOCUMENTS;

  if (docs.length === 0) {
    console.log('No matching documents found for filter:', onlyFilter);
    process.exit(1);
  }

  let ok = 0, fail = 0;
  for (const docConfig of docs) {
    try {
      await processDocument(docConfig);
      ok++;
    } catch (e) {
      fail++;
      console.log(`\n  [FAIL] ${e.message}`);
      console.log(`  ${e.stack?.split('\n').slice(1, 3).join('\n  ')}`);
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`  COMPLETE: ${ok} succeeded, ${fail} failed out of ${docs.length}`);
  console.log('='.repeat(70));
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
