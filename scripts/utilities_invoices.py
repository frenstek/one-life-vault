"""Shared-house utilities recharge invoices: electricity and water (OLF standard).

One invoice per resident for their share of the household electricity bill. OLF pays 25%; the rest is split
equally between the two residents. Run: python scripts/electricity_invoices.py  → PDFs here + copied to Downloads.
"""
import os
import shutil
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
LOGO = os.path.join(ROOT, 'public', 'logo.png')
OUT = os.path.join(ROOT, 'invoices')
DOWNLOADS = os.path.join(os.path.expanduser('~'), 'Downloads')

NAVY = HexColor('#0F528A')
INK = HexColor('#1F2937')
MUTED = HexColor('#6B7280')
GRID = HexColor('#D6DCE4')
LABEL_BG = HexColor('#F5F7FA')

# each bill: OLF pays 25%; the rest is shared between the residents, either equally ('equal', Kevin's figures)
# or by the days each resident lived at the house during the billing period ('days')
BILLS = [
    {'name': 'Electricity', 'period': '10 June 2026 to 8 September 2026', 'total': 1061.90, 'olf_pct': 25, 'olf_share': 265.47, 'split': 'days', 'days': 91,
     'source': 'Lumo Energy, account 8897022, bill issued 14 Sep 2026', 'attach': ('Lumo Energy bill 8897022 - 14 Sep 2026.pdf', [0, 1])},
    {'name': 'Water', 'period': 'paid in full 6 October 2026, receipt 4513657934', 'total': 286.38, 'olf_pct': 25, 'olf_share': 71.59, 'split': 'equal', 'share': 107.39,
     'source': 'Yarra Valley Water, account 2265185369, invoice 2260367447013',
     'attach': ('Yarra Valley Water receipt 4513657934.pdf', [0])},
]
ISSUED = '6 October 2026'
DUE = '20 October 2026'
BANK = {'name': 'One Life Foundation', 'bsb': '083-237', 'acc': '258 645 455'}

RESIDENTS = [
    # days at the house within the electricity period (10 Jun – 8 Sep 2026, 91 days)
    {'no': 'OLF-UTIL-2026-001', 'name': 'Darrell James Twyford', 'short': 'Darrell Twyford', 'ndis': '431 576 804',
     'days': 52, 'stay': '26 June to 16 August 2026'},
    {'no': 'OLF-UTIL-2026-002', 'name': 'John Ross', 'short': 'John Ross', 'ndis': '574 479 496', 'days': 91, 'stay': None},
]
HOUSE = '59 Severn Street, Epping VIC 3076'


def money(v):
    return f'${v:,.2f}'


def share(b, r):
    """this resident's share of one bill"""
    if b['split'] == 'equal':
        return b['share']
    pot = round(b['total'] - b['olf_share'], 2)
    days = {x['short']: min(x['days'], b['days']) for x in RESIDENTS}
    shares = {k: round(pot * d / sum(days.values()), 2) for k, d in days.items()}
    # put any rounding cent on the resident with the most days, so the shares add back to the pot exactly
    top = max(days, key=days.get)
    shares[top] = round(pot - sum(v for k, v in shares.items() if k != top), 2)
    return shares[r['short']]


def build(r):
    os.makedirs(OUT, exist_ok=True)
    fname = f"Utilities Invoice - {r['short']} - Electricity and Water.pdf"
    due = round(sum(share(b, r) for b in BILLS), 2)
    path = os.path.join(OUT, fname)
    W, H = A4
    c = canvas.Canvas(path, pagesize=A4)
    c.setTitle(f"Utilities Invoice {r['no']} - {r['short']}")
    c.setAuthor('One Life Foundation')
    ML, MR = 18 * mm, W - 18 * mm

    # navy top bar
    c.setFillColor(NAVY)
    c.rect(0, H - 8 * mm, W, 8 * mm, stroke=0, fill=1)

    # logo, centred
    logo = ImageReader(LOGO)
    lw = 46 * mm
    lh = lw * 267 / 522
    c.drawImage(logo, (W - lw) / 2, H - 14 * mm - lh, lw, lh, mask='auto')
    y = H - 14 * mm - lh - 6 * mm
    c.setFillColor(INK)
    c.setFont('Helvetica-Bold', 12)
    c.drawCentredString(W / 2, y, 'One Life Foundation')
    y -= 5 * mm
    c.setFont('Helvetica', 8.5)
    c.setFillColor(MUTED)
    c.drawCentredString(W / 2, y, 'ABN 55 643 227 061  |  NDIS Registered Provider  |  9C Grasslands Avenue, Craigieburn VIC 3064')

    # title row
    y -= 13 * mm
    c.setFillColor(NAVY)
    c.setFont('Helvetica-Bold', 20)
    c.drawString(ML, y, 'INVOICE')
    c.setFont('Helvetica', 9.5)
    c.setFillColor(INK)
    c.drawRightString(MR, y + 4 * mm, f"Invoice no.  {r['no']}")
    c.drawRightString(MR, y - 1 * mm, f'Issued  {ISSUED}')
    c.setFont('Helvetica-Bold', 9.5)
    c.drawRightString(MR, y - 6 * mm, f'Due  {DUE}')
    y -= 10 * mm
    c.setStrokeColor(NAVY)
    c.setLineWidth(1.2)
    c.line(ML, y, MR, y)

    # bill to / for
    y -= 8 * mm
    col2 = W / 2 + 4 * mm
    c.setFont('Helvetica-Bold', 8)
    c.setFillColor(MUTED)
    c.drawString(ML, y, 'BILL TO')
    c.drawString(col2, y, 'FOR')
    y -= 5.5 * mm
    c.setFillColor(INK)
    c.setFont('Helvetica-Bold', 11)
    c.drawString(ML, y, r['name'])
    c.drawString(col2, y, 'Household electricity and water')
    c.setFont('Helvetica', 9.5)
    c.drawString(ML, y - 5 * mm, f"NDIS no. {r['ndis']}")
    c.drawString(ML, y - 10 * mm, HOUSE)
    c.drawString(col2, y - 5 * mm, HOUSE)
    c.drawString(col2, y - 10 * mm, 'Resident share of the household bills')
    if r.get('stay'):
        c.setFont('Helvetica-Bold', 9.5)
        c.drawString(ML, y - 15 * mm, f"Lived at the house {r['stay']}")
        c.setFont('Helvetica', 9.5)
    y -= (26 if r.get('stay') else 21) * mm

    # one block per bill: how it is shared
    rh = 6.6 * mm
    for b in BILLS:
        c.setFillColor(NAVY)
        c.rect(ML, y - 1.5 * mm, MR - ML, 7 * mm, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont('Helvetica-Bold', 10)
        c.drawString(ML + 3 * mm, y + 0.5 * mm, f"{b['name']} bill" + (f"  ·  {b['period']}" if b['period'] else ''))
        y -= 1.5 * mm
        rows = [
            (f"Total {b['name'].lower()} bill" + (f" ({b['source']})" if b.get('source') else ''), money(b['total'])),
            (f"Paid by One Life Foundation ({b['olf_pct']}%)", f"- {money(b['olf_share'])}"),
        ]
        if b['split'] == 'days':
            pot = round(b['total'] - b['olf_share'], 2)
            rd = sum(min(x['days'], b['days']) for x in RESIDENTS)
            mine = min(r['days'], b['days'])
            rows += [
                ('Remaining for the residents, shared by days at the house', money(pot)),
                (' + '.join(f"{x['short']} {min(x['days'], b['days'])} days" for x in RESIDENTS) + f" = {rd} resident-days", f'{rd} days'),
                (f'Cost per resident-day ({money(pot)} / {rd})', money(pot / rd)),
                (f"{r['short']}'s share of the {b['name'].lower()} ({mine} of {b['days']} days)", money(share(b, r))),
            ]
        else:
            rows += [
                ('Remaining, shared equally between 2 residents', money(b['total'] - b['olf_share'])),
                (f"{r['short']}'s share of the {b['name'].lower()} (1 of 2)", money(share(b, r))),
            ]
        split = MR - 45 * mm
        for i, (k, v) in enumerate(rows):
            top = y - i * rh
            last = i == len(rows) - 1
            c.setFillColor(LABEL_BG if not last else HexColor('#E8F0F8'))
            c.rect(ML, top - rh, MR - ML, rh, stroke=0, fill=1)
            c.setStrokeColor(GRID)
            c.setLineWidth(0.6)
            c.rect(ML, top - rh, MR - ML, rh, stroke=1, fill=0)
            c.line(split, top - rh, split, top)
            c.setFillColor(INK)
            c.setFont('Helvetica-Bold' if last else 'Helvetica', 10)
            c.drawString(ML + 3 * mm, top - rh + 2.1 * mm, k)
            c.drawRightString(MR - 3 * mm, top - rh + 2.1 * mm, v)
        y -= len(rows) * rh + 6.5 * mm

    # summary of what this resident owes
    for i, (k, v, bold) in enumerate([*[(f"{b['name']} share", money(share(b, r)), False) for b in BILLS], ('Total due', money(due), True)]):
        c.setFillColor(INK)
        c.setFont('Helvetica-Bold' if bold else 'Helvetica', 10.5 if bold else 10)
        c.drawString(MR - 90 * mm, y - i * 6 * mm, k)
        c.drawRightString(MR - 3 * mm, y - i * 6 * mm, v)
        if bold:
            c.setStrokeColor(NAVY)
            c.setLineWidth(0.8)
            c.line(MR - 90 * mm, y - i * 6 * mm + 4.3 * mm, MR, y - i * 6 * mm + 4.3 * mm)
    y -= (len(BILLS) + 1) * 6 * mm + 4 * mm

    # amount due
    box_w = 80 * mm
    c.setFillColor(NAVY)
    c.rect(MR - box_w, y - 12 * mm, box_w, 16 * mm, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont('Helvetica', 9)
    c.drawString(MR - box_w + 4 * mm, y - 0.5 * mm, 'AMOUNT DUE')
    c.setFont('Helvetica-Bold', 18)
    c.drawRightString(MR - 4 * mm, y - 8.5 * mm, money(due))
    c.setFillColor(MUTED)
    c.setFont('Helvetica', 9)
    c.drawString(ML, y - 0.5 * mm, f'Please pay by {DUE}.')
    c.drawString(ML, y - 5.5 * mm, f"Payment reference: {r['no']}")
    y -= 21 * mm

    # payment details
    c.setFillColor(NAVY)
    c.rect(ML, y - 1.5 * mm, MR - ML, 7 * mm, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont('Helvetica-Bold', 10)
    c.drawString(ML + 3 * mm, y + 0.5 * mm, 'Payment details (EFT)')
    y -= 1.5 * mm
    for i, (k, v) in enumerate([('Account name', BANK['name']), ('BSB', BANK['bsb']), ('Account number', BANK['acc']), ('Reference', r['no'])]):
        top = y - i * rh
        c.setFillColor(LABEL_BG)
        c.rect(ML, top - rh, 50 * mm, rh, stroke=0, fill=1)
        c.setStrokeColor(GRID)
        c.rect(ML, top - rh, MR - ML, rh, stroke=1, fill=0)
        c.line(ML + 50 * mm, top - rh, ML + 50 * mm, top)
        c.setFillColor(INK)
        c.setFont('Helvetica-Bold', 9.5)
        c.drawString(ML + 3 * mm, top - rh + 2.8 * mm, k)
        c.setFont('Helvetica', 10)
        c.drawString(ML + 53 * mm, top - rh + 2.8 * mm, v)
    y -= 4 * rh + 6 * mm

    c.setFillColor(MUTED)
    c.setFont('Helvetica', 8.5)
    c.drawString(ML, y, "This invoice is for the resident's share of household electricity and water. These are personal living costs")
    c.drawString(ML, y - 4.2 * mm, 'and are not claimed against NDIS funding. ' + ('The electricity bill and the water payment receipt are attached.' if any(b.get('attach') for b in BILLS) else 'Copies of the bills are available on request.'))

    # footer
    c.setStrokeColor(GRID)
    c.line(ML, 16 * mm, MR, 16 * mm)
    c.setFont('Helvetica', 7.5)
    c.setFillColor(MUTED)
    c.drawString(ML, 11 * mm, f"One Life Foundation | Utilities Invoice | {r['name']} | NDIS: {r['ndis']}")
    c.drawRightString(MR, 11 * mm, 'Invoice, followed by the supporting bills' if any(b.get('attach') for b in BILLS) else 'Page 1 of 1')
    c.setFillColor(NAVY)
    c.rect(0, 0, W, 4 * mm, stroke=0, fill=1)
    c.showPage()
    c.save()
    # supporting documents: the original bills, behind the invoice
    import fitz
    doc = fitz.open(path)
    for b in BILLS:
        if b.get('attach'):
            src = fitz.open(os.path.join(OUT, b['attach'][0]))
            for pg in b['attach'][1]:
                doc.insert_pdf(src, from_page=pg, to_page=pg)
    doc.save(path + '.tmp')
    doc.close()
    os.replace(path + '.tmp', path)
    shutil.copy(path, os.path.join(DOWNLOADS, fname))
    return path


if __name__ == '__main__':
    # the split must add back up to the bill
    for b in BILLS:
        print(f"check {b['name']}: OLF + shares =", round(b['olf_share'] + sum(share(b, x) for x in RESIDENTS), 2), 'vs bill', b['total'], {x['short']: share(b, x) for x in RESIDENTS})
    for r in RESIDENTS:
        print(build(r))
