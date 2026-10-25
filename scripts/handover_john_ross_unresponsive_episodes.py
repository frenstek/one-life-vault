"""
One Life Foundation — Handover to the Dialysis Unit, The Northern Hospital (Epping): John Ross
Brief episodes of unresponsiveness observed when John is moved.

Observations only. Every item comes from John's records in the OLF vault (progress notes, incident
INC-202605-006, support plan, hospital passport) or from support worker observation. No diagnosis
or cause is stated: that is for the treating team.
"""

import os
import shutil
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, HRFlowable
from reportlab.lib.styles import ParagraphStyle

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
LOGO_PATH = os.path.join(PROJECT_ROOT, "public", "logo.png")
FILENAME = "Handover to Dialysis Unit - John Ross - Episodes of Unresponsiveness.pdf"
OLD_FILENAME = "Staff Handover - John Ross - Unresponsive Episodes When Moved.pdf"
OUTPUT_PATH = os.path.join(PROJECT_ROOT, FILENAME)
DOWNLOADS = r"C:\Users\kevin\Downloads"

BLUE = HexColor("#309EDD")
GREEN = HexColor("#0ea03e")
INK = HexColor("#1E293B")
MUTED = HexColor("#64748B")
RULE = HexColor("#E2E8F0")
LABEL_BG = HexColor("#F5F7FA")

W, H = A4
M = 18 * mm
FULL = W - 2 * M

body = ParagraphStyle("Body", fontName="Helvetica", fontSize=9.5, leading=13.5, textColor=INK, spaceAfter=4)
small = ParagraphStyle("Small", parent=body, fontSize=8.5, leading=11.5, textColor=MUTED)
h1 = ParagraphStyle("H1", fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=INK)
sub = ParagraphStyle("Sub", fontName="Helvetica", fontSize=10.5, leading=14, textColor=MUTED)
h2 = ParagraphStyle("H2", fontName="Helvetica-Bold", fontSize=12.5, leading=16, textColor=BLUE, spaceBefore=10, spaceAfter=4)
cell = ParagraphStyle("Cell", parent=body, fontSize=9, leading=12, spaceAfter=0)
cell_b = ParagraphStyle("CellB", parent=cell, fontName="Helvetica-Bold")
bullet = ParagraphStyle("Bullet", parent=body, leftIndent=12, bulletIndent=2, spaceAfter=2.5)


def bullets(items):
    return [Paragraph(t, bullet, bulletText="\u2022") for t in items]


def info_table(rows, label_w=40 * mm):
    t = Table([[Paragraph(a, cell_b), Paragraph(b, cell)] for a, b in rows], colWidths=(label_w, FULL - label_w))
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, RULE),
        ("BACKGROUND", (0, 0), (0, -1), LABEL_BG),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def on_page(c, doc):
    c.saveState()
    if doc.page > 1 and os.path.exists(LOGO_PATH):
        c.drawImage(LOGO_PATH, M, H - 14 * mm, width=22 * mm, height=9 * mm, preserveAspectRatio=True, mask="auto")
        c.setFont("Helvetica", 8)
        c.setFillColor(MUTED)
        c.drawRightString(W - M, H - 10.5 * mm, "Handover to Dialysis Unit  |  John Ross")
        c.setStrokeColor(RULE)
        c.line(M, H - 16 * mm, W - M, H - 16 * mm)
    c.setStrokeColor(RULE)
    c.line(M, 14 * mm, W - M, 14 * mm)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(MUTED)
    c.drawString(M, 9.5 * mm, "One Life Foundation  |  Handover to Dialysis Unit  |  John Ross  |  NDIS 574479496  |  Confidential")
    c.drawRightString(W - M, 9.5 * mm, f"{doc.page}  |  Page")
    c.restoreState()


def build():
    doc = SimpleDocTemplate(OUTPUT_PATH, pagesize=A4, leftMargin=M, rightMargin=M, topMargin=20 * mm, bottomMargin=20 * mm,
                            title="Handover to Dialysis Unit - John Ross", author="One Life Foundation")
    s = []

    if os.path.exists(LOGO_PATH):
        s.append(Image(LOGO_PATH, width=42 * mm, height=17 * mm, kind="proportional", hAlign="LEFT"))
        s.append(Spacer(1, 5 * mm))
    s.append(Paragraph("Handover to the Dialysis Unit", ParagraphStyle("Kicker", fontName="Helvetica-Bold", fontSize=9, textColor=GREEN, leading=12)))
    s.append(Paragraph("John Ross: brief episodes of unresponsiveness when he is moved", h1))
    s.append(Spacer(1, 2 * mm))
    s.append(Paragraph("For the attention of the treating team, Dialysis Unit, The Northern Hospital (Epping).", sub))
    s.append(Spacer(1, 4 * mm))

    s.append(info_table([
        ("Patient", "John Eric Ross  |  DOB 30/12/1961  |  NDIS 574479496"),
        ("Dialysis", "Haemodialysis, Tuesday / Thursday / Saturday, 2:30 PM, transported by ambulance"),
        ("Resuscitation", "<b>Full code</b> (for resuscitation)"),
        ("From", "One Life Foundation, Supported Independent Living provider"),
        ("Contact", "Swosthani Thapa, Operations Manager  |  0457 347 882  |  swos@olfndisservices.com.au"),
        ("Date", "29 September 2026"),
    ]))

    s.append(Paragraph("Reason for this handover", h2))
    s.append(Paragraph(
        "Support workers have noticed <b>several episodes where John becomes unresponsive for several seconds when he "
        "is moved</b>. These have happened during bed care and transfers, for example pad changes, bed sheet changes, "
        "repositioning and hoist transfers. During these episodes John stops moving and does not respond to his name. "
        "He has been observed to keep breathing. <b>During one episode, staff noticed his eyes rolling.</b> Afterwards "
        "he has told staff his <b>head was spinning</b> or that he felt <b>dizzy</b>.", body))
    s.append(Paragraph("This handover is to make the unit aware of what staff have noticed.", body))

    s.append(Paragraph("Observations recorded in John's notes", h2))
    s.append(info_table([
        ("27/05/2026", "During a bed sheet change John showed no movement for about half a minute; when asked, he said his head "
                       "was spinning. Later the same morning, after a hoist transfer with his OT and physiotherapist, he reported "
                       "sudden dizziness. Two episodes of unresponsiveness were recorded that day (incident INC-202605-006) and "
                       "his wife was informed."),
        ("15/06/2026", "During a transfer with his physiotherapist and OT, blood pressure was recorded as <b>157/98</b> before, "
                       "and <b>112/57</b> after John was moved to the chair."),
        ("02/09/2026", "Hoist transfer with the physiotherapist to the commode and chair. Blood pressure was checked three times "
                       "and did not drop."),
        ("09/09/2026", "Hoist transfers with the physiotherapist (commode, bed, chair). Blood pressure was checked and stayed "
                       "steady during the transfers."),
        ("25/09/2026", "John reported feeling giddy in the morning, and was drowsy for the rest of the day."),
    ], label_w=28 * mm))

    s.append(Paragraph("Relevant background from John's records", h2))
    s += bullets([
        "Type 2 diabetes mellitus (Novorapid and Optisulin insulin), end stage kidney disease on haemodialysis, and severe "
        "diabetic peripheral neuropathy.",
        "Suprapubic catheter in situ. Multiple lower limb and abdominal wounds; high risk of pressure injury.",
        "Non-ambulant. Two staff for all bed mobility; hoist transfers are done with his physiotherapist.",
        "His community physiotherapist's note of 29/07/2026 lists a drop in blood pressure leading to fainting as one of the "
        "risks when John is hoisted out of bed. His OT has trialled a tilt-in-space commode for this reason.",
        "His hospital passport records a history of unresponsiveness for a few seconds during transfers.",
    ])

    s.append(Paragraph("Key contacts", h2))
    s.append(info_table([
        ("OLF", "Swosthani Thapa, Operations Manager  |  0457 347 882"),
        ("Next of kin", "Beverly Ross (wife)  |  0416 104 301"),
        ("GP", "Dr Shahzad Ahmed, Plenty Valley Medical Centre  |  03 9436 9677"),
        ("Support coordinator", "Gulsun Ali, Interconnection Support Services  |  0407 346 180"),
    ]))

    s.append(Spacer(1, 6 * mm))
    s.append(HRFlowable(width="100%", color=RULE, thickness=0.6))
    s.append(Spacer(1, 2 * mm))
    s.append(Paragraph("This handover reports observations made by One Life Foundation support workers and entries in John's "
                       "records. It does not state a diagnosis or cause.  |  Approved by: Kevin Rae Geronimo - General Manager", small))

    doc.build(s, onFirstPage=on_page, onLaterPages=on_page)
    shutil.copy(OUTPUT_PATH, os.path.join(DOWNLOADS, FILENAME))
    # The earlier staff version is replaced by this one.
    for d in (PROJECT_ROOT, DOWNLOADS):
        old = os.path.join(d, OLD_FILENAME)
        if os.path.exists(old):
            os.remove(old)
    print("Saved", OUTPUT_PATH)


if __name__ == "__main__":
    build()
