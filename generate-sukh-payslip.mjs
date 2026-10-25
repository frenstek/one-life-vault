import { jsPDF } from 'jspdf';
import { writeFileSync } from 'fs';

// ─── Constants (matching StaffPayslips.jsx) ──────────────────────────────────
const PAGE_W = 210, PAGE_H = 297;
const MARGIN_L = 16, MARGIN_R = 16, MARGIN_T = 10;
const HEADER_H = 22, FOOTER_H = 8;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const BODY_TOP = MARGIN_T + HEADER_H + 8;
const BODY_BOTTOM = PAGE_H - MARGIN_T - FOOTER_H;
const OLF_GREEN = [14, 160, 62];
const DARK_TEXT = [30, 41, 59];
const MEDIUM_TEXT = [100, 116, 139];
const LIGHT_TEXT = [148, 163, 184];
const BORDER_COLOR = [226, 232, 240];

// ─── Sukhsimran's details ────────────────────────────────────────────────────
const staff = {
  first_name: 'Sukhsimran',
  last_name: 'Kaur Manhani',
  role: 'Support Worker',
  position_type: 'Contractor',
  email: 'Sukhsimran4646@gmail.com',
  phone: '0479100014',
  abn: '34 972 209 526',
  bsb: '063000',
  bank_account: '14372109',
  ndis_clearance_number: '19757531',
  pay_rate_weekday: 42,
  pay_rate_saturday: 42, // From invoice — same rate used
  pay_rate_sunday: 42,
  sleepover_rate: 160,
};

// ─── Combined shifts (Simmie + Simran payslips merged) ───────────────────────
const shifts = [
  // From Simran payslip
  { shift_date: '2026-03-17', shift_type: 'morning', start_time: '06:00', end_time: '12:00', day: 'Tuesday' },
  // From Simmie payslip
  { shift_date: '2026-03-18', shift_type: 'morning', start_time: '06:00', end_time: '12:00', day: 'Wednesday' },
  { shift_date: '2026-03-18', shift_type: 'sleepover', start_time: '22:00', end_time: '06:00', day: 'Wednesday' },
  { shift_date: '2026-03-20', shift_type: 'afternoon', start_time: '16:00', end_time: '20:00', day: 'Friday' },
  { shift_date: '2026-03-20', shift_type: 'night', start_time: '20:00', end_time: '22:00', day: 'Friday' },
  { shift_date: '2026-03-20', shift_type: 'sleepover', start_time: '22:00', end_time: '06:00', day: 'Friday' },
  { shift_date: '2026-03-21', shift_type: 'sleepover', start_time: '22:00', end_time: '06:00', day: 'Saturday' },
];

// ─── Calculate hours and pay ─────────────────────────────────────────────────
let weekday_hours = 0, saturday_hours = 0, sunday_hours = 0, sleepover_count = 0;

for (const s of shifts) {
  if (s.shift_type === 'sleepover') {
    sleepover_count++;
    continue;
  }
  const [sh, sm] = s.start_time.split(':').map(Number);
  const [eh, em] = s.end_time.split(':').map(Number);
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins <= startMins) endMins += 24 * 60;
  const hours = (endMins - startMins) / 60;

  const dow = new Date(s.shift_date).getDay();
  if (dow === 6) saturday_hours += hours;
  else if (dow === 0) sunday_hours += hours;
  else weekday_hours += hours;
}

const weekday_pay = weekday_hours * staff.pay_rate_weekday;
const saturday_pay = saturday_hours * staff.pay_rate_saturday;
const sunday_pay = sunday_hours * staff.pay_rate_sunday;
const sleepover_pay = sleepover_count * staff.sleepover_rate;
const total_pay = weekday_pay + saturday_pay + sunday_pay + sleepover_pay;

console.log('Weekday hours:', weekday_hours, '→', weekday_pay);
console.log('Saturday hours:', saturday_hours, '→', saturday_pay);
console.log('Sunday hours:', sunday_hours, '→', sunday_pay);
console.log('Sleepovers:', sleepover_count, '→', sleepover_pay);
console.log('TOTAL:', total_pay);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDateAU(d) {
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}
function formatCurrency(v) {
  return '$' + Number(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function formatTime12(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}
function getDayName(d) {
  return new Date(d).toLocaleDateString('en-AU', { weekday: 'short' });
}

// ─── Generate PDF ────────────────────────────────────────────────────────────
const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
let pageNum = 1;
let y = BODY_TOP;
const staffName = `${staff.first_name} ${staff.last_name}`;
const startDate = '2026-03-16';
const endDate = '2026-03-29';

function drawHeader() {
  pdf.setFillColor(...OLF_GREEN);
  pdf.rect(0, 0, PAGE_W, MARGIN_T + HEADER_H, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Staff Payslip', MARGIN_L, MARGIN_T + 10);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`Period: ${formatDateAU(startDate)} - ${formatDateAU(endDate)}`, MARGIN_L, MARGIN_T + 18);
  const generated = `Generated: ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  pdf.text(generated, PAGE_W - MARGIN_R, MARGIN_T + 18, { align: 'right' });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('One Life Foundation Pty Ltd', PAGE_W - MARGIN_R, MARGIN_T + 10, { align: 'right' });
}

function drawFooter() {
  const footerY = PAGE_H - MARGIN_T;
  pdf.setDrawColor(...BORDER_COLOR);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_L, footerY - 4, PAGE_W - MARGIN_R, footerY - 4);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(...LIGHT_TEXT);
  pdf.text('One Life Foundation Pty Ltd  |  1300 ONE LIFE  |  onelifefoundation.com.au', MARGIN_L, footerY);
  pdf.text(`Page ${pageNum}`, PAGE_W - MARGIN_R, footerY, { align: 'right' });
}

function ensureSpace(needed) {
  if (y + needed > BODY_BOTTOM) {
    drawFooter();
    pdf.addPage();
    pageNum++;
    drawHeader();
    y = BODY_TOP;
  }
}

// Draw first page
drawHeader();

// ─── Worker Details ──────────────────────────────────────────────────────────
ensureSpace(30);
pdf.setFillColor(248, 250, 252);
pdf.roundedRect(MARGIN_L, y, CONTENT_W, 22, 1.5, 1.5, 'F');
pdf.setFillColor(...OLF_GREEN);
pdf.rect(MARGIN_L, y, 1.2, 22, 'F');

pdf.setFont('helvetica', 'bold');
pdf.setFontSize(11);
pdf.setTextColor(...DARK_TEXT);
pdf.text(staffName, MARGIN_L + 6, y + 7);

pdf.setFont('helvetica', 'normal');
pdf.setFontSize(8);
pdf.setTextColor(...MEDIUM_TEXT);
const detailLine = [staff.role, staff.position_type, staff.email].filter(Boolean).join('  |  ');
pdf.text(detailLine, MARGIN_L + 6, y + 13);
pdf.text(`ABN: ${staff.abn}`, MARGIN_L + 6, y + 18);
y += 28;

// ─── Participant ─────────────────────────────────────────────────────────────
ensureSpace(10);
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(9);
pdf.setTextColor(...DARK_TEXT);
pdf.text('Participant: Nicole Elizabeth Knight', MARGIN_L, y + 5);
y += 10;

// ─── Shift Table ─────────────────────────────────────────────────────────────
ensureSpace(16);
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(10);
pdf.setTextColor(...DARK_TEXT);
pdf.text('Shift Details', MARGIN_L, y + 5);
y += 10;

const colX = [MARGIN_L, MARGIN_L + 28, MARGIN_L + 52, MARGIN_L + 72, MARGIN_L + 92, MARGIN_L + 120];
ensureSpace(8);
pdf.setFillColor(248, 250, 252);
pdf.rect(MARGIN_L, y, CONTENT_W, 7, 'F');
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(7);
pdf.setTextColor(...MEDIUM_TEXT);
pdf.text('DATE', colX[0] + 2, y + 5);
pdf.text('DAY', colX[1] + 2, y + 5);
pdf.text('TYPE', colX[2] + 2, y + 5);
pdf.text('START', colX[3] + 2, y + 5);
pdf.text('END', colX[4] + 2, y + 5);
pdf.text('HOURS', colX[5] + 2, y + 5);
y += 8;

for (const shift of shifts) {
  ensureSpace(6);
  const isSleep = shift.shift_type === 'sleepover';
  const [sh, sm] = shift.start_time.split(':').map(Number);
  const [eh, em] = shift.end_time.split(':').map(Number);
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins <= startMins) endMins += 24 * 60;
  const hours = isSleep ? '--' : ((endMins - startMins) / 60).toFixed(1);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...DARK_TEXT);
  pdf.text(formatDateAU(shift.shift_date), colX[0] + 2, y + 4);
  pdf.text(getDayName(shift.shift_date), colX[1] + 2, y + 4);
  const typeName = shift.shift_type.charAt(0).toUpperCase() + shift.shift_type.slice(1);
  pdf.text(typeName, colX[2] + 2, y + 4);
  pdf.text(formatTime12(shift.start_time), colX[3] + 2, y + 4);
  pdf.text(formatTime12(shift.end_time), colX[4] + 2, y + 4);
  pdf.text(String(hours), colX[5] + 2, y + 4);

  pdf.setDrawColor(240, 240, 240);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN_L, y + 5.5, MARGIN_L + CONTENT_W, y + 5.5);
  y += 6;
}
y += 6;

// ─── Payment Summary ─────────────────────────────────────────────────────────
ensureSpace(50);
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(10);
pdf.setTextColor(...DARK_TEXT);
pdf.text('Payment Summary', MARGIN_L, y + 5);
y += 10;

const summaryX = MARGIN_L + 4;
const summaryValX = MARGIN_L + CONTENT_W - 4;
const summaryRows = [
  { label: `Weekday Hours (${weekday_hours.toFixed(1)} hrs x ${formatCurrency(staff.pay_rate_weekday)}/hr)`, value: formatCurrency(weekday_pay) },
  { label: `Saturday Hours (${saturday_hours.toFixed(1)} hrs x ${formatCurrency(staff.pay_rate_saturday)}/hr)`, value: formatCurrency(saturday_pay) },
  { label: `Sunday Hours (${sunday_hours.toFixed(1)} hrs x ${formatCurrency(staff.pay_rate_sunday)}/hr)`, value: formatCurrency(sunday_pay) },
  { label: `Sleepovers (${sleepover_count} x ${formatCurrency(staff.sleepover_rate)})`, value: formatCurrency(sleepover_pay) },
];

for (const row of summaryRows) {
  ensureSpace(6);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...DARK_TEXT);
  pdf.text(row.label, summaryX, y + 4);
  pdf.text(row.value, summaryValX, y + 4, { align: 'right' });
  pdf.setDrawColor(240, 240, 240);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN_L, y + 6, MARGIN_L + CONTENT_W, y + 6);
  y += 7;
}

// Total
ensureSpace(10);
pdf.setFillColor(248, 250, 252);
pdf.rect(MARGIN_L, y, CONTENT_W, 8, 'F');
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(10);
pdf.setTextColor(...OLF_GREEN);
pdf.text('TOTAL GROSS PAY', summaryX, y + 6);
pdf.text(formatCurrency(total_pay), summaryValX, y + 6, { align: 'right' });
y += 14;

// ─── Bank Details ────────────────────────────────────────────────────────────
ensureSpace(20);
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(9);
pdf.setTextColor(...DARK_TEXT);
pdf.text('Bank Details', MARGIN_L, y + 5);
y += 9;
pdf.setFont('helvetica', 'normal');
pdf.setFontSize(8);
pdf.setTextColor(...MEDIUM_TEXT);
pdf.text(`Account Name: ${staffName}`, MARGIN_L + 4, y + 4); y += 5;
pdf.text(`BSB: ${staff.bsb}`, MARGIN_L + 4, y + 4); y += 5;
pdf.text(`Account: ${staff.bank_account}`, MARGIN_L + 4, y + 4); y += 5;

drawFooter();

// ─── Save ────────────────────────────────────────────────────────────────────
const outPath = 'C:/Users/kevin/OneDrive/Desktop/INVOICES NICOLE/NICOLE/Payslip_Sukhsimran_Kaur_Nicole_FN2_16-29_March.pdf';
const buf = Buffer.from(pdf.output('arraybuffer'));
writeFileSync(outPath, buf);
console.log(`\nSaved: ${outPath}`);
