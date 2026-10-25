import { useState } from 'react';
import jsPDF from 'jspdf';
import { HiArrowDownTray, HiDocumentText } from 'react-icons/hi2';

// ─── OLF Brand Colors ────────────────────────────────────────────────────────
const NAVY = [15, 82, 138]; // #0F528A
const OLF_GREEN = [14, 160, 62]; // #0ea03e
const WHITE = [255, 255, 255];
const DARK_TEXT = [30, 41, 59]; // #1e293b
const MEDIUM_TEXT = [71, 85, 105]; // #475569
const LIGHT_TEXT = [148, 163, 184]; // #94a3b8
const BORDER_COLOR = [226, 232, 240]; // #e2e8f0
const RED_BG = [254, 242, 242]; // #fef2f2
const RED_BORDER = [239, 68, 68]; // #ef4444
const RED_TEXT = [153, 27, 27]; // #991b1b
const AMBER_BG = [255, 251, 235]; // #fffbeb
const AMBER_BORDER = [245, 158, 11]; // #f59e0b
const AMBER_TEXT = [146, 64, 14]; // #92400e
const BLUE_BG = [239, 246, 255]; // #eff6ff
const BLUE_TEXT = [30, 64, 175]; // #1e40af
const GREEN_BG = [240, 253, 244]; // #f0fdf4
const GREEN_TEXT = [22, 101, 52]; // #166534
const LABEL_BG = [245, 247, 250]; // #F5F7FA
const TABLE_BORDER = [203, 213, 225]; // #cbd5e1

// ─── PDF Constants ───────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 16;
const MARGIN_R = 16;
const MARGIN_T = 8;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const HEADER_BAR_H = 8;
const FOOTER_H = 12;
const BODY_TOP = MARGIN_T + HEADER_BAR_H + 6;
const BODY_BOTTOM = PAGE_H - FOOTER_H - 10;
const OLF_PHONE = '0420 652 270';
const OLF_EMAIL = 'support@olfndisservices.com.au';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function calcAge(dob) {
  if (!dob) return '';
  const born = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  if (now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) age--;
  return age;
}

// ─── Logo loader ─────────────────────────────────────────────────────────────
async function loadLogoBase64() {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = '/logo.png';
    });
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/png');
  } catch {
    return null;
  }
}

// ─── Default content generator (shared with OrientationTab) ──────────────

export function generateDefaults(participant, supportPlan, hospitalPassport) {
  const name = participant.preferred_name || participant.first_name || 'Participant';
  const d = {};

  d.about = participant.bio || '';

  d.likes = hospitalPassport?.things_i_like || '';
  d.dislikes = hospitalPassport?.things_i_dont_like || '';
  d.upsets = hospitalPassport?.things_that_upset_me || '';
  d.calms = hospitalPassport?.things_that_calm_me || '';

  const alerts = [];
  if (participant.dietary_requirements?.toLowerCase().includes('fluid restriction')) {
    alerts.push(`FLUID RESTRICTION: ${participant.dietary_requirements.trim()} Monitor and record ALL fluid intake on the fluid balance chart.`);
  }
  if (participant.mobility?.toLowerCase().includes('two') || participant.mobility?.toLowerCase().includes('2')) {
    alerts.push(`TWO (2) SUPPORT WORKERS required for ALL transfers. Always use ceiling hoist and sling. NEVER attempt manual lifting.`);
  }
  if (participant.allergies) {
    alerts.push(`ALLERGIES: ${participant.allergies}`);
  }
  d.critical_alerts = alerts.join('\n\n');

  d.daily_routine_morning = supportPlan?.daily_support_needs?.match(/MORNING[\s\S]*?(?=AFTERNOON|$)/i)?.[0]?.trim() || '';
  d.daily_routine_afternoon = supportPlan?.daily_support_needs?.match(/AFTERNOON[\s\S]*?(?=EVENING|$)/i)?.[0]?.trim() || '';
  d.daily_routine_evening = supportPlan?.daily_support_needs?.match(/EVENING[\s\S]*?(?=OVERNIGHT|$)/i)?.[0]?.trim() || '';
  d.daily_routine_overnight = supportPlan?.daily_support_needs?.match(/OVERNIGHT[\s\S]*/i)?.[0]?.trim() || '';
  if (!d.daily_routine_morning && supportPlan?.daily_support_needs) {
    d.daily_routine_morning = supportPlan.daily_support_needs;
    d.daily_routine_afternoon = '';
    d.daily_routine_evening = '';
    d.daily_routine_overnight = '';
  }

  d.medication_management = participant.medications_summary || '';
  d.insulin_schedule = '';
  d.personal_care = '';
  d.meals_nutrition = participant.dietary_requirements || '';
  d.mobility_transfers = participant.mobility || '';
  d.communication_style = (participant.communication_needs || '') + (supportPlan?.communication ? '\n\n' + supportPlan.communication : '');
  d.behaviour_guidance = supportPlan?.behaviour_support || '';
  d.behaviour_notes = '';

  if (hospitalPassport?.routine_appointments) {
    let appts = hospitalPassport.routine_appointments;
    if (typeof appts === 'string') try { appts = JSON.parse(appts); } catch { appts = []; }
    if (Array.isArray(appts)) {
      d.appointments = appts.map(a => `${a.name || ''}: ${a.frequency || ''} at ${a.location || ''} (${a.time || ''}) — Transport: ${a.transport || ''}`).join('\n');
    }
  }

  d.risk_management = supportPlan?.risk_management || '';
  d.emergency_protocols = '';
  d.household_duties = '';
  d.family_visitors = '';
  d.additional_notes = '';

  return d;
}

// ─── PDF Generator ───────────────────────────────────────────────────────────

export async function generateOrientationPDF(participant, supportPlan, hospitalPassport, sections = null) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let pageNum = 1;
  let y = BODY_TOP;

  const logoData = await loadLogoBase64();
  const name = participant.preferred_name || participant.first_name || 'Participant';
  const fullName = `${participant.first_name || ''} ${participant.last_name || ''}`.trim();
  const docTitle = 'Support Worker Orientation Guide';

  // ─── Header (navy bar + logo) ─────────────────────────────────────────────
  function drawHeader() {
    pdf.setFillColor(...NAVY);
    pdf.rect(0, 0, PAGE_W, MARGIN_T + HEADER_BAR_H, 'F');
    if (logoData) {
      try { pdf.addImage(logoData, 'PNG', MARGIN_L - 2, 1, 22, 11); } catch {}
    }
  }

  // ─── Footer ───────────────────────────────────────────────────────────────
  function drawFooter() {
    const footerY = PAGE_H - 8;
    pdf.setDrawColor(...BORDER_COLOR);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_L, footerY - 4, PAGE_W - MARGIN_R, footerY - 4);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(...LIGHT_TEXT);
    pdf.text(`One Life Foundation  |  ${docTitle}  |  ${fullName}  |  NDIS: ${participant.ndis_number || '--'}`, MARGIN_L, footerY);
    pdf.text(`Page ${pageNum}`, PAGE_W - MARGIN_R, footerY, { align: 'right' });
  }

  // ─── New page ─────────────────────────────────────────────────────────────
  function newPage() {
    drawFooter();
    pdf.addPage();
    pageNum++;
    drawHeader();
    y = BODY_TOP;
  }

  function ensureSpace(needed) {
    if (y + needed > BODY_BOTTOM) newPage();
  }

  // ─── Section heading ──────────────────────────────────────────────────────
  function sectionHeading(title, color = NAVY) {
    // Separator line above section (except at top of page)
    if (y > BODY_TOP + 5) {
      ensureSpace(20);
      pdf.setDrawColor(...BORDER_COLOR);
      pdf.setLineWidth(0.3);
      pdf.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
      y += 6;
    } else {
      ensureSpace(14);
    }
    pdf.setFillColor(...color);
    pdf.rect(MARGIN_L, y, CONTENT_W, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...WHITE);
    pdf.text(title.toUpperCase(), MARGIN_L + 4, y + 5.8);
    y += 12;
  }

  // ─── Sub heading ──────────────────────────────────────────────────────────
  function subHeading(title) {
    ensureSpace(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...NAVY);
    pdf.text(title, MARGIN_L + 2, y + 3);
    y += 5;
    pdf.setDrawColor(...NAVY);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_L + 2, y, MARGIN_L + 2 + Math.min(pdf.getTextWidth(title) + 4, CONTENT_W - 4), y);
    y += 4;
  }

  // ─── Info table (label-value pairs) ────────────────────────────────────────
  function infoTable(rows, colSplit = 52) {
    for (const [label, value] of rows) {
      const valText = value || '--';
      const valLines = pdf.splitTextToSize(String(valText), CONTENT_W - colSplit - 6);
      const rowH = Math.max(6, valLines.length * 3.8 + 2);
      ensureSpace(rowH + 1);

      // Label bg
      pdf.setFillColor(...LABEL_BG);
      pdf.rect(MARGIN_L, y, colSplit, rowH, 'F');
      // Borders
      pdf.setDrawColor(...TABLE_BORDER);
      pdf.setLineWidth(0.2);
      pdf.rect(MARGIN_L, y, CONTENT_W, rowH);
      pdf.line(MARGIN_L + colSplit, y, MARGIN_L + colSplit, y + rowH);

      // Label
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...DARK_TEXT);
      pdf.text(label, MARGIN_L + 3, y + 4.2);

      // Value
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...DARK_TEXT);
      pdf.text(valLines, MARGIN_L + colSplit + 3, y + 4.2);

      y += rowH;
    }
    y += 3;
  }

  // ─── Alert box ────────────────────────────────────────────────────────────
  function alertBox(title, text, type = 'red') {
    const colors = {
      red: { bg: RED_BG, border: RED_BORDER, text: RED_TEXT },
      amber: { bg: AMBER_BG, border: AMBER_BORDER, text: AMBER_TEXT },
      blue: { bg: BLUE_BG, border: [59, 130, 246], text: BLUE_TEXT },
      green: { bg: GREEN_BG, border: [34, 197, 94], text: GREEN_TEXT },
    };
    const c = colors[type] || colors.red;
    const lines = pdf.splitTextToSize(text, CONTENT_W - 14);
    const boxH = (title ? 6 : 0) + lines.length * 3.8 + 6;
    ensureSpace(boxH + 3);

    pdf.setFillColor(...c.bg);
    pdf.roundedRect(MARGIN_L, y, CONTENT_W, boxH, 1.5, 1.5, 'F');
    pdf.setDrawColor(...c.border);
    pdf.setLineWidth(0.6);
    pdf.roundedRect(MARGIN_L, y, CONTENT_W, boxH, 1.5, 1.5, 'S');
    // Left accent
    pdf.setFillColor(...c.border);
    pdf.rect(MARGIN_L, y + 1.5, 2, boxH - 3, 'F');

    let textY = y + 4.5;
    if (title) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...c.text);
      pdf.text(title, MARGIN_L + 7, textY);
      textY += 5;
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...c.text);
    pdf.text(lines, MARGIN_L + 7, textY);

    y += boxH + 4;
  }

  // ─── Paragraph text ───────────────────────────────────────────────────────
  function paragraph(text, indent = 0) {
    if (!text) return;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    const lines = pdf.splitTextToSize(text, CONTENT_W - indent - 4);
    for (const line of lines) {
      ensureSpace(4.5);
      pdf.setTextColor(...DARK_TEXT);
      pdf.text(line, MARGIN_L + 2 + indent, y + 3);
      y += 3.8;
    }
    y += 2;
  }

  // ─── Bullet list ──────────────────────────────────────────────────────────
  function bulletList(items, indent = 4) {
    for (const item of items) {
      if (!item) continue;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      const lines = pdf.splitTextToSize(item, CONTENT_W - indent - 10);
      ensureSpace(lines.length * 3.8 + 2);
      pdf.setTextColor(...DARK_TEXT);
      pdf.text('•', MARGIN_L + indent, y + 3);
      pdf.text(lines, MARGIN_L + indent + 5, y + 3);
      y += lines.length * 3.8 + 1;
    }
    y += 2;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1: COVER / TITLE PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  drawHeader();

  // ─── Cover: Logo centered ─────────────────────────────────────────────────
  y = 30;
  if (logoData) {
    const logoW = 50;
    const logoH = 25;
    const logoX = (PAGE_W - logoW) / 2;
    try { pdf.addImage(logoData, 'PNG', logoX, y, logoW, logoH); } catch {}
    y += logoH + 8;
  } else {
    // Fallback: text company name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(...NAVY);
    pdf.text('One Life Foundation', PAGE_W / 2, y + 10, { align: 'center' });
    y += 20;
  }

  // Thin navy line under logo
  pdf.setDrawColor(...NAVY);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
  y += 10;

  // Title block
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(...NAVY);
  pdf.text('Support Worker', MARGIN_L, y);
  y += 12;
  pdf.text('Orientation Guide', MARGIN_L, y);
  y += 14;

  // Thick navy divider
  pdf.setFillColor(...NAVY);
  pdf.rect(MARGIN_L, y, CONTENT_W, 1.2, 'F');
  y += 8;

  // Participant name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(...DARK_TEXT);
  pdf.text(fullName, MARGIN_L, y);
  y += 8;

  if (participant.preferred_name && participant.preferred_name !== participant.first_name) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(...MEDIUM_TEXT);
    pdf.text(`Preferred Name: ${participant.preferred_name}`, MARGIN_L, y);
    y += 6;
  }

  // Thin line under name
  y += 2;
  pdf.setDrawColor(...BORDER_COLOR);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
  y += 6;

  // Quick details table
  infoTable([
    ['NDIS Number', participant.ndis_number],
    ['Date of Birth', `${fmtDate(participant.date_of_birth)}${participant.date_of_birth ? ` (Age ${calcAge(participant.date_of_birth)})` : ''}`],
    ['Address', participant.location],
    ['Phone', participant.phone],
    ['Funding Type', participant.funding_type],
    ['Support Level', `${participant.support_level} — ${participant.funding_ratio || '1:1'} ratio`],
  ]);

  y += 4;

  // Confidentiality notice
  alertBox(
    'CONFIDENTIAL DOCUMENT',
    'This document contains personal and medical information protected under the Privacy Act 1988 (Cth) and the NDIS Act 2013. It is intended solely for authorised One Life Foundation support workers assigned to this participant. Do not copy, share, photograph, or distribute this document. Return to your Team Leader at the end of your orientation.',
    'amber',
  );

  // Generated date
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...LIGHT_TEXT);
  pdf.text(`Document generated: ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`, MARGIN_L, y + 2);
  pdf.text('One Life Foundation Pty Ltd  |  ABN 59 668 648 977', MARGIN_L, y + 7);

  drawFooter();

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT PAGES — every section comes from THIS participant's saved
  // orientation record (or the auto-generated defaults from their profile).
  // Nothing here is written for one specific person.
  // ═══════════════════════════════════════════════════════════════════════════

  const s = sections && Object.keys(sections).length ? sections : generateDefaults(participant, supportPlan, hospitalPassport);
  const txt = (k) => (s[k] || '').toString().trim();
  const blocks = (k) => txt(k).split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  const lines = (k) => txt(k).split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
  let n = 0;
  const num = () => `${++n}. `;

  // Renders a free-text section as paragraphs, or as bullets when the text is a list.
  function textSection(title, key, { fallback } = {}) {
    const t = txt(key);
    if (!t && !fallback) return false;
    sectionHeading(num() + title);
    if (!t) { paragraph(fallback); return true; }
    const ls = t.split('\n').map(l => l.trim()).filter(Boolean);
    const listy = ls.length > 1 && ls.filter(l => /^[-•*]\s/.test(l)).length >= Math.ceil(ls.length / 2);
    if (listy) bulletList(ls.map(l => l.replace(/^[-•*]\s*/, '')));
    else for (const b of blocks(key)) paragraph(b);
    return true;
  }

  newPage();

  // ─── About ────────────────────────────────────────────────────────────────
  sectionHeading(num() + 'About ' + name);
  paragraph(txt('about') || participant.bio || `No profile summary has been recorded for ${name} yet.`);
  if (txt('likes')) { subHeading('Things ' + name + ' Likes'); paragraph(txt('likes')); }
  if (txt('dislikes')) { subHeading('Things ' + name + ' Doesn\'t Like'); paragraph(txt('dislikes')); }
  if (txt('upsets')) { subHeading('Things That May Upset ' + name); paragraph(txt('upsets')); }
  if (txt('calms')) { subHeading('What Helps ' + name + ' Feel Calm'); paragraph(txt('calms')); }

  // ─── Key contacts (from the participant record) ───────────────────────────
  sectionHeading(num() + 'Key Contacts');

  subHeading('Emergency Contact');
  infoTable([
    ['Name', participant.emergency_contact_name],
    ['Relationship', participant.emergency_contact_relationship],
    ['Phone', participant.emergency_contact_phone],
  ]);

  subHeading('General Practitioner');
  infoTable([
    ['Doctor', participant.gp_name],
    ['Clinic', participant.gp_clinic],
    ['Phone', participant.gp_phone],
  ]);

  if (participant.support_coordinator_name || participant.support_coordinator_organisation) {
    subHeading('Support Coordinator');
    infoTable([
      ['Name', participant.support_coordinator_name],
      ['Organisation', participant.support_coordinator_organisation],
      ['Phone', participant.support_coordinator_phone],
      ['Email', participant.support_coordinator_email],
    ]);
  }

  if (participant.plan_manager_organisation || participant.plan_manager_email) {
    subHeading('Plan Manager');
    infoTable([
      ['Organisation', participant.plan_manager_organisation],
      ['Email', participant.plan_manager_email],
    ]);
  }

  if (participant.pharmacy_name) {
    subHeading('Pharmacy');
    infoTable([
      ['Name', participant.pharmacy_name],
      ['Address', participant.pharmacy_address],
      ['Phone', participant.pharmacy_phone],
    ]);
  }

  const specialists = [];
  if (participant.occupational_therapist) specialists.push(['Occupational Therapist', participant.occupational_therapist]);
  if (participant.speech_pathologist) specialists.push(['Speech Pathologist', participant.speech_pathologist]);
  if (participant.psychologist) specialists.push(['Psychologist', participant.psychologist]);
  if (specialists.length > 0) {
    subHeading('Allied Health');
    infoTable(specialists);
  }

  subHeading('One Life Foundation (Provider)');
  infoTable([
    ['Phone', OLF_PHONE],
    ['Email', OLF_EMAIL],
  ]);

  // ─── Medical overview (from the participant record) ───────────────────────
  sectionHeading(num() + 'Medical Overview');
  subHeading('Primary Disability');
  paragraph(participant.primary_disability || '--');
  if (participant.secondary_disability) {
    subHeading('Secondary Conditions');
    paragraph(participant.secondary_disability);
  }
  if (participant.allergies) alertBox('ALLERGIES', participant.allergies, 'red');
  if (hospitalPassport?.nfr_status) {
    const nfrLabel = hospitalPassport.nfr_status === 'full_code' ? 'FOR RESUSCITATION' : String(hospitalPassport.nfr_status).replace(/_/g, ' ').toUpperCase();
    alertBox('RESUSCITATION STATUS', nfrLabel, hospitalPassport.nfr_status === 'full_code' ? 'green' : 'red');
  }

  // ─── Critical alerts (saved section, one red box per paragraph) ───────────
  const alerts = blocks('critical_alerts');
  if (alerts.length) {
    sectionHeading(num() + 'Critical Alerts — Must Read', [185, 28, 28]);
    for (const a of alerts) {
      const m = a.match(/^([A-Z0-9 ()/&'-]{4,60}):\s*([\s\S]+)$/);
      if (m) alertBox(m[1].trim(), m[2].trim(), 'red');
      else alertBox('', a, 'red');
    }
  }

  // ─── Daily routine ────────────────────────────────────────────────────────
  const routine = [
    ['Morning', 'daily_routine_morning'],
    ['Afternoon', 'daily_routine_afternoon'],
    ['Evening', 'daily_routine_evening'],
    ['Overnight', 'daily_routine_overnight'],
  ].filter(([, k]) => txt(k));
  if (routine.length) {
    sectionHeading(num() + 'Daily Routine');
    for (const [label, k] of routine) {
      subHeading(label);
      const ls = lines(k);
      if (ls.length > 1) bulletList(ls); else paragraph(ls[0]);
    }
  }

  // ─── Medication ───────────────────────────────────────────────────────────
  if (txt('medication_management') || txt('insulin_schedule') || participant.medications_summary) {
    sectionHeading(num() + 'Medication Management');
    for (const b of blocks('medication_management')) paragraph(b);
    if (!txt('medication_management') && participant.medications_summary) paragraph(participant.medications_summary);
    if (txt('insulin_schedule')) {
      subHeading('Insulin / Medication Schedule');
      const rows = lines('insulin_schedule').map(l => {
        const i = l.indexOf(':');
        return i > 0 && i < 30 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : null;
      });
      if (rows.length && rows.every(Boolean)) infoTable(rows);
      else bulletList(lines('insulin_schedule'));
    }
  }

  // ─── Free-text sections ───────────────────────────────────────────────────
  textSection('Personal Care', 'personal_care');
  textSection('Meals & Nutrition', 'meals_nutrition', { fallback: participant.dietary_requirements });
  textSection('Mobility & Transfers', 'mobility_transfers', { fallback: participant.mobility });

  if (txt('communication_style') || txt('behaviour_guidance') || txt('behaviour_notes') || hospitalPassport?.behaviour_triggers || hospitalPassport?.behaviour_strategies) {
    sectionHeading(num() + 'Communication & Behaviour');
    if (txt('communication_style')) { subHeading('Communication Style'); for (const b of blocks('communication_style')) paragraph(b); }
    if (txt('behaviour_guidance')) { subHeading('Behaviour Guidance'); for (const b of blocks('behaviour_guidance')) paragraph(b); }
    if (txt('behaviour_notes')) { subHeading('What to Expect (from progress notes)'); const ls = lines('behaviour_notes'); if (ls.length > 1) bulletList(ls); else paragraph(ls[0]); }
    if (hospitalPassport?.behaviour_triggers || hospitalPassport?.behaviour_strategies) {
      subHeading('Triggers & Strategies');
      infoTable([
        ['Known Triggers', hospitalPassport.behaviour_triggers || '--'],
        ['Recommended Strategies', hospitalPassport.behaviour_strategies || '--'],
      ], 52);
    }
  }

  if (txt('appointments')) {
    sectionHeading(num() + 'Appointments & Transport');
    const ls = lines('appointments');
    if (ls.length > 1) bulletList(ls); else paragraph(ls[0]);
  }

  textSection('Risk Management', 'risk_management');

  // ─── Emergency ────────────────────────────────────────────────────────────
  sectionHeading(num() + 'Emergency Protocols', [185, 28, 28]);
  if (txt('emergency_protocols')) {
    const ls = lines('emergency_protocols');
    if (ls.length > 1) bulletList(ls); else paragraph(ls[0]);
  }
  subHeading('In an Emergency');
  const age = participant.date_of_birth ? `${calcAge(participant.date_of_birth)} years old, ` : '';
  const conditions = [participant.primary_disability, participant.secondary_disability].filter(Boolean).join('; ');
  bulletList([
    'Call 000 immediately for: unresponsiveness, breathing difficulty, chest pain, seizure, severe bleeding, signs of stroke, or any situation you believe is life-threatening',
    `Tell 000: "${fullName}, ${age}${participant.location || 'address on file'}. NDIS participant${conditions ? ` with ${conditions}` : ''}."`,
    `Call One Life Foundation: ${OLF_PHONE}`,
    participant.emergency_contact_name ? `Call emergency contact: ${participant.emergency_contact_name}${participant.emergency_contact_phone ? ` — ${participant.emergency_contact_phone}` : ''}` : null,
    'Complete an incident report in the One Life Vault system before the end of your shift',
  ]);

  // ─── Household, family, notes ─────────────────────────────────────────────
  textSection('Household & General Duties', 'household_duties', {
    fallback: 'Keep the house clean and tidy (kitchen, bathroom, floors). Laundry washed, dried, folded and put away. Dishes done after each meal. Bins out on collection day. Remove expired food from the fridge. Tell your Team Leader when supplies are running low.',
  });
  textSection('Family & Visitors', 'family_visitors');
  textSection('Additional Notes', 'additional_notes');

  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF ACKNOWLEDGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  sectionHeading(num() + 'Staff Acknowledgement');

  paragraph('By signing below, I acknowledge that I have read and understood this Support Worker Orientation Guide for ' + fullName + '. I understand the care requirements, medical needs, critical alerts, and emergency procedures outlined in this document. I will follow these procedures during every shift and report any concerns to my Team Leader immediately.');

  y += 4;

  // Sign-off table header
  ensureSpace(50);
  const cols = [0, 52, 90, 135, 158];
  const colLabels = ['Staff Name', 'Signature', 'Date', 'Initials'];
  const tableW = CONTENT_W;
  const rowH = 10;
  const headerH = 7;

  // Header row
  pdf.setFillColor(...NAVY);
  pdf.rect(MARGIN_L, y, tableW, headerH, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...WHITE);
  for (let i = 0; i < colLabels.length; i++) {
    pdf.text(colLabels[i], MARGIN_L + cols[i] + 3, y + 5);
  }
  y += headerH;

  // 8 blank rows
  for (let r = 0; r < 8; r++) {
    ensureSpace(rowH + 1);
    pdf.setDrawColor(...TABLE_BORDER);
    pdf.setLineWidth(0.2);
    pdf.rect(MARGIN_L, y, tableW, rowH);
    for (let c = 1; c < cols.length; c++) {
      pdf.line(MARGIN_L + cols[c], y, MARGIN_L + cols[c], y + rowH);
    }
    y += rowH;
  }

  drawFooter();

  return pdf;
}

// ─── React Component ─────────────────────────────────────────────────────────

export default function OrientationPDF({ participant, supportPlan, hospitalPassport, sections = null, className = '' }) {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const pdf = await generateOrientationPDF(participant, supportPlan, hospitalPassport, sections);
      const name = `${participant.first_name || ''}-${participant.last_name || ''}`.replace(/\s+/g, '-');
      pdf.save(`OLF-Orientation-Guide-${name}.pdf`);
    } catch (err) {
      console.error('Orientation PDF error:', err);
      alert('Failed to generate orientation PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={generating}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        generating
          ? 'bg-stone-100 text-stone-400 cursor-wait'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      } ${className}`}
    >
      {generating ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          Generating...
        </>
      ) : (
        <>
          <HiDocumentText className="h-4 w-4" />
          Orientation Guide
        </>
      )}
    </button>
  );
}
