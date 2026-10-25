"""
Employment Contract — Bamidele Musbau Akinsola
One Life Foundation NDIS Services
"""

import os
from datetime import date
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DOWNLOADS = r"C:\Users\kevin\Downloads"
LOGO_PATH = os.path.join(PROJECT_ROOT, "public", "logo.png")

EMPLOYEE_NAME = "Bamidele Musbau Akinsola"
EMPLOYEE_ADDRESS = "4 Sunai Street, Seisia QLD 4876"
EMPLOYEE_DOB = "19/02/1989"
EMPLOYEE_EMAIL = "bamideleakinsolakawia@gmail.com"
EMPLOYEE_PHONE = "0475 212 803"
EMPLOYEE_TFN = "662 875 960"
EMPLOYEE_BSB = "484 799"
EMPLOYEE_ACCOUNT = "563045048"
EMPLOYEE_SUPER_FUND = "HESTA SUPER"
EMPLOYEE_SUPER_ABN = "64 971 749 321"
EMPLOYEE_SUPER_USI = "HST0100AU"
EMPLOYEE_SUPER_MEMBER = "16976135"
EMPLOYEE_EMERGENCY_NAME = "Kawia Ifafunke Akinsola (Wife)"
EMPLOYEE_EMERGENCY_PHONE = "0483 796 105"

EMPLOYER_NAME = "One Life Foundation Pty Ltd"
EMPLOYER_ABN = "32 672 688 013"
EMPLOYER_ADDRESS = "4 Sunai Street, Seisia QLD 4876"

POSITION = "Disability Support Worker"
AWARD = "Social, Community, Home Care and Disability Services Industry Award 2010 (SCHADS Award)"
COMMENCEMENT_DATE = "1 September 2026"
EMPLOYMENT_TYPE = "Casual"
PROBATION = "N/A (Casual)"
ORDINARY_HOURS = "As per roster — no guaranteed minimum hours"
CLASSIFICATION = "Level 2, Pay Point 4 (+ $5.00/hr above-award loading)"
PAY_RATE_ORDINARY = "$54.41"
PAY_RATE_NIGHT = "$60.34"
PAY_RATE_SATURDAY = "$74.18"
PAY_RATE_SUNDAY = "$93.94"

NAVY = HexColor("#0F528A")
LIGHT_GREY = HexColor("#F5F7FA")
GREY_BORDER = HexColor("#D1D5DB")
DARK_TEXT = HexColor("#1E293B")
MED_TEXT = HexColor("#475569")
RED = HexColor("#DC2626")
LIGHT_RED = HexColor("#FEF2F2")

W, H = A4

styles = getSampleStyleSheet()

title_style = ParagraphStyle("Title", fontName="Helvetica-Bold", fontSize=18, textColor=NAVY, alignment=TA_CENTER, leading=22, spaceAfter=4)
subtitle_style = ParagraphStyle("Subtitle", fontName="Helvetica", fontSize=10, textColor=MED_TEXT, alignment=TA_CENTER, leading=13, spaceAfter=12)
section_head = ParagraphStyle("SectionHead", fontName="Helvetica-Bold", fontSize=11, textColor=white, alignment=TA_LEFT, leading=14)
body_style = ParagraphStyle("Body", fontName="Helvetica", fontSize=9.5, textColor=DARK_TEXT, leading=14, alignment=TA_JUSTIFY, spaceAfter=6)
body_bold = ParagraphStyle("BodyBold", fontName="Helvetica-Bold", fontSize=9.5, textColor=DARK_TEXT, leading=14, alignment=TA_JUSTIFY, spaceAfter=6)
label_style = ParagraphStyle("Label", fontName="Helvetica-Bold", fontSize=9, textColor=DARK_TEXT, leading=12)
value_style = ParagraphStyle("Value", fontName="Helvetica", fontSize=9, textColor=DARK_TEXT, leading=12)
footer_style = ParagraphStyle("Footer", fontName="Helvetica", fontSize=7, textColor=MED_TEXT, alignment=TA_CENTER, leading=9)
clause_style = ParagraphStyle("Clause", fontName="Helvetica", fontSize=9.5, textColor=DARK_TEXT, leading=14, alignment=TA_JUSTIFY, spaceAfter=4, leftIndent=12)
clause_head = ParagraphStyle("ClauseHead", fontName="Helvetica-Bold", fontSize=9.5, textColor=DARK_TEXT, leading=14, spaceAfter=2, leftIndent=0)
sign_label = ParagraphStyle("SignLabel", fontName="Helvetica-Bold", fontSize=9, textColor=MED_TEXT, leading=12)
sign_value = ParagraphStyle("SignValue", fontName="Helvetica", fontSize=9, textColor=DARK_TEXT, leading=12)


def section_bar(text):
    t = Table([[Paragraph(text, section_head)]], colWidths=[W - 24*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ROUNDEDCORNERS", [3, 3, 3, 3]),
    ]))
    return t


def info_table(rows, col_widths=None):
    if col_widths is None:
        col_widths = [55*mm, W - 24*mm - 55*mm]
    data = []
    for label, value in rows:
        data.append([
            Paragraph(label, label_style),
            Paragraph(value, value_style),
        ])
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GREY),
        ("GRID", (0, 0), (-1, -1), 0.5, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def header_footer(canvas, doc):
    canvas.saveState()
    # Top navy bar
    canvas.setFillColor(NAVY)
    canvas.rect(0, H - 8*mm, W, 8*mm, fill=1, stroke=0)
    # Footer
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MED_TEXT)
    footer_text = f"One Life Foundation | Employment Contract | {EMPLOYEE_NAME} | Page {doc.page}"
    canvas.drawCentredString(W / 2, 10*mm, footer_text)
    canvas.restoreState()


def build():
    output = os.path.join(DOWNLOADS, f"Employment_Contract_{EMPLOYEE_NAME.replace(' ', '_')}.pdf")
    doc = SimpleDocTemplate(
        output,
        pagesize=A4,
        leftMargin=12*mm, rightMargin=12*mm,
        topMargin=18*mm, bottomMargin=18*mm,
    )

    story = []

    # Logo
    if os.path.exists(LOGO_PATH):
        logo = Image(LOGO_PATH, width=55*mm, height=55*mm * 0.4)
        logo.hAlign = "CENTER"
        story.append(logo)
        story.append(Spacer(1, 4*mm))

    # Title
    story.append(Paragraph("EMPLOYMENT CONTRACT", title_style))
    story.append(Paragraph("Social, Community, Home Care and Disability Services", subtitle_style))
    story.append(Spacer(1, 6*mm))

    # ─── PARTIES ───
    story.append(section_bar("1. PARTIES"))
    story.append(Spacer(1, 3*mm))
    story.append(info_table([
        ("Employer", EMPLOYER_NAME),
        ("ABN", EMPLOYER_ABN),
        ("Address", EMPLOYER_ADDRESS),
    ]))
    story.append(Spacer(1, 3*mm))
    story.append(info_table([
        ("Employee", EMPLOYEE_NAME),
        ("Date of Birth", EMPLOYEE_DOB),
        ("Address", EMPLOYEE_ADDRESS),
        ("Email", EMPLOYEE_EMAIL),
        ("Phone", EMPLOYEE_PHONE),
    ]))
    story.append(Spacer(1, 6*mm))

    # ─── POSITION ───
    story.append(section_bar("2. POSITION & COMMENCEMENT"))
    story.append(Spacer(1, 3*mm))
    story.append(info_table([
        ("Position Title", POSITION),
        ("Employment Type", EMPLOYMENT_TYPE),
        ("Commencement Date", COMMENCEMENT_DATE),
        ("Probation Period", PROBATION),
        ("Applicable Award", AWARD),
        ("Classification", CLASSIFICATION),
        ("Ordinary Hours", ORDINARY_HOURS),
    ]))
    story.append(Spacer(1, 6*mm))

    # ─── DUTIES ───
    story.append(section_bar("3. DUTIES & RESPONSIBILITIES"))
    story.append(Spacer(1, 3*mm))
    duties = [
        "Provide person-centred support to NDIS participants in accordance with their individual support plans.",
        "Assist participants with daily living activities including personal care, meal preparation, medication prompting, community access, and household tasks.",
        "Maintain accurate and timely progress notes, incident reports, and shift documentation.",
        "Comply with all One Life Foundation policies, procedures, and the NDIS Code of Conduct.",
        "Participate in mandatory training, supervision sessions, and team meetings as required.",
        "Report any concerns regarding participant safety, wellbeing, or rights immediately to management.",
        "Maintain current First Aid, CPR, and NDIS Worker Screening clearances at all times.",
        "Perform other duties as reasonably directed by management consistent with the employee's skills and classification.",
    ]
    for d in duties:
        story.append(Paragraph(f"• {d}", clause_style))
    story.append(Spacer(1, 6*mm))

    # ─── REMUNERATION ───
    story.append(section_bar("4. REMUNERATION & PAYMENT"))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("The Employee will be paid in accordance with the SCHADS Award at the applicable classification level. Payment will be made fortnightly by electronic funds transfer to the nominated bank account.", body_style))
    story.append(Spacer(1, 2*mm))
    story.append(info_table([
        ("Classification", f"SCHADS Award {CLASSIFICATION}"),
        ("Ordinary Rate", f"{PAY_RATE_ORDINARY} per hour"),
        ("Night Rate", f"{PAY_RATE_NIGHT} per hour"),
        ("Saturday Rate", f"{PAY_RATE_SATURDAY} per hour"),
        ("Sunday Rate", f"{PAY_RATE_SUNDAY} per hour"),
        ("Pay Frequency", "Weekly"),
        ("Pay Method", "Electronic Funds Transfer (EFT)"),
        ("BSB", EMPLOYEE_BSB),
        ("Account Number", EMPLOYEE_ACCOUNT),
        ("Tax File Number", EMPLOYEE_TFN),
    ]))
    story.append(Spacer(1, 6*mm))

    # ─── SUPERANNUATION ───
    story.append(section_bar("5. SUPERANNUATION"))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("Superannuation contributions will be made in accordance with the Superannuation Guarantee (Administration) Act 1992 at the prevailing rate (currently 12% of Ordinary Time Earnings).", body_style))
    story.append(Spacer(1, 2*mm))
    story.append(info_table([
        ("Fund Name", EMPLOYEE_SUPER_FUND),
        ("ABN", EMPLOYEE_SUPER_ABN),
        ("USI", EMPLOYEE_SUPER_USI),
        ("Member Number", EMPLOYEE_SUPER_MEMBER),
    ]))
    story.append(Spacer(1, 6*mm))

    # ─── TERMINATION ───
    story.append(section_bar("6. TERMINATION OF EMPLOYMENT"))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("As a casual employee, either party may terminate this engagement by providing 1 hour's notice, or at the end of the current shift.", body_style))
    story.append(Paragraph("The Employer is under no obligation to offer further shifts and the Employee is under no obligation to accept any shift offered.", body_style))
    story.append(Paragraph("The Employer may terminate employment without notice in cases of serious misconduct as defined by the Fair Work Act 2009.", body_style))
    story.append(Spacer(1, 6*mm))

    # ─── CONFIDENTIALITY ───
    story.append(section_bar("7. CONFIDENTIALITY & PRIVACY"))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("The Employee must maintain strict confidentiality regarding all participant information, business operations, and proprietary information of One Life Foundation. This obligation continues after the cessation of employment.", body_style))
    story.append(Paragraph("The Employee must comply with the Privacy Act 1988 (Cth), the Australian Privacy Principles, and the NDIS Practice Standards regarding the collection, use, storage, and disclosure of personal and sensitive information.", body_style))
    story.append(Spacer(1, 6*mm))

    # ─── CODE OF CONDUCT ───
    story.append(section_bar("8. NDIS CODE OF CONDUCT"))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("The Employee acknowledges and agrees to comply with the NDIS Code of Conduct at all times, including:", body_style))
    code = [
        "Act with respect for individual rights to freedom of expression, self-determination, and decision-making in accordance with applicable laws and conventions.",
        "Respect the privacy of people with disability.",
        "Provide supports and services in a safe and competent manner, with care and skill.",
        "Act with integrity, honesty, and transparency.",
        "Promptly take steps to raise and act on concerns about matters that may impact the quality and safety of supports and services provided to people with disability.",
        "Take all reasonable steps to prevent and respond to all forms of violence against, and exploitation, neglect, and abuse of, people with disability.",
        "Take all reasonable steps to prevent and respond to sexual misconduct.",
    ]
    for c in code:
        story.append(Paragraph(f"• {c}", clause_style))
    story.append(Spacer(1, 6*mm))

    # ─── WHS ───
    story.append(section_bar("9. WORK HEALTH & SAFETY"))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("The Employee must comply with all Work Health and Safety (WHS) legislation, regulations, and workplace policies. The Employee must:", body_style))
    whs = [
        "Take reasonable care for their own health and safety and the health and safety of others.",
        "Comply with all reasonable instructions and workplace policies regarding WHS.",
        "Report any hazards, incidents, or near-misses immediately.",
        "Not attend work while under the influence of alcohol or drugs.",
        "Use personal protective equipment (PPE) as required.",
    ]
    for w in whs:
        story.append(Paragraph(f"• {w}", clause_style))
    story.append(Spacer(1, 6*mm))

    # ─── EMERGENCY CONTACT ───
    story.append(section_bar("10. EMERGENCY CONTACT"))
    story.append(Spacer(1, 3*mm))
    story.append(info_table([
        ("Contact Name", EMPLOYEE_EMERGENCY_NAME),
        ("Phone", EMPLOYEE_EMERGENCY_PHONE),
    ]))
    story.append(Spacer(1, 6*mm))

    # ─── GENERAL ───
    story.append(section_bar("11. GENERAL PROVISIONS"))
    story.append(Spacer(1, 3*mm))
    general = [
        "This contract is governed by the laws of the State of Queensland and the Commonwealth of Australia.",
        "This contract constitutes the entire agreement between the parties and supersedes all prior agreements, representations, and understandings.",
        "Any amendments to this contract must be in writing and signed by both parties.",
        "If any provision of this contract is found to be invalid or unenforceable, the remaining provisions will continue in full force and effect.",
        "The Employee warrants that all information provided is true and correct, and acknowledges that providing false or misleading information may result in termination of employment.",
    ]
    for g in general:
        story.append(Paragraph(f"• {g}", clause_style))
    story.append(Spacer(1, 10*mm))

    # ─── SIGNATURES ───
    story.append(section_bar("EXECUTION"))
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph("By signing below, both parties acknowledge they have read, understood, and agree to be bound by the terms and conditions of this Employment Contract.", body_style))
    story.append(Spacer(1, 8*mm))

    # Employer signature block
    story.append(Paragraph("<b>EMPLOYER</b>", body_bold))
    story.append(Spacer(1, 3*mm))
    sig_data_employer = [
        [Paragraph("Signed by", sign_label), Paragraph("", sign_value)],
        [Paragraph("Name", sign_label), Paragraph("", sign_value)],
        [Paragraph("Position", sign_label), Paragraph("Director", sign_value)],
        [Paragraph("Date", sign_label), Paragraph("", sign_value)],
    ]
    t = Table(sig_data_employer, colWidths=[35*mm, 80*mm])
    t.setStyle(TableStyle([
        ("LINEBELOW", (1, 0), (1, -1), 0.5, GREY_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
    ]))
    story.append(t)
    story.append(Spacer(1, 12*mm))

    # Employee signature block
    story.append(Paragraph("<b>EMPLOYEE</b>", body_bold))
    story.append(Spacer(1, 3*mm))
    sig_data_employee = [
        [Paragraph("Signed by", sign_label), Paragraph("", sign_value)],
        [Paragraph("Name", sign_label), Paragraph(EMPLOYEE_NAME, sign_value)],
        [Paragraph("Date", sign_label), Paragraph("", sign_value)],
    ]
    t = Table(sig_data_employee, colWidths=[35*mm, 80*mm])
    t.setStyle(TableStyle([
        ("LINEBELOW", (1, 0), (1, -1), 0.5, GREY_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
    ]))
    story.append(t)

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"Contract generated: {output}")


if __name__ == "__main__":
    build()
