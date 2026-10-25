"""
One Life Foundation — Hospital Passport: Darrell James Twyford
Matches the format from HospitalPassportTab.jsx (jsPDF) using reportlab
"""

import os
import shutil
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    KeepTogether, HRFlowable, Frame, PageTemplate, BaseDocTemplate
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# ─── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
LOGO_PATH = os.path.join(PROJECT_ROOT, "public", "logo.png")
DOWNLOADS = r"C:\Users\kevin\Downloads"
FILENAME = "Hospital_Passport_Darrell_James_Twyford.pdf"
OUTPUT_PATH = os.path.join(DOWNLOADS, FILENAME)

# ─── OLF Colours ───────────────────────────────────────────────────────────────
NAVY = HexColor("#0F528A")
GREEN = HexColor("#0ea03e")
TEAL = HexColor("#0F766E")
PURPLE = HexColor("#7C3AED")
AMBER = HexColor("#F59E0B")
RED = HexColor("#DC2626")
LIGHT_BLUE = HexColor("#EBF4FB")
LIGHT_GREY = HexColor("#F5F7FA")
GREY_BORDER = HexColor("#E2E8F0")
DARK_TEXT = HexColor("#1E293B")
MED_TEXT = HexColor("#475569")
LIGHT_TEXT = HexColor("#94A3B8")
LABEL_BG = HexColor("#F5F7FA")
RED_BG = HexColor("#FEF2F2")
RED_BORDER_COLOR = HexColor("#EF4444")
RED_TEXT = HexColor("#991B1B")

W, H = A4
ML = 15 * mm
MR = 15 * mm
MT = 8 * mm
CW = W - ML - MR
HEADER_H = 26 * mm
FOOTER_H = 12 * mm

# ─── Participant Data ──────────────────────────────────────────────────────────
PARTICIPANT = {
    "full_name": "Darrell James Twyford",
    "preferred_name": "Darrell",
    "dob": "12/10/1961",
    "ndis": "431576804",
    "phone": "0433 795 906",
    "location": "59 Severn Street, Epping VIC 3076",
    "email": "darrell1210@msn.com",
    "medicare": None,
}

PROVIDER = {
    "name": "One Life Foundation",
    "phone": "1300 ONE LIFE (1300 663 543)",
    "email": "info@onelifefoundation.com.au",
    "address": "59 Severn Street, Epping VIC 3076",
    "service": "Supported Independent Living (SIL)",
}

EMERGENCY = {
    "name": "Aroshi Bandarawatte",
    "phone": "0424 101 065",
    "relationship": "Support Coordinator (Western Coordination Plus)",
    "backup": "Mirjana — 0414 822 440 (Backup SC)",
}

GP = {
    "name": "Dr Matthew Penn",
    "phone": "03 9810 3000",
    "clinic": "Access Health and Community, 21-31 Goodwood Street, Richmond VIC 3121",
}

# ─── Styles ────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

s_body = ParagraphStyle("Body", parent=styles["Normal"],
    fontName="Helvetica", fontSize=8, leading=11, textColor=DARK_TEXT)
s_body_bold = ParagraphStyle("BodyBold", parent=s_body, fontName="Helvetica-Bold")
s_label = ParagraphStyle("Label", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=7.5, leading=10, textColor=MED_TEXT)
s_value = ParagraphStyle("Value", parent=styles["Normal"],
    fontName="Helvetica", fontSize=8, leading=11, textColor=DARK_TEXT)
s_section = ParagraphStyle("Section", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=white)
s_alert = ParagraphStyle("Alert", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=RED_TEXT)
s_footer = ParagraphStyle("Footer", parent=styles["Normal"],
    fontName="Helvetica", fontSize=6, leading=8, textColor=LIGHT_TEXT)
s_header_title = ParagraphStyle("HeaderTitle", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=white)
s_header_name = ParagraphStyle("HeaderName", parent=styles["Normal"],
    fontName="Helvetica", fontSize=10, leading=13, textColor=white)
s_header_ndis = ParagraphStyle("HeaderNDIS", parent=styles["Normal"],
    fontName="Helvetica", fontSize=8, leading=10, textColor=white)
s_header_right = ParagraphStyle("HeaderRight", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=white, alignment=TA_RIGHT)
s_header_right_sm = ParagraphStyle("HeaderRightSm", parent=styles["Normal"],
    fontName="Helvetica", fontSize=7, leading=9, textColor=white, alignment=TA_RIGHT)
s_confidential = ParagraphStyle("Confidential", parent=styles["Normal"],
    fontName="Helvetica", fontSize=6, leading=8, textColor=white, alignment=TA_RIGHT)


def section_bar(title, color=NAVY):
    """Coloured section heading bar"""
    t = Table(
        [[Paragraph(title.upper(), s_section)]],
        colWidths=[CW],
        rowHeights=[7 * mm],
    )
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def info_row(label, value):
    """Label | Value table row"""
    if not value:
        return None
    t = Table(
        [[Paragraph(label, s_label), Paragraph(str(value), s_value)]],
        colWidths=[44 * mm, CW - 44 * mm],
    )
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), LABEL_BG),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.2, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 2 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 1.5 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5 * mm),
    ]))
    return t


def alert_box(text):
    """Red alert box for critical information"""
    t = Table(
        [[Paragraph(text, s_alert)]],
        colWidths=[CW],
    )
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), RED_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, RED_BORDER_COLOR),
        ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
    ]))
    return t


def build_header(canvas, doc):
    """Draw header on every page"""
    canvas.saveState()
    # Navy header bar
    canvas.setFillColor(NAVY)
    canvas.rect(0, H - MT - HEADER_H, W, MT + HEADER_H, fill=1, stroke=0)

    # Logo
    if os.path.exists(LOGO_PATH):
        try:
            canvas.drawImage(LOGO_PATH, ML, H - MT - HEADER_H + 5 * mm, width=26 * mm, height=13 * mm, preserveAspectRatio=True, mask='auto')
        except:
            pass

    text_x = ML + 30 * mm

    # Title
    canvas.setFillColor(white)
    canvas.setFont("Helvetica-Bold", 16)
    canvas.drawString(text_x, H - MT - 9 * mm, "HOSPITAL PASSPORT")

    # Name
    canvas.setFont("Helvetica", 10)
    canvas.drawString(text_x, H - MT - 17 * mm, PARTICIPANT["full_name"])

    # NDIS
    canvas.setFont("Helvetica", 8)
    canvas.drawString(text_x, H - MT - 22 * mm, f"NDIS: {PARTICIPANT['ndis']}")

    # Right side
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawRightString(W - MR, H - MT - 9 * mm, "One Life Foundation")
    canvas.setFont("Helvetica", 7)
    canvas.drawRightString(W - MR, H - MT - 15 * mm, "Generated: 13 Aug 2026")
    canvas.setFont("Helvetica", 6)
    canvas.drawRightString(W - MR, H - MT - 20 * mm, "CONFIDENTIAL")

    # Footer
    canvas.setStrokeColor(GREY_BORDER)
    canvas.setLineWidth(0.3)
    fy = MT + 4 * mm
    canvas.line(ML, fy, W - MR, fy)
    canvas.setFillColor(LIGHT_TEXT)
    canvas.setFont("Helvetica", 6)
    canvas.drawString(ML, MT, f"One Life Foundation  |  Hospital Passport  |  {PARTICIPANT['full_name']}  |  NDIS: {PARTICIPANT['ndis']}")
    canvas.drawRightString(W - MR, MT, f"Page {doc.page}")

    canvas.restoreState()


# ─── Build Document ────────────────────────────────────────────────────────────

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=A4,
    leftMargin=ML,
    rightMargin=MR,
    topMargin=MT + HEADER_H + 4 * mm,
    bottomMargin=MT + FOOTER_H,
)

elements = []
sp = Spacer(1, 3 * mm)

# ═══ 1. PARTICIPANT DETAILS ═══
elements.append(section_bar("Participant Details"))
elements.append(info_row("Full Name", PARTICIPANT["full_name"]))
elements.append(info_row("Preferred Name", PARTICIPANT["preferred_name"]))
elements.append(info_row("Date of Birth", PARTICIPANT["dob"]))
elements.append(info_row("NDIS Number", PARTICIPANT["ndis"]))
elements.append(info_row("Address", PARTICIPANT["location"]))
elements.append(info_row("Phone", PARTICIPANT["phone"]))
elements.append(info_row("Email", PARTICIPANT["email"]))
elements.append(sp)

# ═══ 2. SUPPORT PROVIDER ═══
elements.append(section_bar("Support Provider", GREEN))
elements.append(info_row("Provider", PROVIDER["name"]))
elements.append(info_row("Phone", PROVIDER["phone"]))
elements.append(info_row("Email", PROVIDER["email"]))
elements.append(info_row("Address", PROVIDER["address"]))
elements.append(info_row("Service Type", PROVIDER["service"]))
elements.append(sp)

# ═══ 3. EMERGENCY CONTACT / NEXT OF KIN ═══
elements.append(section_bar("Emergency Contact / Next of Kin", RED))
elements.append(info_row("Name", f"{EMERGENCY['name']} ({EMERGENCY['relationship']})"))
elements.append(info_row("Phone", EMERGENCY["phone"]))
elements.append(info_row("Backup SC", EMERGENCY["backup"]))
elements.append(info_row("Family", "Family lives in Mildura, visits occasionally. Ex-partner Alex lives in Mickleham."))
elements.append(info_row("GP", f"{GP['name']} ({GP['clinic']})"))
elements.append(info_row("GP Phone", GP["phone"]))
elements.append(sp)

# ═══ 4. RESUSCITATION STATUS ═══
elements.append(section_bar("Resuscitation Status"))
elements.append(info_row("Status", "FULL CODE — All resuscitation measures"))
elements.append(sp)

# ═══ 5. MEDICAL INFORMATION ═══
elements.append(section_bar("Medical Information"))
elements.append(info_row("Primary Diagnosis", "Lewy Body Dementia, Parkinson's Disease"))
elements.append(info_row("Other Conditions",
    "Depression & Anxiety\n"
    "HIV/AIDS\n"
    "REM Sleep Behaviour Disorder\n"
    "Visual Disturbance\n"
    "Progressive Cognitive Impairment\n"
    "Osteoporosis\n"
    "Ischaemic Heart Disease\n"
    "Chronic Back Pain\n"
    "PCA Syndrome (Balint Syndrome)\n"
    "Appendicular Dyskinesia\n"
    "Bradykinesia\n"
    "Freezing Gait Syndrome\n"
    "Orthostatic Hypotension"
))
elements.append(Spacer(1, 2 * mm))
elements.append(alert_box(
    "FALLS RISK — Freezing gait syndrome and orthostatic hypotension. "
    "Requires supervision during transfers and mobilisation. "
    "Male staff required overnight for manual handling/transfers."
))
elements.append(Spacer(1, 2 * mm))
elements.append(alert_box(
    "BSP IN PLACE — Refer to Form56 High Risk Participant Register. "
    "Darrell is classified as a high-risk participant."
))
elements.append(sp)

# ═══ 6. CURRENT MEDICATIONS ═══
elements.append(section_bar("Current Medications"))
elements.append(info_row("Medication Regime",
    "Webster packs dispensed by pharmacist. Takes same medication daily but may "
    "take from different days depending on webster pack start date. Multiple webster "
    "packs may be available — workers need to monitor correct day."
))
elements.append(info_row("Medication Prompts",
    "Has alarm system (giant clock + phone alarms) for medication times. "
    "SIL support workers assist/prompt as needed."
))
elements.append(info_row("Reference", "Refer to Form40 Medication Chart for full medication list, dosages, and administration times."))
elements.append(sp)

# ═══ 7. COMMUNICATION ═══
elements.append(section_bar("Communication"))
elements.append(info_row("How I Communicate", "Verbal communication. English-speaking, born in Australia. No interpreter needed."))
elements.append(info_row("Communication Aids", "Nil — communicates verbally. May have reduced cognitive processing due to Lewy body dementia; allow extra time for responses."))
elements.append(sp)

# ═══ 8. THINGS TO KNOW ABOUT ME ═══
elements.append(section_bar("Things to Know About Me", PURPLE))
elements.append(info_row("Cultural Identity",
    "Part of the LGBTQI community. Preference for male support workers. "
    "Male staff required overnight due to manual handling/transfers."
))
elements.append(info_row("Travel & Access",
    "Reliant on support workers for community access. "
    "Has myki travel pass, taxi card, companions card, and concession card."
))
elements.append(info_row("Other Providers",
    "Receives SIL from Arete Care and community access from Connections Home Care and Nursing. "
    "SIL, community access provider & support coordinator use email chain for alerts, rosters, and handovers."
))
elements.append(info_row("Consent",
    "Verbal consent obtained 24/06/2026 from Darrell Twyford."
))
elements.append(sp)

# ═══ 9. MOBILITY & PERSONAL CARE ═══
elements.append(section_bar("Mobility & Personal Care"))
elements.append(info_row("Mobility & Transfers",
    "Falls risk due to freezing gait syndrome and orthostatic hypotension. "
    "Bradykinesia affects speed of movement. "
    "Requires male staff overnight for manual handling and transfers."
))
elements.append(info_row("Personal Care",
    "Wears incontinence products. Uses toilet during the day but needs assistance "
    "with clean-up and pad changes. Bedding may need changing if overnight accident."
))
elements.append(info_row("Equipment & Aids",
    "Incontinence products (pads). Giant clock and phone alarms for medication reminders."
))
elements.append(sp)

# ═══ 10. BEHAVIOUR SUPPORT ═══
elements.append(section_bar("Behaviour Support", AMBER))
elements.append(info_row("BSP Status",
    "Behaviour Support Plan in place — refer to Form56 High Risk Participant Register."
))
elements.append(info_row("REM Sleep Disorder",
    "May act out dreams during REM sleep (talking, shouting, limb movements). "
    "Staff should ensure safe sleep environment and avoid startling Darrell when waking."
))
elements.append(sp)

# ═══ 11. ROUTINE APPOINTMENTS ═══
elements.append(section_bar("Routine Appointments", TEAL))
elements.append(info_row("GP", f"{GP['name']}\nAccess Health and Community\n21-31 Goodwood Street, Richmond VIC 3121\nPh: {GP['phone']}"))
elements.append(info_row("Podiatry", "Undefeated Podiatry, Craigieburn"))
elements.append(info_row("Social Worker", "Rose Knoll — Alfred Hospital"))
elements.append(info_row("Specialist", "Prof Edwina Wright — Alfred Hospital\nedwina.wright@monash.edu"))
elements.append(sp)

# ═══ 12. KEY CONTACTS & SPECIALISTS ═══
elements.append(section_bar("Key Contacts & Specialists"))
elements.append(info_row("Support Coordinator", "Aroshi Bandarawatte — 0424 101 065\nWestern Coordination Plus\nBackup: Mirjana — 0414 822 440"))
elements.append(info_row("Occupational Therapist", "Larissa Johnstone (Enhancing Independence) — 0422 609 869"))
elements.append(info_row("Psychologist", "Prof Edwina Wright (Alfred Hospital)\nedwina.wright@monash.edu"))
elements.append(info_row("Plan Manager", "My Plan Manager\nPh: 1800 861 272\naccounts@myplanmanager.com.au"))
elements.append(info_row("Funding", "Plan-managed | Funding ratio: 1:3\nPlan: 29/11/2025 – 28/11/2027"))
elements.append(sp)

# ═══ 13. ADDITIONAL NOTES ═══
elements.append(section_bar("Additional Notes"))
elements.append(info_row("Residence",
    "Darrell resides at 59 Severn Street, Epping VIC 3076."
))
elements.append(info_row("Communication Chain",
    "SIL provider, community access provider, and support coordinator use an email "
    "chain for alerts, rosters, and handovers. Hospital staff should notify the "
    "support coordinator (Aroshi) of any admission or discharge."
))

# ─── Build ─────────────────────────────────────────────────────────────────────
doc.build(elements, onFirstPage=build_header, onLaterPages=build_header)
print(f"Generated: {OUTPUT_PATH}")
