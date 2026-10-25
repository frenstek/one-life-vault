/**
 * Training Attendance Record Template
 * OLF branded, printable A4 with sign-off rows
 */

import { jsPDF } from 'jspdf';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');

const SUPA_URL = 'https://czdlemutsimvwfpwylxh.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGxlbXV0c2ltdndmcHd5bHhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjQ3NCwiZXhwIjoyMDkwMjQyNDc0fQ.ZueFz5cozYoC_TNUH_wX5Ak5G2PAdBMzJyrr_0gzPHk';
const sb = createClient(SUPA_URL, SUPA_KEY);

const logoPath = path.join(PROJECT, 'public', 'logo.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoDataUrl = 'data:image/png;base64,' + logoBase64;

// Use HTML + Playwright for clean output instead of jsPDF
const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Training Attendance Record</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4;margin:10mm 14mm}
body{font-family:'Inter',sans-serif;color:#1e293b;font-size:9px;line-height:1.4;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.logo{height:28px;margin-bottom:4px}
.header{display:flex;align-items:center;gap:12px;padding-bottom:8px;border-bottom:3px solid #0ea03e;margin-bottom:12px}
.header h1{font-size:18px;font-weight:800;color:#0ea03e;line-height:1.1}
.header .sub{font-size:9px;color:#64748b;font-weight:400}
.section-title{font-size:10px;font-weight:800;color:#0ea03e;text-transform:uppercase;letter-spacing:0.06em;margin:10px 0 6px;display:flex;align-items:center;gap:6px}
.section-title::after{content:'';flex:1;height:1px;background:#d1d5db}
.field-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:10px}
.field{padding:6px 10px;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;min-height:28px}
.field:nth-child(even){border-right:none}
.field.full{grid-column:1/-1;border-right:none}
.field-label{font-size:7.5px;font-weight:700;color:#0ea03e;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px}
.field-value{font-size:9px;color:#94a3b8;min-height:14px}
.field-checkboxes{font-size:8.5px;color:#334155;display:flex;flex-wrap:wrap;gap:8px;margin-top:2px}
.field-checkboxes label{display:flex;align-items:center;gap:3px}
.cb{width:10px;height:10px;border:1.5px solid #0ea03e;border-radius:2px;display:inline-block;flex-shrink:0}
.desc-box{border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;min-height:50px;margin-bottom:10px}
.desc-box .placeholder{font-size:8px;color:#cbd5e1;font-style:italic}
.attendance-table{width:100%;border-collapse:collapse;margin-bottom:10px}
.attendance-table th{background:#0ea03e;color:#fff;padding:5px 6px;text-align:left;font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em}
.attendance-table td{padding:5px 6px;border-bottom:1px solid #e2e8f0;height:22px;font-size:8.5px;color:#94a3b8}
.attendance-table tr:nth-child(even) td{background:#f8fafc}
.attendance-table .row-num{color:#cbd5e1;font-weight:600;width:20px;text-align:center}
.confirm{font-size:7.5px;color:#64748b;font-style:italic;margin-bottom:6px;padding:4px 8px;background:#f0fdf4;border-radius:4px;border:1px solid #bbf7d0}
.sign-off{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px;padding-top:10px;border-top:2px solid #0ea03e}
.sign-block{font-size:9px}
.sign-label{font-size:7.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px}
.sign-line{border-bottom:1px solid #1e293b;height:24px;margin-bottom:3px}
.sign-name{font-size:8px;color:#94a3b8}
.footer{margin-top:auto;padding-top:8px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:7px;color:#cbd5e1;position:fixed;bottom:10mm;left:14mm;right:14mm}
@media screen{body{background:#ddd;padding:10px}.page{background:#fff;max-width:210mm;margin:0 auto;padding:14mm;box-shadow:0 2px 10px rgba(0,0,0,0.2)}}
</style></head><body>
<div class="page">

<div class="header">
<img src="${logoDataUrl}" class="logo" />
<div>
<h1>Training Attendance Record</h1>
<div class="sub">One Life Foundation &mdash; NDIS Registered Provider</div>
</div>
</div>

<div class="section-title">Training Details</div>
<div class="field-grid">
<div class="field full">
  <div class="field-label">Training Title</div>
  <div class="field-value">&nbsp;</div>
</div>
<div class="field full">
  <div class="field-label">Training Category</div>
  <div class="field-checkboxes">
    <label><span class="cb"></span> Induction</label>
    <label><span class="cb"></span> High Intensity</label>
    <label><span class="cb"></span> WHS / Safety</label>
    <label><span class="cb"></span> Medication</label>
    <label><span class="cb"></span> Manual Handling</label>
    <label><span class="cb"></span> Infection Control</label>
    <label><span class="cb"></span> First Aid / CPR</label>
    <label><span class="cb"></span> Restrictive Practices</label>
    <label><span class="cb"></span> Other: ______________</label>
  </div>
</div>
<div class="field">
  <div class="field-label">Date</div>
  <div class="field-value">______ / ______ / ____________</div>
</div>
<div class="field">
  <div class="field-label">Duration</div>
  <div class="field-value">Start: __________ &nbsp;&nbsp; End: __________ &nbsp;&nbsp; Total: ______ hrs</div>
</div>
<div class="field">
  <div class="field-label">Location / Venue</div>
  <div class="field-checkboxes">
    <label><span class="cb"></span> Office</label>
    <label><span class="cb"></span> On-site (property)</label>
    <label><span class="cb"></span> Online / Video</label>
    <label><span class="cb"></span> External venue</label>
  </div>
</div>
<div class="field">
  <div class="field-label">Delivery Method</div>
  <div class="field-checkboxes">
    <label><span class="cb"></span> Presentation</label>
    <label><span class="cb"></span> Practical / Hands-on</label>
    <label><span class="cb"></span> Video + Discussion</label>
    <label><span class="cb"></span> Reading + Assessment</label>
  </div>
</div>
<div class="field full">
  <div class="field-label">Trainer / Facilitator Name &amp; Qualifications</div>
  <div class="field-value">&nbsp;</div>
</div>
</div>

<div class="section-title">Training Description &amp; Learning Objectives</div>
<div class="desc-box">
<div class="placeholder">Describe the training content, key topics covered, and learning objectives for this session:</div>
</div>

<div class="section-title">Attendance Sign-Off</div>
<div class="confirm">By signing below, I confirm that I attended this training session, understood the content delivered, and will apply the learnings in my role.</div>

<table class="attendance-table">
<thead>
<tr>
<th style="width:20px">#</th>
<th style="width:30%">Full Name (Print)</th>
<th style="width:18%">Position</th>
<th style="width:15%">Date</th>
<th>Signature</th>
</tr>
</thead>
<tbody>
${Array.from({length: 15}, (_, i) => `<tr><td class="row-num">${i+1}</td><td></td><td></td><td></td><td></td></tr>`).join('\n')}
</tbody>
</table>

<div class="section-title">Trainer Sign-Off</div>
<div class="sign-off">
<div class="sign-block">
  <div class="sign-label">Trainer Name</div>
  <div class="sign-line"></div>
  <div class="sign-name">Print name</div>
</div>
<div class="sign-block">
  <div class="sign-label">Trainer Signature</div>
  <div class="sign-line"></div>
  <div class="sign-name">Sign &amp; date</div>
</div>
</div>

<div class="footer">
<span>One Life Foundation | Training Attendance Record | Version 1.0</span>
<span>Controlled Document &mdash; Retain for minimum 7 years</span>
</div>

</div>
</body></html>`;

fs.writeFileSync('C:/Users/kevin/Downloads/OLF-Training-Attendance-Template.html', html);
console.log('HTML saved, converting to PDF...');
