/**
 * regenerate-all-pdfs.mjs
 *
 * Regenerates 13 OLF policy/procedure PDFs from scratch using jsPDF.
 * Downloads existing PDFs from Supabase, extracts all text content using pdfjs-dist,
 * then rebuilds each PDF with the proper OLF header/footer template and logo.
 *
 * Usage: node scripts/regenerate-all-pdfs.mjs
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

// ─── Colors ──────────────────────────────────────────────────────────────────
const BLUE = [30, 90, 138];       // #1E5A8A - OLF brand blue
const TEAL = [15, 118, 110];      // #0F766E - teal for training guides
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];
const DARK_GREY = [51, 51, 51];
const MED_GREY = [102, 102, 102];
const LIGHT_GREY = [240, 240, 240];
const TABLE_BORDER = [200, 200, 200];
const CALLOUT_BG = [255, 248, 230]; // Light amber for callout boxes
const CALLOUT_BORDER = [230, 180, 50];
const ALERT_BG = [255, 235, 235]; // Light red for alert boxes
const ALERT_BORDER = [220, 50, 50];
const INFO_BG = [235, 245, 255]; // Light blue for info boxes
const INFO_BORDER = [59, 130, 246];

// ─── Page dimensions ─────────────────────────────────────────────────────────
const PAGE_W = 210;   // A4 width in mm
const PAGE_H = 297;   // A4 height in mm
const MARGIN_L = 15;
const MARGIN_R = 15;
const MARGIN_T = 45;  // below header
const MARGIN_B = 25;  // above footer
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

// ─── Logo ────────────────────────────────────────────────────────────────────
const logoPath = path.join(PROJECT, 'public', 'logo.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoDataUrl = 'data:image/png;base64,' + logoBase64;

// ─── Auditor portal folder IDs ───────────────────────────────────────────────
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
    type: 'policy', // 'policy' uses blue, 'training' uses teal
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

// ─── Text extraction ─────────────────────────────────────────────────────────

/**
 * Extract structured text from a PDF buffer.
 * Returns an array of page objects, each containing an array of text lines
 * with basic style information (fontSize, isBold, isHeader).
 */
async function extractPdfText(pdfBuffer) {
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

    // Group text items into lines by Y position
    const lineMap = new Map(); // y -> items[]
    for (const item of tc.items) {
      if (!item.str && item.str !== '') continue;
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push(item);
    }

    // Sort lines by Y descending (top to bottom in PDF)
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);

    const lines = [];
    for (const y of sortedYs) {
      const items = lineMap.get(y).sort((a, b) => a.transform[4] - b.transform[4]);
      const text = items.map(i => i.str).join('');
      if (!text.trim()) continue;

      // Detect font size and boldness
      const avgFontSize = items.reduce((sum, i) => sum + Math.abs(i.transform[0]), 0) / items.length;
      const fontName = items[0]?.fontName || '';
      const isBold = fontName.toLowerCase().includes('bold') ||
                     fontName.toLowerCase().includes('black') ||
                     fontName.includes('Bd') ||
                     fontName.includes('-B');

      lines.push({
        text: text.trim(),
        fontSize: avgFontSize,
        isBold,
        fontName,
        y,
      });
    }

    pages.push({ pageNum: p, lines });
  }

  return pages;
}

// ─── Header/footer filters ───────────────────────────────────────────────────

/**
 * Filter out existing header/footer text from extracted content.
 * We want only the body content, since we'll regenerate headers/footers.
 *
 * Uses BOTH position-based filtering (y > 740 = header zone, y < 40 = footer zone)
 * AND content-based pattern matching for robustness.
 */
function filterHeaderFooter(lines, pageNum, docType) {
  return lines.filter(line => {
    const t = line.text;
    const y = line.y; // PDF coordinates: 0 = bottom, ~842 = top for A4

    // ── Position-based filtering ──
    // Header zone: anything above y=740 is in the header/metadata bar area
    if (y > 740) return false;
    // Footer zone: anything below y=40 is in the footer area
    if (y < 40) return false;

    // ── Content-based filtering (for lines that may have shifted positions) ──

    // Footer patterns (anywhere on page)
    if (t.includes('One Life Foundation Pty Ltd |') && t.includes('ABN:')) return false;
    if (t.match(/^Page \d+ of \d+$/)) return false;
    if (t.includes('Copyright One Life Foundation')) return false;
    if (t.includes('© One Life Foundation')) return false;

    // Concatenated header metadata remnants from previous generation
    // e.g. "DOC NO.VERSIONEFFECTIVE DATEREVIEW DATE"
    if (t.includes('DOC NO.VERSION')) return false;
    if (t.match(/^Form\d+1\.0/)) return false; // "Form1091.08 June 2026..."
    if (t.match(/^OLF-TG-HI-\d+1\.0/)) return false;

    // Header metadata row patterns
    if (t.match(/^DOC NO[.:]\s/) || t === 'DOC NO.' || t === 'DOC NO:') return false;
    if (t.match(/^VERSION[:\s]/) || t === 'VERSION') return false;
    if (t.match(/^EFFECTIVE DATE[:\s]/) || t === 'EFFECTIVE DATE') return false;
    if (t.match(/^REVIEW DATE[:\s]/) || t === 'REVIEW DATE') return false;
    // Combined metadata line from our regenerated header
    if (t.includes('DOC NO:') && t.includes('VERSION:') && t.includes('EFFECTIVE DATE:')) return false;

    // Blue/teal bar header text
    if (t === 'OLF') return false;
    if (t === 'One Life Foundation' && line.fontSize >= 14) return false;
    // "One Life Foundation" that appears right after header (not part of body content)
    // Only filter on non-page-1, or when it's clearly a repeated header
    if (t === 'One Life Foundation' && line.fontSize < 10 && y > 700) return false;
    if (t === 'ABN: 55 643 227 061 | NDIS Registered Provider') return false;
    if (t.includes('ABN: 55 643 227 061  |  NDIS Registered Provider')) return false;

    // Category labels in header
    if (t === 'Policy & Procedure') return false;
    if (t === 'Register') return false;
    if (t === 'Training Guide') return false;
    if (t === 'High Intensity') return false;
    if (t.match(/^(Human Resources|Governance|Clinical Governance|Quality Management|Business Continuity|Governance & Compliance|Strategic Planning)$/) && line.fontSize <= 10) return false;

    // Date-only lines in header area
    if (t === '1 January 2026' && line.fontSize < 9) return false;
    if (t === '1 January 2027' && line.fontSize < 9) return false;
    if (t === '8 June 2026' && line.fontSize < 9) return false;
    if (t === '8 June 2027' && line.fontSize < 9) return false;
    if (t === '8 September 2026' && line.fontSize < 9) return false;

    // Training guide header text
    if (t === 'TRAINING GUIDE' && line.fontSize > 10) return false;
    if (t.startsWith('Module 1 — High Intensity') && line.fontSize < 9 && pageNum > 1) return false;

    // Form number badges / version in header
    if (t.match(/^Form\d+$/) && line.fontSize < 9) return false;
    if (t.match(/^OLF-TG-HI-\d+$/) && line.fontSize < 9) return false;
    if (t === '1.0' && line.fontSize < 9 && y > 700) return false;

    // "PT Y LTD" standalone header remnant
    if (t === 'PT Y LTD' || t === 'P T Y LT D') return false;
    if (t === 'PT Y LTD • NDIS PROVIDER') return false;

    // Standalone "Register / Governance & Compliance" etc
    if (t === 'Register / Governance & Compliance') return false;

    return true;
  });
}

// ─── PDF Generation helpers ──────────────────────────────────────────────────

/**
 * Draw the standard OLF header on the current page.
 */
function drawHeader(doc, config) {
  const { docNo, category, type } = config;
  const headerColor = type === 'training' ? TEAL : BLUE;

  // Blue/teal banner bar
  doc.setFillColor(...headerColor);
  doc.rect(0, 0, PAGE_W, 25, 'F');

  // Logo in the blue bar
  try {
    doc.addImage(logoDataUrl, 'PNG', 6, 3, 28, 14);
  } catch (e) {
    // Fallback: text if image fails
    doc.setTextColor(...WHITE);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('OLF', 15, 12);
  }

  // "One Life Foundation" text
  doc.setTextColor(...WHITE);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('One Life Foundation', 38, 11);

  // ABN line
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('ABN: 55 643 227 061  |  NDIS Registered Provider', 38, 17);

  // Category text on right side
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  const catLines = category.split(' / ');
  catLines.forEach((line, i) => {
    doc.text(line, PAGE_W - MARGIN_R, 10 + (i * 5), { align: 'right' });
  });

  // Metadata row below banner
  doc.setFillColor(...LIGHT_GREY);
  doc.rect(0, 25, PAGE_W, 10, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...MED_GREY);

  // Metadata labels and values
  const metaY = 31.5;
  const metaItems = [
    { label: 'DOC NO:', value: docNo },
    { label: 'VERSION:', value: '1.0' },
    { label: 'EFFECTIVE DATE:', value: '1 January 2026' },
    { label: 'REVIEW DATE:', value: '1 January 2027' },
  ];

  const colW = CONTENT_W / 4;
  metaItems.forEach((item, i) => {
    const x = MARGIN_L + (i * colW);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MED_GREY);
    doc.text(item.label, x, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_GREY);
    doc.text(' ' + item.value, x + doc.getTextWidth(item.label), metaY);
  });

  // Thin line below metadata
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(0, 35, PAGE_W, 35);
}

/**
 * Draw the standard footer on the current page.
 */
function drawFooter(doc, pageNum, totalPages) {
  const footerY = PAGE_H - 10;

  // Thin line above footer
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, footerY - 3, PAGE_W - MARGIN_R, footerY - 3);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MED_GREY);

  // Left: company info
  doc.text('One Life Foundation Pty Ltd  |  ABN: 55 643 227 061  |  9C Grasslands Avenue, Craigieburn VIC 3064', MARGIN_L, footerY);

  // Center: copyright
  doc.text('Copyright One Life Foundation 2026', PAGE_W / 2, footerY + 4, { align: 'center' });

  // Right: page number
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN_R, footerY, { align: 'right' });
}

// ─── Content rendering ───────────────────────────────────────────────────────

/**
 * Analyzes extracted text lines and determines their semantic type
 * (heading, subheading, body, table, bullet, callout box, etc.)
 */
function classifyLines(pages) {
  const allContent = [];

  for (const page of pages) {
    const filtered = filterHeaderFooter(page.lines, page.pageNum, null);
    for (const line of filtered) {
      const t = line.text;

      // Skip page numbers that slipped through
      if (t.match(/^\d+$/) && line.fontSize < 8) continue;

      // Detect line type
      let type = 'body';
      let level = 0;

      // Main section heading: "1. Purpose" or "1 Purpose"
      if (t.match(/^\d+[\.\s]\s*[A-Z]/) && line.isBold && line.fontSize >= 10) {
        type = 'heading1';
      }
      // Sub-section: "3.1 Something" or "4.2 Something"
      else if (t.match(/^\d+\.\d+\s+[A-Z]/) && (line.isBold || line.fontSize >= 9)) {
        type = 'heading2';
      }
      // Sub-sub-section: "4.2.1"
      else if (t.match(/^\d+\.\d+\.\d+\s+/) && line.isBold) {
        type = 'heading3';
      }
      // Document title (large text on page 1)
      else if (line.fontSize >= 16 && page.pageNum <= 2) {
        type = 'title';
      }
      // Subtitle (medium-large text)
      else if (line.fontSize >= 13 && line.isBold) {
        type = 'subtitle';
      }
      // Callout box headers (all caps)
      else if (t === t.toUpperCase() && t.length > 5 && t.length < 60 && !t.match(/^\d/) && line.isBold) {
        type = 'callout_header';
      }
      // Bullet points
      else if (t.match(/^[•●▪◦‣\-–]\s/) || t.match(/^[a-z]\)\s/) || t.match(/^\([a-z]\)\s/)) {
        type = 'bullet';
      }
      // Numbered list items
      else if (t.match(/^\d+\.\s+[A-Z]/) && !line.isBold && line.fontSize < 10) {
        type = 'numbered';
      }
      // Table-like rows (contains multiple tabs/large spaces or pipe separators)
      else if (t.includes(' | ') || (t.split(/\s{3,}/).length >= 3 && t.length > 20)) {
        type = 'table_row';
      }

      allContent.push({
        text: t,
        type,
        fontSize: line.fontSize,
        isBold: line.isBold,
        origPage: page.pageNum,
      });
    }
  }

  return allContent;
}

/**
 * Render all extracted content into a new jsPDF document with proper headers/footers.
 */
function renderPdf(contentLines, config) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let curY = MARGIN_T;
  let pageCount = 1;
  const pageStarts = [1]; // track page start indices for TOC etc.

  // Helper: check if we need a new page
  function ensureSpace(needed) {
    if (curY + needed > PAGE_H - MARGIN_B) {
      doc.addPage();
      pageCount++;
      drawHeader(doc, config);
      curY = MARGIN_T;
    }
  }

  // Helper: wrap and render text
  function renderText(text, x, fontSize, fontStyle, color, maxWidth, lineSpacing) {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(...color);

    const lines = doc.splitTextToSize(text, maxWidth);
    const lineH = fontSize * 0.45 + (lineSpacing || 0);

    for (const line of lines) {
      ensureSpace(lineH + 1);
      doc.text(line, x, curY);
      curY += lineH;
    }
  }

  // Draw header on first page
  drawHeader(doc, config);

  // Track callout state
  let inCallout = false;
  let calloutStartY = 0;

  for (let i = 0; i < contentLines.length; i++) {
    const item = contentLines[i];
    const { text, type, fontSize: origSize, isBold } = item;

    switch (type) {
      case 'title': {
        ensureSpace(15);
        curY += 3;
        renderText(text, MARGIN_L, 16, 'bold', BLUE, CONTENT_W, 1);
        curY += 3;
        break;
      }

      case 'subtitle': {
        ensureSpace(10);
        curY += 2;
        renderText(text, MARGIN_L, 12, 'bold', DARK_GREY, CONTENT_W, 0.5);
        curY += 2;
        break;
      }

      case 'heading1': {
        ensureSpace(12);
        curY += 4;
        // Draw a subtle left accent bar
        const accentColor = config.type === 'training' ? TEAL : BLUE;
        doc.setFillColor(...accentColor);
        doc.rect(MARGIN_L, curY - 4, 1.5, 7, 'F');

        renderText(text, MARGIN_L + 4, 12, 'bold', DARK_GREY, CONTENT_W - 4, 0.5);
        curY += 2;
        break;
      }

      case 'heading2': {
        ensureSpace(10);
        curY += 3;
        renderText(text, MARGIN_L, 10.5, 'bold', DARK_GREY, CONTENT_W, 0.3);
        curY += 1.5;
        break;
      }

      case 'heading3': {
        ensureSpace(8);
        curY += 2;
        renderText(text, MARGIN_L + 3, 9.5, 'bold', DARK_GREY, CONTENT_W - 3, 0.2);
        curY += 1;
        break;
      }

      case 'callout_header': {
        ensureSpace(15);
        curY += 3;

        // Determine callout color based on content
        let bgColor = CALLOUT_BG;
        let borderColor = CALLOUT_BORDER;
        if (text.includes('CRITICAL') || text.includes('WARNING') || text.includes('NEVER') || text.includes('EMERGENCY')) {
          bgColor = ALERT_BG;
          borderColor = ALERT_BORDER;
        } else if (text.includes('NOTE') || text.includes('SCOPE') || text.includes('DELEGATION') || text.includes('SUPPLY') || text.includes('TRANSITION')) {
          bgColor = INFO_BG;
          borderColor = INFO_BORDER;
        }

        // Draw callout box background (estimate height)
        const boxStartY = curY - 2;
        // Look ahead to find callout body lines
        let boxLines = [text];
        let j = i + 1;
        while (j < contentLines.length && contentLines[j].type !== 'heading1' &&
               contentLines[j].type !== 'heading2' && contentLines[j].type !== 'callout_header' &&
               contentLines[j].type !== 'title') {
          // Check if this looks like callout body (usually the next 1-5 lines)
          const nextText = contentLines[j].text;
          if (nextText.match(/^\d+[\.\s]\s*[A-Z]/) || nextText.length > 200) break;
          if (boxLines.length >= 8) break; // max callout lines
          boxLines.push(nextText);
          j++;
        }

        const estHeight = boxLines.length * 5 + 6;
        ensureSpace(estHeight);

        // Draw box
        doc.setFillColor(...bgColor);
        doc.roundedRect(MARGIN_L, curY - 2, CONTENT_W, estHeight, 1.5, 1.5, 'F');
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.5);
        doc.line(MARGIN_L, curY - 2, MARGIN_L, curY - 2 + estHeight);

        // Render header
        renderText(text, MARGIN_L + 4, 8.5, 'bold', borderColor, CONTENT_W - 8, 0.3);
        curY += 1;

        // Render body lines
        for (let k = 1; k < boxLines.length; k++) {
          renderText(boxLines[k], MARGIN_L + 4, 8, 'normal', DARK_GREY, CONTENT_W - 8, 0.2);
        }

        // Skip the lines we already rendered
        i = j - 1;
        curY += 2;
        break;
      }

      case 'bullet': {
        ensureSpace(6);
        // Remove the bullet character and re-add our own
        let cleanText = text.replace(/^[•●▪◦‣\-–]\s*/, '').replace(/^[a-z]\)\s*/, '').replace(/^\([a-z]\)\s*/, '');
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK_GREY);
        doc.text('\u2022', MARGIN_L + 3, curY);
        renderText(cleanText, MARGIN_L + 7, 8.5, isBold ? 'bold' : 'normal', DARK_GREY, CONTENT_W - 7, 0.2);
        curY += 0.5;
        break;
      }

      case 'numbered': {
        ensureSpace(6);
        renderText(text, MARGIN_L + 3, 8.5, 'normal', DARK_GREY, CONTENT_W - 3, 0.2);
        curY += 0.5;
        break;
      }

      case 'table_row': {
        ensureSpace(6);
        // Simple table row rendering
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK_GREY);

        // For pipe-separated content, render as columns
        if (text.includes(' | ')) {
          const cells = text.split(' | ');
          const cellW = CONTENT_W / cells.length;
          cells.forEach((cell, idx) => {
            const lines = doc.splitTextToSize(cell.trim(), cellW - 2);
            lines.forEach((line, lineIdx) => {
              doc.text(line, MARGIN_L + (idx * cellW) + 1, curY + (lineIdx * 3.5));
            });
          });
          curY += Math.max(4, 4);
        } else {
          // Multi-space separated - render as single line
          const wrappedLines = doc.splitTextToSize(text, CONTENT_W);
          for (const wl of wrappedLines) {
            ensureSpace(4);
            doc.text(wl, MARGIN_L, curY);
            curY += 3.5;
          }
        }
        curY += 0.5;
        break;
      }

      default: {
        // Regular body text
        ensureSpace(5);
        const bodyFontSize = 8.5;
        const style = isBold ? 'bold' : 'normal';
        renderText(text, MARGIN_L, bodyFontSize, style, DARK_GREY, CONTENT_W, 0.2);
        curY += 1;
        break;
      }
    }
  }

  // Now go back and add footers to all pages
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawFooter(doc, p, total);
  }

  return doc;
}

// ─── Upload helpers ──────────────────────────────────────────────────────────

async function uploadToDocuments(storagePath, pdfBytes) {
  // Remove then re-upload to avoid cache issues
  await sb.storage.from('documents').remove([storagePath]);
  const { error } = await sb.storage.from('documents').upload(
    storagePath, pdfBytes,
    { contentType: 'application/pdf' }
  );
  if (error) throw new Error('Documents upload failed: ' + error.message);
}

async function uploadToAuditorPortal(folderIds, fileName, pdfBytes) {
  for (const folderId of folderIds) {
    const portalPath = folderId + '/' + fileName;
    // Check if exists
    const { data: listing } = await sb.storage.from('auditor-portal').list(folderId, { limit: 500 });
    const exists = listing?.some(f => f.name === fileName);
    if (exists) {
      await sb.storage.from('auditor-portal').remove([portalPath]);
    }
    const { error } = await sb.storage.from('auditor-portal').upload(
      portalPath, pdfBytes,
      { contentType: 'application/pdf' }
    );
    if (error) {
      console.log(`  [!] Auditor portal upload to ${folderId} failed: ${error.message}`);
    } else {
      console.log(`  [+] Uploaded to auditor-portal/${folderId.substring(0, 8)}...`);
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(70));
  console.log('  OLF PDF Regeneration — Full Rebuild with jsPDF');
  console.log('  ' + new Date().toISOString());
  console.log('='.repeat(70));
  console.log();

  let ok = 0, fail = 0;

  for (const docConfig of DOCUMENTS) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Processing: ${docConfig.name}`);
    console.log(`${'─'.repeat(60)}`);

    try {
      // 1. Download existing PDF
      process.stdout.write('  Downloading from Supabase... ');
      const { data, error } = await sb.storage.from('documents').download(docConfig.storage);
      if (error) throw new Error('Download failed: ' + error.message);
      const pdfBuffer = Buffer.from(await data.arrayBuffer());
      console.log(`${(pdfBuffer.length / 1024).toFixed(0)} KB`);

      // 2. Extract text
      process.stdout.write('  Extracting text content... ');
      const pages = await extractPdfText(pdfBuffer);
      const totalLines = pages.reduce((sum, p) => sum + p.lines.length, 0);
      console.log(`${pages.length} pages, ${totalLines} text lines`);

      // 3. Classify content
      process.stdout.write('  Classifying content... ');
      const classified = classifyLines(pages);
      const types = {};
      classified.forEach(c => { types[c.type] = (types[c.type] || 0) + 1; });
      console.log(Object.entries(types).map(([k, v]) => `${k}:${v}`).join(', '));

      // 4. Generate new PDF
      process.stdout.write('  Generating new PDF... ');
      const newDoc = renderPdf(classified, docConfig);
      const pdfOutput = Buffer.from(newDoc.output('arraybuffer'));
      console.log(`${newDoc.getNumberOfPages()} pages, ${(pdfOutput.length / 1024).toFixed(0)} KB`);

      // 5. Save to Downloads
      const dlPath = path.join(DOWNLOADS, docConfig.name);
      fs.writeFileSync(dlPath, pdfOutput);
      console.log(`  [+] Saved to Downloads/${docConfig.name}`);

      // 6. Upload to documents bucket
      process.stdout.write('  Uploading to documents bucket... ');
      await uploadToDocuments(docConfig.storage, pdfOutput);
      console.log('OK');

      // 7. Upload to auditor-portal bucket
      if (docConfig.auditFolders.length > 0) {
        await uploadToAuditorPortal(docConfig.auditFolders, docConfig.name, pdfOutput);
      }

      ok++;
      console.log(`  [OK] ${docConfig.name} complete!`);

    } catch (e) {
      fail++;
      console.log(`\n  [FAIL] ${e.message}`);
      console.log(`  Stack: ${e.stack?.split('\n').slice(0, 3).join('\n    ')}`);
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`  COMPLETE: ${ok} succeeded, ${fail} failed out of ${DOCUMENTS.length}`);
  console.log('='.repeat(70));
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
