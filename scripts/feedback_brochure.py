"""
One Life Foundation — Feedback, Complaints & Compliments Brochure
Participant-friendly A4 brochure with OLF branding
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
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

# ─── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
LOGO_PATH = os.path.join(PROJECT_ROOT, "public", "logo.png")
DOWNLOADS = r"C:\Users\kevin\Downloads"
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "Feedback_Complaints_Compliments_Brochure.pdf")
DOWNLOADS_PATH = os.path.join(DOWNLOADS, "Feedback_Complaints_Compliments_Brochure.pdf")

# Images
HERO_IMG = os.path.join(DOWNLOADS, "openart-image_uOF4G5Gk_1779407360853_raw.jpg")
FEEDBACK_ICON = os.path.join(DOWNLOADS, "openart-image_l_YPdJqC_1779407364448_raw.jpg")
COMPLAINT_ICON = os.path.join(DOWNLOADS, "openart-image_orblQ60f_1779407372909_raw.jpg")
COMPLIMENT_ICON = os.path.join(DOWNLOADS, "openart-image_dGlHXfZH_1779407376439_raw.jpg")

# ─── OLF Colours ───────────────────────────────────────────────────────────────
NAVY = HexColor("#0F528A")
GREEN = HexColor("#0ea03e")
YELLOW = HexColor("#FFD900")
LIGHT_BLUE = HexColor("#EBF4FB")
LIGHT_GREEN = HexColor("#ECFDF5")
LIGHT_YELLOW = HexColor("#FFFBEB")
LIGHT_RED = HexColor("#FEF2F2")
LIGHT_GREY = HexColor("#F5F7FA")
GREY_BORDER = HexColor("#D1D5DB")
DARK_TEXT = HexColor("#1E293B")
MED_TEXT = HexColor("#475569")
RED = HexColor("#DC2626")

W, H = A4  # 595 x 842 points

# ─── Styles ────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

s_title = ParagraphStyle(
    "BrochureTitle", parent=styles["Heading1"],
    fontName="Helvetica-Bold", fontSize=22, leading=28,
    textColor=NAVY, alignment=TA_CENTER, spaceAfter=4*mm
)
s_subtitle = ParagraphStyle(
    "BrochureSubtitle", parent=styles["Normal"],
    fontName="Helvetica", fontSize=11, leading=15,
    textColor=MED_TEXT, alignment=TA_CENTER, spaceAfter=6*mm
)
s_section = ParagraphStyle(
    "SectionHead", parent=styles["Heading2"],
    fontName="Helvetica-Bold", fontSize=14, leading=18,
    textColor=NAVY, spaceBefore=8*mm, spaceAfter=3*mm
)
s_subsection = ParagraphStyle(
    "Subsection", parent=styles["Heading3"],
    fontName="Helvetica-Bold", fontSize=11, leading=14,
    textColor=DARK_TEXT, spaceBefore=4*mm, spaceAfter=2*mm
)
s_body = ParagraphStyle(
    "BodyText", parent=styles["Normal"],
    fontName="Helvetica", fontSize=10, leading=15,
    textColor=DARK_TEXT, alignment=TA_JUSTIFY, spaceAfter=2*mm
)
s_body_center = ParagraphStyle(
    "BodyCenter", parent=s_body, alignment=TA_CENTER
)
s_bullet = ParagraphStyle(
    "BulletText", parent=s_body,
    leftIndent=12*mm, bulletIndent=5*mm, spaceAfter=1.5*mm
)
s_quote = ParagraphStyle(
    "QuoteText", parent=s_body,
    fontName="Helvetica-Oblique", fontSize=11, leading=16,
    textColor=NAVY, alignment=TA_CENTER, leftIndent=15*mm, rightIndent=15*mm,
    spaceBefore=3*mm, spaceAfter=3*mm
)
s_small = ParagraphStyle(
    "SmallText", parent=s_body,
    fontSize=8.5, leading=12, textColor=MED_TEXT, alignment=TA_CENTER
)
s_footer = ParagraphStyle(
    "FooterText", parent=s_body,
    fontSize=8, leading=10, textColor=MED_TEXT, alignment=TA_CENTER
)

# ─── Helper functions ──────────────────────────────────────────────────────────

def coloured_box(text, bg_color, border_color=None, icon="", text_color=DARK_TEXT):
    """Create a coloured info box."""
    style = ParagraphStyle("boxtext", parent=s_body, textColor=text_color, spaceAfter=0)
    content = f"{icon} {text}" if icon else text
    para = Paragraph(content, style)

    t = Table([[para]], colWidths=[W - 50*mm])
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, -1), bg_color),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]
    if border_color:
        style_cmds.append(("BOX", (0, 0), (-1, -1), 1.2, border_color))
    t.setStyle(TableStyle(style_cmds))
    return t

def section_bar(text, color=NAVY):
    """Navy (or coloured) section heading bar."""
    style = ParagraphStyle("bartext", parent=s_body, fontName="Helvetica-Bold",
                           fontSize=13, textColor=white, spaceAfter=0, leading=18)
    para = Paragraph(text, style)
    t = Table([[para]], colWidths=[W - 50*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ]))
    return t

def step_box(number, title, desc):
    """Numbered step box."""
    num_style = ParagraphStyle("numstyle", fontName="Helvetica-Bold", fontSize=18,
                                textColor=white, alignment=TA_CENTER)
    title_style = ParagraphStyle("steptitle", fontName="Helvetica-Bold", fontSize=10.5,
                                  leading=14, textColor=DARK_TEXT)
    desc_style = ParagraphStyle("stepdesc", fontName="Helvetica", fontSize=9.5,
                                 leading=13, textColor=MED_TEXT)

    num_para = Paragraph(str(number), num_style)
    text_para = Paragraph(f"<b>{title}</b><br/>{desc}", ParagraphStyle(
        "stepcombo", fontName="Helvetica", fontSize=9.5, leading=13, textColor=DARK_TEXT
    ))

    # Number circle as a small table
    num_table = Table([[num_para]], colWidths=[28], rowHeights=[28])
    num_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("ROUNDEDCORNERS", [14, 14, 14, 14]),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))

    row = Table([[num_table, text_para]], colWidths=[38, W - 88*mm])
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING", (0, 0), (0, 0), 0),
        ("LEFTPADDING", (1, 0), (1, 0), 8),
    ]))
    return row

# ─── Build document ───────────────────────────────────────────────────────────

def build():
    doc = SimpleDocTemplate(
        OUTPUT_PATH, pagesize=A4,
        leftMargin=25*mm, rightMargin=25*mm,
        topMargin=20*mm, bottomMargin=20*mm,
    )

    story = []

    # ── Page 1: Cover & Introduction ──────────────────────────────────────────

    # Logo
    logo = Image(LOGO_PATH, width=55*mm, height=28*mm)
    logo.hAlign = "CENTER"
    story.append(logo)
    story.append(Spacer(1, 4*mm))

    # Title
    story.append(Paragraph("Feedback, Complaints<br/>& Compliments", s_title))
    story.append(Paragraph("Your voice matters to us. This brochure explains how you can<br/>"
                           "share feedback, make a complaint, or give a compliment.", s_subtitle))

    # Hero image
    hero = Image(HERO_IMG, width=150*mm, height=82*mm)
    hero.hAlign = "CENTER"
    story.append(hero)
    story.append(Spacer(1, 4*mm))

    # Welcome quote
    story.append(Paragraph(
        '"We are committed to providing the best possible support.<br/>'
        'Your feedback helps us grow and improve."',
        s_quote
    ))
    story.append(Spacer(1, 4*mm))

    # What is this brochure about?
    story.append(section_bar("What is this brochure about?"))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        "At <b>One Life Foundation</b>, we believe every person we support has the right to speak up. "
        "Whether you want to tell us something is going well, suggest an improvement, or raise a concern — "
        "we want to hear from you.", s_body
    ))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        "This brochure is written in <b>easy-to-understand language</b> so that participants, families, "
        "and carers can feel confident about sharing their thoughts with us.", s_body
    ))
    story.append(Spacer(1, 4*mm))

    # Three types — side by side cards with icons
    card_title = ParagraphStyle("cardtitle", fontName="Helvetica-Bold", fontSize=11,
                                 leading=14, textColor=DARK_TEXT, alignment=TA_CENTER)
    card_body = ParagraphStyle("cardbody", fontName="Helvetica", fontSize=9,
                                leading=12.5, textColor=MED_TEXT, alignment=TA_CENTER)

    def make_card(icon_path, title, body, bg):
        icon = Image(icon_path, width=28*mm, height=21*mm)
        icon.hAlign = "CENTER"
        content = [
            [icon],
            [Paragraph(title, card_title)],
            [Paragraph(body, card_body)],
        ]
        t = Table(content, colWidths=[48*mm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), bg),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (0, 0), 8),
            ("TOPPADDING", (0, 1), (-1, -1), 2),
            ("BOTTOMPADDING", (0, -1), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("ROUNDEDCORNERS", [6, 6, 6, 6]),
            ("BOX", (0, 0), (-1, -1), 0.5, GREY_BORDER),
        ]))
        return t

    feedback_card = make_card(
        FEEDBACK_ICON, "<b>Feedback</b>",
        "A suggestion or idea to help us do better.",
        LIGHT_BLUE
    )
    complaint_card = make_card(
        COMPLAINT_ICON, "<b>Complaint</b>",
        "Something you are unhappy about that you want fixed.",
        LIGHT_RED
    )
    compliment_card = make_card(
        COMPLIMENT_ICON, "<b>Compliment</b>",
        "Something positive you want to share about our service.",
        LIGHT_GREEN
    )

    cards_table = Table(
        [[feedback_card, complaint_card, compliment_card]],
        colWidths=[50*mm, 50*mm, 50*mm],
    )
    cards_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(cards_table)

    # ── Page 2: Your Rights & How to Give Feedback ────────────────────────────
    story.append(Spacer(1, 8*mm))
    story.append(section_bar("Your Rights"))
    story.append(Spacer(1, 3*mm))

    story.append(coloured_box(
        "<b>You have the right to:</b><br/><br/>"
        "&#8226; &nbsp;Share your views about the services you receive<br/>"
        "&#8226; &nbsp;Make a complaint without fear of it affecting your support<br/>"
        "&#8226; &nbsp;Have someone help you (an advocate, family member, or friend)<br/>"
        "&#8226; &nbsp;Be treated with respect and have your concerns taken seriously<br/>"
        "&#8226; &nbsp;Receive a response within a fair and reasonable time<br/>"
        "&#8226; &nbsp;Remain anonymous if you choose",
        LIGHT_BLUE, NAVY
    ))

    story.append(Spacer(1, 6*mm))
    story.append(section_bar("How to Give Feedback or Make a Complaint"))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(
        "You can share your feedback in whatever way is easiest for you:", s_body
    ))
    story.append(Spacer(1, 3*mm))

    # Steps
    steps = [
        ("Talk to us", "Speak to your support worker, team leader, or any staff member you feel comfortable with. They will listen and help."),
        ("Phone us", "Call <b>One Life Foundation</b> on <b>1300 XXX XXX</b> during business hours (Mon-Fri, 9am-5pm). Ask for the manager if needed."),
        ("Email us", "Send an email to <b>admin@olfndisservices.com.au</b> with the subject \"Feedback\" or \"Complaint\". We will respond within 3 business days."),
        ("Write to us", "Fill in the Feedback Form (available from any staff member or on our website) and hand it in or post it to our office."),
        ("Use an advocate", "If you need help, you can ask a family member, friend, or an independent advocate to speak on your behalf."),
    ]

    for i, (title, desc) in enumerate(steps, 1):
        story.append(step_box(i, title, desc))
        story.append(Spacer(1, 3*mm))

    # ── What happens next ─────────────────────────────────────────────────────
    story.append(Spacer(1, 4*mm))
    story.append(section_bar("What Happens After You Tell Us?"))
    story.append(Spacer(1, 3*mm))

    process_data = [
        ["Step", "What We Do", "Timeframe"],
        ["1. Acknowledge", "We confirm we received your feedback or complaint.", "Within 2 business days"],
        ["2. Review", "We look into the matter and gather information.", "Within 5 business days"],
        ["3. Respond", "We contact you with what we found and what we will do.", "Within 10 business days"],
        ["4. Action", "We make changes or improvements based on your feedback.", "As agreed"],
        ["5. Follow Up", "We check in with you to make sure you are satisfied.", "Within 2 weeks"],
    ]

    col_widths = [22*mm, 70*mm, 53*mm]

    proc_styles = []
    for i, row in enumerate(process_data):
        process_data[i] = [
            Paragraph(row[0], ParagraphStyle("ptcell", fontName="Helvetica-Bold" if i == 0 else "Helvetica",
                                              fontSize=9, leading=12, textColor=white if i == 0 else DARK_TEXT)),
            Paragraph(row[1], ParagraphStyle("ptcell2", fontName="Helvetica-Bold" if i == 0 else "Helvetica",
                                              fontSize=9, leading=12, textColor=white if i == 0 else DARK_TEXT)),
            Paragraph(row[2], ParagraphStyle("ptcell3", fontName="Helvetica-Bold" if i == 0 else "Helvetica",
                                              fontSize=9, leading=12, textColor=white if i == 0 else MED_TEXT)),
        ]

    proc_table = Table(process_data, colWidths=col_widths)
    proc_table.setStyle(TableStyle([
        # Header
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        # Alternating rows
        ("BACKGROUND", (0, 1), (-1, 1), LIGHT_BLUE),
        ("BACKGROUND", (0, 2), (-1, 2), white),
        ("BACKGROUND", (0, 3), (-1, 3), LIGHT_BLUE),
        ("BACKGROUND", (0, 4), (-1, 4), white),
        ("BACKGROUND", (0, 5), (-1, 5), LIGHT_BLUE),
        # Grid
        ("GRID", (0, 0), (-1, -1), 0.5, GREY_BORDER),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
        # Padding
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(proc_table)

    # ── Not happy with the outcome? ──────────────────────────────────────────
    story.append(Spacer(1, 6*mm))
    story.append(section_bar("Not Happy With the Outcome?", RED))
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph(
        "If you are not satisfied with how we handled your complaint, you can contact the "
        "<b>NDIS Quality and Safeguards Commission</b>. They are an independent government body "
        "that protects the rights of NDIS participants.", s_body
    ))
    story.append(Spacer(1, 3*mm))

    ext_data = [
        ["Organisation", "Contact"],
        ["NDIS Quality and Safeguards Commission",
         "Phone: 1800 035 544 (free call)\nWebsite: www.ndiscommission.gov.au"],
        ["National Disability Advocacy Program",
         "Phone: 1800 880 052\nWebsite: www.dss.gov.au/ndap"],
        ["Disability Advocacy Network Australia (DANA)",
         "Website: www.dana.org.au"],
    ]

    for i, row in enumerate(ext_data):
        ext_data[i] = [
            Paragraph(row[0], ParagraphStyle("extcell", fontName="Helvetica-Bold" if i == 0 else "Helvetica",
                                              fontSize=9, leading=12, textColor=white if i == 0 else DARK_TEXT)),
            Paragraph(row[1], ParagraphStyle("extcell2", fontName="Helvetica-Bold" if i == 0 else "Helvetica",
                                              fontSize=9, leading=12, textColor=white if i == 0 else DARK_TEXT)),
        ]

    ext_table = Table(ext_data, colWidths=[60*mm, 85*mm])
    ext_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), RED),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 1), (-1, -1), LIGHT_RED),
        ("GRID", (0, 0), (-1, -1), 0.5, GREY_BORDER),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(ext_table)

    # ── Compliments ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 6*mm))
    story.append(section_bar("Want to Say Thank You?", GREEN))
    story.append(Spacer(1, 3*mm))

    story.append(coloured_box(
        "We love hearing when something goes well! If a support worker or team member has made "
        "a difference in your life, please let us know. Compliments help us recognise our staff "
        "and continue delivering great support.<br/><br/>"
        "You can share a compliment the same way as feedback — just tell us, call, email, "
        "or fill in a form. We will make sure the right person hears your kind words.",
        LIGHT_GREEN, GREEN
    ))

    # ── Contact Us ───────────────────────────────────────────────────────────
    story.append(Spacer(1, 6*mm))
    story.append(section_bar("Contact Us"))
    story.append(Spacer(1, 3*mm))

    contact_data = [
        ["One Life Foundation PTY LTD", ""],
        ["Email", "admin@olfndisservices.com.au"],
        ["Website", "www.olfndisservices.com.au"],
        ["Address", "Melbourne, Victoria, Australia"],
    ]

    for i, row in enumerate(contact_data):
        is_header = i == 0
        contact_data[i] = [
            Paragraph(row[0], ParagraphStyle("clabel",
                fontName="Helvetica-Bold", fontSize=9.5 if is_header else 9,
                leading=13, textColor=NAVY if is_header else MED_TEXT)),
            Paragraph(row[1], ParagraphStyle("cval",
                fontName="Helvetica-Bold" if is_header else "Helvetica",
                fontSize=9.5 if is_header else 9.5, leading=13, textColor=DARK_TEXT)),
        ]

    contact_table = Table(contact_data, colWidths=[40*mm, 105*mm])
    contact_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BLUE),
        ("SPAN", (0, 0), (-1, 0)),
        ("GRID", (0, 0), (-1, -1), 0.5, GREY_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("BACKGROUND", (0, 1), (0, -1), LIGHT_GREY),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ]))
    story.append(contact_table)

    # ── Footer ───────────────────────────────────────────────────────────────
    story.append(Spacer(1, 8*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GREY_BORDER, spaceAfter=3*mm))
    story.append(Paragraph(
        "One Life Foundation PTY LTD | ABN: XX XXX XXX XXX | NDIS Registered Provider<br/>"
        "This brochure is available in Easy Read format upon request.",
        s_footer
    ))
    story.append(Paragraph(
        "Document Version: 1.0 | Last Updated: May 2026",
        s_footer
    ))

    # ── Build ────────────────────────────────────────────────────────────────
    doc.build(story)
    print(f"Brochure saved to: {OUTPUT_PATH}")

    # Copy to Downloads
    shutil.copy2(OUTPUT_PATH, DOWNLOADS_PATH)
    print(f"Copied to: {DOWNLOADS_PATH}")


if __name__ == "__main__":
    build()
