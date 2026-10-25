/*  Humanity and Inclusion — Moira Sunai weekly invoices, in HAI's own template.
 *
 *  This is deliberately NOT a redesign. The geometry was measured out of HAI's original
 *  `Invoice 1013.pdf` with pdfplumber — US Letter 612×792pt, QuickBooks blue #0077C5 heading,
 *  #393A3D body, the pale blue #EBF4FA band behind Bill to / Ship to / Invoice details, #E3E5E8
 *  hairlines, their column x-positions, and their own logo PNG lifted out of the file and put back
 *  at the exact spot it sits (x=327, y=22.5, 240 × 54.8pt).
 *
 *  What changed is only what was missing or wrong:
 *    · the Description column — which their template HAS but never fills — now carries the NDIS
 *      support item number, the shift times and the 1:1 ratio
 *    · invoice 1013 line 2 was dated 19/09/2026, a Saturday, on the Sunday claim. It is 20/09.
 *    · every line gets its service dates, and they are per line rather than the whole week repeated
 *    · participant NDIS number, provider NDIS registration number, GST position, bank details
 *
 *  Rates are the ones in Moira's NDIS budget breakdown (7 Oct 2025) — what her plan was funded at,
 *  so every rate is the national figure plus 50%.
 *
 *  Usage:  node generate-hai-invoice.mjs          → all three
 *          node generate-hai-invoice.mjs 1013     → just that one
 */
import { jsPDF } from 'jspdf';
import fs from 'node:fs';
import path from 'node:path';

/* ── measured from the original ─────────────────────────────── */
const BLUE = [0, 119, 197];        // QuickBooks heading blue
const INK = [57, 58, 61];          // #393A3D body
const BAND = [235, 244, 250];      // pale blue panel
const RULE = [227, 229, 232];      // hairline
const DASH = [212, 215, 220];      // the dashed separator inside the blue band

const X_NUM = 27, X_DATE = 45, X_PROD = 112.9, X_DESC = 244.1;
const X_QTY = 441.5, X_RATE = 509.3, X_AMT = 567;      // right-aligned
const X_L = 32.2, X_R = 397.2, X_H2 = 174.4;
const RULE_L = 27, RULE_R = 567;
const PAGE_BOTTOM = 744;

const LOGO = fs.readFileSync(new URL('./hai-logo.png', import.meta.url)).toString('base64');

/* ── the support catalogue ──────────────────────────────────────
   `product` is HAI's own wording, kept exactly as they write it (including "rec Activ" on the
   Saturday community line). `item` and `times` fill the Description column. */
const SUPPORTS = {
  wd_day: {
    item: '01_011_0107_1_1', rate: 105.35,
    product: 'Assistance with Self-care Activities Standard Weekday Daytime',
    times: ['6:00am-12:00pm and 2:00pm-8:00pm', '1:1 - 12 hrs/day x 5 days'],
  },
  wd_eve: {
    item: '01_015_0107_1_1', rate: 116.07,
    product: 'Assistance with Self Care Activities Standard Weekday Evening',
    times: ['8:00pm-12:00am', '1:1 - 4 hrs/day x 5 days'],
  },
  wd_night: {
    item: '01_002_0107_1_1', rate: 118.22,
    product: 'Assistance with Self Care Activities Night Time Active',
    times: ['12:00am-6:00am, active overnight', '1:1 - 6 hrs/day x 5 days'],
  },
  sat: {
    item: '01_013_0107_1_1', rate: 148.25,
    product: 'Assistance with Self-care Activities Standard - Saturday',
    times: ['12:00am-12:00pm and 2:00pm-12:00am', '1:1 - 22 hrs'],
  },
  sun: {
    item: '01_014_0107_1_1', rate: 191.15,
    product: 'Assistance with Self-care Activities Standard Sunday',
    times: ['12:00am-12:00pm and 2:00pm-12:00am', '1:1 - 22 hrs'],
  },
  cp_wd: {
    item: '04_104_0125_6_1', rate: 110.37,
    product: 'Access Community Social and Rec Activ - Standard Weekday Daytime',
    times: ['12:00pm-2:00pm', '1:1 - 2 hrs/day x 5 days'],
  },
  cp_sat: {
    item: '04_105_0125_6_1', rate: 155.31,
    product: 'Access Community Social and rec Activ Standard - Saturday',
    times: ['12:00pm-2:00pm', '1:1 - 2 hrs'],
  },
  cp_sun: {
    item: '04_106_0125_6_1', rate: 200.25,
    product: 'Access Community Social and Rec Activ - Standard Sunday',
    times: ['12:00pm-2:00pm', '1:1 - 2 hrs'],
  },
  /* public holidays, for when one falls in the week — 22 h self-care + 2 h community */
  ph: {
    item: '01_012_0107_1_1', rate: 228.84 /* 2026-27 REMOTE (163.46 x 1.4) - Kevin 12 Oct 2026: holidays at remote, not very remote */,
    product: 'Assistance with Self-care Activities Standard - Public Holiday',
    times: ['12:00am-12:00pm and 2:00pm-12:00am', '1:1 - 22 hrs'],
  },
  cp_ph: {
    item: '04_102_0125_6_1', rate: 228.84 /* 2026-27 REMOTE (163.46 x 1.4) - Kevin 12 Oct 2026 */,
    product: 'Access Community Social and Rec Activ - Standard Public Holiday',
    times: ['12:00pm-2:00pm', '1:1 - 2 hrs'],
  },
};

/* ── the same week, shift by shift ──────────────────────────────
   OLF's house format, from AF-INV-005 (Antonino) and DISTINCT-ROSJR-002 (John Ross):
     "01 June 2026 - Evening Service 8:00PM - 10:00PM (Mon-Fri) (1:1 Support) (2 Hours) [01_401…]"
   One line per block of one day, carrying the times, the ratio, the hours and the item number.

   Blocks break at the NDIS claiming band, because the band is what sets the rate. Per Swosthani,
   22 Sep 2026: 8pm-12am is evening, and active overnight is 12am-6am. So the evening line runs the
   full four hours to midnight even though the 10pm handover sits inside it — a line is a claim, not
   a shift, and the progress notes are what evidence who delivered which hours.

   On weekends one item code covers the whole 24 hours, so those days are not divided at all. */
const DAY_BLOCKS = {
  wd: [
    { name: 'Active Overnight 12:00AM - 6:00AM', hours: 6, s: 'wd_night' },
    { name: 'Morning Service 6:00AM - 12:00PM', hours: 6, s: 'wd_day' },
    { name: 'Community Participation 12:00PM - 2:00PM', hours: 2, s: 'cp_wd' },
    { name: 'Afternoon Service 2:00PM - 8:00PM', hours: 6, s: 'wd_day' },
    { name: 'Evening Service 8:00PM - 12:00AM', hours: 4, s: 'wd_eve' },
  ],
};
const DAY_TAG = { wd: 'Mon-Fri', sat: 'Sat', sun: 'Sun' };

const parseAU = (d) => { const [dd, mm, yy] = d.split('/').map(Number); return new Date(yy, mm - 1, dd); };
const fmtAU = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

/* Expand the WEEKDAYS into one line per block per day. The weekend is left alone: Saturday runs on
   one item code all day and Sunday on another, so splitting those days produces more rows carrying
   the same code at the same rate — more paper, no more information.

   A weekend-only invoice (1011) still gets a divided file: there are no weekday blocks to expand,
   but the four weekend rows come out of HAI's original in a jumbled order — Sunday CP, Saturday CP,
   Saturday self-care, Sunday self-care. Ordering them the way they read on 1012 and 1013 is the
   whole point, so the three invoices match each other. */
function divide(inv) {
  const [from, to] = inv.period.split(' - ').map(parseAU);
  const lines = [];
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    if (wd === 0 || wd === 6) continue;
    for (const b of DAY_BLOCKS.wd) {
      lines.push({ s: b.s, date: fmtAU(d), qty: b.hours, block: b.name, tag: DAY_TAG.wd });
    }
  }

  /* Chronological, and within a single day the self-care block comes before the community
     participation block — the same order the weekend reads on the divided weekly invoices. Sorting
     on date alone left that to the order HAI happened to type them in. */
  const weekend = ['sat', 'sun', 'cp_sat', 'cp_sun'];
  const rank = { sat: 0, sun: 0, cp_sat: 1, cp_sun: 1 };
  const tail = inv.lines.filter((l) => weekend.includes(l.s))
    .sort((a, b) => parseAU(a.date) - parseAU(b.date) || rank[a.s] - rank[b.s]);

  if (!lines.length && !tail.length) return null;
  return [...lines, ...tail];
}

/* ── the invoices ───────────────────────────────────────────────
   Line order is HAI's own from each original. `expect` is the printed total on the original —
   the build fails loudly if the arithmetic no longer lands on it. */
const INVOICES = [
  {
    no: '1011', date: '07/09/2026', due: '07/10/2026', period: '05/09/2026 - 06/09/2026',
    expect: 8177.92,
    lines: [
      { s: 'cp_sun', date: '06/09/2026', qty: 2, service: '06/09' },
      { s: 'cp_sat', date: '05/09/2026', qty: 2, service: '05/09' },
      { s: 'sat', date: '05/09/2026', qty: 22, service: '05/09' },
      { s: 'sun', date: '06/09/2026', qty: 22, service: '06/09' },
    ],
  },
  {
    no: '1012', date: '14/09/2026', due: '14/10/2026', period: '07/09/2026 - 13/09/2026',
    expect: 21470.62,
    lines: [
      { s: 'wd_day', date: '07/09/2026', qty: 60, service: '07/09 - 11/09' },
      { s: 'sun', date: '13/09/2026', qty: 22, service: '13/09' },
      { s: 'wd_eve', date: '07/09/2026', qty: 20, service: '07/09 - 11/09' },
      { s: 'wd_night', date: '07/09/2026', qty: 30, service: '07/09 - 11/09' },
      { s: 'sat', date: '12/09/2026', qty: 22, service: '12/09' },
      { s: 'cp_sat', date: '12/09/2026', qty: 2, service: '12/09' },
      { s: 'cp_wd', date: '07/09/2026', qty: 10, service: '07/09 - 11/09' },
      { s: 'cp_sun', date: '13/09/2026', qty: 2, service: '13/09' },
    ],
  },
  {
    no: '1013', date: '21/09/2026', due: '21/10/2026', period: '14/09/2026 - 20/09/2026',
    expect: 21470.62,
    lines: [
      { s: 'wd_day', date: '14/09/2026', qty: 60, service: '14/09 - 18/09' },
      /* was 19/09/2026 on the original — that is a Saturday, and this is the Sunday claim */
      { s: 'sun', date: '20/09/2026', qty: 22, service: '20/09' },
      { s: 'wd_eve', date: '14/09/2026', qty: 20, service: '14/09 - 18/09' },
      { s: 'wd_night', date: '14/09/2026', qty: 30, service: '14/09 - 18/09' },
      { s: 'sat', date: '19/09/2026', qty: 22, service: '19/09' },
      { s: 'cp_sat', date: '19/09/2026', qty: 2, service: '19/09' },
      { s: 'cp_wd', date: '14/09/2026', qty: 10, service: '14/09 - 18/09' },
      { s: 'cp_sun', date: '20/09/2026', qty: 2, service: '20/09' },
    ],
  },
];

const round2 = (n) => Math.round(n * 100) / 100;
const money = (n) => '$' + n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function build(inv, divided = false) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  /* pdfplumber reports the top of the glyph box; jsPDF wants the baseline. */
  const base = (top, size) => top + size * 0.8;
  const put = (s, x, top, { size = 8, bold = false, color = INK, align = 'left' } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(size).setTextColor(...color);
    doc.text(s, x, base(top, size), { align });
  };
  const hairline = (top) => {
    doc.setDrawColor(...RULE).setLineWidth(0.75);
    doc.line(RULE_L, top, RULE_R, top);
  };
  const wrap = (s, w, size, bold = false) => doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(size).splitTextToSize(s, w);

  const source = divided ? divide(inv) : inv.lines;
  const items = source.map((l) => {
    const s = SUPPORTS[l.s];
    if (!s) throw new Error(`unknown support "${l.s}" on invoice ${inv.no}`);
    return { ...s, date: l.date, qty: l.qty, service: l.service, block: l.block, tag: l.tag, amount: round2(l.qty * s.rate) };
  });
  const total = round2(items.reduce((a, b) => a + b.amount, 0));
  const hours = items.reduce((a, b) => a + b.qty, 0);

  /* ── header ── */
  doc.addImage(`data:image/png;base64,${LOGO}`, 'PNG', 327, 22.5, 240, 54.8);
  put('INVOICE', X_L, 32, { size: 12, color: BLUE });
  put('Humanity and Inclusion Pty Ltd', X_L, 48, { size: 7.5, bold: true });
  put('ABN 27 659 576 968', X_L, 60, { size: 7.5 });
  put('NDIS Registration No. 4-K7B0WDS', X_L, 72, { size: 7.5 });

  put('3023', X_H2, 48, { size: 7.5 });   // as their own template has it
  put('humanityandinclusion25@gmail.com', X_H2, 60, { size: 7.5 });
  put('+61433693482', X_H2, 72, { size: 7.5 });
  put('https://humanityinclusion.com/', X_H2, 84, { size: 7.5 });

  /* ── bill to / ship to / invoice details, on their pale blue band ── */
  doc.setFillColor(...BAND).rect(0, 120, 612, 217, 'F');
  put('Bill to', X_L, 134, { size: 7.5, bold: true });
  put('Ship to', X_R, 134, { size: 7.5, bold: true });
  put('Moira Sunai', X_L, 147, { size: 9 });
  put('Moira Sunai', X_R, 147, { size: 9 });
  put('NDIS no. 431040053', X_L, 160, { size: 9 });
  put('4 Sunai Street', X_R, 160, { size: 9 });
  put('4 Sunai Street', X_L, 173, { size: 9 });
  put('Seisia QLD 4876', X_R, 173, { size: 9 });
  put('Seisia QLD 4876', X_L, 186, { size: 9 });
  // Hemera Plans is deliberately NOT named here. Their 24 Sep email: "Billed to
  // the participant, not Hemera Plans. Hemera Plans needs to be removed from the
  // 'Billed To' section." The invoice is simply SENT to invoices@hemeraplans.com.au.

  doc.setDrawColor(...DASH).setLineWidth(0.75).setLineDashPattern([2.25, 1.51], 0);
  doc.line(32.2, 219.4, 575.2, 219.4);
  doc.setLineDashPattern([], 0);

  put('Invoice details', X_L, 244, { size: 9, bold: true });
  put(`Invoice no.: ${inv.no}`, X_L, 260, { size: 9 });
  put('Terms: Net 30', X_L, 274, { size: 9 });
  put(`Invoice date: ${inv.date}`, X_L, 288, { size: 9 });
  put(`Due date: ${inv.due}`, X_L, 302, { size: 9 });
  put(`Service period: ${inv.period}`, X_L, 316, { size: 9 });

  /* ── table ── */
  let y = 350;
  put('#', X_NUM, y, { size: 8, color: [0, 0, 0] });
  put('Date', X_DATE, y, { size: 9, color: [0, 0, 0] });
  put('Product or service', X_PROD, y, { size: 9, color: [0, 0, 0] });
  put('Description', X_DESC, y, { size: 9, color: [0, 0, 0] });
  put('Qty', X_QTY, y, { size: 9, color: [0, 0, 0], align: 'right' });
  put('Rate', X_RATE, y, { size: 9, color: [0, 0, 0], align: 'right' });
  put('Amount', X_AMT, y, { size: 9, color: [0, 0, 0], align: 'right' });
  y += 17.5;
  hairline(y);
  y += 10.8;

  for (const [i, it] of items.entries()) {
    const prod = wrap(it.block || it.product, X_DESC - X_PROD - 10, 8, true);
    const desc = it.tag
      ? [it.item, `(${it.tag}) (1:1 Support) (${it.qty} ${it.qty === 1 ? 'Hour' : 'Hours'})`]
      : [it.item, ...it.times];
    const height = Math.max(prod.length, desc.length) * 12 + 4;

    if (y + height + 30 > PAGE_BOTTOM) { doc.addPage(); y = 30; }

    put(`${i + 1}.`, X_NUM, y, { size: 8 });
    put(it.date, X_DATE, y, { size: 8 });
    prod.forEach((l, n) => put(l, X_PROD, y + n * 12, { size: 8, bold: true }));
    put(desc[0], X_DESC, y, { size: 8, bold: true });
    desc.slice(1).forEach((l, n) => put(l, X_DESC, y + (n + 1) * 12, { size: 7.5 }));
    put(String(it.qty), X_QTY, y, { size: 8, align: 'right' });
    put(money(it.rate), X_RATE, y, { size: 8, align: 'right' });
    put(money(it.amount), X_AMT, y, { size: 8, align: 'right' });

    y += height;
    hairline(y);
    y += 10.8;

    /* Their template puts the service dates on their own row under the line. Only worth a row when
       the line covers a range — for a single day the Date column already says it, and the original
       invoices leave it off those lines too. */
    if (!divided && it.service && it.service.includes('-')) {
      put(`Service date from ${it.service}`, X_DATE, y, { size: 8 });
      y += 17.5;
      hairline(y);
      y += 10.8;
    }
  }

  /* ── total, in their position ── */
  if (y + 80 > PAGE_BOTTOM) { doc.addPage(); y = 30; }
  doc.setDrawColor(...RULE).setLineWidth(0.75).line(372, y, RULE_R, y);
  y += 12;
  put('Total', 371.8, y + 2, { size: 8 });
  put(money(total), X_AMT, y, { size: 12, align: 'right' });
  y += 22;
  doc.setDrawColor(...RULE).setLineWidth(0.75).line(372, y, RULE_R, y);
  put('GST-free NDIS supports  ·  GST $0.00', X_AMT, y + 6, { size: 7.5, align: 'right' });
  put(`${hours} hours  ·  1:1 throughout  ·  self-care per NDIS budget breakdown 07/10/2025; community at 2026-27 very remote limits`, 371.8, y + 19, { size: 7.5 });

  /* ── payment, the way HAI writes it: labels in grey, values in their blue ── */
  const py = y + 42;
  const pair = (label, value, top) => {
    put(label, X_L, top, { size: 8 });
    doc.setFont('helvetica', 'normal').setFontSize(8);
    put(value, X_L + doc.getTextWidth(label) + 3, top, { size: 8, color: BLUE });
  };
  pair('Acc Name:', 'Humanity and Inclusion Pty Ltd', py);
  pair('BSB:', '063-599', py + 13);
  pair('ACC:', '1129 9251', py + 26);
  put(`Please quote invoice ${inv.no} and NDIS no. 431040053 with your remittance.`, X_L, py + 44, { size: 7.5 });

  return { doc, items, total, hours };
}

/* ── run ────────────────────────────────────────────────────── */
const only = process.argv[2];
const wanted = only ? INVOICES.filter((i) => i.no === only) : INVOICES;
if (!wanted.length) {
  console.error(`no invoice ${only}. known: ${INVOICES.map((i) => i.no).join(', ')}`);
  process.exit(1);
}

let failed = false;
for (const inv of wanted) {
  // The divided layout is the issued invoice (Kevin, 25 Sep 2026: "make sure its the divided one, i
  // dont need the non divided one") — one file per invoice, plain name.
  for (const divided of [true]) {
    const { doc, items, total, hours } = build(inv, divided && divide(inv) ? true : false);
    const filename = `Invoice_${inv.no}_Moira_Sunai_HAI.pdf`;
    const buffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(filename, buffer);
    fs.writeFileSync(path.join('C:', 'Users', 'kevin', 'Downloads', filename), buffer);

    const ok = total === inv.expect;
    if (!ok) failed = true;
    console.log(`
${filename}  (${doc.getNumberOfPages()} pages, ${items.length} lines)  ${inv.period}`);
    if (divided) {
      let day = null;
      for (const it of items) {
        if (it.date !== day) { day = it.date; console.log(`   ${day}`); }
        console.log(`     ${(it.block || it.product).slice(0, 48).padEnd(48)} ${String(it.qty).padStart(2)} h x ${money(it.rate).padStart(8)} = ${money(it.amount).padStart(10)}  ${it.item}`);
      }
    }
    console.log(`  ${hours} hours - total ${money(total)} ${ok ? '- matches the original' : `*** DOES NOT MATCH ${money(inv.expect)}`}`);
  }
}
if (failed) process.exit(1);
