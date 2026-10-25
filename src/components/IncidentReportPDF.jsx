import jsPDF from 'jspdf';

// ─── Constants ──────────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 18;
const MARGIN_R = 18;
const MARGIN_T = 18;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const BODY_BOTTOM = PAGE_H - 24;

// Colors (RGB arrays)
const OLF_GREEN = [14, 160, 62];
const DARK_TEXT = [30, 41, 59];
const LIGHT_TEXT = [100, 116, 139];
const RED = [220, 38, 38];
const AMBER = [217, 119, 6];
const BORDER = [226, 232, 240];

const CATEGORY_LABELS = {
  injury: 'Injury',
  medication: 'Medication Error',
  behaviour: 'Behaviour of Concern',
  property_damage: 'Property Damage',
  abuse_neglect: 'Abuse/Neglect',
  missing_person: 'Missing Person',
  fall: 'Fall',
  aggression: 'Aggression',
  other: 'Other',
};

function formatDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(t) {
  if (!t) return '';
  return t;
}

// ─── PDF Generator ──────────────────────────────────────────────────────────

export function generateIncidentReportPDF(incident, participantName, propertyName) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = MARGIN_T;
  let pageNum = 1;

  const incNum = incident.incident_number || `INC-${String(incident.id).slice(0, 6).toUpperCase()}`;

  // ─── Helper: New page ──────────────────────────────────
  function newPage() {
    drawFooter();
    pdf.addPage();
    pageNum++;
    y = MARGIN_T;
  }

  function ensureSpace(needed) {
    if (y + needed > BODY_BOTTOM) {
      newPage();
    }
  }

  // ─── Helper: Draw footer ───────────────────────────────
  function drawFooter() {
    const footerY = PAGE_H - 12;
    pdf.setDrawColor(...BORDER);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_L, footerY - 2, PAGE_W - MARGIN_R, footerY - 2);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...LIGHT_TEXT);
    pdf.text('One Life Foundation - Confidential Incident Report', MARGIN_L, footerY + 2);
    pdf.text(`Page ${pageNum}`, PAGE_W - MARGIN_R, footerY + 2, { align: 'right' });
  }

  // ─── Helper: Draw field row ────────────────────────────
  function drawField(label, value, leftX, width) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...LIGHT_TEXT);
    pdf.text(label.toUpperCase(), leftX, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...DARK_TEXT);
    const lines = pdf.splitTextToSize(value || '--', width - 4);
    pdf.text(lines, leftX, y + 4.5);
    return 4.5 + lines.length * 4;
  }

  // ─── Helper: Section heading ───────────────────────────
  function drawSectionHeading(title) {
    ensureSpace(14);
    y += 4;
    pdf.setDrawColor(...OLF_GREEN);
    pdf.setLineWidth(0.6);
    pdf.line(MARGIN_L, y, MARGIN_L + 40, y);
    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...OLF_GREEN);
    pdf.text(title, MARGIN_L, y);
    y += 7;
  }

  // ─── Helper: Text block ────────────────────────────────
  function drawTextBlock(text) {
    if (!text) return;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...DARK_TEXT);
    const lines = pdf.splitTextToSize(text, CONTENT_W - 8);
    for (let i = 0; i < lines.length; i++) {
      ensureSpace(5);
      pdf.text(lines[i], MARGIN_L + 4, y);
      y += 4.2;
    }
    y += 2;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Header Banner ─────────────────────────────────────
  pdf.setFillColor(...OLF_GREEN);
  pdf.rect(0, 0, PAGE_W, 38, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.text('INCIDENT REPORT', MARGIN_L, 16);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255, 200);
  pdf.text('One Life Foundation', MARGIN_L, 23);

  // Incident number on right
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.text(incNum, PAGE_W - MARGIN_R, 16, { align: 'right' });

  // Severity badge
  const severity = (incident.severity || 'medium').toUpperCase();
  const sevColor = incident.severity === 'critical' || incident.severity === 'high' ? RED : incident.severity === 'medium' ? AMBER : LIGHT_TEXT;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(...sevColor);
  const sevWidth = pdf.getTextWidth(severity) + 8;
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(PAGE_W - MARGIN_R - sevWidth, 26, sevWidth, 7, 1.5, 1.5, 'F');
  pdf.text(severity, PAGE_W - MARGIN_R - sevWidth + 4, 31);

  // Date on left below org name
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`Date: ${formatDate(incident.incident_date)}${incident.incident_time ? ' at ' + formatTime(incident.incident_time) : ''}`, MARGIN_L, 30);

  y = 46;

  // ─── Key Details Grid ──────────────────────────────────
  // Row 1
  const col1 = MARGIN_L;
  const col2 = MARGIN_L + CONTENT_W / 2;
  const colW = CONTENT_W / 2 - 4;

  const h1 = drawField('Title', incident.title, col1, CONTENT_W);
  y += h1 + 2;

  const savedY = y;
  const h2 = drawField('Category', CATEGORY_LABELS[incident.category] || incident.category || '--', col1, colW);
  const h3 = drawField('Status', (incident.status || 'open').charAt(0).toUpperCase() + (incident.status || 'open').slice(1), col2, colW);
  y = savedY + Math.max(h2, h3) + 2;

  const savedY2 = y;
  const h4 = drawField('Reported By', incident.reported_by, col1, colW);
  const h5 = drawField('Location', incident.location, col2, colW);
  y = savedY2 + Math.max(h4, h5) + 2;

  const savedY3 = y;
  const h6 = drawField('Participant', participantName || '--', col1, colW);
  const h7 = drawField('Property', propertyName || '--', col2, colW);
  y = savedY3 + Math.max(h6, h7) + 2;

  if (incident.witnesses) {
    const h8 = drawField('Witnesses', incident.witnesses, col1, CONTENT_W);
    y += h8 + 2;
  }

  // ─── Description ───────────────────────────────────────
  drawSectionHeading('Incident Description');
  drawTextBlock(incident.description);

  // ─── Immediate Actions ─────────────────────────────────
  if (incident.immediate_actions) {
    drawSectionHeading('Immediate Actions Taken');
    drawTextBlock(incident.immediate_actions);
  }

  // ─── Follow-up ─────────────────────────────────────────
  if (incident.follow_up_required) {
    drawSectionHeading('Follow-up Required');
    if (incident.follow_up_actions) {
      drawTextBlock(incident.follow_up_actions);
    }
    if (incident.follow_up_date) {
      ensureSpace(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...LIGHT_TEXT);
      pdf.text('FOLLOW-UP DATE:', MARGIN_L + 4, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(...DARK_TEXT);
      pdf.text(formatDate(incident.follow_up_date), MARGIN_L + 38, y);
      y += 6;
    }
  }

  // ─── Resolution ────────────────────────────────────────
  if (incident.status === 'resolved' || incident.status === 'closed') {
    drawSectionHeading('Resolution');

    if (incident.resolution_notes) {
      // Green box background
      ensureSpace(12);
      const resLines = pdf.splitTextToSize(incident.resolution_notes, CONTENT_W - 20);
      const boxH = resLines.length * 4.2 + 12;
      ensureSpace(boxH);

      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(MARGIN_L, y - 2, CONTENT_W, boxH, 2, 2, 'F');
      pdf.setFillColor(...OLF_GREEN);
      pdf.rect(MARGIN_L, y - 2, 1.5, boxH, 'F');

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(22, 101, 52);
      pdf.text(resLines, MARGIN_L + 8, y + 5);
      y += boxH + 4;
    }

    ensureSpace(10);
    const savedY4 = y;
    drawField('Resolved By', incident.resolved_by || '--', col1, colW);
    y = savedY4;
    drawField('Resolved At', incident.resolved_at ? formatDate(incident.resolved_at) : '--', col2, colW);
    y = savedY4 + 12;
  }

  // ─── Footer ────────────────────────────────────────────
  drawFooter();

  return pdf;
}

// ─── Export function called from UI ──────────────────────────────────────────

export function downloadIncidentPDF(incident, participantName, propertyName) {
  const pdf = generateIncidentReportPDF(incident, participantName, propertyName);
  const incNum = incident.incident_number || `INC-${String(incident.id).slice(0, 6).toUpperCase()}`;
  const dateStr = incident.incident_date || 'undated';
  pdf.save(`OLF-Incident-Report-${incNum}-${dateStr}.pdf`);
}
