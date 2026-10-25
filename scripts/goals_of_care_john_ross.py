"""
One Life Foundation — Goals of Care: John Ross
One-page quick-reference for Ambulance Victoria / hospital handover
"""

import os
import shutil
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# ─── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
LOGO_PATH = os.path.join(PROJECT_ROOT, "public", "logo.png")
DOWNLOADS = r"C:\Users\kevin\Downloads"
FILENAME = "Goals_of_Care_John_Ross.pdf"
OUTPUT_PATH = os.path.join(PROJECT_ROOT, FILENAME)
DOWNLOADS_PATH = os.path.join(DOWNLOADS, FILENAME)

# ─── OLF Colours ───────────────────────────────────────────────────────────────
NAVY = HexColor("#0F528A")
GREEN = HexColor("#0ea03e")
LIGHT_BLUE = HexColor("#EBF4FB")
LIGHT_GREY = HexColor("#F5F7FA")
GREY_BORDER = HexColor("#D1D5DB")
DARK_TEXT = HexColor("#1E293B")
MED_TEXT = HexColor("#475569")
RED = HexColor("#DC2626")
LIGHT_RED = HexColor("#FEF2F2")
LIGHT_GREEN = HexColor("#F0FDF4")
DARK_GREEN = HexColor("#166534")

W, H = A4

# ─── Styles (compact for one-pager) ────────────────────────────────────────────
styles = getSampleStyleSheet()

title_style = ParagraphStyle("DocTitle", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=12, textColor=white,
    alignment=TA_CENTER, spaceAfter=0, leading=15)

section_head = ParagraphStyle("SectionHead", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=7.5, textColor=white,
    alignment=TA_LEFT, leading=10)

label_style = ParagraphStyle("Label", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=7, textColor=DARK_TEXT,
    leading=9)

value_style = ParagraphStyle("Value", parent=styles["Normal"],
    fontName="Helvetica", fontSize=7, textColor=DARK_TEXT,
    leading=9)

value_bold = ParagraphStyle("ValueBold", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=7, textColor=DARK_TEXT,
    leading=9)

check_label = ParagraphStyle("CheckLabel", parent=styles["Normal"],
    fontName="Helvetica", fontSize=7, textColor=DARK_TEXT,
    leading=9)

footer_style = ParagraphStyle("Footer", parent=styles["Normal"],
    fontName="Helvetica", fontSize=5.5, textColor=MED_TEXT,
    alignment=TA_CENTER, leading=7)

SP = 1  # spacer mm between sections


def section_bar(text, color=NAVY):
    t = Table([[Paragraph(text, section_head)]], colWidths=[W - 20*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("ROUNDEDCORNERS", [2, 2, 2, 2]),
    ]))
    return t


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH, pagesize=A4,
        topMargin=8*mm, bottomMargin=6*mm,
        leftMargin=10*mm, rightMargin=10*mm
    )

    story = []
    full_w = W - 20*mm

    # ── Header ──
    if os.path.exists(LOGO_PATH):
        logo = Image(LOGO_PATH, width=24*mm, height=10*mm, kind="proportional")
    else:
        logo = Paragraph("OLF", ParagraphStyle("OLF", fontName="Helvetica-Bold", fontSize=8, textColor=white))

    header_table = Table([[
        logo,
        Paragraph("GOALS OF CARE — HOSPITAL PASSPORT", title_style),
        Paragraph("CONFIDENTIAL", ParagraphStyle("Conf", parent=styles["Normal"],
            fontName="Helvetica-Bold", fontSize=6, textColor=HexColor("#93C5FD"),
            alignment=TA_RIGHT, leading=8))
    ]], colWidths=[28*mm, full_w - 56*mm, 28*mm])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROUNDEDCORNERS", [3, 3, 0, 0]),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 1.5*mm))

    # ── RESUSCITATION STATUS ──
    resus_green = ParagraphStyle("ResusGreen", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=9, textColor=DARK_GREEN, alignment=TA_CENTER, leading=12)
    resus_sub = ParagraphStyle("ResusSub", parent=styles["Normal"],
        fontName="Helvetica", fontSize=6.5, textColor=DARK_GREEN, alignment=TA_CENTER, leading=8)
    resus_table = Table([
        [Paragraph("\u2714  FOR FULL CODE RESUSCITATION", resus_green)],
        [Paragraph("John does NOT have a Non-For-Resuscitation (NFR) plan. He is for FULL resuscitation.", resus_sub)],
    ], colWidths=[full_w])
    resus_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GREEN),
        ("BOX", (0, 0), (-1, -1), 1.5, GREEN),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (0, 0), 3),
        ("BOTTOMPADDING", (-1, -1), (-1, -1), 3),
        ("ROUNDEDCORNERS", [3, 3, 3, 3]),
    ]))
    story.append(resus_table)
    story.append(Spacer(1, SP*mm))

    # ── PARTICIPANT DETAILS (compact 4-col) ──
    story.append(section_bar("PARTICIPANT DETAILS"))
    story.append(Spacer(1, 0.5*mm))
    cw = [32*mm, full_w/2 - 32*mm, 32*mm, full_w/2 - 32*mm]
    det_rows = [
        [("Full Name", "John Eric Ross"), ("Preferred Name", "John")],
        [("Date of Birth", "30/12/1961 (Age 64)"), ("NDIS Number", "574 479 496")],
        [("Address", "59 Severn St, Epping VIC 3076"), ("Phone", "0488 700 146")],
    ]
    data = []
    for row in det_rows:
        cells = []
        for label, value in row:
            cells.append(Paragraph(label, label_style))
            cells.append(Paragraph(value, value_style))
        data.append(cells)
    t = Table(data, colWidths=cw)
    cmds = [
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    for r in range(len(data)):
        cmds.append(("BACKGROUND", (0, r), (0, r), LIGHT_GREY))
        cmds.append(("BACKGROUND", (2, r), (2, r), LIGHT_GREY))
    t.setStyle(TableStyle(cmds))
    story.append(t)
    story.append(Spacer(1, SP*mm))

    # ── KEY CONTACTS (3-col, single row — only critical contacts for ambos) ──
    story.append(section_bar("KEY CONTACTS"))
    story.append(Spacer(1, 0.5*mm))
    cw3 = full_w / 4
    contact_data = [
        [
            Paragraph("<b>NOK (Wife)</b>", label_style),
            Paragraph("<b>GP</b>", label_style),
            Paragraph("<b>Support Coordinator</b>", label_style),
            Paragraph("<b>Pharmacy</b>", label_style),
        ],
        [
            Paragraph("Beverly Ross<br/>0416 104 301", value_style),
            Paragraph("Dr Shahzad Ahmed<br/>Plenty Valley Medical<br/>03 9436 9677", value_style),
            Paragraph("Gulsun Ali<br/>Interconnection<br/>0407 346 180", value_style),
            Paragraph("Terry White Pharmacy<br/>South Morang<br/>03 9408 3222", value_style),
        ],
    ]
    ct = Table(contact_data, colWidths=[cw3] * 4)
    ct.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GREY),
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(ct)
    story.append(Spacer(1, SP*mm))

    # ── MEDICAL OVERVIEW ──
    story.append(section_bar("MEDICAL OVERVIEW"))
    story.append(Spacer(1, 0.5*mm))
    med_data = []
    med_rows = [
        ("Primary Dx", "Severe Diabetic Peripheral Neuropathy — sensorimotor impairment, reduced limb function, chronic pain, weakness, fatigue"),
        ("Secondary Dx", "Type 2 Diabetes  |  End Stage Kidney Disease (haemodialysis)  |  Bowel & bladder incontinence  |  SPC in situ  |  Lower limb & abdominal wounds  |  Pressure injury risk"),
        ("Mobility", "Non-ambulant. Transfer requirements currently under review by allied health team. "
                      "<b>Floor hoist: X3 staff. Ceiling hoist: X2 staff.</b>"),
    ]
    for label, value in med_rows:
        med_data.append([Paragraph(label, label_style), Paragraph(value, value_style)])
    mt = Table(med_data, colWidths=[32*mm, full_w - 32*mm])
    mt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GREY),
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(mt)
    story.append(Spacer(1, SP*mm))

    # ── DIALYSIS SCHEDULE ──
    story.append(section_bar("REGULAR DIALYSIS SCHEDULE"))
    story.append(Spacer(1, 0.5*mm))
    dw = full_w / 4
    dial_table = Table([
        [Paragraph("<b>Location</b>", label_style), Paragraph("<b>Days</b>", label_style),
         Paragraph("<b>Time</b>", label_style), Paragraph("<b>Transport</b>", label_style)],
        [Paragraph("Northern Hospital<br/>(Epping Campus)", value_style),
         Paragraph("Every Tuesday, Thursday<br/>and Saturday", value_style),
         Paragraph("<b>2:30 PM</b>", value_bold),
         Paragraph("Ambulance Victoria<br/>scheduled transport", value_style)],
    ], colWidths=[dw] * 4)
    dial_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BLUE),
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(dial_table)
    story.append(Spacer(1, SP*mm))

    # ── DECISION-MAKING CAPACITY (compact) ──
    story.append(section_bar("DECISION-MAKING CAPACITY"))
    story.append(Spacer(1, 0.5*mm))
    cap_text = Paragraph(
        "John is <b>cognitively capable</b> of making his own decisions regarding care and treatment. "
        "No communication deficits. His wife, <b>Beverly Ross (NOK — 0416 104 301)</b>, should be contacted "
        "for significant medical decisions or hospital admissions.",
        value_style
    )
    cap_t = Table([[cap_text]], colWidths=[full_w])
    cap_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BLUE),
        ("BOX", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(cap_t)
    story.append(Spacer(1, SP*mm))

    # ── INSULIN & MEDICATIONS ──
    story.append(section_bar("INSULIN & MEDICATIONS", RED))
    story.append(Spacer(1, 0.5*mm))
    meds_data = [
        [Paragraph("<b>Insulin<br/>Administration</b>", label_style),
         Paragraph("Before Breakfast: <b>16 units Toujeo + 5 units Novorapid</b><br/>"
                    "Before Lunch: <b>5 units Novorapid</b><br/>"
                    "Before Dinner: <b>5 units Novorapid</b>", value_style)],
        [Paragraph("<b>BGL</b>", label_style),
         Paragraph("Blood glucose checks <b>3x daily</b>. Cannot self-monitor (reduced finger sensation).", value_style)],
        [Paragraph("<b>Medications</b>", label_style),
         Paragraph("Full support required for medication admin — cannot manage packaging. Refer to medication chart.", value_style)],
        [Paragraph("<b>BOC</b>", label_style),
         Paragraph("John frequently declines to take his medications when presented by staff. He will request that medications "
                    "be left on the table, stating he will take them later. John then often dozes off and forgets to take them. "
                    "When staff follow up or remind him, he becomes agitated and verbally refuses, directing staff to leave him alone. "
                    "This pattern occurs across all medication rounds, not only in the morning. On dialysis days, John tends to take "
                    "his breakfast and morning medications late, which results in him skipping his lunch medications. "
                    "Refer to Dignity of Risk — Medication Self-Administration Behaviour document (OLF-DOR-JR-001) for staff response guidelines.", value_style)],
    ]
    meds_t = Table(meds_data, colWidths=[25*mm, full_w - 25*mm])
    meds_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_RED),
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(meds_t)
    story.append(Spacer(1, SP*mm))

    # ── PRE-TRANSFER CHECKLIST ──
    story.append(section_bar("PRE-TRANSFER CHECKLIST (Staff to complete before ambulance departure)"))
    story.append(Spacer(1, 0.5*mm))

    # All 6 items + date/time/staff in one compact grid
    chk_w = full_w / 3
    items = ["Breakfast", "Morning Insulin", "Morning Medications",
             "Lunch", "Lunch Insulin", "Lunch Medications"]
    chk_rows = []
    for i in range(0, 6, 3):
        chk_rows.append([Paragraph(f"\u2610  {items[i+j]}", check_label) for j in range(3)])
    # Date/time/staff row
    chk_rows.append([
        Paragraph("<b>Date:</b> ______________", check_label),
        Paragraph("<b>Time:</b> ______________", check_label),
        Paragraph("<b>Staff:</b> _______________________", check_label),
    ])
    chk_t = Table(chk_rows, colWidths=[chk_w] * 3)
    chk_t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, -1), (-1, -1), LIGHT_GREY),
    ]))
    story.append(chk_t)
    story.append(Spacer(1, SP*mm))

    # ── TRANSFER INFORMATION ──
    story.append(section_bar("TRANSFER INFORMATION"))
    story.append(Spacer(1, 0.5*mm))
    transfer_data = [
        [Paragraph("<b>Hoist Requirements</b>", label_style),
         Paragraph("<b>Ceiling Hoist: X2 staff  |  Floor Hoist: X3 staff</b>", value_style)],
        [Paragraph("<b>Reason</b>", label_style),
         Paragraph("Haemodialysis 3x/week at Northern Hospital. Non-ambulant — requires ambulance with hoist/stretcher.", value_style)],
        [Paragraph("<b>BP Monitoring</b>", label_style),
         Paragraph("John has an unstable blood pressure condition. BP can rise or drop rapidly. "
                    "<b>Blood pressure must be checked and monitored before any attempt is made to transfer him out of bed</b>, "
                    "as sudden changes may place him at increased risk during transfers.", value_style)],
        [Paragraph("<b>Transfer Review</b>", label_style),
         Paragraph("John's transfer requirements are currently under review by his Occupational Therapist (OT) and Physiotherapist. "
                    "The hoist and other transfer equipment are currently being trialled and assessed by his treating allied health team. "
                    "<b>Support workers must not transfer John out of bed using the hoist or any other transfer equipment until "
                    "written clearance and specific transfer instructions have been provided by his treating OT and Physiotherapist.</b>", value_style)],
        [Paragraph("<b>Equipment</b>", label_style),
         Paragraph("Hoist sling, Hospital Passport folder, medication chart.", value_style)],
    ]
    tr_t = Table(transfer_data, colWidths=[28*mm, full_w - 28*mm])
    tr_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GREY),
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(tr_t)
    story.append(Spacer(1, 1*mm))

    # Safety note
    safety_text = Paragraph(
        "Until clearance is received, staff must follow the current transfer plan and seek guidance from the "
        "Clinical Team or Management if there are any concerns. <b>The safety of John and staff must remain "
        "the highest priority at all times.</b>",
        ParagraphStyle("Safety", parent=value_style, fontSize=6.5, textColor=HexColor("#DC2626"), leading=9)
    )
    safety_t = Table([[safety_text]], colWidths=[full_w])
    safety_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#FEF2F2")),
        ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#DC2626")),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(safety_t)
    story.append(Spacer(1, 1*mm))

    # ── Footer ──
    story.append(Paragraph(
        "One Life Foundation  |  ABN: 55 643 227 061  |  NDIS Registered Provider  |  "
        "Goals of Care — John Eric Ross  |  NDIS: 574 479 496  |  "
        "This document should accompany John during all hospital transfers and ambulance transport.",
        footer_style
    ))

    doc.build(story)
    print(f"PDF generated: {OUTPUT_PATH}")
    shutil.copy2(OUTPUT_PATH, DOWNLOADS_PATH)
    print(f"Copied to: {DOWNLOADS_PATH}")


if __name__ == "__main__":
    build_pdf()
