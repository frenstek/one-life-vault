"""
One Life Foundation — Dignity of Risk: John Eric Ross
Focused on medication self-administration behaviour
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
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

# ─── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
LOGO_PATH = os.path.join(PROJECT_ROOT, "public", "logo.png")
DOWNLOADS = r"C:\Users\kevin\Downloads"
FILENAME = "Dignity_of_Risk_John_Ross.pdf"
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
AMBER = HexColor("#D97706")
LIGHT_AMBER = HexColor("#FFFBEB")
BORDER_LIGHT = HexColor("#E2E8F0")

W, H = A4

# ─── Styles ────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

title_style = ParagraphStyle("DocTitle", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=16, textColor=NAVY,
    alignment=TA_CENTER, leading=20, spaceAfter=2*mm)

subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"],
    fontName="Helvetica", fontSize=10, textColor=MED_TEXT,
    alignment=TA_CENTER, leading=13)

section_head_style = ParagraphStyle("SectionHead", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=8.5, textColor=white,
    alignment=TA_LEFT, leading=11)

body_style = ParagraphStyle("Body", parent=styles["Normal"],
    fontName="Helvetica", fontSize=8.5, textColor=DARK_TEXT,
    alignment=TA_JUSTIFY, leading=12)

body_bold = ParagraphStyle("BodyBold", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=8.5, textColor=DARK_TEXT,
    alignment=TA_LEFT, leading=12)

label_style = ParagraphStyle("Label", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=8, textColor=DARK_TEXT,
    leading=10)

value_style = ParagraphStyle("Value", parent=styles["Normal"],
    fontName="Helvetica", fontSize=8, textColor=DARK_TEXT,
    leading=10)

bullet_style = ParagraphStyle("Bullet", parent=styles["Normal"],
    fontName="Helvetica", fontSize=8.5, textColor=DARK_TEXT,
    alignment=TA_LEFT, leading=12, leftIndent=10, bulletIndent=0)

meta_label = ParagraphStyle("MetaLabel", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=7.5, textColor=MED_TEXT, leading=10)

meta_value = ParagraphStyle("MetaValue", parent=styles["Normal"],
    fontName="Helvetica", fontSize=8, textColor=DARK_TEXT, leading=10)

footer_style = ParagraphStyle("Footer", parent=styles["Normal"],
    fontName="Helvetica", fontSize=6.5, textColor=MED_TEXT,
    alignment=TA_CENTER, leading=8)

alert_style = ParagraphStyle("Alert", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=8.5, textColor=RED,
    alignment=TA_LEFT, leading=12)

amber_alert_style = ParagraphStyle("AmberAlert", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=8.5, textColor=AMBER,
    alignment=TA_LEFT, leading=12)

scenario_body = ParagraphStyle("ScenarioBody", parent=styles["Normal"],
    fontName="Helvetica", fontSize=7.5, textColor=DARK_TEXT,
    leading=10)

sign_label = ParagraphStyle("SignLabel", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=8, textColor=MED_TEXT,
    leading=10)

step_num = ParagraphStyle("StepNum", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=8, textColor=white,
    alignment=TA_CENTER, leading=10)


def section_bar(text, color=NAVY):
    t = Table([[Paragraph(text, section_head_style)]], colWidths=[W - 24*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("ROUNDEDCORNERS", [2, 2, 2, 2]),
    ]))
    return t


def alert_box(text, bg=LIGHT_RED, border=RED, style=None):
    if style is None:
        style = alert_style
    p = Paragraph(text, style)
    t = Table([[p]], colWidths=[W - 24*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 1, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROUNDEDCORNERS", [3, 3, 3, 3]),
    ]))
    return t


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH, pagesize=A4,
        topMargin=10*mm, bottomMargin=12*mm,
        leftMargin=12*mm, rightMargin=12*mm
    )

    story = []
    full_w = W - 24*mm

    # ── Header ──
    navy_bar = Table([[""]], colWidths=[full_w])
    navy_bar.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    navy_bar._argH = [3*mm]
    story.append(navy_bar)
    story.append(Spacer(1, 3*mm))

    if os.path.exists(LOGO_PATH):
        logo = Image(LOGO_PATH, width=50*mm, height=18*mm, kind="proportional")
        logo.hAlign = "CENTER"
        story.append(logo)
        story.append(Spacer(1, 2*mm))

    story.append(Paragraph("Dignity of Risk", title_style))
    story.append(Paragraph("Medication Self-Administration & Insulin Refusal", subtitle_style))
    story.append(Spacer(1, 2*mm))

    # ── Metadata ──
    meta_data = [
        [("DOC NO.", "OLF-DOR-JR-001"), ("VERSION", "1.0")],
        [("EFFECTIVE DATE", "3 August 2026"), ("REVIEW DATE", "3 August 2027")],
        [("PARTICIPANT", "John Eric Ross"), ("NDIS NUMBER", "574 479 496")],
        [("APPROVED BY", "Kevin Rae Geronimo — General Manager"), ("STATUS", "Active")],
    ]
    meta_rows = []
    for row in meta_data:
        cells = []
        for label, val in row:
            cells.append(Paragraph(label, meta_label))
            cells.append(Paragraph(val, meta_value))
        meta_rows.append(cells)
    mw = [30*mm, full_w/2 - 30*mm, 30*mm, full_w/2 - 30*mm]
    mt = Table(meta_rows, colWidths=mw)
    mcmds = [
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    for r in range(len(meta_rows)):
        mcmds.append(("BACKGROUND", (0, r), (0, r), LIGHT_GREY))
        mcmds.append(("BACKGROUND", (2, r), (2, r), LIGHT_GREY))
    mt.setStyle(TableStyle(mcmds))
    story.append(mt)
    story.append(Spacer(1, 3*mm))

    # ═══════════════════════════════════════════════════════════════
    # 1. PURPOSE
    # ═══════════════════════════════════════════════════════════════
    story.append(section_bar("1. PURPOSE"))
    story.append(Spacer(1, 1*mm))
    story.append(Paragraph(
        "This document addresses specific and recurring dignity of risk matters relating to <b>John Eric Ross's</b> "
        "medication behaviour. It covers two identified behaviours: (1) John requesting that oral medications "
        "be left near him rather than taking them immediately, and (2) John refusing insulin administration. "
        "It provides support workers with clear guidelines on how to manage both situations.",
        body_style
    ))
    story.append(Spacer(1, 1.5*mm))
    story.append(Paragraph(
        "Dignity of risk recognises that all people, including those with disability, have the right to make choices "
        "about their own lives — even when those choices involve a degree of risk. However, this right must be "
        "balanced against <b>duty of care</b> obligations and the clinical realities of John's medical conditions. "
        "This document is guided by the <b>NDIS Practice Standards</b>, the <b>NDIS Code of Conduct</b>, and the "
        "<b>UN Convention on the Rights of Persons with Disabilities (UNCRPD)</b>.",
        body_style
    ))
    story.append(Spacer(1, 3*mm))

    # ═══════════════════════════════════════════════════════════════
    # 2. PARTICIPANT OVERVIEW
    # ═══════════════════════════════════════════════════════════════
    story.append(section_bar("2. PARTICIPANT OVERVIEW"))
    story.append(Spacer(1, 1*mm))
    overview_rows = [
        ("Full Name", "John Eric Ross"),
        ("Date of Birth", "30 December 1961 (Age 64)"),
        ("NDIS Number", "574 479 496"),
        ("Primary Disability", "Severe Diabetic Peripheral Neuropathy — sensorimotor impairment, reduced limb function, chronic pain"),
        ("Key Medical", "Type 2 Diabetes Mellitus  |  End Stage Kidney Disease (haemodialysis 3x/week)  |  SPC in situ"),
        ("Decision-Making", "John is cognitively capable of making his own informed decisions."),
        ("NOK", "Beverly Ross (Wife) — 0416 104 301"),
        ("GP", "Dr Shahzad Ahmed — Plenty Valley Medical Centre — 03 9436 9677"),
        ("Pharmacy", "Terry White Pharmacy, South Morang — 03 9408 3222"),
    ]
    ov_data = [[Paragraph(l, label_style), Paragraph(v, value_style)] for l, v in overview_rows]
    ov_t = Table(ov_data, colWidths=[35*mm, full_w - 35*mm])
    ov_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GREY),
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(ov_t)
    story.append(Spacer(1, 3*mm))

    # ═══════════════════════════════════════════════════════════════
    # 3. IDENTIFIED BEHAVIOUR
    # ═══════════════════════════════════════════════════════════════
    story.append(section_bar("3. IDENTIFIED BEHAVIOUR"))
    story.append(Spacer(1, 1*mm))
    story.append(Paragraph(
        "John receives the majority of his medications via <b>Webster packs</b>, which are prepared by Terry White "
        "Pharmacy (South Morang) and administered by support workers. John requires assistance with medication "
        "administration due to his reduced hand function and impaired dexterity caused by severe peripheral neuropathy.",
        body_style
    ))
    story.append(Spacer(1, 1.5*mm))
    story.append(Paragraph(
        "<b>Behaviour A — Oral Medication Self-Administration:</b>",
        body_bold
    ))
    story.append(Spacer(1, 1*mm))

    behaviours_a = [
        "When support workers present John with his medications from the Webster pack, he frequently "
        "<b>requests that the medications be left near him</b> (e.g., on his bedside table, on his tray) "
        "rather than taking them immediately.",
        "This results in <b>significant delays</b> in medication intake. On multiple occasions, John has "
        "<b>forgotten to take the medications entirely</b> after they were left with him.",
        "When support workers attempt to <b>follow up or remind</b> John to take his medications, he "
        "<b>becomes visibly angry and agitated</b>. He may respond with raised voice, verbal refusal, or "
        "expressions of frustration directed at the support worker.",
    ]
    for b in behaviours_a:
        story.append(Paragraph(f"\u2022  {b}", bullet_style))
        story.append(Spacer(1, 1*mm))

    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        "<b>Behaviour B — Insulin Refusal:</b>",
        body_bold
    ))
    story.append(Spacer(1, 1*mm))

    behaviours = [
        "When support workers attempt to administer John's insulin (Novorapid / Optisulin), he frequently "
        "<b>refuses outright</b> — declining the injection entirely, in the same manner he "
        "refuses his other medications.",
        "This is <b>not</b> a case of John asking staff to leave insulin nearby. "
        "John <b>actively refuses</b> to have his insulin administered.",
        "John also frequently <b>refuses BGL checks</b>, which are required to determine the correct insulin dosage "
        "and monitor his blood glucose levels.",
        "When support workers attempt to <b>explain the importance of insulin or encourage</b> John to accept it, he "
        "<b>becomes visibly angry and agitated</b>.",
    ]
    for b in behaviours:
        story.append(Paragraph(f"\u2022  {b}", bullet_style))
        story.append(Spacer(1, 1*mm))

    story.append(Spacer(1, 2*mm))

    # ═══════════════════════════════════════════════════════════════
    # 4. RISK ANALYSIS
    # ═══════════════════════════════════════════════════════════════
    story.append(section_bar("4. RISK ANALYSIS — WHY THIS MATTERS", RED))
    story.append(Spacer(1, 1*mm))
    story.append(Paragraph(
        "John's medications are clinically essential. Delayed or missed doses carry the following risks:",
        body_style
    ))
    story.append(Spacer(1, 1*mm))

    risk_data = [
        [Paragraph("<b>Medication</b>", label_style),
         Paragraph("<b>Risk if Delayed or Missed</b>", label_style),
         Paragraph("<b>Severity</b>", label_style)],
        [Paragraph("Oral Medications<br/>(Webster pack)", value_style),
         Paragraph("Varies by medication. May include uncontrolled blood pressure, unmanaged pain, "
                    "gastrointestinal complications, or worsening of chronic conditions. Cumulative missed "
                    "doses compound risk over time.", value_style),
         Paragraph("<font color='#D97706'><b>MEDIUM<br/>to HIGH</b></font>", value_style)],
        [Paragraph("Insulin<br/>(Novorapid /<br/>Optisulin)", value_style),
         Paragraph("Hyperglycaemia (dangerously high blood sugar). Risk of diabetic ketoacidosis (DKA) — "
                    "a life-threatening emergency requiring hospitalisation. Compounded by John's End Stage "
                    "Kidney Disease. Repeated missed doses accelerate kidney damage and increase risk of "
                    "cardiac events, infection, and poor wound healing.", value_style),
         Paragraph("<font color='#DC2626'><b>HIGH<br/>— CRITICAL</b></font>", value_style)],
        [Paragraph("BGL Monitoring<br/>(3x daily)", value_style),
         Paragraph("Without BGL readings, staff cannot determine safe insulin dosage. Risk of administering "
                    "incorrect dose if BGL is unknown. Risk of undetected hypoglycaemia or hyperglycaemia.", value_style),
         Paragraph("<font color='#DC2626'><b>HIGH</b></font>", value_style)],
    ]
    risk_t = Table(risk_data, colWidths=[full_w * 0.22, full_w * 0.6, full_w * 0.18])
    risk_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_RED),
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(risk_t)
    story.append(Spacer(1, 1.5*mm))

    story.append(Spacer(1, 2*mm))

    # ═══════════════════════════════════════════════════════════════
    # 5. STAFF GUIDELINES — HOW TO RESPOND
    # ═══════════════════════════════════════════════════════════════
    story.append(section_bar("5. STAFF GUIDELINES — HOW TO RESPOND"))
    story.append(Spacer(1, 1*mm))
    story.append(Paragraph(
        "The following step-by-step guidelines must be followed by all support workers when John requests "
        "that his medications be left near him. These guidelines balance John's dignity of risk with the "
        "clinical requirements of his care.",
        body_style
    ))
    story.append(Spacer(1, 1.5*mm))

    story.append(Paragraph(
        "<b>For Behaviour A — Oral Medications (Webster Pack):</b>",
        body_bold
    ))
    story.append(Spacer(1, 1*mm))

    steps = [
        ("PRESENT MEDICATIONS AS NORMAL",
         "Bring the Webster pack to John at the scheduled time. Offer water or juice. "
         "Calmly and respectfully ask John if he is ready to take his medications now."),
        ("IF JOHN ASKS YOU TO LEAVE THEM — ACKNOWLEDGE AND INFORM",
         "Do <b>not</b> argue or insist. Instead, acknowledge his request calmly. Inform John once, clearly "
         "and without pressure: <i>\"That's okay John. I just want to let you know these are your "
         "[morning/lunch/evening] medications and they work best when taken on time. I'll leave them "
         "here for you.\"</i> Do not lecture, repeat the risks multiple times, or adopt a parental tone."),
        ("LEAVE THE MEDICATIONS IN A SAFE, VISIBLE LOCATION",
         "Place the medications within John's reach and line of sight (e.g., bedside table, tray table). "
         "Ensure the Webster pack compartment is clearly labelled for the correct day and time."),
        ("SET A 30-MINUTE CHECK-IN (ONE FOLLOW-UP ONLY)",
         "Return after <b>30 minutes</b> to check whether John has taken his oral medications. "
         "Approach calmly: <i>\"Hey John, just checking in — did you get a chance to take your tablets?\"</i> "
         "If John has taken them, document the delay and move on. "
         "If John has not taken them, note this and proceed to Step 5. "
         "<b>Do not ask more than once.</b> Repeated prompting triggers anger and is counterproductive."),
        ("IF MEDICATIONS REMAIN UNTAKEN AFTER 30 MINUTES",
         "Do <b>not</b> continue to prompt John. Instead:<br/>"
         "\u2022 &nbsp;Document in shift notes: time offered, John's request to leave them, 30-minute follow-up, "
         "and that medications remain untaken.<br/>"
         "\u2022 &nbsp;Notify the <b>Team Leader</b> via phone or message.<br/>"
         "\u2022 &nbsp;Do not remove the medications from John's reach unless he asks you to."),
        ("IF JOHN BECOMES ANGRY OR AGITATED",
         "If at any point John becomes angry when you follow up:<br/>"
         "\u2022 &nbsp;Do not escalate. Do not raise your voice or argue.<br/>"
         "\u2022 &nbsp;Calmly say: <i>\"No worries John, I'll leave you to it.\"</i><br/>"
         "\u2022 &nbsp;Remove yourself from the situation. Give John space.<br/>"
         "\u2022 &nbsp;Document the interaction in shift notes, including John's response.<br/>"
         "\u2022 &nbsp;Notify Team Leader. Do not take it personally — this is a known behavioural pattern "
         "and is not a reflection of your care."),
    ]

    for i, (title, desc) in enumerate(steps, 1):
        step_data = [[
            Paragraph(f"<b>STEP {i}</b>", ParagraphStyle("SN", parent=styles["Normal"],
                fontName="Helvetica-Bold", fontSize=7.5, textColor=white, alignment=TA_CENTER, leading=10)),
            Paragraph(f"<b>{title}</b><br/>{desc}", value_style),
        ]]
        st = Table(step_data, colWidths=[16*mm, full_w - 16*mm])
        st.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), NAVY),
            ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(st)
        story.append(Spacer(1, 0.5*mm))

    story.append(Spacer(1, 3*mm))

    # ── Behaviour B steps ──
    story.append(Paragraph(
        "<b>For Behaviour B — Insulin Refusal:</b>",
        body_bold
    ))
    story.append(Spacer(1, 1*mm))

    insulin_steps = [
        ("OFFER BGL CHECK & INSULIN AS NORMAL",
         "Approach John at the scheduled time with BGL monitor and insulin. "
         "Calmly and respectfully ask John if he is ready for his BGL check and insulin."),
        ("IF JOHN REFUSES — ACKNOWLEDGE AND INFORM ONCE",
         "Do <b>not</b> argue or insist. Inform John once, clearly: "
         "<i>\"That's okay John. I just want to let you know your insulin is important for keeping "
         "your sugar levels safe. If you change your mind, let me know.\"</i>"),
        ("OFFER AGAIN AFTER 30 MINUTES (ONE FOLLOW-UP ONLY)",
         "Return after <b>30 minutes</b>: <i>\"Hey John, are you happy to have your insulin now?\"</i> "
         "If he accepts, do BGL check and administer. If he refuses again, proceed to Step 4."),
        ("IF JOHN STILL REFUSES",
         "Do <b>not</b> continue to prompt. Document in shift notes. Notify Team Leader. "
         "Monitor for signs of hyperglycaemia (excessive thirst, frequent urination, confusion, nausea, fruity breath). "
         "If John refuses BGL check, do <b>not</b> administer insulin without a reading."),
        ("MONITOR FOR SYMPTOMS",
         "Even if John refuses, continue observing for deterioration. "
         "If confusion, vomiting, or rapid decline is observed, contact Team Leader and consider calling 000."),
    ]

    for i, (title, desc) in enumerate(insulin_steps, 1):
        step_data = [[
            Paragraph(f"<b>STEP {i}</b>", ParagraphStyle("SN2", parent=styles["Normal"],
                fontName="Helvetica-Bold", fontSize=7.5, textColor=white, alignment=TA_CENTER, leading=10)),
            Paragraph(f"<b>{title}</b><br/>{desc}", value_style),
        ]]
        st = Table(step_data, colWidths=[16*mm, full_w - 16*mm])
        st.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), RED),
            ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(st)
        story.append(Spacer(1, 0.5*mm))

    story.append(Spacer(1, 2*mm))

    # ── Key distinction box ──
    story.append(alert_box(
        "\u26A0  REMEMBER: Oral medications (Webster pack) may be left with John as per his request. "
        "Insulin is different — John refuses it outright. In both cases: offer once, follow up once "
        "at 30 minutes, then document and notify Team Leader. Do not force or repeatedly prompt.",
        bg=LIGHT_AMBER, border=AMBER, style=amber_alert_style
    ))
    story.append(Spacer(1, 3*mm))

    # ═══════════════════════════════════════════════════════════════
    # 6. WHAT STAFF MUST NOT DO
    # ═══════════════════════════════════════════════════════════════
    story.append(section_bar("6. WHAT STAFF MUST NOT DO", RED))
    story.append(Spacer(1, 1*mm))

    donts = [
        "<b>Do not force or coerce</b> John to take his medications or insulin. This violates his rights under the NDIS Code of Conduct and may constitute restrictive practice.",
        "<b>Do not repeatedly prompt or nag.</b> One initial offer and one 30-minute follow-up is the maximum. Repeated prompting causes anger, damages rapport, and is ineffective.",
        "<b>Do not withhold other supports</b> (e.g., meals, assistance) as a consequence of John not taking his medications or refusing insulin.",
        "<b>Do not make John feel guilty</b> or use emotional pressure (e.g., \"You'll end up in hospital if you don't take these\"). State facts once, then respect his decision.",
        "<b>Do not ignore the situation.</b> Even if John declines, documentation and Team Leader notification are mandatory.",
        "<b>Do not administer insulin without a BGL reading.</b> If John refuses BGL check, insulin cannot be safely administered — document and notify Team Leader.",
    ]
    for d in donts:
        story.append(Paragraph(f"\u2718  {d}", bullet_style))
        story.append(Spacer(1, 1*mm))

    story.append(Spacer(1, 2*mm))

    # ═══════════════════════════════════════════════════════════════
    # 7. DOCUMENTATION REQUIREMENTS
    # ═══════════════════════════════════════════════════════════════
    story.append(section_bar("7. DOCUMENTATION REQUIREMENTS"))
    story.append(Spacer(1, 1*mm))
    story.append(Paragraph(
        "Every instance of delayed or declined medication must be documented in the shift notes. Include:",
        body_style
    ))
    story.append(Spacer(1, 1*mm))

    doc_items = [
        "Date and time medications were offered",
        "John's response (e.g., \"John asked for tablets to be left on his bedside table\")",
        "Time of 30-minute follow-up and outcome (taken / not taken)",
        "Whether John became agitated and how it was managed",
        "Whether Team Leader was notified (and their response)",
        "Support worker's name",
    ]
    for item in doc_items:
        story.append(Paragraph(f"\u2022  {item}", bullet_style))
    story.append(Spacer(1, 1.5*mm))

    story.append(Paragraph(
        "<b>Example shift note entry:</b>",
        body_bold
    ))
    story.append(Spacer(1, 1*mm))

    example_text = Paragraph(
        "<i>\"08:15 — Offered John his morning BGL check and insulin. John refused, saying he didn't want it. "
        "Informed John calmly that insulin is important for keeping his sugar levels safe. John said 'Not now.' "
        "Did not press further. 08:45 — Returned and offered again. John refused again in a firm tone. "
        "Did not prompt further. Notified TL [name] via text at 08:50. Monitoring John for symptoms — "
        "no signs of hyperglycaemia observed during shift. — [Staff Name]\"</i>",
        ParagraphStyle("Example", parent=body_style, fontSize=7.5, leading=10, textColor=MED_TEXT)
    )
    ex_t = Table([[example_text]], colWidths=[full_w])
    ex_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GREY),
        ("BOX", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(ex_t)
    story.append(Spacer(1, 3*mm))

    # ═══════════════════════════════════════════════════════════════
    # 8. ESCALATION PROCESS
    # ═══════════════════════════════════════════════════════════════
    story.append(section_bar("8. ESCALATION PROCESS"))
    story.append(Spacer(1, 1*mm))

    esc_data = [
        [Paragraph("<b>Situation</b>", label_style), Paragraph("<b>Action</b>", label_style)],
        [Paragraph("John initially refuses but accepts insulin within 30 minutes", value_style),
         Paragraph("Administer insulin. Document delay in shift notes. No further escalation required unless pattern is increasing.", value_style)],
        [Paragraph("John refuses insulin entirely for that dose", value_style),
         Paragraph("Document in shift notes. Notify Team Leader. Monitor for symptoms. Do not continue to prompt John.", value_style)],
        [Paragraph("John refuses BGL check (so insulin cannot be safely given)", value_style),
         Paragraph("Document refusal. Do not administer insulin without BGL. Notify Team Leader. Monitor for symptoms.", value_style)],
        [Paragraph("John becomes aggressive or threatening when offered insulin", value_style),
         Paragraph("Remove yourself. Ensure your safety. Document. Notify Team Leader and On-Call Manager. "
                    "Complete incident report if required.", value_style)],
        [Paragraph("Repeated pattern of refused insulin (3+ instances in a week)", value_style),
         Paragraph("Team Leader to escalate to management. Case conference with GP (Dr Ahmed), Support Coordinator (Gulsun), "
                    "and Beverly (NOK). Review insulin schedule and approach.", value_style)],
    ]
    esc_t = Table(esc_data, colWidths=[full_w * 0.4, full_w * 0.6])
    esc_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BLUE),
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(esc_t)
    story.append(Spacer(1, 3*mm))

    # ═══════════════════════════════════════════════════════════════
    # 9. SUMMARY — QUICK REFERENCE
    # ═══════════════════════════════════════════════════════════════
    story.append(section_bar("9. QUICK REFERENCE SUMMARY"))
    story.append(Spacer(1, 1*mm))

    summary_data = [
        [Paragraph("<b>Can I leave Webster pack tablets with John?</b>", value_style),
         Paragraph("<font color='#166534'><b>YES</b></font> — Place within reach. Follow up once after 30 mins. Document.", value_style)],
        [Paragraph("<b>Can John refuse insulin?</b>", value_style),
         Paragraph("<font color='#166534'><b>YES</b></font> — It is his right. Offer once, follow up once at 30 mins. Document and notify TL.", value_style)],
        [Paragraph("<b>What if John refuses BGL check?</b>", value_style),
         Paragraph("Do <b>not</b> give insulin without BGL. Document refusal. Notify TL. Monitor for symptoms.", value_style)],
        [Paragraph("<b>How many times can I remind/offer?</b>", value_style),
         Paragraph("<b>Once</b> at initial offer + <b>one</b> follow-up at 30 minutes. Maximum two interactions.", value_style)],
        [Paragraph("<b>What if John gets angry?</b>", value_style),
         Paragraph("Back off. Say <i>\"No worries John.\"</i> Do not escalate. Document and notify TL.", value_style)],
        [Paragraph("<b>Is this my fault?</b>", value_style),
         Paragraph("<b>No.</b> As long as you followed these steps and documented, you have met your duty of care. "
                    "John has the right to make these choices.", value_style)],
    ]
    sum_t = Table(summary_data, colWidths=[full_w * 0.4, full_w * 0.6])
    sum_t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GREY),
    ]))
    story.append(sum_t)
    story.append(Spacer(1, 3*mm))

    # ═══════════════════════════════════════════════════════════════
    # 10. PARTICIPANT ACKNOWLEDGEMENT
    # ═══════════════════════════════════════════════════════════════
    story.append(section_bar("10. PARTICIPANT ACKNOWLEDGEMENT"))
    story.append(Spacer(1, 1*mm))
    story.append(Paragraph(
        "I, <b>John Eric Ross</b>, acknowledge and understand the following:",
        body_style
    ))
    story.append(Spacer(1, 1*mm))

    participant_ack = [
        "I have been informed about the importance of taking my medications on time, including my "
        "Webster pack medications and insulin, and I understand the medical risks associated with delayed or missed doses.",
        "I understand that when I choose to delay taking my medications, ask staff to leave them near me, "
        "or refuse my insulin, this is <b>my decision</b> and I accept the risks associated with those choices.",
        "I understand that support workers are required to offer my medications and insulin at the scheduled time and "
        "may follow up with me <b>once</b> after 30 minutes. I understand this is part of their duty of care "
        "and is not intended to pressure or disrespect me.",
        "I understand that if I decline my medications or refuse insulin, staff are required to document this and notify "
        "their Team Leader. This is a standard procedure and not a punitive measure.",
        "I have had the opportunity to ask questions about this document and have had them answered "
        "to my satisfaction.",
    ]
    for item in participant_ack:
        story.append(Paragraph(f"\u2022  {item}", bullet_style))
        story.append(Spacer(1, 0.5*mm))

    story.append(Spacer(1, 2*mm))

    # Participant signature block
    p_sig_data = [
        [Paragraph("<b>Participant Name</b>", label_style), Paragraph("John Eric Ross", value_style),
         Paragraph("<b>Date</b>", label_style), Paragraph("", value_style)],
        [Paragraph("<b>Participant Signature</b>", label_style), Paragraph("", value_style),
         Paragraph("<b>Witness Name</b>", label_style), Paragraph("", value_style)],
        [Paragraph("<b>NOK Name</b>", label_style), Paragraph("Beverly Ross", value_style),
         Paragraph("<b>NOK Signature</b>", label_style), Paragraph("", value_style)],
    ]
    p_sig_t = Table(p_sig_data, colWidths=[32*mm, full_w/2 - 32*mm, 32*mm, full_w/2 - 32*mm])
    p_sig_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GREY),
        ("BACKGROUND", (2, 0), (2, -1), LIGHT_GREY),
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(p_sig_t)
    story.append(Spacer(1, 3*mm))

    # ═══════════════════════════════════════════════════════════════
    # 11. STAFF ACKNOWLEDGEMENT
    # ═══════════════════════════════════════════════════════════════
    story.append(section_bar("11. STAFF ACKNOWLEDGEMENT"))
    story.append(Spacer(1, 1*mm))
    story.append(Paragraph(
        "By signing below, I confirm that I have read and understood the Dignity of Risk guidelines specific to "
        "John Eric Ross's medication self-administration and insulin refusal behaviours. I understand that oral "
        "medications may be left with John per his request, and that John has the right to refuse insulin. "
        "I will follow the step-by-step processes, limit follow-ups to one, and document all instances.",
        body_style
    ))
    story.append(Spacer(1, 2*mm))

    sig_header = [
        Paragraph("<b>Name</b>", label_style),
        Paragraph("<b>Signature</b>", label_style),
        Paragraph("<b>Date</b>", label_style),
        Paragraph("<b>Initials</b>", label_style),
    ]
    sig_data = [sig_header]
    for _ in range(15):
        sig_data.append([Paragraph("", value_style)] * 4)
    sig_t = Table(sig_data, colWidths=[full_w * 0.3, full_w * 0.35, full_w * 0.2, full_w * 0.15])
    sig_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GREY),
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (0, 0), 3),
        ("BOTTOMPADDING", (0, 0), (0, 0), 3),
        ("TOPPADDING", (0, 1), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(sig_t)
    story.append(Spacer(1, 3*mm))

    # ── Footer ──
    story.append(HRFlowable(width="100%", thickness=0.3, color=BORDER_LIGHT))
    story.append(Spacer(1, 1*mm))
    story.append(Paragraph(
        "One Life Foundation  |  ABN: 55 643 227 061  |  NDIS Registered Provider  |  "
        "Dignity of Risk — John Eric Ross  |  NDIS: 574 479 496  |  "
        "OLF-DOR-JR-001 v1.0  |  Effective: 3 August 2026",
        footer_style
    ))

    doc.build(story)
    print(f"PDF generated: {OUTPUT_PATH}")
    shutil.copy2(OUTPUT_PATH, DOWNLOADS_PATH)
    print(f"Copied to: {DOWNLOADS_PATH}")


if __name__ == "__main__":
    build_pdf()
