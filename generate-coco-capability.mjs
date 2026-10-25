import { jsPDF } from 'jspdf';
import { writeFileSync } from 'fs';

// ── Colors ──────────────────────────────────────────────
const NAVY = [6, 10, 20];          // #060A14
const GOLD = [201, 169, 110];      // #C9A96E
const WHITE = [255, 255, 255];
const LIGHT_GRAY = [245, 245, 245];
const MID_GRAY = [120, 120, 130];
const DARK_TEXT = [30, 30, 40];
const SECTION_BG = [250, 249, 247]; // warm off-white for alternating sections

// ── Page Setup ──────────────────────────────────────────
const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
const W = 210;
const H = 297;
const MARGIN = 16;
const CONTENT_W = W - MARGIN * 2;

// ── Helper: draw filled rect ────────────────────────────
function rect(x, y, w, h, color) {
  doc.setFillColor(...color);
  doc.rect(x, y, w, h, 'F');
}

// ── Helper: gold horizontal rule ────────────────────────
function goldRule(x, y, w, thickness = 0.5) {
  rect(x, y, w, thickness, GOLD);
}

// ── Helper: section title ───────────────────────────────
function sectionTitle(text, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...GOLD);
  doc.text(text.toUpperCase(), MARGIN, y);
  goldRule(MARGIN, y + 1.5, 30, 0.4);
  return y + 6;
}

// ══════════════════════════════════════════════════════════
//  HEADER — Dark navy banner
// ══════════════════════════════════════════════════════════
const HEADER_H = 44;
rect(0, 0, W, HEADER_H, NAVY);

// Gold accent line at very top
rect(0, 0, W, 1.2, GOLD);

// Company name
doc.setFont('helvetica', 'bold');
doc.setFontSize(22);
doc.setTextColor(...WHITE);
doc.text('COCO TRANSPORT SERVICES', MARGIN, 17);

// Tagline
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.setTextColor(...GOLD);
doc.text('Professional Fleet & Facility Cleaning Solutions', MARGIN, 25);

// Right-side badge: "Capability Statement"
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(...GOLD);
const badgeText = 'CAPABILITY STATEMENT';
const badgeW = doc.getTextWidth(badgeText) + 8;
const badgeX = W - MARGIN - badgeW;
const badgeY = 13;
doc.setDrawColor(...GOLD);
doc.setLineWidth(0.3);
doc.rect(badgeX, badgeY, badgeW, 7);
doc.text(badgeText, badgeX + 4, badgeY + 4.8);

// Bottom of header: gold accent strip
rect(0, HEADER_H - 1.2, W, 1.2, GOLD);

let y = HEADER_H + 7;

// ══════════════════════════════════════════════════════════
//  ABOUT US
// ══════════════════════════════════════════════════════════
y = sectionTitle('About Us', y);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(...DARK_TEXT);
const aboutText = 'Coco Transport Services is a multi-division Australian company specialising in professional fleet cleaning, aircraft cabin cleaning, premium car detailing, commercial facility cleaning, and transport logistics. Headquartered in Sydney with operations across four major cities, we deliver consistent, high-quality results backed by 15+ years of industry experience. Our trained, vetted crews operate 24/7 to keep fleets spotless and facilities pristine — earning the trust of Australia\'s leading operators, including Swissport International AG.';
const aboutLines = doc.splitTextToSize(aboutText, CONTENT_W);
doc.text(aboutLines, MARGIN, y);
y += aboutLines.length * 4 + 5;

// ══════════════════════════════════════════════════════════
//  KEY SERVICES — 2x3 grid
// ══════════════════════════════════════════════════════════
y = sectionTitle('Key Services', y);

const services = [
  { num: '01', title: 'Bus & Fleet Cleaning', desc: 'Interior deep clean, exterior wash, depot & facility cleaning for bus, coach and minibus fleets.' },
  { num: '02', title: 'Aircraft / Plane Cleaning', desc: 'Cabin interior, galley sanitisation, lavatory deep clean, and rapid turnaround services.' },
  { num: '03', title: 'Car Detailing & Ceramic Coating', desc: 'Full detailing, paint correction, nano-ceramic coating, and paint protection film.' },
  { num: '04', title: 'Rental Car Turnaround', desc: 'Fast interior/exterior clean between hires — vac, wipe-down, window clean, odour removal.' },
  { num: '05', title: 'Commercial / Office Cleaning', desc: 'Daily scheduled cleaning for offices, warehouses, retail, and laundromat facilities.' },
  { num: '06', title: 'Transport & Logistics', desc: 'Courier, heavy freight, tail lift services, pallet transport, and professional driver hire.' },
];

const GRID_COLS = 2;
const CARD_GAP = 4;
const CARD_W = (CONTENT_W - CARD_GAP) / GRID_COLS;
const CARD_H = 26;

services.forEach((s, i) => {
  const col = i % GRID_COLS;
  const row = Math.floor(i / GRID_COLS);
  const cx = MARGIN + col * (CARD_W + CARD_GAP);
  const cy = y + row * (CARD_H + CARD_GAP);

  // Card background
  rect(cx, cy, CARD_W, CARD_H, LIGHT_GRAY);

  // Gold left accent bar
  rect(cx, cy, 1.5, CARD_H, GOLD);

  // Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GOLD);
  doc.text(s.num, cx + 5, cy + 5.5);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text(s.title, cx + 12, cy + 5.5);

  // Description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MID_GRAY);
  const descLines = doc.splitTextToSize(s.desc, CARD_W - 16);
  doc.text(descLines, cx + 5, cy + 11);
});

y += Math.ceil(services.length / GRID_COLS) * (CARD_H + CARD_GAP) + 4;

// ══════════════════════════════════════════════════════════
//  KEY CLIENT — Swissport
// ══════════════════════════════════════════════════════════
y = sectionTitle('Key Client', y);

const clientBoxH = 16;
rect(MARGIN, y, CONTENT_W, clientBoxH, NAVY);
rect(MARGIN, y, 2, clientBoxH, GOLD); // gold left accent

doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...GOLD);
doc.text('Swissport International AG', MARGIN + 8, y + 6.5);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(...WHITE);
doc.text('Office cleaning, transport bus cleaning, and ground operations support across multiple Australian airports.', MARGIN + 8, y + 12);

y += clientBoxH + 7;

// ══════════════════════════════════════════════════════════
//  WHY CHOOSE US — 4 stats in a row
// ══════════════════════════════════════════════════════════
y = sectionTitle('Why Choose Us', y);

const stats = [
  { value: 'Fully Insured', sub: 'Public liability & vehicle coverage' },
  { value: '24/7 Operations', sub: 'Round-the-clock service' },
  { value: 'Licensed & Certified', sub: 'Accredited professionals' },
  { value: '10,000+', sub: 'Vehicles serviced' },
];

const STAT_W = (CONTENT_W - 3 * 3) / 4;
const STAT_H = 18;

stats.forEach((s, i) => {
  const sx = MARGIN + i * (STAT_W + 3);

  rect(sx, y, STAT_W, STAT_H, LIGHT_GRAY);
  goldRule(sx, y, STAT_W, 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  // Center the value text
  const valW = doc.getTextWidth(s.value);
  doc.text(s.value, sx + (STAT_W - valW) / 2, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...MID_GRAY);
  const subW = doc.getTextWidth(s.sub);
  doc.text(s.sub, sx + (STAT_W - subW) / 2, y + 13);
});

y += STAT_H + 7;

// ══════════════════════════════════════════════════════════
//  SERVICE AREAS
// ══════════════════════════════════════════════════════════
y = sectionTitle('Service Areas', y);

const areas = ['Sydney (HQ)', 'Melbourne', 'Brisbane', 'Adelaide', 'Greater Western Sydney', 'Wollongong'];
const AREA_GAP = 3;
let ax = MARGIN;

areas.forEach((area) => {
  const tw = doc.getTextWidth(area) * 1; // approximate at current font size
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  const pillW = doc.getTextWidth(area) + 8;
  const pillH = 7;

  rect(ax, y, pillW, pillH, LIGHT_GRAY);

  // Gold left dot
  doc.setFillColor(...GOLD);
  doc.circle(ax + 3, y + pillH / 2, 1, 'F');

  doc.setTextColor(...DARK_TEXT);
  doc.text(area, ax + 6, y + 4.8);

  ax += pillW + AREA_GAP;
});

y += 14;

// ══════════════════════════════════════════════════════════
//  FOOTER — Contact band
// ══════════════════════════════════════════════════════════
const FOOTER_H = 28;
const footerY = H - FOOTER_H;

// Gold line above footer
rect(0, footerY, W, 1, GOLD);

// Navy footer
rect(0, footerY + 1, W, FOOTER_H - 1, NAVY);

// Contact details — left side
const fy = footerY + 8;

doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(...GOLD);
doc.text('Contact Us', MARGIN, fy);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(...WHITE);

const contactLines = [
  'Phone:  +61 419 602 056',
  'Email:   enquire@cocotransportservices.com.au',
  'Office:  Level 6, Suite 38, 43 Bridge St, Hurstville NSW 2220',
];
contactLines.forEach((line, i) => {
  doc.text(line, MARGIN, fy + 5.5 + i * 4);
});

// Right side — ABN + Website
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(...GOLD);
doc.text('cocotransportservices.com.au', W - MARGIN, fy, { align: 'right' });

doc.setFont('helvetica', 'normal');
doc.setFontSize(7);
doc.setTextColor(...WHITE);
doc.text('ABN: 17 676 592 634', W - MARGIN, fy + 5.5, { align: 'right' });

doc.setFontSize(6.5);
doc.setTextColor(150, 150, 160);
doc.text('Coco Transport Services Pty. Ltd.', W - MARGIN, fy + 10, { align: 'right' });

// Bottom gold accent
rect(0, H - 1, W, 1, GOLD);

// ══════════════════════════════════════════════════════════
//  SAVE
// ══════════════════════════════════════════════════════════
const outputPath = 'C:/Users/kevin/OneDrive/Desktop/CLAUDE/Coco Transport - Capability Statement.pdf';
const buffer = doc.output('arraybuffer');
writeFileSync(outputPath, Buffer.from(buffer));
console.log(`PDF saved to: ${outputPath}`);
