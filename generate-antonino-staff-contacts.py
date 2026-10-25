"""Support worker contact list for Antonino Fiorito — NDIA Payments Integrity Review RTP6501.

Attachment A asks for: contact details of support workers who delivered the supports, including their
NDIS worker screening number, name, date of birth, address and phone number.

Workers = everyone who wrote a progress note for Antonino in the One Life Vault (11 Aug – 29 Sep 2026).
Their details come from the vault's staff records (scripts/nino_staff_notes.json, pulled by
hcs-journal/scripts/_nino_staff2.mjs). TFN and bank details are never included.

    python generate-antonino-staff-contacts.py
"""
import os, json, datetime, shutil
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, 'public', 'logo.png')
DATA = json.load(open(os.path.join(HERE, 'scripts', 'nino_staff_notes.json'), encoding='utf-8'))
P = json.load(open(os.path.join(HERE, 'scripts', 'nino_profile.json'), encoding='utf-8'))
FILE = 'Antonino_Fiorito_Support_Worker_Contact_List_RTP6501.pdf'
OUT = os.path.join(HERE, FILE)

NAVY = colors.HexColor('#0F528A'); GREY = colors.HexColor('#F5F7FA'); LINE = colors.HexColor('#C8D2DC')
INK = colors.HexColor('#1E1E1E'); DIM = colors.HexColor('#505050')
B = ParagraphStyle('b', fontName='Helvetica', fontSize=8.8, leading=11.5, textColor=INK)
SM = ParagraphStyle('sm', parent=B, fontSize=7.8, leading=10, textColor=DIM)
LBL = ParagraphStyle('lbl', parent=B, fontName='Helvetica-Bold', fontSize=8.2, textColor=NAVY)
TH = ParagraphStyle('th', parent=B, fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.white)
H1 = ParagraphStyle('h1', parent=B, fontName='Helvetica-Bold', fontSize=16, leading=19, textColor=NAVY)

NAME = f"{P['first_name']} {P['last_name']}"; NDIS = P['ndis_number']
DOB = datetime.date.fromisoformat(P['date_of_birth']).strftime('%d/%m/%Y')
TODAY = datetime.date.today().strftime('%d/%m/%Y')

# progress-note author names → staff record (the vault has a few spellings)
ALIAS = {'Navdeep': 'Navdeep Kaur Padda', 'Navde': 'Navdeep Kaur Padda', 'Navdeep Kaur': 'Navdeep Kaur Padda', 'Sukhsimran Kaur': 'Sukhsimran Kaur Manhani'}
by_name = {}
for raw, v in DATA['byName'].items():
    k = ALIAS.get(raw.strip(), raw.strip())
    cur = by_name.setdefault(k, {'n': 0, 'first': v['first'], 'last': v['last']})
    cur['n'] += v['n']; cur['first'] = min(cur['first'], v['first']); cur['last'] = max(cur['last'], v['last'])
staff = {f"{s['first_name']} {s['last_name']}".strip(): s for s in DATA['staff']}

def d(iso):
    return datetime.date.fromisoformat(iso).strftime('%d/%m/%Y') if iso else '—'

def dash(v):
    v = (v or '').strip()
    return v if v else '—'

rows = []
for name in sorted(by_name, key=lambda n: -by_name[n]['n']):
    s = staff.get(name)
    if not s:
        rows.append([name, '—', '—', '—', '—', '—', '—']); continue
    rows.append([
        name, dash(s.get('role')), dash(s.get('ndis_clearance_number')), d(s.get('date_of_birth')),
        dash(s.get('address')), dash(s.get('phone')), dash(s.get('email')),
    ])

def on_page(c, doc):
    w, h = landscape(A4)
    c.setFillColor(NAVY); c.rect(0, h - 8 * mm, w, 8 * mm, fill=1, stroke=0)
    c.setFillColor(DIM); c.setFont('Helvetica', 7.5)
    c.drawString(15 * mm, 8 * mm, f'One Life Foundation | Support Worker Contact List | {NAME} | NDIS: {NDIS} | NDIA ref RTP6501')
    c.drawRightString(w - 15 * mm, 8 * mm, f'Page {doc.page}')
    c.setStrokeColor(LINE); c.line(15 * mm, 12 * mm, w - 15 * mm, 12 * mm)

def kv(pairs, lw=48 * mm, width=267 * mm):
    t = Table([[Paragraph(k, LBL), Paragraph(v, B)] for k, v in pairs], colWidths=[lw, width - lw])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (0, -1), GREY), ('GRID', (0, 0), (-1, -1), 0.5, LINE), ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3)]))
    return t

doc = SimpleDocTemplate(OUT, pagesize=landscape(A4), leftMargin=15 * mm, rightMargin=15 * mm, topMargin=16 * mm, bottomMargin=18 * mm,
                        title=f'Support Worker Contact List – {NAME} – RTP6501', author='One Life Foundation Pty Ltd')
story = [Image(LOGO, width=38 * mm, height=19.5 * mm), Spacer(1, 4),
         Paragraph('Support Worker Contact List', H1),
         Paragraph('Response to NDIA Request for Information RTP6501 (Attachment A – contact details of support workers who delivered the supports)', SM), Spacer(1, 8),
         kv([['Participant', f'{NAME}  |  NDIS {NDIS}  |  DOB {DOB}'],
             ['Provider', 'One Life Foundation Pty Ltd  |  NDIS Provider Number 4050120437'],
             ['Supports', 'Core Supports – Supported Independent Living, 59 Severn Street, Epping VIC 3076'],
             ['Date', TODAY]]),
         Spacer(1, 10)]

head = ['Support worker', 'Role', 'NDIS Worker Screening No.', 'Date of birth', 'Residential address', 'Phone', 'Email']
widths = [42, 26, 34, 24, 70, 28, 43]
data = [[Paragraph(h, TH) for h in head]] + [[Paragraph(str(c), B) for c in r] for r in rows]
t = Table(data, colWidths=[w * mm for w in widths], repeatRows=1)
t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), NAVY), ('GRID', (0, 0), (-1, -1), 0.5, LINE), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                       ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, GREY]), ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]))
story += [t, Spacer(1, 8),
          Paragraph('Worker screening numbers are as recorded in the provider\'s staff register. Tax file numbers and bank details are not included.', SM)]
doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
dl = os.path.join(r'C:\Users\kevin\Downloads', FILE)
shutil.copy(OUT, dl)
print('written', OUT, '\ncopied', dl)
for r in rows: print('  ', ' | '.join(r))
