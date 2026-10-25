/*  Payment Review Desk rules, shared by the pages and api/payment-reviews.js.
 *  Pure functions only (no imports) so the serverless function can load them.
 *
 *  A claim is covered when its service week has, for this review, at least one
 *  linked file of every evidence kind the NDIA's finding asks for. Evidence is
 *  filed per participant + week; a row with no week counts for every week of
 *  that participant (service agreement, worker contact list). */

export const KINDS = [
  { value: 'notes', label: 'Support notes' },
  { value: 'roster', label: 'Roster' },
  { value: 'timesheet', label: 'Timesheet' },
  { value: 'payslip', label: 'Payslips' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'contractor_invoice', label: 'Contractor invoice' },
  { value: 'contacts', label: 'Worker contacts' },
  { value: 'schedule', label: 'Schedule of supports' },
  { value: 'service_agreement', label: 'Service agreement' },
  { value: 'travel', label: 'Travel log' },
  { value: 'other', label: 'Other' },
];
export const kindLabel = (k) => KINDS.find((x) => x.value === k)?.label || k;

export const money = (n) => `$${Number(n || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const shortDate = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const daysUntil = (iso) => {
  if (!iso) return null;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${iso}T00:00:00`) - t) / 86400000);
};

export const CLAIM_STATUSES = ['open', 'evidenced', 'sent', 'paid', 'cancelled', 'not_ours'];
export const REVIEW_STATUSES = ['open', 'sent', 'closed'];

const FINDING_WORDS = [
  ['notes', 'notes'], ['roster', 'roster'], ['timesheet', 'timesheet'], ['payslip', 'payslip'],
  ['invoice', 'invoice'], ['schedule', 'schedule'], ['contact', 'contacts'],
];
const CORE_DEFAULT = ['notes', 'roster', 'timesheet', 'payslip', 'invoice', 'contacts'];
const CORE_RE = /supported independent living|assistance (in|with)|daily (life|activities)|community (participation|access)|accommodation|\bcore\b/i;

// a payslip proves who was paid for the week; a contractor invoice proves the same for a contractor
const SATISFIES = { payslip: ['payslip', 'contractor_invoice'], invoice: ['invoice'] };

export function requiredKinds(claim) {
  const f = (claim.finding || '').toLowerCase();
  const found = FINDING_WORDS.filter(([w]) => f.includes(w)).map(([, k]) => k);
  if (found.length) return [...new Set(found)];
  if (CORE_RE.test(claim.support || '')) return CORE_DEFAULT;
  return ['notes', 'invoice'];
}

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const weekEndOf = (start) => (start ? addDays(start, 6) : null);

/** true when evidence row `e` applies to the week [ws, we] for that participant */
export function evidenceFits(e, ws, we) {
  if (!e.week_start) return true;
  if (!ws) return false;
  const eEnd = e.week_end || weekEndOf(e.week_start);
  const end = we || weekEndOf(ws);
  return e.week_start <= end && eEnd >= ws;
}

const who = (x) => x.participant_id || `name:${x.participant_name}`;

/** group claims into participant-week cards, each with its evidence and coverage */
export function buildWeeks(claims, evidence, reviewId) {
  const groups = new Map();
  for (const c of claims) {
    const key = `${who(c)}|${c.week_start || ''}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key, participant_id: c.participant_id, participant_name: c.participant_name, ndis_number: c.ndis_number,
        week_start: c.week_start, week_end: c.week_end || weekEndOf(c.week_start), claims: [],
      });
    }
    groups.get(key).claims.push(c);
  }
  const weeks = [...groups.values()].map((g) => {
    const required = [...new Set(g.claims.flatMap(requiredKinds))];
    const mine = evidence.filter((e) => e.review_id === reviewId && who(e) === who(g) && evidenceFits(e, g.week_start, g.week_end));
    const elsewhere = evidence.filter((e) => e.review_id !== reviewId && e.week_start && who(e) === who(g) && evidenceFits(e, g.week_start, g.week_end)
      && !mine.some((m) => m.file_id && m.file_id === e.file_id));
    const have = (k) => mine.some((e) => (SATISFIES[k] || [k]).includes(e.kind));
    const missing = required.filter((k) => !have(k));
    const amount = g.claims.reduce((s, c) => s + Number(c.amount || 0), 0);
    return { ...g, required, evidence: mine, elsewhere, missing, covered: missing.length === 0, amount };
  });
  weeks.sort((a, b) => (a.participant_name || '').localeCompare(b.participant_name || '') || (a.week_start || '9999').localeCompare(b.week_start || '9999'));
  return weeks;
}

export function evidenceFor(week, kind) {
  return week.evidence.filter((e) => (SATISFIES[kind] || [kind]).includes(e.kind));
}

export function reviewSummary(review, claims, evidence) {
  const weeks = buildWeeks(claims, evidence, review.id);
  const live = claims.filter((c) => c.status !== 'cancelled' && c.status !== 'not_ours');
  const coveredClaims = weeks.filter((w) => w.covered).reduce((n, w) => n + w.claims.filter((c) => c.status !== 'cancelled' && c.status !== 'not_ours').length, 0);
  return {
    participants: [...new Set(claims.map((c) => c.participant_name))],
    claim_count: claims.length,
    total: claims.reduce((s, c) => s + Number(c.amount || 0), 0),
    covered_pct: live.length ? Math.round((coveredClaims / live.length) * 100) : null,
    gaps: weeks.reduce((n, w) => n + w.missing.length, 0),
  };
}

/** "814039961" or "814039878-814039969 (31)" — used for pack file names */
export function prnGroup(claims) {
  const prns = claims.map((c) => c.prn).sort();
  if (prns.length === 1) return prns[0];
  return `${prns[0]}-${prns[prns.length - 1]}`;
}

/* ─── Attachment A parser ───────────────────────────────────────────────────
 * The NDIA's "Missing Information" table extracts to blocks like
 *   431576804                       NDIS number
 *   Darrell / Twyford               name, one word per line (or on the claim line)
 *   13-Jul-26 814039961 $81.06 Supported Independent Living - Standard
 *   (Description is Truncated) MPM-DT-003-00749   invoice, when there is one
 *   Insufficient / information      outcome words
 *   >Missing case notes, timesheet, roster, payslips
 * The Request for Information letter lists one claim per line instead:
 *   Darrell Twyford 13-Jul-26 814039961 $81.06                               */
const MONTHS = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
const DATE = String.raw`(\d{1,2}-[A-Za-z]{3}-\d{2,4}|\d{1,2}/\d{1,2}/\d{4})`;
const ANCHOR = new RegExp(`${DATE}\\s+(\\d{8,10})\\s+\\$([\\d,]+\\.\\d{2})\\s*(.*)$`);
const NOISE = /^(-- \d+ of \d+ --|\d+)$/;

export function isoDate(s) {
  let m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (m) return `${m[3].length === 2 ? `20${m[3]}` : m[3]}-${MONTHS[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}

export function parseAttachmentA(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const starts = lines.map((l, i) => (/^\d{9}$/.test(l) ? i : -1)).filter((i) => i >= 0);
  const out = [];

  if (starts.length) {
    starts.forEach((s, n) => {
      const block = lines.slice(s, n + 1 < starts.length ? starts[n + 1] : lines.length).filter((l) => !/^-- \d+ of \d+ --$/.test(l));
      const a = block.findIndex((l) => ANCHOR.test(l));
      if (a < 0) return;
      const m = block[a].match(ANCHOR);
      const name = [...block.slice(1, a), block[a].slice(0, m.index)].join(' ').replace(/\s+/g, ' ').trim();
      let support = m[4].trim();
      let invoice = '';
      const rest = [];
      let inSupport = true;
      for (const l of block.slice(a + 1)) {
        if (/^\(Description is Truncated\)/i.test(l)) {
          invoice = l.replace(/^\(Description is Truncated\)/i, '').trim();
          inSupport = false;
        } else if (inSupport && !/^(>|insufficient|information|not\b|payable)/i.test(l) && !l.includes('.') && (support.endsWith('-') || l.length < 48)) {
          support = `${support} ${l}`;
        } else {
          inSupport = false;
          rest.push(l);
        }
      }
      let finding = rest.join(' ').replace(/\s+/g, ' ').trim();
      if (finding.includes('>')) {
        finding = finding.split('>').slice(1).map((x) => x.trim()).filter(Boolean).join('; ');
      } else {
        finding = finding.replace(/^(insufficient( and inconsistent)? information)\s*/i, '');
      }
      out.push({
        participant: name, ndis: block[0], posted: isoDate(m[1]), prn: m[2],
        amount: Number(m[3].replace(/,/g, '')), support: support.replace(/\s+-\s*$/, '').trim(),
        invoice: /^not provided$/i.test(invoice) ? '' : invoice, finding,
      });
    });
    return out;
  }

  for (const l of lines) {
    if (NOISE.test(l)) continue;
    const m = l.match(ANCHOR);
    if (!m) continue;
    const name = l.slice(0, m.index).trim();
    if (!name || /\d/.test(name)) continue;
    out.push({ participant: name, ndis: '', posted: isoDate(m[1]), prn: m[2], amount: Number(m[3].replace(/,/g, '')), support: m[4].trim(), invoice: '', finding: '' });
  }
  return out;
}
