import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const PROJECT = 'C:/Users/kevin/OneDrive/Desktop/CLAUDE/one-life-vault';
const logoPath = path.join(PROJECT, 'public', 'logo.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoDataUrl = 'data:image/png;base64,' + logoBase64;

const outDir = 'C:/Users/kevin/Downloads';

// ── DATA ──

const nathan = {
  name: 'Nathan Gottaas',
  ndis: '430323224',
  shifts: [
    { date: '29/12/2025', day: 'Mon', staff: 'Sukhsimran Kaur', times: '8:00AM – 8:00PM', type: 'At home care', hours: '12 hrs' },
    { date: '30/12/2025', day: 'Tue', staff: 'Sukhsimran Kaur', times: '8:00AM – 8:00PM', type: 'At home care', hours: '12 hrs' },
    { date: '31/12/2025', day: 'Wed', staff: 'Sukhsimran Kaur', times: '8:00AM – 4:30PM', type: 'At home care', hours: '8.5 hrs' },
    { date: '01/01/2026', day: 'Thu\n(PH)', staff: 'Sukhsimran Kaur', times: '9:00AM – 4:00PM', type: 'At home care', hours: '7 hrs' },
    { date: '23/03/2026', day: 'Mon', staff: 'Prabhjot Kaur', times: '10:00AM – 1:00PM', type: 'Community Participation', hours: '3 hrs' },
    { date: '24/03/2026', day: 'Tue', staff: 'Prabhjot Kaur', times: '10:00AM – 1:00PM', type: 'Community Participation', hours: '3 hrs' },
    { date: '25/03/2026', day: 'Wed', staff: 'Prabhjot Kaur', times: '10:00AM – 1:00PM', type: 'Community Participation', hours: '3 hrs' },
    { date: '26/03/2026', day: 'Thu', staff: 'Prabhjot Kaur', times: '10:00AM – 1:00PM', type: 'Community Participation', hours: '3 hrs' },
    { date: '27/03/2026', day: 'Fri', staff: 'Prabhjot Kaur', times: '10:00AM – 12:00PM', type: 'Community Participation', hours: '2 hrs' },
    { date: '30/03/2026', day: 'Mon', staff: 'Afrah Najmeh', times: '6:00AM – 2:00PM', type: 'At home care', hours: '8 hrs' },
    { date: '30/03/2026', day: 'Mon', staff: 'Vishali Gill', times: '2:00PM – 10:00PM', type: 'At home care', hours: '8 hrs' },
    { date: '31/03/2026', day: 'Tue', staff: 'Prabhjot Kaur', times: '8:00AM – 4:00PM', type: 'Community Participation', hours: '8 hrs' },
  ],
  totalDays: 11,
  totalStaff: 4,
  totalHours: 77.5,
  staffList: 'Sukhsimran Kaur, Prabhjot Kaur, Afrah Najmeh, Vishali Gill',
  invoiceRefs: [
    { staff: 'Prabhjot Kaur', invoiceNo: '—', period: '23 Mar – 31 Mar 2026', filename: 'NDISInvoice_Prabhjot_Kaur_Nathan_Mar23-31.pdf', totalHours: '22 hrs' },
    { staff: 'Afrah Najmeh', invoiceNo: '001', period: '30 March 2026', filename: 'Invoice_Afrah_Nathan_Mar30.pdf', totalHours: '8 hrs' },
    { staff: 'Vishali Gill', invoiceNo: '001', period: '30 March 2026', filename: 'Invoice_Vishali_Nathan_Mar30.pdf', totalHours: '8 hrs' },
  ],
};

const nicole = {
  name: 'Nicole Elizabeth Knight',
  ndis: '431301939',
  shifts: [
    { date: '06/04/2026', day: 'Mon', staff: 'Pawandeep Kaur', times: '6:00AM – 12:00PM', type: 'Morning', hours: '6 hrs' },
    { date: '06/04/2026', day: 'Mon', staff: 'Avneet Kaur', times: '4:00PM – 10:00PM', type: 'Afternoon + Evening', hours: '6 hrs' },
    { date: '06/04/2026', day: 'Mon', staff: 'Vishali Gill', times: '10:00PM – 6:00AM', type: 'Sleepover', hours: '8 hrs' },
    { date: '07/04/2026', day: 'Tue', staff: 'Vishali Gill', times: '6:00AM – 12:00PM', type: 'Morning', hours: '6 hrs' },
    { date: '07/04/2026', day: 'Tue', staff: 'Gurpreet Kaur', times: '4:00PM – 10:00PM', type: 'Afternoon + Evening', hours: '6 hrs' },
    { date: '07/04/2026', day: 'Tue', staff: 'Vishali Gill', times: '10:00PM – 6:00AM', type: 'Sleepover', hours: '8 hrs' },
    { date: '08/04/2026', day: 'Wed', staff: 'Gurpreet Kaur', times: '6:00AM – 12:00PM', type: 'Morning', hours: '6 hrs' },
    { date: '08/04/2026', day: 'Wed', staff: 'Avneet Kaur', times: '4:00PM – 6:00AM', type: 'Afternoon + Evening + Sleepover', hours: '14 hrs' },
    { date: '09/04/2026', day: 'Thu', staff: 'Vishali Gill', times: '4:00PM – 6:00AM', type: 'Afternoon + Evening + Sleepover', hours: '14 hrs' },
    { date: '10/04/2026', day: 'Fri', staff: 'Vishali Gill', times: '6:00AM – 7:30AM', type: 'Morning', hours: '1.5 hrs' },
    { date: '10/04/2026', day: 'Fri', staff: 'Gurpreet Kaur', times: '7:30AM – 12:00PM', type: 'Morning', hours: '4.5 hrs' },
    { date: '10/04/2026', day: 'Fri', staff: 'Avneet Kaur', times: '4:00PM – 6:00AM', type: 'Afternoon + Evening + Sleepover', hours: '14 hrs' },
    { date: '11/04/2026', day: 'Sat', staff: 'Vishali Gill', times: '6:00AM – 12:00PM', type: 'Morning', hours: '6 hrs' },
    { date: '11/04/2026', day: 'Sat', staff: 'Prabhjot Kaur', times: '4:00PM – 8:00PM', type: 'Afternoon', hours: '4 hrs' },
    { date: '11/04/2026', day: 'Sat', staff: 'Avneet Kaur', times: '8:00PM – 6:00AM', type: 'Evening + Sleepover', hours: '10 hrs' },
    { date: '12/04/2026', day: 'Sun', staff: 'Avneet Kaur', times: '6:00AM – 9:00AM', type: 'Morning', hours: '3 hrs' },
    { date: '12/04/2026', day: 'Sun', staff: 'Vishali Gill', times: '9:00AM – 12:00PM', type: 'Morning', hours: '3 hrs' },
    { date: '12/04/2026', day: 'Sun', staff: 'Prabhjot Kaur', times: '4:00PM – 8:00PM', type: 'Afternoon', hours: '4 hrs' },
    { date: '12/04/2026', day: 'Sun', staff: 'Avneet Kaur', times: '8:00PM – 6:00AM', type: 'Evening + Sleepover', hours: '10 hrs' },
  ],
  totalDays: 7,
  totalStaff: 5,
  totalHours: 134,
  staffList: 'Pawandeep Kaur, Avneet Kaur, Vishali Gill, Gurpreet Kaur, Prabhjot Kaur',
  invoiceRefs: [
    { staff: 'Avneet Kaur', invoiceNo: '003', period: '6 Apr – 12 Apr 2026', filename: 'Payslip_Avneet_Kaur.pdf', totalHours: '57 hrs' },
    { staff: 'Vishali Gill', invoiceNo: '002', period: '6 Apr – 12 Apr 2026', filename: 'Payslip_Vishali_Gill.pdf', totalHours: '25.5 hrs' },
    { staff: 'Pawandeep Kaur', invoiceNo: '002', period: '6 Apr – 12 Apr 2026', filename: 'Payslip_Pawandeep_Kaur.pdf', totalHours: '6 hrs' },
  ],
};

// ── HTML TEMPLATE ──

function buildHTML(data) {
  const invoiceRefRows = (data.invoiceRefs || []).map((r, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
      <td style="font-weight:500">${r.staff}</td>
      <td>${r.invoiceNo}</td>
      <td>${r.period}</td>
      <td>${r.totalHours}</td>
      <td style="font-size:8.5px;color:#64748b">${r.filename}</td>
    </tr>
  `).join('');

  const shiftRows = data.shifts.map((s, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
      <td>${s.date}</td>
      <td>${s.day}</td>
      <td>${s.staff}</td>
      <td>${s.times}</td>
      <td>${s.type}</td>
      <td style="text-align:right">${s.hours}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4;margin:12mm 16mm}
body{font-family:'Inter',sans-serif;color:#1e293b;font-size:10px;line-height:1.4;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.header{display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;border-bottom:3px solid #0ea03e;margin-bottom:16px}
.header-left{display:flex;align-items:center;gap:14px}
.logo{height:44px}
.header h1{font-size:22px;font-weight:700;color:#1e293b;margin:0}
.header .sub{font-size:10px;color:#64748b;margin-top:2px}
.header-right{text-align:right;font-size:10px;color:#64748b}
.participant-bar{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px 18px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center}
.participant-bar h2{font-size:14px;font-weight:700;color:#1e293b}
.participant-bar .ndis{font-size:12px;color:#64748b}
.note{font-size:9px;color:#94a3b8;margin-bottom:14px;line-height:1.5}
table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:9.5px}
th{background:#1e293b;color:#fff;padding:8px 10px;text-align:left;font-weight:600;font-size:9px;text-transform:uppercase;letter-spacing:0.3px}
th:last-child{text-align:right}
td{padding:7px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top}
.summary{margin-bottom:20px}
.summary-row{display:flex;gap:32px;margin-bottom:6px;font-size:10px}
.summary-label{color:#64748b;font-weight:500}
.summary-value{font-weight:600;color:#1e293b}
.staff-list{font-size:9.5px;color:#64748b;margin-top:4px}
.staff-list span{font-weight:500;color:#1e293b}
.attached{background:#f8fafc;border-left:3px solid #d1d5db;padding:12px 16px;margin-top:24px;border-radius:0 6px 6px 0}
.attached h3{font-size:10px;font-weight:700;color:#1e293b;margin-bottom:4px}
.attached p{font-size:9px;color:#64748b}
.footer{position:fixed;bottom:0;left:0;right:0;padding:8px 16mm;font-size:8px;color:#94a3b8;display:flex;justify-content:space-between}
</style></head><body>

<div class="header">
  <div class="header-left">
    <img src="${logoDataUrl}" class="logo" />
    <div>
      <h1>Daily Staff Summary</h1>
      <div class="sub">One Life Foundation Pty Ltd</div>
    </div>
  </div>
  <div class="header-right">Generated: 4 July 2026</div>
</div>

<div class="participant-bar">
  <h2>Participant: ${data.name}</h2>
  <div class="ndis">NDIS No: ${data.ndis}</div>
</div>

<p class="note">This summary provides an at-a-glance view of all staff rostered per day. Corresponding invoices, timesheets, and progress notes are attached separately.</p>

<table>
  <thead>
    <tr>
      <th>Date</th>
      <th>Day</th>
      <th>Staff Member</th>
      <th>Shift Times</th>
      <th>Service Type</th>
      <th>Hours</th>
    </tr>
  </thead>
  <tbody>
    ${shiftRows}
  </tbody>
</table>

<div class="summary">
  <h3 style="font-size:12px;font-weight:700;margin-bottom:8px">Summary</h3>
  <div class="summary-row">
    <div><span class="summary-label">Total Service Days:</span> <span class="summary-value">${data.totalDays}</span></div>
    <div><span class="summary-label">Total Staff Members:</span> <span class="summary-value">${data.totalStaff}</span></div>
    <div><span class="summary-label">Total Hours:</span> <span class="summary-value">${data.totalHours}</span></div>
  </div>
  <div class="staff-list"><span>Staff:</span> ${data.staffList}</div>
</div>

${invoiceRefRows ? `
<h3 style="font-size:12px;font-weight:700;margin-bottom:8px">Attached Staff Invoices</h3>
<table style="margin-bottom:20px">
  <thead>
    <tr>
      <th>Staff Member</th>
      <th>Invoice #</th>
      <th>Service Period</th>
      <th>Total Hours</th>
      <th>Document</th>
    </tr>
  </thead>
  <tbody>
    ${invoiceRefRows}
  </tbody>
</table>
` : ''}

<div class="attached">
  <h3>Attached Supporting Documents:</h3>
  <p>Individual staff invoices, roster/timesheets, progress notes, and participant service agreement.</p>
</div>

<div class="footer">
  <span>One Life Foundation Pty Ltd · ABN: 65 672 812 516 · support@olfndisservices.com.au · 0457 347 882</span>
  <span>Confidential — Daily Staff Summary</span>
</div>

</body></html>`;
}

// ── GENERATE ──

async function generate() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const data of [nathan, nicole]) {
    const html = buildHTML(data);
    await page.setContent(html, { waitUntil: 'networkidle' });
    const safeName = data.name.replace(/\s+/g, '_');
    const outPath = path.join(outDir, `${safeName}_Daily_Staff_Summary.pdf`);
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', bottom: '12mm', left: '16mm', right: '16mm' },
    });
    console.log(`Generated: ${outPath}`);
  }

  await browser.close();
}

generate().catch(console.error);
