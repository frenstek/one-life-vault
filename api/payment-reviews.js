/*  Payment Review Desk — NDIA payment integrity reviews (IPML0346, RTP6501 …).
 *  Replaces the old public auditor portal. Every request carries the vault
 *  session token; only owner/admin/manager profiles get in.
 *
 *  Evidence is never created here: the desk links files that already sit in
 *  the participant's vault folder (bucket `participant-files`) to a review +
 *  service week, and packs those same files for the NDIA. */
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import PDFDocument from 'pdfkit';
import { supabase } from './_lib/supabase.js';
import { verifyAuth } from './_lib/auth.js';
import { setCors, handleOptions } from './_lib/cors.js';
import {
  buildWeeks, reviewSummary, parseAttachmentA, prnGroup, kindLabel, weekEndOf, CLAIM_STATUSES, REVIEW_STATUSES,
} from '../src/lib/paymentReviews.js';

const FILES = 'participant-files';
const PACKS = 'payment-review-packs';
const NAVY = '#0F528A';
const LINE = '#C8D2DC';
const DIM = '#505050';

async function requireStaff(req, res) {
  const auth = await verifyAuth(req);
  if (!auth) { res.status(401).json({ error: 'Sign in required' }); return null; }
  if (!['owner', 'admin', 'manager'].includes(auth.profile?.role)) { res.status(403).json({ error: 'Payment reviews are admin and manager only' }); return null; }
  return auth;
}

const fail = (res, error, code = 500) => res.status(code).json({ error: error?.message || String(error) });
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' });
const money = (n) => `$${Number(n || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dmy = (iso) => (iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) : '-');
const weekLabel = (w) => (w.week_start ? `${dmy(w.week_start)} to ${dmy(w.week_end || weekEndOf(w.week_start))}` : 'Week not set');
const safe = (s) => String(s || '').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

async function loadReview(id) {
  const { data: review, error } = await supabase.from('pr_reviews').select('*').eq('id', id).single();
  if (error || !review) throw Object.assign(new Error('Review not found'), { code: 404 });
  const { data: claims, error: cErr } = await supabase.from('pr_claims').select('*').eq('review_id', id).order('posted').order('prn');
  if (cErr) throw cErr;
  const ids = [...new Set(claims.map((c) => c.participant_id).filter(Boolean))];
  let evidence = [];
  if (ids.length) {
    const { data, error: eErr } = await supabase.from('pr_evidence').select('*, review:pr_reviews(reference, round)').in('participant_id', ids).order('created_at');
    if (eErr) throw eErr;
    evidence = data;
  }
  return { review, claims, evidence };
}

// ─── reads ─────────────────────────────────────────────────────────────────

async function list(req, res) {
  const [{ data: reviews, error }, { data: claims, error: cErr }, { data: evidence, error: eErr }] = await Promise.all([
    supabase.from('pr_reviews').select('*').order('letter_date', { ascending: false }),
    supabase.from('pr_claims').select('id, review_id, participant_id, participant_name, ndis_number, prn, amount, support, finding, week_start, week_end, status'),
    supabase.from('pr_evidence').select('id, review_id, participant_id, week_start, week_end, kind, file_id'),
  ]);
  if (error || cErr || eErr) return fail(res, error || cErr || eErr);
  res.json(reviews.map((r) => ({ ...r, ...reviewSummary(r, claims.filter((c) => c.review_id === r.id), evidence) })));
}

async function getReview(req, res) {
  const { review, claims, evidence } = await loadReview(req.query.id);
  res.json({ review, claims, evidence, summary: reviewSummary(review, claims, evidence) });
}

async function participantFiles(req, res) {
  const { participant_id } = req.query;
  if (!participant_id) return fail(res, 'participant_id required', 400);
  const { data, error } = await supabase.from('participant_files').select('id, file_name, category, storage_path, file_type, size, notes, created_at')
    .eq('participant_id', participant_id).order('created_at', { ascending: false });
  if (error) return fail(res, error);
  res.json(data);
}

async function link(req, res) {
  let storagePath = req.query.path;
  let name = req.query.name;
  if (req.query.file_id) {
    const { data } = await supabase.from('participant_files').select('storage_path, file_name').eq('id', req.query.file_id).single();
    if (data) { storagePath = data.storage_path; name = data.file_name; }
  }
  if (!storagePath) return fail(res, 'File not found', 404);
  const { data, error } = await supabase.storage.from(FILES).createSignedUrl(storagePath, 600);
  if (error) return fail(res, error);
  res.json({ url: data.signedUrl, file_name: name });
}

async function participantClaims(req, res) {
  const { participant_id } = req.query;
  if (!participant_id) return fail(res, 'participant_id required', 400);
  const { data, error } = await supabase.from('pr_claims')
    .select('id, prn, posted, amount, status, week_start, review:pr_reviews(id, reference, round, title, due_date, status)')
    .eq('participant_id', participant_id).order('posted', { ascending: false });
  if (error) return fail(res, error);
  res.json(data);
}

// ─── writes ────────────────────────────────────────────────────────────────

const REVIEW_FIELDS = ['reference', 'round', 'title', 'letter_date', 'due_date', 'email_to', 'status', 'sent_date', 'notes'];
function pickReview(b) {
  const row = {};
  for (const k of REVIEW_FIELDS) if (k in b) row[k] = b[k] === '' ? null : b[k];
  if ('round' in row && row.round != null) row.round = Number(row.round) || null;
  if (row.status && !REVIEW_STATUSES.includes(row.status)) throw Object.assign(new Error('Unknown status'), { code: 400 });
  return row;
}

async function createReview(req, res) {
  const row = pickReview(req.body || {});
  if (!row.reference?.trim() || !row.title?.trim()) return fail(res, 'Reference and title are required', 400);
  const { data, error } = await supabase.from('pr_reviews').insert(row).select().single();
  if (error) return fail(res, error.code === '23505' ? 'That reference and round already exist' : error, error.code === '23505' ? 409 : 500);
  res.status(201).json(data);
}

async function updateReview(req, res) {
  const { id, ...rest } = req.body || {};
  if (!id) return fail(res, 'id required', 400);
  const row = { ...pickReview(rest), updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from('pr_reviews').update(row).eq('id', id).select().single();
  if (error) return fail(res, error);
  res.json(data);
}

// sent = the pack went to the NDIA today; claims still being chased or already settled keep their status
async function markSent(req, res) {
  const { id } = req.body || {};
  if (!id) return fail(res, 'id required', 400);
  const date = req.body.sent_date || today();
  const { error } = await supabase.from('pr_reviews').update({ status: 'sent', sent_date: date, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return fail(res, error);
  const { error: cErr } = await supabase.from('pr_claims').update({ status: 'sent' }).eq('review_id', id).in('status', ['open', 'evidenced']);
  if (cErr) return fail(res, cErr);
  const { error: eErr } = await supabase.from('pr_evidence').update({ sent_date: date }).eq('review_id', id).is('sent_date', null);
  if (eErr) return fail(res, eErr);
  res.json({ ok: true, sent_date: date });
}

async function updateClaim(req, res) {
  const { id, status, notes } = req.body || {};
  if (!id) return fail(res, 'id required', 400);
  const row = {};
  if (status !== undefined) {
    if (!CLAIM_STATUSES.includes(status)) return fail(res, 'Unknown status', 400);
    row.status = status;
  }
  if (notes !== undefined) row.notes = notes || null;
  const { data, error } = await supabase.from('pr_claims').update(row).eq('id', id).select().single();
  if (error) return fail(res, error);
  res.json(data);
}

async function setWeek(req, res) {
  const { claim_ids, week_start, week_end } = req.body || {};
  if (!Array.isArray(claim_ids) || !claim_ids.length) return fail(res, 'claim_ids required', 400);
  if (week_start && week_end && week_end < week_start) return fail(res, 'The week ends before it starts', 400);
  const { error } = await supabase.from('pr_claims')
    .update({ week_start: week_start || null, week_end: week_start ? (week_end || weekEndOf(week_start)) : null })
    .in('id', claim_ids);
  if (error) return fail(res, error);
  res.json({ ok: true });
}

async function attach(req, res) {
  const b = req.body || {};
  if (!b.review_id || !b.participant_id || !b.file_id || !b.kind) return fail(res, 'review_id, participant_id, file_id and kind are required', 400);
  const { data: file, error: fErr } = await supabase.from('participant_files').select('id, participant_id, file_name, storage_path').eq('id', b.file_id).single();
  if (fErr || !file) return fail(res, 'That file is not in the vault', 404);
  if (file.participant_id !== b.participant_id) return fail(res, "That file belongs to a different participant's folder", 400);
  const { data, error } = await supabase.from('pr_evidence').insert({
    review_id: b.review_id, participant_id: b.participant_id, week_start: b.week_start || null,
    week_end: b.week_start ? (b.week_end || weekEndOf(b.week_start)) : null, kind: b.kind,
    file_id: file.id, file_name: file.file_name, storage_path: file.storage_path, note: b.note || null,
  }).select().single();
  if (error) return fail(res, error);
  res.status(201).json(data);
}

async function detach(req, res) {
  const { id } = req.body || {};
  if (!id) return fail(res, 'id required', 400);
  const { error } = await supabase.from('pr_evidence').delete().eq('id', id);
  if (error) return fail(res, error);
  res.json({ ok: true });
}

// ─── import: Attachment A text or PDF → pr_claims ──────────────────────────

async function importClaims(req, res) {
  const { review_id, text, pdf, commit } = req.body || {};
  if (!review_id) return fail(res, 'review_id required', 400);
  let source = text || '';
  if (pdf) {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: Buffer.from(pdf.includes(',') ? pdf.slice(pdf.indexOf(',') + 1) : pdf, 'base64') });
    try { source = (await parser.getText()).text; } finally { await parser.destroy?.(); }
  }
  const parsed = parseAttachmentA(source);
  if (!parsed.length) return fail(res, 'No claims found. Paste the Attachment A table (or the claims list from the letter) as it appears in the PDF.', 422);

  const { data: people } = await supabase.from('participants').select('id, first_name, last_name, ndis_number');
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z ]/g, '').trim();
  const match = (c) => people.find((p) => c.ndis && p.ndis_number === c.ndis)
    || people.find((p) => {
      const [first, ...rest] = norm(c.participant).split(' ');
      return norm(p.last_name) === rest.join(' ') && norm(p.first_name).split(' ')[0] === first;
    });
  const { data: existing } = await supabase.from('pr_claims').select('prn').eq('review_id', review_id);
  const known = new Set((existing || []).map((x) => x.prn));

  const rows = parsed.map((c) => {
    const p = match(c);
    const row = {
      review_id, participant_id: p?.id || null, participant_name: c.participant, ndis_number: c.ndis || p?.ndis_number || null,
      posted: c.posted, prn: c.prn, amount: c.amount,
    };
    // the short claims list has no support, invoice or finding; never blank out what a fuller import already set
    if (c.support) row.support = c.support;
    if (c.invoice) row.invoice_no = c.invoice;
    if (c.finding) row.finding = c.finding;
    return row;
  });
  const preview = rows.map((r) => ({ ...r, matched: !!r.participant_id, exists: known.has(r.prn) }));
  if (!commit) return res.json({ claims: preview, total: rows.reduce((s, r) => s + r.amount, 0) });

  // upsert in two passes so rows only carry the columns they have
  const withAll = rows.filter((r) => 'support' in r && 'finding' in r);
  const partial = rows.filter((r) => !withAll.includes(r));
  for (const batch of [withAll, partial]) {
    if (!batch.length) continue;
    const { error } = await supabase.from('pr_claims').upsert(batch, { onConflict: 'review_id,prn' });
    if (error) return fail(res, error);
  }
  res.json({ imported: rows.length, added: rows.filter((r) => !known.has(r.prn)).length, updated: rows.filter((r) => known.has(r.prn)).length, unmatched: preview.filter((r) => !r.matched).map((r) => r.participant_name) });
}

// ─── PDFs (pdfkit, OLF document style) ─────────────────────────────────────

function logoPath() {
  const p = path.join(process.cwd(), 'public', 'logo.png');
  return fs.existsSync(p) ? p : null;
}

function pdfBuffer(build) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 40, right: 40 }, bufferPages: true, info: { Author: 'One Life Foundation Pty Ltd' } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    build(doc);
    const footer = doc._footer || '';
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const { width, height } = doc.page;
      doc.save().rect(0, 0, width, 14).fill(NAVY).restore();
      doc.save().moveTo(40, height - 38).lineTo(width - 40, height - 38).lineWidth(0.5).stroke(LINE).restore();
      doc.font('Helvetica').fontSize(7).fillColor(DIM);
      doc.text(footer, 40, height - 32, { width: width - 140, lineBreak: false, height: 10 });
      doc.text(`Page ${i + 1} of ${range.count}`, width - 120, height - 32, { width: 80, align: 'right', lineBreak: false, height: 10 });
    }
    doc.end();
  });
}

function heading(doc, title, sub) {
  const logo = logoPath();
  if (logo) doc.image(logo, 40, 28, { height: 44 });
  doc.font('Helvetica-Bold').fontSize(16).fillColor(NAVY).text(title, 40, logo ? 84 : 32);
  doc.font('Helvetica').fontSize(8.5).fillColor(DIM).text(sub, { width: 515 });
  doc.moveDown(0.8);
}

function bar(doc, text) {
  if (doc.y > doc.page.height - 120) doc.addPage();
  const y = doc.y;
  doc.save().rect(40, y, 515, 18).fill(NAVY).restore();
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF').text(text, 46, y + 5, { width: 503, lineBreak: false, height: 10 });
  doc.y = y + 24;
}

function table(doc, head, rows, widths, align = []) {
  const x0 = 40;
  const pad = 3;
  const drawRow = (cells, bold, fill) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.6);
    const h = Math.max(...cells.map((c, i) => doc.heightOfString(String(c ?? ''), { width: widths[i] - pad * 2 }))) + pad * 2;
    if (doc.y + h > doc.page.height - 60) { doc.addPage(); doc.y = 40; if (!bold) drawRow(head, true, NAVY); }
    const y = doc.y;
    let x = x0;
    cells.forEach((c, i) => {
      if (fill) doc.save().rect(x, y, widths[i], h).fill(fill).restore();
      doc.save().rect(x, y, widths[i], h).lineWidth(0.5).stroke(LINE).restore();
      doc.fillColor(bold ? '#FFFFFF' : '#1E1E1E').text(String(c ?? ''), x + pad, y + pad, { width: widths[i] - pad * 2, align: align[i] || 'left' });
      x += widths[i];
    });
    doc.y = y + h;
  };
  drawRow(head, true, NAVY);
  rows.forEach((r, i) => drawRow(r, false, i % 2 ? '#F5F7FA' : null));
  doc.moveDown(0.6);
}

function indexSection(doc, w, docs) {
  // every claim in a week is evidenced by the same documents, numbered once below
  const refs = !docs.length ? 'None linked' : docs.length === 1 ? 'Document 1' : `Documents 1-${docs.length} (all listed below)`;
  bar(doc,`${w.participant_name}  |  NDIS ${w.ndis_number || '-'}  |  ${weekLabel(w)}  |  ${w.claims.length} claim${w.claims.length === 1 ? '' : 's'}  |  ${money(w.amount)}`);
  table(doc, ['Payment request', 'Posted', 'Support', 'Amount', 'Documents'],
    w.claims.map((c) => [c.prn, dmy(c.posted), c.support || '-', money(c.amount), refs]),
    [70, 52, 168, 55, 170], ['left', 'left', 'left', 'right', 'left']);
  if (docs.length) {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY).text('Documents in this pack', 40);
    doc.moveDown(0.2);
    table(doc, ['No.', 'File in this pack', 'Evidence', 'Source document in the vault'], docs.map((d, i) => [i + 1, d.zipName, kindLabel(d.kind), d.missing ? `${d.file_name} (could not be retrieved)` : d.file_name]), [28, 200, 85, 202]);
  }
  const missing = w.missing.map(kindLabel);
  if (missing.length) {
    doc.font('Helvetica').fontSize(7.8).fillColor('#B45309').text(`Not included for this week: ${missing.join(', ')}.`, 40, doc.y, { width: 515 });
    doc.moveDown(0.6);
  }
}

// ─── packs ─────────────────────────────────────────────────────────────────

async function addWeekFiles(zip, folder, w) {
  const seen = new Set();
  const group = prnGroup(w.claims);
  const docs = [];
  for (const e of w.evidence) {
    const key = e.storage_path || e.file_id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    let zipName = `${group}_${safe(e.file_name)}`;
    let n = 2;
    while (docs.some((d) => d.zipName === zipName)) zipName = `${group}_${n++}_${safe(e.file_name)}`;
    const { data, error } = await supabase.storage.from(FILES).download(e.storage_path);
    if (error || !data) { docs.push({ ...e, zipName, missing: true }); continue; }
    zip.file(`${folder}${zipName}`, Buffer.from(await data.arrayBuffer()));
    docs.push({ ...e, zipName });
  }
  return docs;
}

async function pack(req, res) {
  const { review_id, participant_id, week_start } = req.query;
  const { review, claims, evidence } = await loadReview(review_id);
  let weeks = buildWeeks(claims.filter((c) => c.status !== 'cancelled' && c.status !== 'not_ours'), evidence, review.id);
  const single = participant_id !== undefined;
  if (single) weeks = weeks.filter((w) => (w.participant_id || '') === participant_id && (w.week_start || '') === (week_start || ''));
  if (!weeks.length) return fail(res, 'Nothing to pack', 404);

  const ref = `${review.reference}${review.round ? `_R${review.round}` : ''}`;
  const zip = new JSZip();
  const sections = [];
  for (const w of weeks) {
    const folder = single ? '' : `${safe(w.participant_name)}_${w.week_start || 'no-week'}/`;
    const docs = await addWeekFiles(zip, folder, w);
    sections.push([w, docs]);
    if (!single) {
      zip.file(`${folder}00_INDEX.pdf`, await pdfBuffer((doc) => {
        doc._footer = `One Life Foundation  |  Evidence index  |  NDIA ref ${review.reference}  |  ${w.participant_name}`;
        heading(doc, 'Evidence Index', `${review.title}  |  Response to NDIA reference ${review.reference}  |  Prepared ${dmy(today())}  |  Each document below is a copy of a record held in the One Life Vault.`);
        indexSection(doc, w, docs);
      }));
    }
  }
  zip.file('00_INDEX.pdf', await pdfBuffer((doc) => {
    doc._footer = `One Life Foundation  |  Evidence index  |  NDIA ref ${review.reference}`;
    const total = weeks.reduce((s, w) => s + w.amount, 0);
    const count = weeks.reduce((n, w) => n + w.claims.length, 0);
    heading(doc, 'Evidence Index', `${review.title}  |  Response to NDIA reference ${review.reference}  |  ${count} claims, ${money(total)}  |  Prepared ${dmy(today())}  |  Each document is a copy of a record held in the One Life Vault.`);
    for (const [w, docs] of sections) indexSection(doc, w, docs);
  }));

  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const name = single ? `${ref}_${safe(weeks[0].participant_name)}_${weeks[0].week_start || 'no-week'}.zip` : `${ref}_all_packs.zip`;
  // packs go through storage and a signed link: a review's files easily pass the 4.5 MB function response cap
  await supabase.storage.createBucket(PACKS, { public: false }).catch(() => {});
  const key = `${review.id}/${name}`;
  const { error: upErr } = await supabase.storage.from(PACKS).upload(key, buf, { contentType: 'application/zip', upsert: true });
  if (upErr) return fail(res, upErr);
  const { data, error } = await supabase.storage.from(PACKS).createSignedUrl(key, 600, { download: name });
  if (error) return fail(res, error);
  res.json({ url: data.signedUrl, file_name: name, files: sections.reduce((n, [, d]) => n + d.filter((x) => !x.missing).length, 0), size: buf.length });
}

async function gapsPdf(req, res) {
  const { review, claims, evidence } = await loadReview(req.query.review_id);
  const weeks = buildWeeks(claims.filter((c) => c.status !== 'cancelled' && c.status !== 'not_ours'), evidence, review.id).filter((w) => w.missing.length);
  const rows = weeks.flatMap((w) => w.missing.map((k) => [w.participant_name, weekLabel(w), kindLabel(k), `${w.claims.length} (${money(w.amount)})`, prnGroup(w.claims)]));
  const buf = await pdfBuffer((doc) => {
    doc._footer = `One Life Foundation  |  Evidence gaps  |  NDIA ref ${review.reference}  |  internal working document`;
    const due = review.due_date ? `  |  Due ${dmy(review.due_date)}` : '';
    heading(doc, 'Evidence Gaps', `${review.title}${due}  |  ${rows.length} missing item${rows.length === 1 ? '' : 's'} across ${weeks.length} participant-week${weeks.length === 1 ? '' : 's'}  |  Printed ${dmy(today())}`);
    if (!rows.length) {
      doc.font('Helvetica').fontSize(10).fillColor('#1E1E1E').text('Every claim week has a linked document for each kind of evidence requested.');
    } else {
      table(doc, ['Participant', 'Service week', 'Missing', 'Claims', 'Payment requests'], rows, [110, 120, 95, 75, 115]);
    }
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${review.reference}${review.round ? `_R${review.round}` : ''}_gaps.pdf"`);
  res.send(buf);
}

// ─── handler ───────────────────────────────────────────────────────────────

const GET = { list, review: getReview, files: participantFiles, link, participant: participantClaims, pack, 'gaps-pdf': gapsPdf };
const POST = {
  'create-review': createReview, 'update-review': updateReview, 'mark-sent': markSent, 'update-claim': updateClaim,
  'set-week': setWeek, attach, detach, import: importClaims,
};

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  const auth = await requireStaff(req, res);
  if (!auth) return;
  const action = req.query.action || req.body?.action;
  const fn = req.method === 'GET' ? GET[action] : POST[action];
  if (!fn) return fail(res, 'Invalid action', 400);
  try {
    await fn(req, res, auth);
  } catch (e) {
    console.error('payment-reviews', action, e);
    fail(res, e, e.code === 404 || e.code === 400 ? e.code : 500);
  }
}
