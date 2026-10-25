import { jsPDF } from 'jspdf';
import { writeFileSync } from 'fs';

const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
const PW = 210, PH = 297;
const CX = PW / 2; // center X

// Colors
const NAVY = [26, 42, 58];
const TEAL = [13, 148, 136];
const AMBER = [245, 158, 11];
const GREEN = [22, 163, 74];
const RED = [220, 38, 38];
const BLUE = [37, 99, 235];
const PURPLE = [124, 58, 237];
const SLATE = [71, 85, 105];
const LIGHT_SLATE = [148, 163, 184];
const WHITE = [255, 255, 255];
const LIGHT_BG = [248, 250, 252];
const VERY_LIGHT = [241, 245, 249];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function drawRoundedBox(x, y, w, h, color, textLines, opts = {}) {
  const r = opts.radius || 3;
  pdf.setFillColor(...color);
  pdf.roundedRect(x, y, w, h, r, r, 'F');

  if (opts.border) {
    pdf.setDrawColor(...opts.border);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(x, y, w, h, r, r, 'S');
  }

  const textColor = opts.textColor || WHITE;
  pdf.setTextColor(...textColor);
  pdf.setFont('helvetica', opts.bold !== false ? 'bold' : 'normal');
  pdf.setFontSize(opts.fontSize || 8);

  const lineHeight = opts.lineHeight || 4;
  const totalTextH = textLines.length * lineHeight;
  let ty = y + (h - totalTextH) / 2 + lineHeight * 0.75;

  for (const line of textLines) {
    pdf.text(line, x + w / 2, ty, { align: 'center' });
    ty += lineHeight;
    // Switch to normal after first line if subtitle
    if (opts.subtitleAfterFirst) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize((opts.fontSize || 8) - 1);
      pdf.setTextColor(...(opts.subtitleColor || LIGHT_SLATE));
    }
  }
}

function drawArrow(fromX, fromY, toX, toY) {
  pdf.setDrawColor(...SLATE);
  pdf.setLineWidth(0.5);
  pdf.line(fromX, fromY, toX, toY);
  // Arrowhead
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headLen = 2.5;
  pdf.setFillColor(...SLATE);
  pdf.triangle(
    toX, toY,
    toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6),
    toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6),
    'F'
  );
}

function drawDiamond(cx, cy, w, h, color, textLines) {
  pdf.setFillColor(...color);
  pdf.setDrawColor(...color);
  // Draw diamond shape
  const points = [
    { x: cx, y: cy - h / 2 },
    { x: cx + w / 2, y: cy },
    { x: cx, y: cy + h / 2 },
    { x: cx - w / 2, y: cy },
  ];
  // Use lines to draw diamond
  pdf.setLineWidth(0);
  pdf.triangle(points[0].x, points[0].y, points[1].x, points[1].y, points[3].x, points[3].y, 'F');
  pdf.triangle(points[2].x, points[2].y, points[1].x, points[1].y, points[3].x, points[3].y, 'F');

  pdf.setTextColor(...WHITE);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  const lineH = 3.5;
  const totalH = textLines.length * lineH;
  let ty = cy - totalH / 2 + lineH * 0.75;
  for (const line of textLines) {
    pdf.text(line, cx, ty, { align: 'center' });
    ty += lineH;
  }
}

function drawSideLabel(x, y, text, color) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(...color);
  pdf.text(text, x, y);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════════════════════

// Header bar
pdf.setFillColor(...NAVY);
pdf.rect(0, 0, PW, 32, 'F');

pdf.setFont('helvetica', 'bold');
pdf.setFontSize(18);
pdf.setTextColor(...WHITE);
pdf.text('Complaints & Feedback', CX, 14, { align: 'center' });
pdf.setFont('helvetica', 'normal');
pdf.setFontSize(10);
pdf.setTextColor(200, 210, 220);
pdf.text('Workflow Process', CX, 21, { align: 'center' });

pdf.setFont('helvetica', 'bold');
pdf.setFontSize(8);
pdf.setTextColor(...AMBER);
pdf.text('Arete Care', CX, 28, { align: 'center' });

let y = 38;
const boxW = 72;
const boxH = 14;
const smallBoxH = 12;
const gap = 6;

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: RECEIVE FEEDBACK
// ═══════════════════════════════════════════════════════════════════════════════

// Step number
pdf.setFillColor(...TEAL);
pdf.circle(22, y + 4, 4, 'F');
pdf.setTextColor(...WHITE);
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(7);
pdf.text('1', 22, y + 5.5, { align: 'center' });

drawRoundedBox(CX - boxW / 2, y, boxW, boxH, TEAL, ['Feedback / Complaint Received']);

y += boxH + 3;

// Source boxes (small, spread out)
const sources = ['Email', 'Phone / Verbal', 'Online Form', 'In Person', 'Third Party'];
const srcW = 30;
const srcH = 9;
const srcGap = 3;
const totalSrcW = sources.length * srcW + (sources.length - 1) * srcGap;
let srcX = CX - totalSrcW / 2;

for (const src of sources) {
  drawRoundedBox(srcX, y, srcW, srcH, VERY_LIGHT, [src], {
    textColor: SLATE, bold: false, fontSize: 6.5, border: [200, 210, 220]
  });
  // Small arrow from main box to source
  drawArrow(CX, y - 3, srcX + srcW / 2, y);
  srcX += srcW + srcGap;
}

y += srcH + gap;

drawArrow(CX, y - gap, CX, y);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: ACKNOWLEDGE
// ═══════════════════════════════════════════════════════════════════════════════

pdf.setFillColor(...BLUE);
pdf.circle(22, y + 4, 4, 'F');
pdf.setTextColor(...WHITE);
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(7);
pdf.text('2', 22, y + 5.5, { align: 'center' });

drawRoundedBox(CX - boxW / 2, y, boxW, boxH, BLUE, ['Acknowledge Receipt', 'Within 24 hours'], { subtitleAfterFirst: true, subtitleColor: [180, 200, 255] });

y += boxH + gap;
drawArrow(CX, y - gap, CX, y);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: LOG IN REGISTER
// ═══════════════════════════════════════════════════════════════════════════════

pdf.setFillColor(...PURPLE);
pdf.circle(22, y + 4, 4, 'F');
pdf.setTextColor(...WHITE);
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(7);
pdf.text('3', 22, y + 5.5, { align: 'center' });

drawRoundedBox(CX - boxW / 2, y, boxW, boxH, PURPLE, ['Log in Feedback Register', 'Record details, date, source'], { subtitleAfterFirst: true, subtitleColor: [200, 180, 255] });

y += boxH + gap;
drawArrow(CX, y - gap, CX, y);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: REVIEW CHAIN
// ═══════════════════════════════════════════════════════════════════════════════

pdf.setFillColor(...AMBER);
pdf.circle(22, y + 4, 4, 'F');
pdf.setTextColor(...WHITE);
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(7);
pdf.text('4', 22, y + 5.5, { align: 'center' });

// Three review boxes side by side
const revW = 50;
const revH = 16;
const revGap = 8;
const totalRevW = 3 * revW + 2 * revGap;
let revX = CX - totalRevW / 2;

drawRoundedBox(revX, y, revW, revH, AMBER, ['Operations Manager', 'Initial Review'], { subtitleAfterFirst: true, subtitleColor: [255, 230, 180] });
const om_right = revX + revW;
revX += revW + revGap;

drawArrow(om_right, y + revH / 2, revX, y + revH / 2);

drawRoundedBox(revX, y, revW, revH, AMBER, ['Team Leader', 'Assessment & Action'], { subtitleAfterFirst: true, subtitleColor: [255, 230, 180] });
const tl_right = revX + revW;
revX += revW + revGap;

drawArrow(tl_right, y + revH / 2, revX, y + revH / 2);

drawRoundedBox(revX, y, revW, revH, AMBER, ['Quality Manager', 'Compliance Review'], { subtitleAfterFirst: true, subtitleColor: [255, 230, 180] });

y += revH + gap;
drawArrow(CX, y - gap, CX, y);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5: ASSESS SEVERITY
// ═══════════════════════════════════════════════════════════════════════════════

pdf.setFillColor(...RED);
pdf.circle(22, y + 6, 4, 'F');
pdf.setTextColor(...WHITE);
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(7);
pdf.text('5', 22, y + 7.5, { align: 'center' });

const diamondCY = y + 10;
drawDiamond(CX, diamondCY, 52, 20, RED, ['Assess Severity', '& Risk Level']);

// Side labels
const sevW = 38;
const sevH = 10;

// Low
drawRoundedBox(CX - 80, diamondCY - sevH / 2, sevW, sevH, [22, 163, 74], ['Low Risk']);
drawArrow(CX - 26, diamondCY, CX - 80 + sevW, diamondCY);
drawSideLabel(CX - 80, diamondCY + sevH / 2 + 4, 'Resolve internally', GREEN);

// High
drawRoundedBox(CX + 42, diamondCY - sevH / 2, sevW, sevH, RED, ['High Risk']);
drawArrow(CX + 26, diamondCY, CX + 42, diamondCY);
drawSideLabel(CX + 42, diamondCY + sevH / 2 + 4, 'Escalate / report to NDIS', RED);

y = diamondCY + 14;
drawArrow(CX, y, CX, y + gap);
y += gap;

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6: INVESTIGATE
// ═══════════════════════════════════════════════════════════════════════════════

pdf.setFillColor(...NAVY);
pdf.circle(22, y + 4, 4, 'F');
pdf.setTextColor(...WHITE);
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(7);
pdf.text('6', 22, y + 5.5, { align: 'center' });

drawRoundedBox(CX - boxW / 2, y, boxW, boxH, NAVY, ['Investigate & Gather Evidence', 'Interview parties, review docs'], { subtitleAfterFirst: true, subtitleColor: [160, 175, 195] });

y += boxH + gap;
drawArrow(CX, y - gap, CX, y);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 7: RESOLVE & ACTION
// ═══════════════════════════════════════════════════════════════════════════════

pdf.setFillColor(...GREEN);
pdf.circle(22, y + 4, 4, 'F');
pdf.setTextColor(...WHITE);
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(7);
pdf.text('7', 22, y + 5.5, { align: 'center' });

drawRoundedBox(CX - boxW / 2, y, boxW, boxH, GREEN, ['Resolve & Implement Actions', 'Corrective / preventive measures'], { subtitleAfterFirst: true, subtitleColor: [180, 240, 200] });

y += boxH + gap;
drawArrow(CX, y - gap, CX, y);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 8: NOTIFY COMPLAINANT
// ═══════════════════════════════════════════════════════════════════════════════

pdf.setFillColor(...BLUE);
pdf.circle(22, y + 4, 4, 'F');
pdf.setTextColor(...WHITE);
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(7);
pdf.text('8', 22, y + 5.5, { align: 'center' });

drawRoundedBox(CX - boxW / 2, y, boxW, smallBoxH, BLUE, ['Notify Complainant of Outcome']);

y += smallBoxH + gap;

// Decision diamond - satisfied?
const satCY = y + 7;
drawDiamond(CX, satCY, 44, 14, SLATE, ['Satisfied?']);

// Yes arrow down
drawArrow(CX, satCY + 7, CX, satCY + 14);

// No arrow right - appeal
drawArrow(CX + 22, satCY, CX + 45, satCY);
drawRoundedBox(CX + 45, satCY - 5, 40, 10, RED, ['Appeal / Escalate', 'External body'], { subtitleAfterFirst: true, subtitleColor: [255, 180, 180], fontSize: 7 });

drawSideLabel(CX + 24, satCY - 2, 'No', RED);
drawSideLabel(CX - 3, satCY + 11, 'Yes', GREEN);

y = satCY + 14;

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 9: CLOSE & REVIEW
// ═══════════════════════════════════════════════════════════════════════════════

pdf.setFillColor(...TEAL);
pdf.circle(22, y + 4, 4, 'F');
pdf.setTextColor(...WHITE);
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(7);
pdf.text('9', 22, y + 5.5, { align: 'center' });

drawRoundedBox(CX - boxW / 2, y, boxW, boxH, TEAL, ['Close & Update Register', 'Record outcome, lessons learned'], { subtitleAfterFirst: true, subtitleColor: [180, 230, 225] });

y += boxH + gap;
drawArrow(CX, y - gap, CX, y);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 10: CONTINUOUS IMPROVEMENT
// ═══════════════════════════════════════════════════════════════════════════════

pdf.setFillColor(...GREEN);
pdf.circle(22, y + 4, 4, 'F');
pdf.setTextColor(...WHITE);
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(7);
pdf.text('10', 22, y + 5.5, { align: 'center' });

drawRoundedBox(CX - boxW / 2, y, boxW, smallBoxH, [22, 163, 74], ['Continuous Improvement Review']);

// ═══════════════════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════════════════

pdf.setFont('helvetica', 'normal');
pdf.setFontSize(6);
pdf.setTextColor(...LIGHT_SLATE);
pdf.text('Arete Care  |  Complaints & Feedback Workflow  |  NDIS Practice Standards Compliant', CX, PH - 8, { align: 'center' });

// Save
const outPath = 'C:/Users/kevin/OneDrive/Desktop/CLAUDE/Arete Care - Complaints Workflow.pdf';
const buf = Buffer.from(pdf.output('arraybuffer'));
writeFileSync(outPath, buf);
console.log('Saved:', outPath);
