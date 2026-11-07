"""Support worker contact list for John Eric Ross — NDIA Payments Integrity Review RTP6741 (19 - 25 Oct 2026).
Workers = everyone who wrote a progress note for John in that window (scripts/john_staff_notes_rtp6638.json, pulled by
hcs-journal/scripts/_john_staff_rtp6638.mjs) plus the workers whose invoices / payslips are in the pack.
Details come from the vault's staff records. TFN and bank details are never included.
    python generate-john-staff-contacts-rtp6638.py
"""
import os, json, datetime
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, 'public', 'logo.png')
DATA = json.load(open(os.path.join(HERE, 'scripts', 'john_staff_notes_rtp6638.json'), encoding='utf-8'))
OUT = os.path.join(HERE, 'John_Ross_Support_Worker_Contact_List_RTP6741.pdf')

NAVY = colors.HexColor('#0F528A'); GREY = colors.HexColor('#F5F7FA'); LINE = colors.HexColor('#C8D2DC')
INK = colors.HexColor('#1E1E1E'); DIM = colors.HexColor('#505050')
B = ParagraphStyle('b', fontName='Helvetica', fontSize=8.8, leading=11.5, textColor=INK)
SM = ParagraphStyle('sm', parent=B, fontSize=7.8, leading=10, textColor=DIM)
LBL = ParagraphStyle('lbl', parent=B, fontName='Helvetica-Bold', fontSize=8.2, textColor=NAVY)
TH = ParagraphStyle('th', parent=B, fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.white)
H1 = ParagraphStyle('h1', parent=B, fontName='Helvetica-Bold', fontSize=16, leading=19, textColor=NAVY)

NAME, NDIS, ADDR = 'John Eric Ross', '574 479 496', '59 Severn Street, Epping VIC 3076'
TODAY = datetime.date.today().strftime('%d/%m/%Y')
ALIAS = {'Vishali': 'Vishali Gill', 'Divya karki': 'Divya Karki', 'Navdeep kaur': 'Navdeep Kaur Padda', 'Navdeep': 'Navdeep Kaur Padda', 'Navde': 'Navdeep Kaur Padda', 'Navdeep Kaur': 'Navdeep Kaur Padda', 'Sukhsimran Kaur': 'Sukhsimran Kaur Manhani', 'Sukhsimran Manhani': 'Sukhsimran Kaur Manhani'}
# documents for each worker in the two weekly packs (DISTINCT-ROSJR-019 and 020)
DOCS = {'Santosh Ojha': 'payslip 19 Oct - 1 Nov 2026 to follow', 'Divya Karki': 'payslip 19 Oct - 1 Nov 2026 to follow', 'Sukhsimran Kaur Manhani': 'payslip 19 Oct - 1 Nov 2026 to follow',
        'Gurpreet Kaur': 'invoice 19 Oct - 1 Nov 2026 to follow', 'Navdeep Kaur Padda': 'invoice 21 Oct - 1 Nov 2026',
        'Avneet Kaur': 'invoice 19 Oct - 1 Nov 2026 to follow', 'Vishali Gill': 'invoice 19 Oct - 1 Nov 2026'}
EXTRA = {k: v for k, v in DOCS.items()}

# live note counts from the vault (19 - 25 Oct 2026); falls back to the json pull if the API is down
import urllib.request
try:
    _notes = json.load(urllib.request.urlopen('https://onelifefoundationndis.app/api/features?action=pn-list&participant_name=John%20Eric%20Ross&start_date=2026-10-19&end_date=2026-10-25', timeout=60))
    _by = {}
    for n in _notes:
        raw = (n.get('staff_name') or '').strip(); k = raw.title() if raw.islower() else raw
        cur = _by.setdefault(k, {'n': 0, 'first': n['note_date'], 'last': n['note_date']})
        cur['n'] += 1; cur['first'] = min(cur['first'], n['note_date']); cur['last'] = max(cur['last'], n['note_date'])
    DATA['byName'] = _by; print('live notes', len(_notes))
except Exception as e:
    print('live pull failed, using json:', e)

by_name = {}
for raw, v in DATA['byName'].items():
    k = ALIAS.get(raw.strip(), raw.strip())
    cur = by_name.setdefault(k, {'n': 0, 'first': v['first'], 'last': v['last']})
    cur['n'] += v['n']; cur['first'] = min(cur['first'], v['first']); cur['last'] = max(cur['last'], v['last'])
for k, why in EXTRA.items():
    by_name.setdefault(k, {'n': 0, 'first': None, 'last': None, 'why': why})
staff = {f"{s['first_name']} {s['last_name']}".strip(): s for s in DATA['staff']}

def d(iso):
    return datetime.date.fromisoformat(iso).strftime('%d/%m/%Y') if iso else '—'
def dash(v):
    v = (v or '').strip(); return v if v else '—'

rows, gaps = [], []
for name in sorted(by_name, key=lambda n: -by_name[n]['n']):
    s = staff.get(name); v = by_name[name]
    basis = (f"{v['n']} progress notes, {d(v['first'])} - {d(v['last'])}" if v['n'] else 'no progress notes in the period') + ('; ' + DOCS[name] if name in DOCS else '')
    if not s:
        rows.append([name, '—', '—', '—', '—', '—', basis]); gaps.append(f'{name}: no staff record'); continue
    for f, lbl in [('ndis_clearance_number', 'worker screening number'), ('date_of_birth', 'date of birth'), ('address', 'address'), ('phone', 'phone')]:
        if not (s.get(f) or '').strip(): gaps.append(f'{name}: {lbl} missing')
    rows.append([name, dash(s.get('role')), dash(s.get('ndis_clearance_number')), d(s.get('date_of_birth')), dash(s.get('address')), dash(s.get('phone')), basis])

def on_page(c, doc):
    w, h = landscape(A4)
    c.setFillColor(NAVY); c.rect(0, h - 8 * mm, w, 8 * mm, fill=1, stroke=0)
    c.setFillColor(DIM); c.setFont('Helvetica', 7.5)
    c.drawString(15 * mm, 8 * mm, f'One Life Foundation | Support Worker Contact List | {NAME} | NDIS: {NDIS} | NDIA ref RTP6741')
    c.drawRightString(w - 15 * mm, 8 * mm, f'Page {doc.page}')
    c.setStrokeColor(LINE); c.line(15 * mm, 12 * mm, w - 15 * mm, 12 * mm)

def kv(pairs, lw=48 * mm, width=267 * mm):
    t = Table([[Paragraph(k, LBL), Paragraph(v, B)] for k, v in pairs], colWidths=[lw, width - lw])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (0, -1), GREY), ('GRID', (0, 0), (-1, -1), 0.5, LINE), ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3)]))
    return t

doc = SimpleDocTemplate(OUT, pagesize=landscape(A4), leftMargin=15 * mm, rightMargin=15 * mm, topMargin=16 * mm, bottomMargin=18 * mm,
                        title=f'Support Worker Contact List – {NAME} – RTP6741', author='One Life Foundation Pty Ltd')
story = [Image(LOGO, width=38 * mm, height=19.5 * mm), Spacer(1, 4),
         Paragraph('Support Worker Contact List', H1),
         Paragraph('NDIA Payments Integrity Review, reference RTP6741, Attachment A: contact details of support workers who delivered the supports, '
                   'including their NDIS worker screening number, name, date of birth, address and phone number.', SM), Spacer(1, 6),
         kv([('Participant', f'{NAME} (NDIS {NDIS})'), ('Support address', ADDR + ' (Supported Independent Living)'),
             ('Support period', '28 September - 11 October 2026 (invoices DISTINCT-ROSJR-019 and 020)'),
             ('Provider', 'One Life Foundation Pty Ltd, ABN 55 643 227 061, NDIS provider 4050120437'),
             ('Basis', 'Workers listed are the authors of the progress notes for the period in the One Life Vault, plus workers whose invoices or payslips are in the evidence pack.'),
             ('Prepared', TODAY)]), Spacer(1, 8)]
hdr = [Paragraph(h, TH) for h in ['Worker', 'Role', 'NDIS worker screening no.', 'Date of birth', 'Address', 'Phone', 'Basis in this period']]
body = [[Paragraph(str(c), B) for c in r] for r in rows]
t = Table([hdr] + body, colWidths=[38 * mm, 24 * mm, 30 * mm, 22 * mm, 66 * mm, 26 * mm, 61 * mm], repeatRows=1)
t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), NAVY), ('GRID', (0, 0), (-1, -1), 0.5, LINE), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                       ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, GREY]), ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]))
story += [t, Spacer(1, 8), Paragraph('Tax file numbers and bank details are not included. Worker screening numbers are as recorded in the One Life Foundation staff register.', SM)]
doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print('written', OUT); print('rows', len(rows)); print('GAPS:', gaps or 'none')
