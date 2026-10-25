import { useState } from 'react';
import jsPDF from 'jspdf';
import { HiArrowDownTray, HiDocumentText, HiXMark } from 'react-icons/hi2';
import { fetchProgressNotes } from '../lib/api';
import { toLocalDate } from '../lib/dates';
import { shiftTimeLabel } from '../lib/shiftTime';
import Modal, {
  ModalBody,
  ModalFooter,
  ButtonPrimary,
  ButtonSecondary,
} from './ui/Modal';

// ─── OLF Brand Colors ────────────────────────────────────────────────────────
const OLF_GREEN = [14, 160, 62]; // #0ea03e
const OLF_BLUE = [48, 158, 221]; // #309edd
const DARK_TEXT = [30, 41, 59]; // #1e293b
const MEDIUM_TEXT = [71, 85, 105]; // #475569
const LIGHT_TEXT = [148, 163, 184]; // #94a3b8
const AMBER_BG = [255, 251, 235]; // #fffbeb
const AMBER_BORDER = [245, 158, 11]; // #f59e0b
const AMBER_TEXT = [146, 64, 14]; // #92400e
const GREEN_BG = [240, 253, 244]; // #f0fdf4
const GREEN_TEXT = [22, 101, 52]; // #166534
const BLUE_BG = [239, 246, 255]; // #eff6ff
const BLUE_TEXT = [30, 64, 175]; // #1e40af
const BORDER_COLOR = [226, 232, 240]; // #e2e8f0

// ─── PDF Constants ───────────────────────────────────────────────────────────
const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN_L = 18;
const MARGIN_R = 18;
const MARGIN_T = 18;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const HEADER_H = 28;
const FOOTER_H = 14;
const BODY_TOP = MARGIN_T + HEADER_H + 4;
const BODY_BOTTOM = PAGE_H - MARGIN_T - FOOTER_H;

function formatDateAU(d) {
  if (!d) return '--';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortAU(d) {
  if (!d) return '--';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── PDF Generator ───────────────────────────────────────────────────────────

function generatePDF(notes, participantName, fromDate, toDate) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let pageNum = 1;
  let y = BODY_TOP;

  // Shift time ordering — sleepover first (overnight ending this morning), then day shifts
  function shiftOrder(shift) {
    if (!shift) return 50;
    const s = shift.toLowerCase();
    // Sleepover / overnight first (these are the overnight staff)
    if (s.includes('sleepover') || s.includes('overnight') || (s.includes('10pm') && !s.includes('incident')) || (s.includes('10:00pm') && !s.includes('incident'))) return 5;
    // Morning patterns
    if (s.includes('morning') || s.includes('6am') || s.includes('6:00am') || s.includes('7am') || s.includes('7:30am') || s.includes('9am') || s.includes('9:00am')) return 10;
    // Midday
    if (s.includes('12pm') || s.includes('12:00pm') || s.includes('1pm') || s.includes('1:00pm')) return 20;
    // Afternoon
    if (s.includes('4pm') || s.includes('4:00pm') || s.includes('afternoon')) return 30;
    // Evening
    if (s.includes('8pm') || s.includes('8:00pm') || s.includes('evening')) return 40;
    // Incident reports last
    if (s.includes('incident')) return 60;
    return 50;
  }

  // Group notes by date ascending, sort within each group chronologically
  const grouped = {};
  for (const note of notes) {
    const key = note.note_date || 'Unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(note);
  }
  // Sort each date group by shift time
  for (const dateNotes of Object.values(grouped)) {
    dateNotes.sort((a, b) => shiftOrder(a.shift) - shiftOrder(b.shift));
  }
  const dateGroups = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));

  // ─── Header ──────────────────────────────────────────────────────────────
  function drawHeader() {
    // Green header bar
    pdf.setFillColor(...OLF_GREEN);
    pdf.rect(0, 0, PAGE_W, MARGIN_T + HEADER_H, 'F');

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Progress Notes Report', MARGIN_L, MARGIN_T + 10);

    // Subtitle line
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255, 200);

    const parts = [];
    if (participantName) parts.push(participantName);
    if (fromDate) parts.push(`From: ${formatShortAU(fromDate)}`);
    if (toDate) parts.push(`To: ${formatShortAU(toDate)}`);
    if (parts.length === 0) parts.push('All Notes');
    const generated = `Generated: ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

    pdf.text(parts.join('  |  '), MARGIN_L, MARGIN_T + 18);
    pdf.text(generated, PAGE_W - MARGIN_R, MARGIN_T + 18, { align: 'right' });

    // Note count
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text(`${notes.length} note${notes.length !== 1 ? 's' : ''}`, PAGE_W - MARGIN_R, MARGIN_T + 10, { align: 'right' });
  }

  // ─── Footer ──────────────────────────────────────────────────────────────
  function drawFooter() {
    const footerY = PAGE_H - MARGIN_T;
    // Thin line
    pdf.setDrawColor(...BORDER_COLOR);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_L, footerY - 4, PAGE_W - MARGIN_R, footerY - 4);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...LIGHT_TEXT);
    pdf.text('One Life Foundation Pty Ltd  |  1300 ONE LIFE  |  onelifefoundation.com.au', MARGIN_L, footerY);
    pdf.text(`Page ${pageNum}`, PAGE_W - MARGIN_R, footerY, { align: 'right' });
  }

  // ─── New page ────────────────────────────────────────────────────────────
  function newPage() {
    drawFooter();
    pdf.addPage();
    pageNum++;
    drawHeader();
    y = BODY_TOP;
  }

  function ensureSpace(needed) {
    if (y + needed > BODY_BOTTOM) {
      newPage();
    }
  }

  // ─── Draw colored box with wrapped text ──────────────────────────────────
  function drawInfoBox(label, text, bgColor, borderColor, textColor, labelColor) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const lines = pdf.splitTextToSize(text, CONTENT_W - 24);
    const boxH = 6 + lines.length * 3.5 + 4;
    ensureSpace(boxH + 2);

    // Background
    pdf.setFillColor(...bgColor);
    pdf.roundedRect(MARGIN_L + 4, y, CONTENT_W - 8, boxH, 1.5, 1.5, 'F');

    // Left border accent
    pdf.setFillColor(...borderColor);
    pdf.rect(MARGIN_L + 4, y, 1.2, boxH, 'F');

    // Label
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(...labelColor);
    pdf.text(label.toUpperCase(), MARGIN_L + 10, y + 5);

    // Content
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...textColor);
    pdf.text(lines, MARGIN_L + 10, y + 9.5);

    y += boxH + 2;
  }

  // ─── Draw initial page ─────────────────────────────────────────────────
  drawHeader();

  if (notes.length === 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(...MEDIUM_TEXT);
    pdf.text('No progress notes found for the selected date range.', MARGIN_L, y + 10);
    drawFooter();
    return pdf;
  }

  // ─── Render notes grouped by date ────────────────────────────────────────
  for (const [date, dateNotes] of dateGroups) {
    // Date header
    ensureSpace(12);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(MARGIN_L, y, CONTENT_W, 8, 1.5, 1.5, 'F');
    pdf.setFillColor(...OLF_GREEN);
    pdf.rect(MARGIN_L, y, 1.2, 8, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...DARK_TEXT);
    pdf.text(formatDateAU(date), MARGIN_L + 6, y + 5.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...LIGHT_TEXT);
    pdf.text(`${dateNotes.length} note${dateNotes.length !== 1 ? 's' : ''}`, PAGE_W - MARGIN_R - 4, y + 5.5, { align: 'right' });

    y += 12;

    // Render each note
    for (const note of dateNotes) {
      // Set content font BEFORE splitTextToSize so line breaks are calculated correctly
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const contentLines = pdf.splitTextToSize(note.content || '', CONTENT_W - 20);
      const minCardH = 18 + contentLines.length * 3.5;
      ensureSpace(Math.min(minCardH, 50)); // At least check if we have some room

      const cardStartY = y;

      // Card border
      pdf.setDrawColor(...BORDER_COLOR);
      pdf.setLineWidth(0.3);

      // ── Note header row ──
      // Participant name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...DARK_TEXT);
      pdf.text(note.participant_name || 'Unknown', MARGIN_L + 6, y + 5);

      // Badges row
      let badgeX = MARGIN_L + 6 + pdf.getTextWidth(note.participant_name || 'Unknown') + 4;

      // Shift time badge: only the actual times staff entered (old preset labels are not shown)
      const shiftTxt = shiftTimeLabel(note.shift);
      if (shiftTxt) {
        const shiftW = pdf.getTextWidth(shiftTxt) + 6;
        pdf.setFillColor(...OLF_BLUE);
        pdf.roundedRect(badgeX, y + 1, shiftW, 5, 1, 1, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.5);
        pdf.setTextColor(255, 255, 255);
        pdf.text(shiftTxt, badgeX + 3, y + 4.5);
        badgeX += shiftW + 3;
      }

      // Mood badge
      if (note.mood) {
        const moodW = pdf.getTextWidth(note.mood) + 6;
        const moodColors = {
          Happy: [34, 197, 94],
          Content: [34, 197, 94],
          Neutral: [148, 163, 184],
          Anxious: [245, 158, 11],
          Agitated: [245, 158, 11],
          Upset: [239, 68, 68],
        };
        pdf.setFillColor(...(moodColors[note.mood] || [148, 163, 184]));
        pdf.roundedRect(badgeX, y + 1, moodW, 5, 1, 1, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.5);
        pdf.setTextColor(255, 255, 255);
        pdf.text(note.mood, badgeX + 3, y + 4.5);
        badgeX += moodW + 3;
      }

      // Sleep badge
      if (note.sleep_quality) {
        const sleepLabel = `Sleep: ${note.sleep_quality}`;
        const sleepW = pdf.getTextWidth(sleepLabel) + 6;
        const sleepColors = {
          Good: [34, 197, 94],
          Fair: [148, 163, 184],
          Poor: [245, 158, 11],
          Restless: [239, 68, 68],
        };
        pdf.setFillColor(...(sleepColors[note.sleep_quality] || [148, 163, 184]));
        pdf.roundedRect(badgeX, y + 1, sleepW, 5, 1, 1, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.5);
        pdf.setTextColor(255, 255, 255);
        pdf.text(sleepLabel, badgeX + 3, y + 4.5);
      }

      y += 8;

      // Staff info
      if (note.staff_name) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(...MEDIUM_TEXT);
        let staffLine = `Staff: ${note.staff_name}`;
        if (note.day_of_week) staffLine += `  ·  ${note.day_of_week}`;
        pdf.text(staffLine, MARGIN_L + 6, y + 3);
        y += 5;
      }

      // Main content
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...DARK_TEXT);

      // Render content line by line, handling page breaks
      for (const line of contentLines) {
        ensureSpace(4);
        pdf.text(line, MARGIN_L + 6, y + 3);
        y += 3.5;
      }
      y += 2;

      // BSL Reading
      if (note.bsl_reading && note.bsl_reading.trim()) {
        drawInfoBox('BSL Reading', note.bsl_reading, BLUE_BG, [59, 130, 246], BLUE_TEXT, BLUE_TEXT);
      }

      // Concerns
      if (note.concerns && note.concerns.trim()) {
        drawInfoBox('Concerns', note.concerns, AMBER_BG, AMBER_BORDER, AMBER_TEXT, AMBER_TEXT);
      }

      // Medication
      if (note.medication_notes && note.medication_notes.trim()) {
        drawInfoBox('Medication', note.medication_notes, GREEN_BG, OLF_GREEN, GREEN_TEXT, GREEN_TEXT);
      }

      // Meals
      if (note.meals && note.meals.trim()) {
        ensureSpace(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(...MEDIUM_TEXT);
        pdf.text('MEALS', MARGIN_L + 6, y + 3);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(...DARK_TEXT);
        const mealLines = pdf.splitTextToSize(note.meals, CONTENT_W - 16);
        for (const line of mealLines) {
          ensureSpace(4);
          pdf.text(line, MARGIN_L + 6, y + 3);
          y += 3.5;
        }
        y += 2;
      }

      // Activities
      if (note.activities && note.activities.trim()) {
        ensureSpace(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(...MEDIUM_TEXT);
        pdf.text('ACTIVITIES', MARGIN_L + 6, y + 3);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(...DARK_TEXT);
        const actLines = pdf.splitTextToSize(note.activities, CONTENT_W - 16);
        for (const line of actLines) {
          ensureSpace(4);
          pdf.text(line, MARGIN_L + 6, y + 3);
          y += 3.5;
        }
        y += 2;
      }

      // Card border (draw after content so we know the height)
      const cardH = y - cardStartY;
      pdf.setDrawColor(...BORDER_COLOR);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(MARGIN_L + 2, cardStartY - 2, CONTENT_W - 4, cardH + 2, 1.5, 1.5, 'S');

      y += 6; // gap between cards
    }

    y += 2; // gap between date groups
  }

  drawFooter();
  return pdf;
}

// ─── Export Modal Component ──────────────────────────────────────────────────

export default function ProgressNotesPDF({ participantNames = [], currentFilters = {} }) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [fromDate, setFromDate] = useState(currentFilters.startDate || '');
  const [toDate, setToDate] = useState(currentFilters.endDate || '');
  const [participant, setParticipant] = useState(currentFilters.participant || '');
  const [error, setError] = useState(null);

  function handleOpen() {
    // Pre-fill from current page filters
    setFromDate(currentFilters.startDate || '');
    setToDate(currentFilters.endDate || '');
    setParticipant(currentFilters.participant || '');
    setError(null);
    setOpen(true);
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    try {
      const notes = await fetchProgressNotes(
        participant || undefined,
        fromDate || undefined,
        toDate || undefined,
        undefined,
      );

      const notesList = Array.isArray(notes) ? notes : [];
      const pdf = generatePDF(notesList, participant, fromDate, toDate);

      // Build filename
      const parts = ['OLF-Progress-Notes'];
      if (participant) parts.push(participant.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-'));
      if (fromDate) parts.push(fromDate);
      if (toDate) parts.push(`to-${toDate}`);
      pdf.save(`${parts.join('-')}.pdf`);
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
      >
        <HiArrowDownTray className="h-4 w-4" />
        Export PDF
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Export Progress Notes PDF"
        icon={HiDocumentText}
        iconColor="text-green-500"
        size="md"
      >
        <ModalBody>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Select a date range and participant to generate a PDF report of progress notes.
          </p>

          <div className="space-y-4">
            {/* Participant */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Participant
              </label>
              <select
                value={participant}
                onChange={e => setParticipant(e.target.value)}
                className="w-full text-sm"
              >
                <option value="">All Participants</option>
                {participantNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="w-full text-sm"
                />
              </div>
            </div>

            {/* Quick presets */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Quick Select
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Last 7 days', days: 7 },
                  { label: 'Last 14 days', days: 14 },
                  { label: 'Last 30 days', days: 30 },
                  { label: 'This month', days: 'month' },
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const to = toLocalDate(now);
                      let from;
                      if (preset.days === 'month') {
                        from = toLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
                      } else {
                        const d = new Date(now);
                        d.setDate(d.getDate() - preset.days);
                        from = toLocalDate(d);
                      }
                      setFromDate(from);
                      setToDate(to);
                    }}
                    className="rounded-md border border-slate-200 dark:border-[#334766] bg-slate-50 dark:bg-[#0f1a2e] px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1a2844] hover:text-slate-900 dark:hover:text-white"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setOpen(false)}>Cancel</ButtonSecondary>
          <ButtonPrimary onClick={handleGenerate} loading={generating}>
            {generating ? 'Generating...' : 'Generate PDF'}
          </ButtonPrimary>
        </ModalFooter>
      </Modal>
    </>
  );
}
