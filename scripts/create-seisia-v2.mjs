/**
 * create-seisia-v2.mjs
 *
 * Generates TWO PDFs for Seisia Groceries:
 *   1. Seisia Groceries Business Plan.pdf
 *   2. Seisia Groceries Cashflow Projections 36 Months.pdf
 *
 * CORRECTIONS from v1:
 *   - Name: "Seisia Groceries" (not "Seisia Community Grocery")
 *   - Funding: $150,000 (not $400,000)
 *   - Own capital: $300,000
 *   - Total: $450,000
 *   - ICN: 9086, registered 24 June 2019 under CATSI Act 2006
 *   - No mention of "loan" — use "funding" or "investment"
 *   - Finance costs: $3,000/month (based on $150K, not $400K)
 *   - Pristine Projects logo on cover pages
 *   - Correct use-of-funds breakdown
 *
 * Usage: node scripts/create-seisia-v2.mjs
 */

import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Output paths ────────────────────────────────────────────────────────────
const BP_OUTPUT = 'C:/Users/kevin/Downloads/Seisia Groceries Business Plan.pdf';
const CF_OUTPUT = 'C:/Users/kevin/Downloads/Seisia Groceries Cashflow Projections 36 Months.pdf';

// ─── Logo ────────────────────────────────────────────────────────────────────
const LOGO_PATH = 'C:/Users/kevin/OneDrive/Desktop/CLAUDE/pristine-projects-logo.png';
let logoBase64 = null;
try {
  const logoBuffer = fs.readFileSync(LOGO_PATH);
  logoBase64 = 'data:image/png;base64,' + logoBuffer.toString('base64');
} catch (e) {
  console.warn('Warning: Could not load logo from', LOGO_PATH);
}

// ─── Colors (warm earth tone palette) ────────────────────────────────────────
const OCHRE       = [180, 83, 9];        // #B45309 — deep ochre (primary heading)
const TEAL        = [13, 94, 109];       // #0D5E6D — dark teal (secondary)
const DARK_TEXT   = [30, 41, 59];        // #1e293b
const GREY_TEXT   = [100, 116, 139];     // #64748b
const LIGHT_GREY_BG = [248, 245, 240];   // warm light grey for alt rows
const WHITE       = [255, 255, 255];
const TABLE_BORDER     = [210, 200, 185]; // warm border
const TABLE_HEADER_BG  = [254, 243, 224]; // warm cream header
const TABLE_HEADER_TEXT = [140, 65, 5];   // dark ochre for header text

// ─── Page dimensions (A4 portrait) ──────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const ML = 20;
const MR = 20;
const MARGIN_T = 30;
const MARGIN_B = 22;
const CW = PAGE_W - ML - MR;

// =============================================================================
// DOCUMENT 1: BUSINESS PLAN
// =============================================================================

function createBusinessPlan() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let curY = MARGIN_T;
  let isCoverPage = true;
  let isTocPage = false;
  let currentPageNum = 1;
  const tocEntries = [];

  // ─── Header ──────────────────────────────────────────────────────────────
  function drawHeader() {
    if (isCoverPage || isTocPage) return;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...OCHRE);
    doc.text('PRISTINE PROJECTS ATSI CORPORATION', ML, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GREY_TEXT);
    doc.text('Business Plan 2026\u20132029', PAGE_W - MR, 14, { align: 'right' });

    doc.setDrawColor(210, 200, 185);
    doc.setLineWidth(0.3);
    doc.line(ML, 18, PAGE_W - MR, 18);
  }

  // ─── Footer ──────────────────────────────────────────────────────────────
  function drawFooter(pageNum) {
    if (pageNum <= 1) return;
    const footerY = PAGE_H - 12;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GREY_TEXT);
    doc.text(`Page ${pageNum}`, PAGE_W - MR, footerY, { align: 'right' });
    doc.text('Confidential', ML, footerY);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────
  function newPage() {
    doc.addPage();
    currentPageNum++;
    isCoverPage = false;
    isTocPage = false;
    drawHeader();
    curY = MARGIN_T;
  }

  function ensureSpace(needed) {
    if (curY + needed > PAGE_H - MARGIN_B) {
      newPage();
    }
  }

  function setBody() {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...DARK_TEXT);
  }

  function sectionHeading(number, text) {
    ensureSpace(20);
    curY += 12;
    const fullText = `${number}. ${text}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...OCHRE);
    doc.text(fullText, ML, curY);
    curY += 10;
    tocEntries.push({ number, text, page: currentPageNum });
  }

  function subHeading(text) {
    ensureSpace(16);
    curY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...TEAL);
    doc.text(text, ML, curY);
    curY += 8;
  }

  function writeBody(text, indent = 0) {
    setBody();
    const maxW = CW - indent;
    const lines = doc.splitTextToSize(text, maxW);
    const lineH = 5.5;
    for (const line of lines) {
      ensureSpace(lineH + 1);
      doc.text(line, ML + indent, curY);
      curY += lineH;
    }
    curY += 3;
  }

  function writeBullet(text, indent = 6) {
    setBody();
    const bulletX = ML + indent;
    const textX = bulletX + 4;
    const maxW = CW - indent - 4;
    const lines = doc.splitTextToSize(text, maxW);
    const lineH = 5.2;
    ensureSpace(lines.length * lineH + 2);
    doc.setTextColor(...GREY_TEXT);
    doc.text('\u2022', bulletX, curY);
    doc.setTextColor(...DARK_TEXT);
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], textX, curY);
      curY += lineH;
    }
    curY += 1.5;
  }

  function writeBulletBold(label, desc, indent = 6) {
    const bulletX = ML + indent;
    const textX = bulletX + 4;
    const maxW = CW - indent - 4;
    const lineH = 5.2;
    const fullText = `${label}: ${desc}`;
    const lines = doc.splitTextToSize(fullText, maxW);
    ensureSpace(lines.length * lineH + 2);

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GREY_TEXT);
    doc.text('\u2022', bulletX, curY);

    doc.setTextColor(...DARK_TEXT);
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', textX, curY);
    const labelW = doc.getTextWidth(label + ': ');
    doc.setFont('helvetica', 'normal');

    if (lines.length === 1) {
      doc.text(desc, textX + labelW, curY);
      curY += lineH;
    } else {
      for (let i = 0; i < lines.length; i++) {
        if (i === 0) {
          const remaining = lines[0].substring(label.length + 2);
          doc.text(remaining, textX + labelW, curY);
        } else {
          doc.text(lines[i], textX, curY);
        }
        curY += lineH;
      }
    }
    curY += 1.2;
  }

  function drawTable(headers, rows, colWidths) {
    const totalW = colWidths.reduce((a, b) => a + b, 0);
    const rowH = 8;
    const padding = 2.5;
    const fontSize = 8.5;

    function calcRowH(cells) {
      let maxLines = 1;
      doc.setFontSize(fontSize);
      cells.forEach((cell, i) => {
        const lines = doc.splitTextToSize(String(cell), colWidths[i] - padding * 2);
        if (lines.length > maxLines) maxLines = lines.length;
      });
      return Math.max(rowH, maxLines * 4.2 + 4);
    }

    ensureSpace(rowH + 5);
    let x = ML;
    const headerH = calcRowH(headers);

    doc.setFillColor(...TABLE_HEADER_BG);
    doc.rect(x, curY - 4.5, totalW, headerH, 'F');
    doc.setDrawColor(...TABLE_BORDER);
    doc.setLineWidth(0.3);
    doc.rect(x, curY - 4.5, totalW, headerH, 'S');

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TABLE_HEADER_TEXT);

    headers.forEach((h, i) => {
      const lines = doc.splitTextToSize(String(h), colWidths[i] - padding * 2);
      lines.forEach((line, li) => {
        doc.text(line, x + padding, curY + (li * 4.2));
      });
      x += colWidths[i];
    });
    curY += headerH - 2;

    rows.forEach((row, ri) => {
      const rH = calcRowH(row);
      ensureSpace(rH + 2);
      x = ML;

      if (ri % 2 === 0) {
        doc.setFillColor(...LIGHT_GREY_BG);
        doc.rect(x, curY - 4.5, totalW, rH, 'F');
      }

      doc.setDrawColor(...TABLE_BORDER);
      doc.setLineWidth(0.2);
      doc.rect(x, curY - 4.5, totalW, rH, 'S');

      let vx = ML;
      for (let ci = 0; ci < row.length - 1; ci++) {
        vx += colWidths[ci];
        doc.line(vx, curY - 4.5, vx, curY - 4.5 + rH);
      }

      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK_TEXT);

      row.forEach((cell, ci) => {
        const cellText = String(cell);
        if (cellText.toLowerCase().startsWith('total') || cellText.toLowerCase().startsWith('funded by')) {
          doc.setFont('helvetica', 'bold');
        }
        const lines = doc.splitTextToSize(cellText, colWidths[ci] - padding * 2);
        lines.forEach((line, li) => {
          doc.text(line, x + padding, curY + (li * 4.2));
        });
        doc.setFont('helvetica', 'normal');
        x += colWidths[ci];
      });

      curY += rH - 2;
    });
    curY += 6;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  isCoverPage = true;
  currentPageNum = 1;

  // Logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', PAGE_W / 2 - 20, 25, 40, 40);
    } catch (e) {
      console.warn('Could not embed logo:', e.message);
    }
  }

  curY = 72;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...OCHRE);
  doc.text('PRISTINE PROJECTS', PAGE_W / 2, curY, { align: 'center' });
  curY += 7;
  doc.text('ABORIGINAL AND TORRES STRAIT ISLANDER', PAGE_W / 2, curY, { align: 'center' });
  curY += 7;
  doc.text('CORPORATION', PAGE_W / 2, curY, { align: 'center' });

  curY += 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...DARK_TEXT);
  doc.text('Seisia Groceries', PAGE_W / 2, curY, { align: 'center' });

  curY += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.setTextColor(...GREY_TEXT);
  doc.text('Business Plan 2026\u20132029', PAGE_W / 2, curY, { align: 'center' });

  curY += 14;
  doc.setDrawColor(...OCHRE);
  doc.setLineWidth(0.8);
  doc.line(ML + 40, curY, PAGE_W - MR - 40, curY);

  curY += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...OCHRE);
  doc.text('Confidential Business Plan', PAGE_W / 2, curY, { align: 'center' });

  curY += 30;
  const metaX = ML + 35;
  const metaValX = ML + 75;
  doc.setFontSize(10);
  const metaItems = [
    ['Prepared By:', 'Pristine Projects ATSI Corporation'],
    ['Director:', 'Alex Wymarra'],
    ['ABN:', '78 550 135 630'],
    ['ICN:', '9086'],
    ['Registered:', '24 June 2019 (CATSI Act 2006)'],
    ['Store Location:', 'Tumema Street, Seisia QLD 4876'],
    ['Version:', 'June 2026'],
  ];
  for (const [label, value] of metaItems) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREY_TEXT);
    doc.text(label, metaX, curY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_TEXT);
    doc.text(value, metaValX, curY);
    curY += 7;
  }

  curY = PAGE_H - 40;
  doc.setDrawColor(210, 200, 185);
  doc.setLineWidth(0.3);
  doc.line(ML + 30, curY, PAGE_W - MR - 30, curY);
  curY += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text('Tumema Street, Seisia QLD 4876', PAGE_W / 2, curY, { align: 'center' });
  curY += 5;
  doc.text('Cape York Peninsula, Far North Queensland', PAGE_W / 2, curY, { align: 'center' });
  curY += 5;
  doc.text('ABN: 78 550 135 630  |  ICN: 9086  |  CATSI Act Corporation', PAGE_W / 2, curY, { align: 'center' });

  // ═══════════════════════════════════════════════════════════════════════════
  // TABLE OF CONTENTS (page 2)
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPageNum = 2;
  isCoverPage = false;
  isTocPage = true;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...OCHRE);
  doc.text('PRISTINE PROJECTS ATSI CORPORATION', ML, 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text('Business Plan 2026\u20132029', PAGE_W - MR, 14, { align: 'right' });
  doc.setDrawColor(210, 200, 185);
  doc.setLineWidth(0.3);
  doc.line(ML, 18, PAGE_W - MR, 18);

  curY = 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...OCHRE);
  doc.text('Table of Contents', ML, curY);
  curY += 16;

  const tocYStart = curY;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT PAGES
  // ═══════════════════════════════════════════════════════════════════════════
  newPage();

  // ─── 1. Executive Summary ────────────────────────────────────────────────
  sectionHeading(1, 'Executive Summary');

  writeBody('Seisia Groceries is an Indigenous community enterprise that will provide essential food retail services while creating meaningful employment opportunities for Aboriginal and Torres Strait Islander people in one of Australia\u2019s most remote communities. Operated by Pristine Projects Aboriginal and Torres Strait Islander Corporation, the store will be located at Tumema Street, Seisia QLD 4876, at the tip of Cape York Peninsula in Far North Queensland.');

  writeBody('The store will serve as the primary retail outlet for the Seisia community (approximately 260 residents) and the broader Northern Peninsula Area (NPA) communities, which have a combined population of approximately 3,000 people. In a community where every local job matters, Seisia Groceries will create 4\u20136 Indigenous employment positions \u2014 a significant contribution to a community of just 260 people.');

  writeBody('The store addresses a critical gap in essential services for one of Australia\'s most remote Indigenous communities. Access to affordable, fresh, and nutritious food is a fundamental need, and Seisia\'s extreme geographic isolation makes local retail infrastructure not just desirable but essential for community wellbeing. Remote Indigenous communities experience significantly higher rates of diabetes, cardiovascular disease, and obesity linked to poor food access \u2014 Seisia Groceries directly addresses this by providing reliable access to fresh, affordable, and nutritious food. The nearest major centre, Cairns, is over 900 kilometres away \u2014 much of it via unsealed road that becomes impassable during the wet season (November to April).');

  writeBody('This business plan outlines the establishment, operations, and financial viability of Seisia Groceries over a three-year period (2026\u20132029). The plan demonstrates a sustainable Indigenous community enterprise model that delivers essential services, strengthens food security, creates meaningful local employment, and keeps economic activity within the community. It is a model for Indigenous self-determination and economic empowerment that can be replicated in other remote communities across Australia.');

  subHeading('Investment Overview');

  writeBody('The total project cost is $450,000, funded through a combination of the Corporation\'s own capital ($300,000) and external funding ($150,000).');

  drawTable(
    ['Item', 'Amount', 'Description'],
    [
      ['Store renovation and fit-out', '$120,000', 'Interior renovation, shelving, counters, signage, flooring, lighting, POS, security'],
      ['Commercial refrigeration and cold storage', '$80,000', 'Walk-in cool room, display fridges, freezer units, ice machine'],
      ['Initial stock purchase', '$100,000', 'First 3 months of stock across all product categories'],
      ['Transport and logistics', '$50,000', 'Delivery vehicle, freight setup, wet season barge arrangements'],
      ['Working capital reserve', '$100,000', 'Operating expenses buffer and contingency reserve'],
      ['Total', '$450,000', ''],
      ['Funded by: Own capital', '$300,000', 'Existing Corporation funds'],
      ['Funded by: External funding', '$150,000', 'Investment funding (concessional rate)'],
    ],
    [55, 30, CW - 85]
  );

  subHeading('Key Outcomes');
  writeBullet('4\u20136 local employment positions created, with 100% Indigenous employment target');
  writeBullet('Reliable access to fresh, affordable food for 260+ Seisia residents');
  writeBullet('Projected Year 1 revenue of approximately $1.05 million (conservative)');
  writeBullet('Break-even expected by Month 7\u20138 of operations');
  writeBullet('A replicable model for Indigenous community enterprise in remote Australia');

  // ─── 2. About Pristine Projects ─────────────────────────────────────────
  sectionHeading(2, 'About Pristine Projects ATSI Corporation');

  writeBody('Pristine Projects Aboriginal and Torres Strait Islander Corporation was registered on 24 June 2019 under the Corporations (Aboriginal and Torres Strait Islander) Act 2006 (CATSI Act). The corporation was founded with the express purpose of creating sustainable economic opportunities for Indigenous communities through the delivery of essential services.');

  writeBody('At its core, Seisia Groceries is about self-determination \u2014 an Indigenous-owned and operated business serving Indigenous people, creating Indigenous jobs, and keeping economic activity within the community. Pristine Projects exists to demonstrate that remote Indigenous communities can build and sustain their own essential services, creating a pathway from dependency to economic independence.');

  writeBody('As a CATSI Act corporation, Pristine Projects operates under the regulatory oversight of the Office of the Registrar of Indigenous Corporations (ORIC), ensuring accountability, transparency, and good governance in all its operations.');

  subHeading('Corporate Details');
  writeBulletBold('Entity Name', 'Pristine Projects Aboriginal and Torres Strait Islander Corporation');
  writeBulletBold('Entity Type', 'CATSI Act Corporation (Other Incorporated Entity)');
  writeBulletBold('ABN', '78 550 135 630');
  writeBulletBold('ICN', '9086');
  writeBulletBold('Registered', '24 June 2019 under the Corporations (Aboriginal and Torres Strait Islander) Act 2006');
  writeBulletBold('Director', 'Alex Wymarra \u2014 local community leader with deep ties to the Northern Peninsula Area and extensive experience in community development and service delivery');
  writeBulletBold('Registered Office', 'NSW 2000');
  writeBulletBold('Operating Location', 'Tumema Street, Seisia QLD 4876, Cape York Peninsula');

  subHeading('Mission');
  writeBody('To create sustainable economic opportunities for Aboriginal and Torres Strait Islander communities through the delivery of essential services, fostering self-determination, community ownership, and local employment.');

  subHeading('Core Values');
  writeBullet('Self-determination \u2014 community-led decision making and governance');
  writeBullet('Local ownership \u2014 the community benefits directly from its own enterprise');
  writeBullet('Employment and skills development \u2014 creating real jobs and career pathways for Indigenous community members');
  writeBullet('Sustainable service delivery \u2014 building a business that serves the community for the long term');
  writeBullet('Cultural respect and responsiveness \u2014 operations that honour and reflect local culture');
  writeBullet('Accountability and transparent governance \u2014 meeting the highest standards expected of a CATSI Act corporation');

  subHeading('Strategic Partnership \u2014 Nationwide Projects Investments Pty Ltd');
  writeBody('Pristine Projects has established a strategic partnership with Nationwide Projects Investments Pty Ltd (NPI), a Victorian-based company with established business operations and infrastructure. NPI provides operational management support, supply chain coordination, and business systems infrastructure to Seisia Groceries.');

  writeBody('This partnership ensures Seisia Groceries benefits from:');
  writeBullet('Established supplier relationships and procurement systems');
  writeBullet('Business management expertise and financial oversight');
  writeBullet('Digital operations platform (seisia-ops.vercel.app) for inventory and order management');
  writeBullet('Logistics coordination for remote freight and supply chain management');

  writeBody('Importantly, this partnership model preserves Indigenous community ownership and self-determination. Pristine Projects ATSI Corporation remains the operator and decision-maker, with NPI providing support services that build the operational capacity of the Indigenous corporation over time. The long-term goal is full operational independence as local staff develop business management capabilities.');

  // ─── 3. The Community ───────────────────────────────────────────────────
  sectionHeading(3, 'The Community \u2014 Seisia and Northern Peninsula Area');

  writeBody('Seisia is a small Aboriginal and Torres Strait Islander community located at the very tip of Cape York Peninsula in Far North Queensland. It is one of the most remote communities in mainland Australia, situated approximately 900 kilometres north of Cairns \u2014 the nearest major regional centre.');

  writeBody('The community has deep cultural significance as part of the traditional lands and seas of the Torres Strait Islander and Aboriginal peoples of the region. Seisia\'s location, facing the Torres Strait, connects it culturally and geographically to both Cape York Aboriginal communities and the Torres Strait Islands.');

  subHeading('Northern Peninsula Area (NPA)');
  writeBody('The Northern Peninsula Area encompasses five distinct communities, each with its own identity, history, and governance structures, united under the NPA Regional Council:');
  curY += 2;
  writeBulletBold('Seisia', 'Approximately 260 residents. A Torres Strait Islander community established in 1948 when people relocated from Saibai Island');
  writeBulletBold('Bamaga', 'The largest NPA community with approximately 1,200 residents. Administrative centre of the NPA');
  writeBulletBold('Injinoo', 'An Aboriginal community of approximately 600 residents, the oldest continuously occupied settlement on the Cape');
  writeBulletBold('Umagico', 'A Torres Strait Islander community of approximately 350 residents');
  writeBulletBold('New Mapoon', 'An Aboriginal community of approximately 400 residents, relocated from Old Mapoon in the 1960s');

  writeBody('The total NPA population is approximately 3,000 people, the vast majority of whom are Aboriginal and/or Torres Strait Islander Australians.');

  subHeading('Access and Remoteness');
  writeBody('The extreme remoteness of the NPA presents both challenges and opportunities:');
  curY += 2;
  writeBullet('Road access is via the Peninsula Developmental Road from Cairns \u2014 a 900km journey that takes 12\u201314 hours in ideal conditions, much of it on unsealed road');
  writeBullet('During the wet season (November to April), the road is cut by flooding, often for weeks at a time, leaving communities dependent on barge and air transport');
  writeBullet('Barge freight operates weekly from Cairns during the wet season, with significantly higher costs than road transport');
  writeBullet('Air access is available via Bamaga/Injinoo Airport, with regular scheduled flights from Cairns (approximately 2 hours)');
  writeBullet('Ferry services connect Seisia to Thursday Island and the broader Torres Strait, providing additional (but expensive) supply options');
  writeBullet('The community is classified as "Very Remote" under the Australian Statistical Geography Standard (ASGS)');

  subHeading('Community Context and Challenges');
  writeBody('The residents of Seisia and the broader NPA face a number of interrelated challenges that underscore the importance of local retail infrastructure:');
  curY += 2;
  writeBullet('Cost of living is extremely high \u2014 grocery prices are typically 30\u201350% above metropolitan levels, and sometimes higher for fresh produce and perishables');
  writeBullet('Significant health challenges including high rates of diabetes, obesity, cardiovascular disease, and renal disease \u2014 all closely linked to poor access to affordable, nutritious food');
  writeBullet('Limited local employment opportunities \u2014 the NPA has unemployment rates significantly above the national average');
  writeBullet('High welfare dependency \u2014 Centrelink payments are the primary income source for many households');
  writeBullet('Housing pressure and overcrowding \u2014 average household sizes are larger than metropolitan averages');
  writeBullet('Strong cultural identity and community cohesion \u2014 a resilient and proud community with deep connections to country and sea');

  // ─── 4. The Opportunity ──────────────────────────────────────────────────
  sectionHeading(4, 'The Opportunity');

  writeBody('Seisia Groceries represents a compelling community enterprise opportunity. The business is underpinned by strong, stable demand for essential goods in a captive market, with minimal competition and significant barriers to entry for potential competitors.');

  subHeading('Market Drivers');
  writeBullet('Seisia has no existing general store \u2014 establishing one fills a critical gap in essential community infrastructure');
  writeBullet('Captive local market of 260+ residents who currently have limited options for purchasing everyday goods');
  writeBullet('Additional demand from the broader NPA population of approximately 3,000 people');
  writeBullet('Wet season (November\u2013April) drives increased demand as residents cannot travel and must rely on local supply');
  writeBullet('Growing Cape York tourism sector \u2014 4WD adventure tourism, fishing charters, and cultural tourism bring increasing numbers of visitors during the dry season (May\u2013October)');
  writeBullet('Dry season travellers passing through Seisia to catch ferries to Thursday Island and the Torres Strait Islands');
  writeBullet('Government, council, and health workers stationed in the NPA require local retail services');
  writeBullet('Essential goods retail is inherently recession-resistant \u2014 people always need food and household supplies');

  subHeading('Competitive Landscape');
  writeBody('Seisia has no direct competition for grocery retail within the immediate community. The nearest alternatives are limited:');
  curY += 2;
  writeBullet('Bamaga (5km) has some retail options, but many Seisia residents lack private transport, making even this short distance a significant barrier');
  writeBullet('Thursday Island is accessible only by ferry and is expensive for routine shopping');
  writeBullet('Cairns (900km) is the nearest full-service retail centre \u2014 clearly impractical for regular grocery shopping');

  writeBody('The remoteness that makes operating in Seisia challenging also creates a natural barrier to competition, providing the store with a secure and stable market position.');

  subHeading('Strategic Advantages');
  writeBullet('Essential service with guaranteed demand \u2014 food is non-discretionary');
  writeBullet('No direct competition in the immediate community');
  writeBullet('Community ownership model builds loyalty and trust');
  writeBullet('Established supplier relationship with Campbell\'s Wholesale (Australia\'s largest independent grocery wholesaler)');
  writeBullet('Strong community leadership through Director Alex Wymarra');

  // ─── 5. Products and Services ────────────────────────────────────────────
  sectionHeading(5, 'Products and Services');

  writeBody('The store will offer a comprehensive range of everyday essentials, carefully curated to meet the specific needs and preferences of the local community. Product range decisions will be informed by direct community consultation to ensure the store stocks what people actually need.');

  subHeading('Fresh Food');
  writeBullet('Fresh fruit and vegetables \u2014 sourced via Campbell\'s Wholesale, Cairns, with an emphasis on shelf-stable varieties suited to the supply chain');
  writeBullet('Meat and poultry \u2014 primarily frozen, with fresh options where cold chain reliability permits');
  writeBullet('Dairy products \u2014 milk, cheese, yoghurt, butter');
  writeBullet('Bread and bakery items \u2014 sourced from Cairns bakeries, supplemented with long-life options');
  writeBullet('Eggs');

  subHeading('Pantry and Packaged Goods');
  writeBullet('Rice, flour, sugar, salt \u2014 in bulk and standard sizes');
  writeBullet('Canned goods \u2014 vegetables, fruit, meat, fish, soups, baked beans');
  writeBullet('Pasta, noodles, and sauces');
  writeBullet('Cooking oils, vinegar, condiments');
  writeBullet('Breakfast cereals, oats, and spreads');
  writeBullet('Long-life milk and UHT beverages');
  writeBullet('Snacks, biscuits, and confectionery');

  subHeading('Beverages');
  writeBullet('Soft drinks, water, and juice (the store will not sell alcohol)');
  writeBullet('Tea, coffee, and hot chocolate');
  writeBullet('Ice');

  subHeading('Household and Personal');
  writeBullet('Cleaning products \u2014 surface cleaners, disinfectant, bleach, dishwashing liquid');
  writeBullet('Laundry supplies \u2014 washing powder, fabric softener');
  writeBullet('Toiletries \u2014 soap, shampoo, toothpaste, deodorant');
  writeBullet('Baby products \u2014 nappies, formula, baby food, wipes');
  writeBullet('Pet food');
  writeBullet('Basic first aid supplies');

  subHeading('Other Products and Services');
  writeBullet('Basic hardware and fishing supplies \u2014 reflecting local lifestyle and livelihood');
  writeBullet('Mobile phone credit and recharge (Telstra, Optus)');
  writeBullet('Stationery and school supplies');
  writeBullet('Cultural and community items as appropriate and seasonally relevant');

  writeBody('The product range will be reviewed quarterly based on sales data and community feedback. The store is committed to stocking affordable, quality products that meet the real needs of the community.');

  // ─── 6. Operations ───────────────────────────────────────────────────────
  sectionHeading(6, 'Operations');

  writeBody('Seisia Groceries will operate from its premises at Tumema Street, Seisia QLD 4876, serving as the primary retail outlet for the Seisia community and surrounding NPA region.');

  subHeading('Operating Hours');
  writeBody('The store will operate 7 days a week to ensure the community has consistent access to essential goods:');
  curY += 2;
  writeBullet('Monday to Saturday: 8:00am \u2013 6:00pm');
  writeBullet('Sunday: 9:00am \u2013 4:00pm');
  writeBullet('Public holidays: reduced hours (10:00am \u2013 2:00pm)');
  writeBullet('Extended hours during peak tourist season (May\u2013October) as demand warrants');

  subHeading('Supply Chain Management');
  writeBody('Reliable supply is the single most critical operational factor for a remote community store. The supply chain has been designed with redundancy to manage the challenges of extreme remoteness and seasonal road closures.');
  curY += 2;
  writeBulletBold('Primary Supplier', 'Campbell\'s Wholesale, Cairns \u2014 Australia\'s largest independent grocery wholesaler, with extensive experience supplying remote communities');
  writeBulletBold('Ordering Platform', 'campbells.sorted.au digital ordering system (Customer ID: 34191593), allowing efficient weekly ordering');
  writeBulletBold('Dry Season Freight (May\u2013Oct)', 'Road transport from Cairns. Orders placed weekly with a 3\u20134 day delivery window. Cost-effective and reliable');
  writeBulletBold('Wet Season Freight (Nov\u2013Apr)', 'Barge transport from Cairns on a weekly schedule. Approximately 25\u201330% more expensive than road freight, but reliable');
  writeBulletBold('Emergency Supplies', 'Air freight from Cairns or Thursday Island for critical shortages (medicine, baby formula, etc.)');
  writeBulletBold('Pre-Season Stocking', 'Build 3-month buffer of non-perishable staples before wet season onset');

  subHeading('Store Operations');
  writeBullet('Modern point-of-sale (POS) system with EFTPOS and integrated inventory tracking');
  writeBullet('Daily cash reconciliation and banking procedures');
  writeBullet('FIFO (First In, First Out) stock rotation to minimise spoilage');
  writeBullet('Temperature monitoring with alarms on all refrigeration and cold storage units');
  writeBullet('Food safety protocols compliant with the Food Act 2006 (Qld) and relevant Australian Standards');
  writeBullet('Daily cleaning schedule and hygiene protocols');
  writeBullet('Security: CCTV system (internal and external), alarm system, secure cash handling');
  writeBullet('Regular stock-takes (weekly for fresh, monthly for full inventory)');

  subHeading('Quality Assurance');
  writeBody('Given the importance of the store to community health outcomes, quality assurance is a priority. All staff will be trained in food safety, cold chain management, and product handling. The store will maintain compliance with all applicable Queensland food safety regulations and undergo regular self-audits of cold chain and stock management processes.');

  // ─── 7. Staffing and Employment ──────────────────────────────────────────
  sectionHeading(7, 'Staffing and Employment');

  writeBody('Creating meaningful local employment for Aboriginal and Torres Strait Islander community members is a fundamental objective of this enterprise \u2014 equal in importance to the provision of essential goods. Every position filled locally is one less person needing to leave community for work. In a community of just 260 people, creating 4\u20136 jobs represents a transformative economic contribution.');

  writeBody('The store will operate with a lean but effective team, with a 100% Indigenous employment target. All positions will be prioritised for recruitment from Seisia and the broader Northern Peninsula Area communities.');

  subHeading('Staffing Plan');
  drawTable(
    ['Position', 'Type', 'Key Responsibilities'],
    [
      ['Store Manager', 'Full-time (1)', 'Overall operations, ordering, cash management, staff supervision, supplier liaison, reporting'],
      ['Senior Shop Assistant', 'Full-time (1)', 'Customer service, stock management, POS operations, deputises for Manager'],
      ['Shop Assistants', 'Part-time / Casual (2)', 'Customer service, shelf stocking, cleaning, stock rotation'],
      ['Freight / Stock Handler', 'Part-time (1)', 'Receiving deliveries, checking stock, loading/unloading, warehouse management'],
      ['Total Positions', '4\u20136', 'Indigenous employment target: 100%'],
    ],
    [42, 35, CW - 77]
  );

  subHeading('Indigenous Employment Strategy');
  writeBullet('100% Indigenous employment target \u2014 all positions designated for Aboriginal and Torres Strait Islander community members');
  writeBullet('Priority hiring from Seisia and broader NPA communities \u2014 local employment is a core purpose of the business');
  writeBullet('Comprehensive on-the-job training covering retail operations, food safety (including Statement of Attainment in Food Safety Supervision), customer service, inventory management, and cash handling');
  writeBullet('Defined career pathways: Shop Assistant \u2192 Senior Shop Assistant \u2192 Supervisor \u2192 Store Manager, providing genuine progression opportunities');
  writeBullet('Youth employment: work experience placements and school-based traineeships for young people in the NPA, creating early engagement with employment and reducing disengagement');
  writeBullet('Flexible scheduling to accommodate cultural obligations, community events, sorry business, ceremony, and family responsibilities');
  writeBullet('Competitive wages aligned with the General Retail Industry Award 2020, with above-Award payments where justified by remoteness');
  writeBullet('Partnership with local employment services (e.g., RISE, My Pathway, Bamaga CDEP) for recruitment, mentoring, and support');

  subHeading('Skills Transfer and Development');
  writeBody('A core objective of the employment model is building transferable skills within the community. All staff will receive structured training in the following areas:');
  curY += 2;
  writeBullet('Retail operations and customer service');
  writeBullet('Food safety certification and hygiene (nationally recognised units of competency)');
  writeBullet('Stock management and FIFO rotation');
  writeBullet('POS system operation and EFTPOS');
  writeBullet('Cash handling and reconciliation');
  writeBullet('Basic accounting and financial reporting (for senior staff and manager)');
  writeBullet('Workplace health and safety');

  writeBody('Training will be delivered on-the-job with the support of external registered training organisations (RTOs) where appropriate. The objective is to build transferable skills \u2014 retail operations, food safety certification, stock management, customer service, and basic accounting \u2014 that benefit staff beyond this specific role and contribute to the community\u2019s long-term human capital.');

  writeBody('These skills are portable and valuable across multiple industries, meaning every staff member who completes their training at Seisia Groceries leaves with qualifications and experience that serve them for life, whether they remain with the store or pursue other opportunities.');

  // ─── 8. Use of Funds ─────────────────────────────────────────────────────
  sectionHeading(8, 'Use of Funds');

  writeBody('The total investment of $450,000 \u2014 comprising $300,000 in existing Corporation capital and $150,000 in external funding \u2014 will be allocated across five key areas. Each allocation has been carefully sized to ensure the store is fully operational, adequately stocked, and has sufficient working capital to sustain operations through the critical establishment phase.');

  drawTable(
    ['Item', 'Amount', 'Description'],
    [
      ['Store Renovation & Fit-out', '$120,000', 'Interior renovation including flooring, wall treatment, ceiling repairs, LED lighting throughout. Shelving and gondola units (8+ bays). Service counter with integrated POS. Internal and external signage. Painting. Security installation (4-camera CCTV, alarm system, secure cash room).'],
      ['Commercial Refrigeration & Cold Storage', '$80,000', 'Walk-in cool room (10m\u00b3, maintained at 2\u20134\u00b0C). Commercial glass-front display fridges (x3). Chest freezer units (x2, -18\u00b0C). Ice machine (100kg/day capacity). Digital temperature monitoring system with SMS alerts.'],
      ['Initial Stock Purchase', '$100,000', 'First 3 months of stock across all product categories, sourced via Campbell\'s Wholesale. Includes dry goods, frozen, chilled, fresh, household, and personal care. Establishment of minimum stock levels and wet season buffer inventory.'],
      ['Transport & Logistics', '$50,000', 'Delivery/utility vehicle suitable for local use (dual-cab or small truck). Freight account setup with road and barge carriers. Fuel reserve. First-year vehicle insurance and registration.'],
      ['Working Capital Reserve', '$100,000', 'Operating expenses buffer including wages, utilities, insurance, freight costs, and general contingency. This reserve ensures the business can sustain operations through the ramp-up period while revenue builds to steady state.'],
      ['Total', '$450,000', ''],
    ],
    [48, 26, CW - 74]
  );

  subHeading('Funding Structure');
  drawTable(
    ['Source', 'Amount', 'Notes'],
    [
      ['Own Capital (Corporation funds)', '$300,000', 'Existing funds held by Pristine Projects ATSI Corporation'],
      ['External Funding', '$150,000', 'Investment funding at a concessional rate. Finance costs of approximately $3,000 per month.'],
      ['Total', '$450,000', ''],
    ],
    [55, 30, CW - 85]
  );

  writeBody('Capital expenditure will be front-loaded in the first three months, with the store targeting a soft opening in Month 2 and full operations from Month 3.');

  // ─── 9. Marketing and Community Engagement ────────────────────────────────
  sectionHeading(9, 'Marketing and Community Engagement');

  writeBody('In a small, close-knit remote community, the most effective marketing is reliable service, fair pricing, and genuine community engagement. The store\'s approach to marketing and engagement reflects this reality.');

  subHeading('Community Engagement');
  writeBullet('Regular community consultation on product range \u2014 quarterly community surveys and an in-store suggestion system to ensure the store stocks what people want and need');
  writeBullet('Community notice board in-store for local events, council information, health services, and community announcements');
  writeBullet('Active participation in and sponsorship of local cultural events, NAIDOC Week celebrations, and community gatherings');
  writeBullet('Social media presence via a Facebook community page for store updates, new stock arrivals, and weekly specials');
  writeBullet('Listing in NPA Regional Council newsletter and community communications');
  writeBullet('Open-door policy \u2014 community members welcome to provide feedback directly to the Store Manager or Director');

  subHeading('Pricing Philosophy');
  writeBody('The store is committed to fair, transparent pricing. While prices will necessarily be higher than metropolitan supermarkets due to significant freight costs, the store will aim to keep margins as low as commercially sustainable. Key pricing commitments include:');
  curY += 2;
  writeBullet('Transparent pricing \u2014 all prices clearly displayed');
  writeBullet('No price gouging during wet season or supply shortages');
  writeBullet('Weekly specials on rotating product categories');
  writeBullet('Competitive pricing benchmarked against other remote community stores in the region');
  writeBullet('Bulk purchase discounts for community organisations and events');

  subHeading('Health and Nutrition Initiatives');
  writeBody('Improving community health through better food access is a core social objective of the store:');
  curY += 2;
  writeBullet('Active promotion and prominent placement of fresh produce and healthy food options');
  writeBullet('Collaboration with local health services (Queensland Health, Aboriginal Medical Service, NPA health clinic) on community nutrition programs');
  writeBullet('Clear in-store signage highlighting healthy choices');
  writeBullet('Seasonal specials on fresh fruit and vegetables to encourage healthy eating');
  writeBullet('Reduced margins on essential healthy staples (fresh vegetables, wholegrain bread, lean protein)');
  writeBullet('Support for any future "Healthy Stores" or similar government initiatives in the region');

  // ─── 10. Financial Overview ──────────────────────────────────────────────
  sectionHeading(10, 'Financial Overview');

  writeBody('The financial projections below are based on conservative assumptions that reflect the unique operating characteristics of a remote community grocery store. Detailed 36-month cashflow projections are provided in the accompanying financial document.');

  subHeading('Revenue Assumptions');
  writeBullet('Core local population: approximately 260 people (Seisia community)');
  writeBullet('Average household size in the NPA: approximately 4.5 persons (~58 households)');
  writeBullet('Average weekly household grocery spend in remote communities: $350\u2013$450 (source: ABS Remote Area Price Survey)');
  writeBullet('Estimated weekly revenue at maturity: $20,000\u2013$26,000');
  writeBullet('Annual revenue estimate at maturity: $1.05M\u2013$1.35M');
  writeBullet('Year 1 conservative estimate: ~$1.05M (accounting for 2-month ramp-up period)');
  writeBullet('Year 2 projection: ~$1.14M (+8% growth from expanded product range and tourism)');
  writeBullet('Year 3 projection: ~$1.32M (+15% growth from additional services and surrounding community delivery)');

  subHeading('Cost Structure');
  writeBody('The cost structure reflects the realities of remote retail, where freight is a major cost driver:');
  curY += 3;
  drawTable(
    ['Cost Category', 'Annual Estimate', 'Notes'],
    [
      ['Cost of Goods (incl. freight)', '64\u201367% of revenue', 'COGS ~52% + freight ~12\u201315%. Freight is higher during wet season (barge vs. road)'],
      ['Wages', '$180,000 \u2013 $195,000', '4\u20136 staff, aligned with Retail Award + remote loading'],
      ['Rent / Occupancy', '$24,000', '$2,000/month'],
      ['Utilities', '$18,000', 'Power, water (remote area premium on electricity)'],
      ['Insurance', '$12,000', 'Business, stock, vehicle, public liability, workers comp'],
      ['Finance Costs', '$36,000', 'Based on $150K funding at concessional rate (~$3,000/month)'],
      ['Other Operating', '$30,000', 'Maintenance, admin, POS fees, phone/internet, accounting'],
    ],
    [50, 42, CW - 92]
  );

  subHeading('Key Financial Metrics');
  writeBulletBold('Gross Margin (after freight)', '~33\u201336% of revenue');
  writeBulletBold('Net Profit (Year 1)', '$80,000\u2013$110,000 (after all costs including finance)');
  writeBulletBold('Break-even Point', 'Month 7\u20138');
  writeBulletBold('Revenue Growth', '~8% Year 2, ~15% Year 3');
  writeBulletBold('Cumulative Surplus at 36 Months', '~$300,000+ (conservative)');

  subHeading('Community Reinvestment');
  writeBody('Surplus generated by Seisia Groceries will be reinvested into the community through employment growth, product range expansion, and community initiatives. As an Indigenous community enterprise, the store\u2019s financial success directly translates to community benefit \u2014 every dollar of profit stays within the community ecosystem rather than flowing to external corporate shareholders.');

  // ─── 11. Risk Management ─────────────────────────────────────────────────
  sectionHeading(11, 'Risk Management');

  writeBody('Operating in one of Australia\'s most remote regions presents unique risks. A comprehensive risk management framework has been developed to identify, assess, and mitigate the key operational, environmental, and commercial risks facing the business.');

  writeBody('The store\u2019s operation strengthens community resilience by ensuring essential supplies remain available regardless of external economic conditions. A locally owned and operated store is far more dependable than reliance on external providers who may withdraw services if profitability declines.');

  drawTable(
    ['Risk', 'Likelihood', 'Impact', 'Mitigation Strategy'],
    [
      ['Wet season road closure', 'High', 'High', 'Pre-season stock build-up (3-month buffer), contracted barge freight, emergency air freight capability, close monitoring of weather and road conditions'],
      ['Freight cost increases', 'Medium', 'Medium', 'Bulk ordering discounts via Campbell\'s, fixed-rate freight agreements where possible, alternative carrier options, fuel hedging'],
      ['Staff turnover', 'Medium', 'Medium', 'Above-Award wages, genuine local employment, comprehensive training, flexible scheduling for cultural obligations, career pathways'],
      ['Stock spoilage (cold chain)', 'Medium', 'Medium', 'Digital temperature monitoring with SMS alerts, backup generator, FIFO stock rotation, conservative ordering of perishables, insurance coverage'],
      ['Natural disaster (cyclone)', 'Low', 'Critical', 'Comprehensive insurance, cyclone-rated building works, emergency supply protocols, registered with Qld disaster management'],
      ['Supplier disruption', 'Low', 'High', 'Maintain relationship with secondary supplier, pre-season buffer stocking, emergency air freight from Thursday Island or Cairns'],
      ['Competition', 'Low', 'Low', 'Only store in community, deep community relationships, essential service, strong supplier partnership'],
      ['Economic downturn', 'Low', 'Low', 'Essential goods retail is recession-resistant; stable needs-based demand regardless of economic conditions'],
    ],
    [34, 21, 17, CW - 72]
  );

  // ─── 12. Community Impact and Social Outcomes ─────────────────────────────
  sectionHeading(12, 'Community Impact and Social Outcomes');

  writeBody('Seisia Groceries is more than a retail business. It is an essential community service and a vehicle for Indigenous economic empowerment. The community impact extends well beyond the provision of groceries and touches on economic development, health outcomes, social wellbeing, and cultural strengthening. Every aspect of this enterprise has been designed with community benefit as the primary measure of success.');

  subHeading('Jobs');
  writeBody('4\u20136 local Indigenous positions will be created \u2014 in a community of 260 people, this is transformative. These are not just jobs; they are pathways to economic independence, skill development, and community leadership.');
  writeBullet('All positions targeted for 100% Aboriginal and Torres Strait Islander employment');
  writeBullet('Estimated $180,000+ in local wages paid annually, significantly boosting household incomes');
  writeBullet('Reduces welfare dependency through meaningful, locally based employment');
  writeBullet('Every position filled locally is one less person needing to leave community for work');
  writeBullet('Creates a foundation for future business development and additional job creation (fuel, takeaway food, delivery services)');

  subHeading('Food Security');
  writeBody('Reliable access to fresh, affordable food \u2014 reducing reliance on expensive freight alternatives and the need for costly travel to Bamaga or Thursday Island for basic supplies.');
  writeBullet('Reliable access to fresh, nutritious, and affordable food for 260+ Seisia residents');
  writeBullet('Reduced cost of living \u2014 local availability eliminates the need for expensive travel to Bamaga (5km, but inaccessible without transport) or Thursday Island for basic groceries');
  writeBullet('Pre-season stocking ensures supply continuity through wet season road closures');
  writeBullet('Reduced reliance on takeaway food and expensive, nutritionally poor alternatives');

  subHeading('Health Outcomes');
  writeBody('Access to fresh fruit and vegetables supports Closing the Gap health targets. Remote Indigenous communities have significantly higher rates of diabetes, cardiovascular disease, and obesity linked to poor food access. Seisia Groceries directly addresses this crisis.');
  writeBullet('Increased access to fresh produce, lean protein, and healthy staples');
  writeBullet('Active promotion and prominent placement of healthy food options');
  writeBullet('Collaboration with local health services on community nutrition programs');
  writeBullet('Reduced margins on essential healthy staples to encourage healthier eating patterns');

  subHeading('Economic Multiplier');
  writeBody('Money spent at an Indigenous-owned store circulates within the community rather than flowing to external corporate retailers. This creates a multiplier effect that benefits the entire community.');
  writeBullet('Wages paid to local staff are spent locally, further stimulating the community economy');
  writeBullet('Builds Indigenous economic capability, business skills, and financial literacy through hands-on employment');
  writeBullet('Demonstrates a viable, replicable model for Indigenous community enterprise in remote Australia');

  subHeading('Skills Development');
  writeBody('Retail and business skills built locally, creating transferable capabilities that serve individuals and the community for the long term.');
  writeBullet('Formal training pathways: shop assistant \u2192 supervisor \u2192 store manager');
  writeBullet('Nationally recognised qualifications in food safety, retail operations, and customer service');
  writeBullet('Skills transfer: retail operations, food safety certification, stock management, customer service, basic accounting');

  subHeading('Youth Engagement');
  writeBody('Providing meaningful employment pathways for young people, reducing disengagement and creating positive futures.');
  writeBullet('Work experience placements and school-based traineeships for NPA youth');
  writeBullet('Visible role models \u2014 young people see community members running a successful business');
  writeBullet('Early engagement with employment reduces long-term welfare dependency');

  subHeading('Cultural Pride');
  writeBody('A community-owned store is a source of pride and demonstrates Indigenous economic capability. It reinforces that remote communities can successfully own and operate essential services.');
  writeBullet('Operated by and for the community, reflecting local values, priorities, and cultural protocols');
  writeBullet('Supports cultural practices by enabling local sourcing of supplies for community events, ceremonies, and cultural gatherings');
  writeBullet('Strengthens community self-determination and pride in local enterprise');
  writeBullet('Preserves the connection between economic activity and cultural identity');

  subHeading('Model for Replication');
  writeBody('Successful operation of Seisia Groceries creates a template for other remote Indigenous communities seeking to establish community-owned essential services. The learnings, systems, supplier relationships, and operational frameworks developed here can be adapted and replicated across Cape York, the Torres Strait, and beyond.');

  subHeading('Closing the Gap Alignment');
  writeBody('Seisia Groceries directly contributes to the following Closing the Gap targets and priority reforms:');
  curY += 2;
  writeBulletBold('Target 7', 'Youth engagement in employment, education, or training \u2014 through youth work experience, school-based traineeships, and visible employment pathways');
  writeBulletBold('Target 8', 'Strong economic participation and development \u2014 through Indigenous employment, local wages, and community economic activity');
  writeBulletBold('Target 14', 'Families and households meeting basic needs (including food security) \u2014 through reliable access to affordable, nutritious food');
  writeBulletBold('Target 1', 'Aboriginal and Torres Strait Islander people enjoy long and healthy lives \u2014 through improved food access, nutrition, and health outcomes');
  writeBulletBold('Priority Reform 2', 'Building the community-controlled sector \u2014 a locally owned and operated essential service that strengthens the Indigenous community-controlled economy');

  // ─── 13. Sustainability and Growth ────────────────────────────────────────
  sectionHeading(13, 'Sustainability and Growth');

  writeBody('The business has been designed for long-term sustainability, not short-term profit. The growth pathway is deliberate, building capability and infrastructure incrementally over three years and beyond.');

  subHeading('Year 1 \u2014 Establish and Stabilise (Jul 2026 \u2013 Jun 2027)');
  writeBullet('Complete store fit-out and commence operations (target: soft open Month 2, full operations Month 3)');
  writeBullet('Build customer base and establish purchasing patterns');
  writeBullet('Refine supply chain and freight logistics for both dry and wet seasons');
  writeBullet('Recruit and train all staff to competency in retail operations and food safety');
  writeBullet('Achieve monthly break-even by Month 7\u20138');
  writeBullet('Establish community feedback mechanisms and quarterly product reviews');

  subHeading('Year 2 \u2014 Expand and Improve (Jul 2027 \u2013 Jun 2028)');
  writeBullet('Expand product range based on community feedback and sales data');
  writeBullet('Introduce phone/online ordering for surrounding NPA communities with local delivery');
  writeBullet('Improve fresh produce access through optimised ordering and enhanced cold chain');
  writeBullet('Develop senior staff into supervisory and deputy management roles');
  writeBullet('Target 8% revenue growth through range expansion and tourism capture');
  writeBullet('Explore partnership with health organisations for community nutrition programs');

  subHeading('Year 3 \u2014 Diversify and Strengthen (Jul 2028 \u2013 Jun 2029)');
  writeBullet('Explore additional services: fuel (subject to licensing), takeaway food, postal services');
  writeBullet('Formal partnership with health organisations for nutrition and healthy eating programs');
  writeBullet('Investigate solar power installation to reduce energy costs (significant savings in a remote area)');
  writeBullet('Evaluate expansion or upgrade of store premises based on demand');
  writeBullet('Target 15% revenue growth from diversification and surrounding community delivery');
  writeBullet('Develop succession planning for the Store Manager role');

  subHeading('Long-term Vision');
  writeBody('Beyond the initial three-year plan, Pristine Projects envisions Seisia Groceries as a model for Indigenous community enterprise \u2014 a demonstration that remote communities can sustainably operate their own essential services, create meaningful local employment, and build economic independence. The learnings from this enterprise may inform similar projects in other remote communities across Cape York and the Torres Strait.');

  // ─── 14. Appendices ───────────────────────────────────────────────────────
  sectionHeading(14, 'Appendices');

  writeBody('The following supporting documents are available upon request:');
  curY += 3;
  writeBulletBold('Appendix A', 'Campbell\'s Wholesale supplier relationship confirmation and account details');
  writeBulletBold('Appendix B', 'ORIC registration details (ICN 9086) and ABN confirmation');
  writeBulletBold('Appendix C', 'Director profile \u2014 Alex Wymarra');
  writeBulletBold('Appendix D', 'Letters of support from community organisations and NPA Regional Council');
  writeBulletBold('Appendix E', '36-Month Cashflow Projections (separate document)');
  writeBulletBold('Appendix F', 'Store premises photographs and renovation scope');

  // ─── Version table ────────────────────────────────────────────────────────
  curY += 12;
  ensureSpace(35);
  subHeading('Document Control');
  drawTable(
    ['Version', 'Date', 'Author', 'Notes'],
    [
      ['2.0', 'June 2026', 'Pristine Projects ATSI Corporation', 'Revised business plan with updated funding structure'],
    ],
    [25, 30, 60, CW - 115]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // FILL IN TOC (page 2) AND ADD FOOTERS
  // ═══════════════════════════════════════════════════════════════════════════
  const totalPages = currentPageNum;

  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(p);
  }

  doc.setPage(2);
  let tocY = tocYStart;
  doc.setFontSize(11);

  for (const entry of tocEntries) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_TEXT);
    const label = `${entry.number}. ${entry.text}`;
    doc.text(label, ML + 5, tocY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GREY_TEXT);
    doc.text(String(entry.page), PAGE_W - MR, tocY, { align: 'right' });

    const labelW = doc.getTextWidth(label);
    const dotsStart = ML + 5 + labelW + 3;
    const dotsEnd = PAGE_W - MR - 10;
    doc.setFontSize(8);
    let dotX = dotsStart;
    while (dotX < dotsEnd) {
      doc.text('.', dotX, tocY);
      dotX += 2;
    }
    doc.setFontSize(11);

    tocY += 9;
  }

  const buf = doc.output('arraybuffer');
  fs.writeFileSync(BP_OUTPUT, Buffer.from(buf));
  console.log(`Business Plan saved to: ${BP_OUTPUT}`);
  console.log(`  Total pages: ${totalPages}`);
  console.log(`  Sections: ${tocEntries.length}`);
}

// =============================================================================
// DOCUMENT 2: CASHFLOW PROJECTIONS
// =============================================================================

function createCashflowProjections() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let curY = 30;
  let currentPageNum = 1;
  let isCoverPage = true;
  let currentOrientation = 'portrait';

  const L_ML = 15;
  const L_MR = 15;

  function pw() { return currentOrientation === 'landscape' ? 297 : 210; }
  function ph() { return currentOrientation === 'landscape' ? 210 : 297; }
  function cw() { return pw() - L_ML - L_MR; }

  function drawHeader() {
    if (isCoverPage) return;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...OCHRE);
    doc.text('PRISTINE PROJECTS ATSI CORPORATION', L_ML, 12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GREY_TEXT);
    doc.text('Cashflow Projections', pw() - L_MR, 12, { align: 'right' });
    doc.setDrawColor(210, 200, 185);
    doc.setLineWidth(0.3);
    doc.line(L_ML, 15, pw() - L_MR, 15);
  }

  function drawFooter(pageNum) {
    if (pageNum <= 1) return;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GREY_TEXT);
    doc.text(`Page ${pageNum}`, pw() - L_MR, ph() - 8, { align: 'right' });
    doc.text('Confidential', L_ML, ph() - 8);
  }

  function newPage(orientation = 'portrait') {
    if (orientation === 'landscape') {
      doc.addPage('a4', 'landscape');
      currentOrientation = 'landscape';
    } else {
      doc.addPage('a4', 'portrait');
      currentOrientation = 'portrait';
    }
    currentPageNum++;
    isCoverPage = false;
    drawHeader();
    curY = 22;
  }

  function ensureSpace(needed) {
    if (curY + needed > ph() - 20) {
      newPage(currentOrientation);
    }
  }

  function setBody() {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DARK_TEXT);
  }

  function writeBody(text) {
    setBody();
    const maxW = cw();
    const lines = doc.splitTextToSize(text, maxW);
    const lineH = 5;
    for (const line of lines) {
      ensureSpace(lineH + 1);
      doc.text(line, L_ML, curY);
      curY += lineH;
    }
    curY += 2;
  }

  function writeBullet(text) {
    setBody();
    const bulletX = L_ML + 4;
    const textX = bulletX + 4;
    const maxW = pw() - textX - L_MR;
    const lines = doc.splitTextToSize(text, maxW);
    const lineH = 5;
    ensureSpace(lines.length * lineH + 2);
    doc.setTextColor(...GREY_TEXT);
    doc.text('\u2022', bulletX, curY);
    doc.setTextColor(...DARK_TEXT);
    for (const line of lines) {
      doc.text(line, textX, curY);
      curY += lineH;
    }
    curY += 1;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COVER PAGE (portrait)
  // ═══════════════════════════════════════════════════════════════════════════
  isCoverPage = true;
  currentPageNum = 1;

  // Logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 105 - 20, 25, 40, 40);
    } catch (e) {
      console.warn('Could not embed logo:', e.message);
    }
  }

  curY = 72;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...OCHRE);
  doc.text('PRISTINE PROJECTS', 105, curY, { align: 'center' });
  curY += 7;
  doc.text('ABORIGINAL AND TORRES STRAIT ISLANDER', 105, curY, { align: 'center' });
  curY += 7;
  doc.text('CORPORATION', 105, curY, { align: 'center' });

  curY += 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...DARK_TEXT);
  doc.text('Seisia Groceries', 105, curY, { align: 'center' });

  curY += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.setTextColor(...GREY_TEXT);
  doc.text('36-Month Cashflow Projections', 105, curY, { align: 'center' });

  curY += 12;
  doc.setDrawColor(...OCHRE);
  doc.setLineWidth(0.8);
  doc.line(60, curY, 150, curY);

  curY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...OCHRE);
  doc.text('Confidential Financial Projections', 105, curY, { align: 'center' });

  curY += 25;
  const metaX2 = 50;
  const metaValX2 = 90;
  doc.setFontSize(10);
  for (const [label, value] of [
    ['Prepared By:', 'Pristine Projects ATSI Corporation'],
    ['Director:', 'Alex Wymarra'],
    ['ABN:', '78 550 135 630'],
    ['ICN:', '9086'],
    ['Registered:', '24 June 2019 (CATSI Act 2006)'],
    ['Store Location:', 'Tumema Street, Seisia QLD 4876'],
    ['Prepared:', 'June 2026'],
  ]) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREY_TEXT);
    doc.text(label, metaX2, curY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_TEXT);
    doc.text(value, metaValX2, curY);
    curY += 7;
  }

  curY = 297 - 40;
  doc.setDrawColor(210, 200, 185);
  doc.setLineWidth(0.3);
  doc.line(50, curY, 160, curY);
  curY += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text('Tumema Street, Seisia QLD 4876', 105, curY, { align: 'center' });
  curY += 5;
  doc.text('Cape York Peninsula, Far North Queensland', 105, curY, { align: 'center' });
  curY += 5;
  doc.text('ABN: 78 550 135 630  |  ICN: 9086  |  CATSI Act Corporation', 105, curY, { align: 'center' });

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSUMPTIONS PAGE (portrait)
  // ═══════════════════════════════════════════════════════════════════════════
  newPage('portrait');

  curY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...OCHRE);
  doc.text('Key Assumptions', L_ML, curY);
  curY += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...TEAL);
  doc.text('Revenue Assumptions', L_ML, curY);
  curY += 7;

  writeBullet('Base monthly revenue: $85,000 (Year 1), growing to $95,000 (Year 2) and $110,000 (Year 3)');
  writeBullet('Seasonal variation: +15% during dry season / tourist season (May\u2013October)');
  writeBullet('Seasonal variation: -10% during wet season (November\u2013April)');
  writeBullet('Months 1\u20132: reduced revenue during ramp-up (50% and 75% of base respectively)');
  writeBullet('Revenue growth driven by expanded product range, tourism capture, and delivery to surrounding communities');

  curY += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...TEAL);
  doc.text('Cost of Goods and Freight', L_ML, curY);
  curY += 7;

  writeBullet('Cost of Goods Sold (COGS): 52% of revenue (wholesale cost of products ex-freight)');
  writeBullet('Freight: 12% of revenue during dry season (road transport), 15% of revenue during wet season (barge transport)');
  writeBullet('Combined COGS + freight: approximately 64\u201367% of revenue');
  writeBullet('Gross margin (revenue less COGS, before freight): approximately 48%');
  writeBullet('Net gross margin (revenue less COGS and freight): approximately 33\u201336%');

  curY += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...TEAL);
  doc.text('Operating Cost Assumptions', L_ML, curY);
  curY += 7;

  writeBullet('Wages: $15,000/month Year 1, increasing ~3% annually (4\u20136 staff at Retail Award + remote loading)');
  writeBullet('Rent / Occupancy: $2,000/month (with modest annual increases)');
  writeBullet('Utilities: $1,500/month (remote area premium on electricity and water)');
  writeBullet('Insurance: $1,000/month (business, stock, vehicle, public liability, workers compensation)');
  writeBullet('Other operating costs: $2,500/month (maintenance, admin, POS fees, phone/internet, accounting)');
  writeBullet('Finance costs: $3,000/month (based on $150K funding at concessional rate)');

  curY += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...TEAL);
  doc.text('Capital Expenditure (Front-loaded)', L_ML, curY);
  curY += 7;

  writeBullet('Month 1: $200,000 (renovation $120K, refrigeration $80K)');
  writeBullet('Month 2: $100,000 (initial stock purchase $100K)');
  writeBullet('Month 3: $50,000 (transport/logistics $50K)');
  writeBullet('Total capital expenditure: $350,000 (from $450K total; remaining $100K retained as working capital reserve)');

  curY += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...TEAL);
  doc.text('Funding Structure', L_ML, curY);
  curY += 7;

  writeBullet('Opening cash balance: $300,000 (Corporation\'s own capital)');
  writeBullet('Month 1 funding injection: $150,000 (external funding)');
  writeBullet('Total available: $450,000');
  writeBullet('Capital deployment: $350,000 across months 1\u20133');
  writeBullet('Working capital reserve: $100,000 held as operational buffer');

  curY += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...TEAL);
  doc.text('Other Assumptions', L_ML, curY);
  curY += 7;

  writeBullet('Opening cash balance of $300,000 (own capital) plus $150,000 funding injection in Month 1');
  writeBullet('Capital expenditure shown separately in the tables');
  writeBullet('Operating cashflow = Revenue less all operating costs (COGS, freight, wages, rent, utilities, insurance, other, finance)');
  writeBullet('Wage increases of approximately 3% per year from Year 2');
  writeBullet('Insurance and rent reviewed annually with modest CPI-linked increases');
  writeBullet('Finance costs based on $150,000 funding only (not on own capital)');

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERATE MONTHLY DATA
  // ═══════════════════════════════════════════════════════════════════════════

  const startMonth = 6; // July (0-indexed)
  const startYear = 2026;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Wet months: Nov(10), Dec(11), Jan(0), Feb(1), Mar(2), Apr(3)
  const wetMonths = [0, 1, 2, 3, 10, 11];
  const dryMonths = [4, 5, 6, 7, 8, 9];

  function getMonthLabel(idx) {
    const m = (startMonth + idx) % 12;
    const y = startYear + Math.floor((startMonth + idx) / 12);
    return `${monthNames[m]} ${String(y).slice(2)}`;
  }
  function getCalMonth(idx) {
    return (startMonth + idx) % 12;
  }

  const monthlyData = [];
  let cumOperatingCashflow = 0;
  let cumTotalCashflow = 0;
  // Opening cash balance: $300K own capital
  let cashBalance = 300000;

  for (let i = 0; i < 36; i++) {
    const calMonth = getCalMonth(i);
    const yearNum = i < 12 ? 1 : (i < 24 ? 2 : 3);

    // Funding injection in Month 1
    let fundingInjection = 0;
    if (i === 0) fundingInjection = 150000;

    // Base revenue
    let baseRev = yearNum === 1 ? 85000 : (yearNum === 2 ? 95000 : 110000);
    if (i === 0) baseRev *= 0.50;
    else if (i === 1) baseRev *= 0.75;

    // Seasonal
    let sf = 1.0;
    if (dryMonths.includes(calMonth)) sf = 1.15;
    else if (wetMonths.includes(calMonth)) sf = 0.90;

    const revenue = Math.round(baseRev * sf);

    // COGS = 52% of revenue (wholesale cost, ex-freight)
    const cogs = Math.round(revenue * 0.52);

    // Freight = 12% dry, 15% wet (of revenue)
    const freightRate = wetMonths.includes(calMonth) ? 0.15 : 0.12;
    const freight = Math.round(revenue * freightRate);

    const grossProfit = revenue - cogs - freight;

    // Operating costs
    const wages = Math.round(yearNum === 1 ? 15000 : (yearNum === 2 ? 15450 : 15914));
    const rent = Math.round(yearNum === 1 ? 2000 : (yearNum === 2 ? 2060 : 2122));
    const utilities = Math.round(yearNum === 1 ? 1500 : (yearNum === 2 ? 1545 : 1591));
    const insurance = Math.round(yearNum === 1 ? 1000 : (yearNum === 2 ? 1030 : 1061));
    const otherOp = Math.round(yearNum === 1 ? 2500 : (yearNum === 2 ? 2575 : 2652));
    const financeCosts = 3000; // $3K/month based on $150K funding

    const totalOpex = wages + rent + utilities + insurance + otherOp + financeCosts;
    const operatingCashflow = grossProfit - totalOpex;

    // Capital expenditure ($350K total across months 1-3)
    let capex = 0;
    if (i === 0) capex = 200000;       // renovation $120K + refrigeration $80K
    else if (i === 1) capex = 100000;   // initial stock $100K
    else if (i === 2) capex = 50000;    // transport/logistics $50K

    const netCashflow = operatingCashflow - capex + fundingInjection;
    cumOperatingCashflow += operatingCashflow;
    cumTotalCashflow += netCashflow;

    // Track cash balance
    cashBalance += fundingInjection + revenue - cogs - freight - totalOpex - capex;

    monthlyData.push({
      month: i + 1,
      label: getMonthLabel(i),
      fundingInjection,
      revenue,
      cogs,
      freight,
      grossProfit,
      wages,
      rent,
      utilities,
      insurance,
      otherOp,
      financeCosts,
      totalOpex,
      operatingCashflow,
      capex,
      netCashflow,
      cumOperatingCashflow,
      cumTotalCashflow,
      cashBalance,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // YEAR TABLES (landscape)
  // ═══════════════════════════════════════════════════════════════════════════

  function formatNum(n) {
    if (n === 0) return '\u2013';
    const abs = Math.abs(n);
    let formatted;
    if (abs >= 1000000) formatted = (abs / 1000000).toFixed(2) + 'M';
    else if (abs >= 1000) formatted = (abs / 1000).toFixed(1) + 'k';
    else formatted = String(abs);
    return n < 0 ? `(${formatted})` : `$${formatted}`;
  }

  function drawYearTable(yearLabel, startIdx, endIdx) {
    newPage('landscape');
    const _pw = 297;
    const ml = 8;
    const mr = 8;

    curY = 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...OCHRE);
    doc.text(`${yearLabel} \u2014 Monthly Cashflow ($AUD)`, ml, curY);
    curY += 7;

    const months = monthlyData.slice(startIdx, endIdx);
    const numMonths = months.length;

    const labelColW = 30;
    const monthColW = (_pw - ml - mr - labelColW) / numMonths;

    const rowLabels = [
      { key: 'revenue', label: 'Revenue', bold: false, highlight: false },
      { key: 'cogs', label: 'COGS (52%)', bold: false, highlight: false },
      { key: 'freight', label: 'Freight', bold: false, highlight: false },
      { key: 'grossProfit', label: 'Gross Profit', bold: true, highlight: true },
      { key: 'wages', label: 'Wages', bold: false, highlight: false },
      { key: 'rent', label: 'Rent', bold: false, highlight: false },
      { key: 'utilities', label: 'Utilities', bold: false, highlight: false },
      { key: 'insurance', label: 'Insurance', bold: false, highlight: false },
      { key: 'otherOp', label: 'Other Operating', bold: false, highlight: false },
      { key: 'financeCosts', label: 'Finance Costs', bold: false, highlight: false },
      { key: 'totalOpex', label: 'Total Opex', bold: true, highlight: true },
      { key: 'operatingCashflow', label: 'Operating CF', bold: true, highlight: true },
      { key: 'capex', label: 'Capital Expenditure', bold: false, highlight: false },
      { key: 'fundingInjection', label: 'Funding Injection', bold: false, highlight: false },
      { key: 'netCashflow', label: 'Net Cashflow', bold: true, highlight: true },
      { key: 'cumTotalCashflow', label: 'Cumulative CF', bold: true, highlight: true },
    ];

    const rowH = 9;
    const fontSize = 5.6;
    const headerH = 9;

    // Header
    doc.setFillColor(...TABLE_HEADER_BG);
    doc.rect(ml, curY, _pw - ml - mr, headerH, 'F');
    doc.setDrawColor(...TABLE_BORDER);
    doc.setLineWidth(0.2);
    doc.rect(ml, curY, _pw - ml - mr, headerH, 'S');

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TABLE_HEADER_TEXT);

    let hx = ml + labelColW;
    for (const m of months) {
      doc.text(m.label, hx + monthColW / 2, curY + 6, { align: 'center' });
      doc.line(hx, curY, hx, curY + headerH);
      hx += monthColW;
    }
    curY += headerH;

    // Rows
    for (const rd of rowLabels) {
      if (rd.highlight) {
        doc.setFillColor(254, 243, 224);
      } else {
        doc.setFillColor(...(rowLabels.indexOf(rd) % 2 === 0 ? LIGHT_GREY_BG : WHITE));
      }
      doc.rect(ml, curY, _pw - ml - mr, rowH, 'F');
      doc.setDrawColor(...TABLE_BORDER);
      doc.setLineWidth(0.15);
      doc.rect(ml, curY, _pw - ml - mr, rowH, 'S');

      // Label
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', rd.bold ? 'bold' : 'normal');
      doc.setTextColor(...DARK_TEXT);
      doc.text(rd.label, ml + 1.5, curY + 6);

      // Values
      let vx = ml + labelColW;
      for (const m of months) {
        const val = m[rd.key];
        if (val < 0) doc.setTextColor(180, 40, 40);
        else if ((rd.key === 'operatingCashflow' || rd.key === 'netCashflow') && val > 0) doc.setTextColor(20, 120, 50);
        else doc.setTextColor(...DARK_TEXT);

        doc.setFont('helvetica', rd.bold ? 'bold' : 'normal');
        doc.text(formatNum(val), vx + monthColW - 1.5, curY + 6, { align: 'right' });
        doc.setDrawColor(...TABLE_BORDER);
        doc.line(vx, curY, vx, curY + rowH);
        vx += monthColW;
      }
      curY += rowH;
    }
  }

  drawYearTable('Year 1 (Months 1\u201312)', 0, 12);
  drawYearTable('Year 2 (Months 13\u201324)', 12, 24);
  drawYearTable('Year 3 (Months 25\u201336)', 24, 36);

  // ═══════════════════════════════════════════════════════════════════════════
  // ANNUAL SUMMARY (portrait)
  // ═══════════════════════════════════════════════════════════════════════════
  newPage('portrait');

  curY = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...OCHRE);
  doc.text('Annual Summary', L_ML, curY);
  curY += 12;

  function sumYear(start, end, field) {
    return monthlyData.slice(start, end).reduce((s, m) => s + m[field], 0);
  }

  const annualData = [0, 1, 2].map(yi => {
    const s = yi * 12;
    const e = s + 12;
    return {
      year: `Year ${yi + 1}`,
      revenue: sumYear(s, e, 'revenue'),
      cogs: sumYear(s, e, 'cogs'),
      freight: sumYear(s, e, 'freight'),
      grossProfit: sumYear(s, e, 'grossProfit'),
      wages: sumYear(s, e, 'wages'),
      rent: sumYear(s, e, 'rent'),
      utilities: sumYear(s, e, 'utilities'),
      insurance: sumYear(s, e, 'insurance'),
      otherOp: sumYear(s, e, 'otherOp'),
      financeCosts: sumYear(s, e, 'financeCosts'),
      totalOpex: sumYear(s, e, 'totalOpex'),
      operatingCashflow: sumYear(s, e, 'operatingCashflow'),
      capex: sumYear(s, e, 'capex'),
      fundingInjection: sumYear(s, e, 'fundingInjection'),
      netCashflow: sumYear(s, e, 'netCashflow'),
    };
  });

  const total3yr = {};
  for (const k of Object.keys(annualData[0])) {
    if (k === 'year') { total3yr.year = '3-Year Total'; continue; }
    total3yr[k] = annualData.reduce((s, a) => s + a[k], 0);
  }

  function fmtDollar(n) {
    const neg = n < 0;
    const abs = Math.abs(n);
    const str = '$' + abs.toLocaleString('en-AU');
    return neg ? `(${str})` : str;
  }

  // Annual table
  const aColW = [42, 34, 34, 34, 36];
  const aTotalW = aColW.reduce((a, b) => a + b, 0);
  const aRowH = 9;
  const aFontSize = 8.5;
  const aPad = 2;

  // Header
  let ax = L_ML;
  doc.setFillColor(...TABLE_HEADER_BG);
  doc.rect(ax, curY, aTotalW, aRowH, 'F');
  doc.setDrawColor(...TABLE_BORDER);
  doc.setLineWidth(0.2);
  doc.rect(ax, curY, aTotalW, aRowH, 'S');
  doc.setFontSize(aFontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TABLE_HEADER_TEXT);

  const aHeaders = ['', 'Year 1', 'Year 2', 'Year 3', '3-Year Total'];
  for (let hi = 0; hi < aHeaders.length; hi++) {
    if (hi > 0) doc.line(ax, curY, ax, curY + aRowH);
    if (hi === 0) doc.text(aHeaders[hi], ax + aPad, curY + 6);
    else doc.text(aHeaders[hi], ax + aColW[hi] - aPad, curY + 6, { align: 'right' });
    ax += aColW[hi];
  }
  curY += aRowH;

  const rowDefs = [
    { label: 'Revenue', field: 'revenue', bold: false, hl: false },
    { label: 'COGS', field: 'cogs', bold: false, hl: false },
    { label: 'Freight', field: 'freight', bold: false, hl: false },
    { label: 'Gross Profit', field: 'grossProfit', bold: true, hl: true },
    { label: 'Wages', field: 'wages', bold: false, hl: false },
    { label: 'Rent', field: 'rent', bold: false, hl: false },
    { label: 'Utilities', field: 'utilities', bold: false, hl: false },
    { label: 'Insurance', field: 'insurance', bold: false, hl: false },
    { label: 'Other Operating', field: 'otherOp', bold: false, hl: false },
    { label: 'Finance Costs', field: 'financeCosts', bold: false, hl: false },
    { label: 'Total Opex', field: 'totalOpex', bold: true, hl: true },
    { label: 'Operating Cashflow', field: 'operatingCashflow', bold: true, hl: true },
    { label: 'Capital Expenditure', field: 'capex', bold: false, hl: false },
    { label: 'Funding Injection', field: 'fundingInjection', bold: false, hl: false },
    { label: 'Net Cashflow', field: 'netCashflow', bold: true, hl: true },
  ];

  for (const rd of rowDefs) {
    const vals = [...annualData.map(a => a[rd.field]), total3yr[rd.field]];
    let rx = L_ML;

    if (rd.hl) {
      doc.setFillColor(254, 243, 224);
      doc.rect(rx, curY, aTotalW, aRowH, 'F');
    } else if (rowDefs.indexOf(rd) % 2 === 0) {
      doc.setFillColor(...LIGHT_GREY_BG);
      doc.rect(rx, curY, aTotalW, aRowH, 'F');
    }

    doc.setDrawColor(...TABLE_BORDER);
    doc.setLineWidth(0.15);
    doc.rect(rx, curY, aTotalW, aRowH, 'S');

    doc.setFontSize(aFontSize);
    doc.setFont('helvetica', rd.bold ? 'bold' : 'normal');
    doc.setTextColor(...DARK_TEXT);
    doc.text(rd.label, rx + aPad, curY + 6);
    rx += aColW[0];

    for (let vi = 0; vi < vals.length; vi++) {
      doc.line(rx, curY, rx, curY + aRowH);
      const v = vals[vi];
      if (v < 0) doc.setTextColor(180, 40, 40);
      else doc.setTextColor(...DARK_TEXT);
      doc.setFont('helvetica', rd.bold ? 'bold' : 'normal');
      doc.text(fmtDollar(v), rx + aColW[vi + 1] - aPad, curY + 6, { align: 'right' });
      rx += aColW[vi + 1];
    }
    curY += aRowH;
  }

  curY += 6;

  // Margin percentages
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...GREY_TEXT);
  for (let yi = 0; yi < 3; yi++) {
    const gm = ((annualData[yi].grossProfit / annualData[yi].revenue) * 100).toFixed(1);
    const nm = ((annualData[yi].operatingCashflow / annualData[yi].revenue) * 100).toFixed(1);
    doc.text(`Year ${yi + 1}: Gross Margin ${gm}%  |  Operating Margin ${nm}%`, L_ML, curY);
    curY += 5;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // KEY METRICS PAGE (portrait)
  // ═══════════════════════════════════════════════════════════════════════════
  newPage('portrait');

  curY = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...OCHRE);
  doc.text('Key Financial Metrics', L_ML, curY);
  curY += 14;

  // Find first profitable operating month
  let firstProfitMonth = 'N/A';
  for (let i = 0; i < 36; i++) {
    if (monthlyData[i].operatingCashflow > 0) {
      firstProfitMonth = `Month ${i + 1} (${monthlyData[i].label})`;
      break;
    }
  }

  // Find cumulative operating break-even
  let cumBreakeven = 'Beyond 36 months';
  for (let i = 0; i < 36; i++) {
    if (monthlyData[i].cumOperatingCashflow > 0) {
      cumBreakeven = `Month ${i + 1} (${monthlyData[i].label})`;
      break;
    }
  }

  // Find cumulative total break-even (incl capex)
  let cumTotalBreakeven = 'Beyond 36 months';
  for (let i = 0; i < 36; i++) {
    if (monthlyData[i].cumTotalCashflow > 0) {
      cumTotalBreakeven = `Month ${i + 1} (${monthlyData[i].label})`;
      break;
    }
  }

  const metrics = [
    ['First Profitable Operating Month', firstProfitMonth],
    ['Cumulative Operating Break-even', cumBreakeven],
    ['Cumulative Total Break-even (incl. capex)', cumTotalBreakeven],
    ['', ''],
    ['Opening Cash Balance (Own Capital)', fmtDollar(300000)],
    ['External Funding Received', fmtDollar(150000)],
    ['Total Available', fmtDollar(450000)],
    ['', ''],
    ['Year 1 Total Revenue', fmtDollar(annualData[0].revenue)],
    ['Year 2 Total Revenue', fmtDollar(annualData[1].revenue)],
    ['Year 3 Total Revenue', fmtDollar(annualData[2].revenue)],
    ['3-Year Total Revenue', fmtDollar(total3yr.revenue)],
    ['', ''],
    ['Year 1 Gross Margin', ((annualData[0].grossProfit / annualData[0].revenue) * 100).toFixed(1) + '%'],
    ['Year 2 Gross Margin', ((annualData[1].grossProfit / annualData[1].revenue) * 100).toFixed(1) + '%'],
    ['Year 3 Gross Margin', ((annualData[2].grossProfit / annualData[2].revenue) * 100).toFixed(1) + '%'],
    ['', ''],
    ['Year 1 Operating Cashflow', fmtDollar(annualData[0].operatingCashflow)],
    ['Year 2 Operating Cashflow', fmtDollar(annualData[1].operatingCashflow)],
    ['Year 3 Operating Cashflow', fmtDollar(annualData[2].operatingCashflow)],
    ['3-Year Operating Cashflow', fmtDollar(total3yr.operatingCashflow)],
    ['', ''],
    ['Total Capital Expenditure', fmtDollar(total3yr.capex)],
    ['Total Finance Costs (36 months)', fmtDollar(total3yr.financeCosts)],
    ['Cumulative Net Cashflow at Month 36', fmtDollar(monthlyData[35].cumTotalCashflow)],
    ['Cash Balance at Month 36', fmtDollar(monthlyData[35].cashBalance)],
    ['', ''],
    ['Jobs Created', '4\u20136 positions (100% Indigenous employment target)'],
    ['Revenue Per Capita (Seisia, Year 1)', fmtDollar(Math.round(annualData[0].revenue / 260)) + ' per person'],
  ];

  const mColWidths2 = [90, cw() - 90];
  const mTotalW = mColWidths2[0] + mColWidths2[1];

  // Header
  let mx = L_ML;
  doc.setFillColor(...TABLE_HEADER_BG);
  doc.rect(mx, curY, mTotalW, 9, 'F');
  doc.setDrawColor(...TABLE_BORDER);
  doc.setLineWidth(0.2);
  doc.rect(mx, curY, mTotalW, 9, 'S');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TABLE_HEADER_TEXT);
  doc.text('Metric', mx + 3, curY + 6);
  doc.line(mx + mColWidths2[0], curY, mx + mColWidths2[0], curY + 9);
  doc.text('Value', mx + mColWidths2[0] + 3, curY + 6);
  curY += 9;

  let altIdx = 0;
  for (const [label, value] of metrics) {
    if (!label && !value) {
      curY += 2;
      altIdx = 0;
      continue;
    }
    const rH = 8;
    ensureSpace(rH + 1);
    if (altIdx % 2 === 0) {
      doc.setFillColor(...LIGHT_GREY_BG);
      doc.rect(L_ML, curY, mTotalW, rH, 'F');
    }
    doc.setDrawColor(...TABLE_BORDER);
    doc.setLineWidth(0.15);
    doc.rect(L_ML, curY, mTotalW, rH, 'S');
    doc.line(L_ML + mColWidths2[0], curY, L_ML + mColWidths2[0], curY + rH);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_TEXT);
    doc.text(label, L_ML + 3, curY + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(value, L_ML + mColWidths2[0] + 3, curY + 5.5);

    curY += rH;
    altIdx++;
  }

  curY += 10;

  // Notes
  ensureSpace(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEAL);
  doc.text('Important Notes', L_ML, curY);
  curY += 7;

  writeBody('These projections are based on conservative assumptions and reflect the unique operating environment of a remote community grocery store. Key variables that may impact actual performance include:');
  writeBullet('Freight cost fluctuations (fuel prices, barge availability and pricing during wet season)');
  writeBullet('Seasonal population variations (community members travelling, tourist numbers)');
  writeBullet('Government policy changes affecting remote community funding and services');
  writeBullet('Weather events (cyclones, extended wet seasons) impacting supply chain and freight costs');
  writeBullet('Changes to welfare payment schedules or levels affecting household spending capacity');

  writeBody('The projections do not account for potential additional revenue streams that may be introduced in Years 2\u20133, such as fuel sales, takeaway food, delivery services to surrounding communities, or postal services. These represent upside potential.');

  // Document control
  curY += 8;
  ensureSpace(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEAL);
  doc.text('Document Control', L_ML, curY);
  curY += 7;

  const vColW = [25, 28, 60, cw() - 113];
  const vTotalW = vColW.reduce((a, b) => a + b, 0);
  let vx = L_ML;

  doc.setFillColor(...TABLE_HEADER_BG);
  doc.rect(vx, curY, vTotalW, 8, 'F');
  doc.setDrawColor(...TABLE_BORDER);
  doc.setLineWidth(0.2);
  doc.rect(vx, curY, vTotalW, 8, 'S');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TABLE_HEADER_TEXT);
  for (const [hi, h] of ['Version', 'Date', 'Author', 'Notes'].entries()) {
    if (hi > 0) doc.line(vx, curY, vx, curY + 8);
    doc.text(h, vx + 2, curY + 5.5);
    vx += vColW[hi];
  }
  curY += 8;

  vx = L_ML;
  doc.setFillColor(...LIGHT_GREY_BG);
  doc.rect(vx, curY, vTotalW, 8, 'F');
  doc.setDrawColor(...TABLE_BORDER);
  doc.rect(vx, curY, vTotalW, 8, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK_TEXT);
  for (const [hi, val] of ['2.0', 'June 2026', 'Pristine Projects ATSI Corp.', 'Revised cashflow projections'].entries()) {
    if (hi > 0) doc.line(vx, curY, vx, curY + 8);
    doc.text(val, vx + 2, curY + 5.5);
    vx += vColW[hi];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTERS
  // ═══════════════════════════════════════════════════════════════════════════
  const totalPages = currentPageNum;

  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    const isLandscape = (p >= 3 && p <= 5);
    const fpw = isLandscape ? 297 : 210;
    const fph = isLandscape ? 210 : 297;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GREY_TEXT);
    doc.text(`Page ${p}`, fpw - L_MR, fph - 8, { align: 'right' });
    doc.text('Confidential', L_ML, fph - 8);
  }

  // Save
  const buf = doc.output('arraybuffer');
  fs.writeFileSync(CF_OUTPUT, Buffer.from(buf));
  console.log(`Cashflow Projections saved to: ${CF_OUTPUT}`);
  console.log(`  Total pages: ${totalPages}`);

  // Print summary
  console.log('\n  Annual Summary:');
  for (const a of annualData) {
    console.log(`    ${a.year}: Revenue ${fmtDollar(a.revenue)}, Gross Profit ${fmtDollar(a.grossProfit)}, Operating CF ${fmtDollar(a.operatingCashflow)}, Net CF ${fmtDollar(a.netCashflow)}`);
  }
  console.log(`    3-Year Total: Revenue ${fmtDollar(total3yr.revenue)}, Operating CF ${fmtDollar(total3yr.operatingCashflow)}, Net CF ${fmtDollar(total3yr.netCashflow)}`);
  console.log(`    Cumulative Net CF at Month 36: ${fmtDollar(monthlyData[35].cumTotalCashflow)}`);
  console.log(`    Cash Balance at Month 36: ${fmtDollar(monthlyData[35].cashBalance)}`);
  console.log(`    First profitable operating month: ${firstProfitMonth}`);
  console.log(`    Cumulative operating break-even: ${cumBreakeven}`);
}

// =============================================================================
// MAIN
// =============================================================================

console.log('Generating Seisia Groceries PDFs (v2)...\n');

try {
  createBusinessPlan();
  console.log('');
  createCashflowProjections();
  console.log('\nDone! Both PDFs saved to C:/Users/kevin/Downloads/');
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
