"""
One Life Foundation — Payslips for Kevin Rae Geronimo
June & July 2026 — showing actual payment dates from bank statement
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
OLF_LOGO_PATH = os.path.join(PROJECT_ROOT, "public", "logo.png")
NPI_LOGO_PATH = r"C:\Users\kevin\OneDrive\Desktop\CLAUDE\nwpi-pm\public\npi-logo.jpeg"
DOWNLOADS = r"C:\Users\kevin\Downloads"
FILENAME = "Payslips_Kevin_Jun_Jul_2026.pdf"
OUTPUT_PATH = os.path.join(DOWNLOADS, FILENAME)

NAVY = HexColor("#0F528A")
LIGHT_BLUE = HexColor("#EBF4FB")
LIGHT_GREY = HexColor("#F5F7FA")
GREY_BORDER = HexColor("#D1D5DB")
DARK_TEXT = HexColor("#1E293B")
MED_TEXT = HexColor("#475569")
GREEN = HexColor("#166534")
LIGHT_GREEN = HexColor("#F0FDF4")

W, H = A4
styles = getSampleStyleSheet()

title_style = ParagraphStyle("Title", fontName="Helvetica-Bold", fontSize=14, textColor=NAVY, alignment=TA_CENTER, leading=18)
sub_style = ParagraphStyle("Sub", fontName="Helvetica", fontSize=8, textColor=MED_TEXT, alignment=TA_CENTER, leading=11)
section_style = ParagraphStyle("Section", fontName="Helvetica-Bold", fontSize=8, textColor=white, alignment=TA_LEFT, leading=10)
label_style = ParagraphStyle("Label", fontName="Helvetica-Bold", fontSize=7.5, textColor=DARK_TEXT, leading=9)
value_style = ParagraphStyle("Value", fontName="Helvetica", fontSize=7.5, textColor=DARK_TEXT, leading=9)
value_right = ParagraphStyle("ValueR", fontName="Helvetica", fontSize=7.5, textColor=DARK_TEXT, alignment=TA_RIGHT, leading=9)
value_bold_right = ParagraphStyle("ValueBR", fontName="Helvetica-Bold", fontSize=7.5, textColor=DARK_TEXT, alignment=TA_RIGHT, leading=9)
footer_style = ParagraphStyle("Footer", fontName="Helvetica", fontSize=6, textColor=MED_TEXT, alignment=TA_CENTER, leading=7)
net_style = ParagraphStyle("Net", fontName="Helvetica-Bold", fontSize=10, textColor=GREEN, alignment=TA_RIGHT, leading=13)
net_label = ParagraphStyle("NetL", fontName="Helvetica-Bold", fontSize=10, textColor=DARK_TEXT, alignment=TA_LEFT, leading=13)


def section_bar(text):
    t = Table([[Paragraph(text, section_style)]], colWidths=[W - 24*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("ROUNDEDCORNERS", [2, 2, 2, 2]),
    ]))
    return t


def build_payslip(story, pay_period, pay_date, payments, monthly_salary, ytd_gross, outstanding):
    full_w = W - 24*mm
    cw = [28*mm, full_w/2 - 28*mm, 28*mm, full_w/2 - 28*mm]

    # Header — NPI + OLF
    header_cells = []
    if os.path.exists(NPI_LOGO_PATH):
        header_cells.append(Image(NPI_LOGO_PATH, width=35*mm, height=14*mm, kind="proportional"))
    else:
        header_cells.append(Paragraph("<b>NPI</b>", label_style))
    header_cells.append(Paragraph("PAY SLIP", title_style))
    if os.path.exists(OLF_LOGO_PATH):
        header_cells.append(Image(OLF_LOGO_PATH, width=28*mm, height=11*mm, kind="proportional"))
    else:
        header_cells.append(Paragraph("OLF", label_style))

    ht = Table([header_cells], colWidths=[38*mm, full_w - 76*mm, 38*mm])
    ht.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(ht)
    story.append(Spacer(1, 1*mm))
    story.append(Paragraph(
        "Nationwide Projects Investments Pty Ltd  |  Subsidiary: One Life Foundation Pty Ltd  |  ABN: 55 643 227 061",
        sub_style))
    story.append(Spacer(1, 2*mm))

    # Employee details
    story.append(section_bar("EMPLOYEE DETAILS"))
    story.append(Spacer(1, 0.5*mm))
    det = [
        [Paragraph("<b>Employee</b>", label_style), Paragraph("Kevin Rae Geronimo", value_style),
         Paragraph("<b>Position</b>", label_style), Paragraph("General Manager", value_style)],
        [Paragraph("<b>Address</b>", label_style), Paragraph("877 Edgars Rd, Epping VIC 3076", value_style),
         Paragraph("<b>Type</b>", label_style), Paragraph("Full-Time", value_style)],
        [Paragraph("<b>Pay Period</b>", label_style), Paragraph(pay_period, value_style),
         Paragraph("<b>Pay Date</b>", label_style), Paragraph(pay_date, value_style)],
    ]
    dt = Table(det, colWidths=cw)
    dcmds = [("GRID", (0,0), (-1,-1), 0.4, GREY_BORDER),
             ("LEFTPADDING", (0,0), (-1,-1), 4), ("RIGHTPADDING", (0,0), (-1,-1), 4),
             ("TOPPADDING", (0,0), (-1,-1), 2), ("BOTTOMPADDING", (0,0), (-1,-1), 2),
             ("VALIGN", (0,0), (-1,-1), "MIDDLE")]
    for r in range(3):
        dcmds.append(("BACKGROUND", (0, r), (0, r), LIGHT_GREY))
        dcmds.append(("BACKGROUND", (2, r), (2, r), LIGHT_GREY))
    dt.setStyle(TableStyle(dcmds))
    story.append(dt)
    story.append(Spacer(1, 2*mm))

    # Employer
    story.append(section_bar("EMPLOYER DETAILS"))
    story.append(Spacer(1, 0.5*mm))
    emp = [
        [Paragraph("<b>Employer</b>", label_style), Paragraph("One Life Foundation Pty Ltd (subsidiary of NPI)", value_style),
         Paragraph("<b>ABN</b>", label_style), Paragraph("55 643 227 061", value_style)],
        [Paragraph("<b>Address</b>", label_style), Paragraph("59 Severn Street, Epping VIC 3076", value_style),
         Paragraph("<b>NDIS #</b>", label_style), Paragraph("4050120437", value_style)],
    ]
    et = Table(emp, colWidths=cw)
    et.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0,0), (-1,-1), 4), ("RIGHTPADDING", (0,0), (-1,-1), 4),
        ("TOPPADDING", (0,0), (-1,-1), 2), ("BOTTOMPADDING", (0,0), (-1,-1), 2),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("BACKGROUND", (0,0), (0,-1), LIGHT_GREY),
        ("BACKGROUND", (2,0), (2,-1), LIGHT_GREY),
    ]))
    story.append(et)
    story.append(Spacer(1, 2*mm))

    # Salary arrangement
    story.append(section_bar("SALARY ARRANGEMENT"))
    story.append(Spacer(1, 0.5*mm))
    sal = Table([
        [Paragraph("<b>Monthly Salary</b>", label_style), Paragraph(f"${monthly_salary:,.2f}", value_style),
         Paragraph("<b>Payment Method</b>", label_style), Paragraph("Bank Transfer (instalments)", value_style)],
    ], colWidths=cw)
    sal.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0,0), (-1,-1), 4), ("RIGHTPADDING", (0,0), (-1,-1), 4),
        ("TOPPADDING", (0,0), (-1,-1), 2), ("BOTTOMPADDING", (0,0), (-1,-1), 2),
        ("BACKGROUND", (0,0), (0,-1), LIGHT_GREY),
        ("BACKGROUND", (2,0), (2,-1), LIGHT_GREY),
    ]))
    story.append(sal)
    story.append(Spacer(1, 2*mm))

    # Payment breakdown
    story.append(section_bar("PAYMENT BREAKDOWN"))
    story.append(Spacer(1, 0.5*mm))

    pay_header = [
        Paragraph("<b>Date</b>", label_style),
        Paragraph("<b>Reference</b>", label_style),
        Paragraph("<b>Method</b>", label_style),
        Paragraph("<b>Amount</b>", label_style),
    ]
    pw = [25*mm, full_w * 0.4, full_w * 0.2, full_w - 25*mm - full_w*0.4 - full_w*0.2]
    pay_data = [pay_header]
    total_paid = 0
    for date, ref, amount in payments:
        pay_data.append([
            Paragraph(date, value_style),
            Paragraph(ref, value_style),
            Paragraph("Bank Transfer", value_style),
            Paragraph(f"${amount:,.2f}", value_right),
        ])
        total_paid += amount

    pt = Table(pay_data, colWidths=pw)
    pcmds = [
        ("BACKGROUND", (0,0), (-1,0), LIGHT_BLUE),
        ("GRID", (0,0), (-1,-1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0,0), (-1,-1), 4), ("RIGHTPADDING", (0,0), (-1,-1), 4),
        ("TOPPADDING", (0,0), (-1,-1), 2), ("BOTTOMPADDING", (0,0), (-1,-1), 2),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ]
    for r in range(1, len(pay_data)):
        if r % 2 == 0:
            pcmds.append(("BACKGROUND", (0, r), (-1, r), LIGHT_GREY))
    pt.setStyle(TableStyle(pcmds))
    story.append(pt)
    story.append(Spacer(1, 0.5*mm))

    # Total paid
    tot_t = Table([
        [Paragraph("<b>TOTAL PAID THIS PERIOD</b>", label_style), Paragraph(f"<b>${total_paid:,.2f}</b>", value_bold_right)],
    ], colWidths=[full_w * 0.7, full_w * 0.3])
    tot_t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), LIGHT_GREY),
        ("BOX", (0,0), (-1,-1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("TOPPADDING", (0,0), (-1,-1), 3), ("BOTTOMPADDING", (0,0), (-1,-1), 3),
    ]))
    story.append(tot_t)
    story.append(Spacer(1, 2*mm))

    # Deductions
    story.append(section_bar("DEDUCTIONS"))
    story.append(Spacer(1, 0.5*mm))
    ded = Table([
        [Paragraph("<b>Description</b>", label_style), Paragraph("<b>Amount</b>", label_style)],
        [Paragraph("PAYG Tax Withheld", value_style), Paragraph("$0.00", value_right)],
    ], colWidths=[full_w * 0.7, full_w * 0.3])
    ded.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), LIGHT_BLUE),
        ("GRID", (0,0), (-1,-1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0,0), (-1,-1), 4), ("RIGHTPADDING", (0,0), (-1,-1), 4),
        ("TOPPADDING", (0,0), (-1,-1), 2), ("BOTTOMPADDING", (0,0), (-1,-1), 2),
    ]))
    story.append(ded)
    story.append(Spacer(1, 2*mm))

    # Net Pay
    net_t = Table([
        [Paragraph("NET PAY", net_label), Paragraph(f"${total_paid:,.2f}", net_style)],
    ], colWidths=[full_w * 0.6, full_w * 0.4])
    net_t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), LIGHT_GREEN),
        ("BOX", (0,0), (-1,-1), 1, HexColor("#16a34a")),
        ("LEFTPADDING", (0,0), (-1,-1), 8), ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("ROUNDEDCORNERS", [3, 3, 3, 3]),
    ]))
    story.append(net_t)

    # Outstanding if any
    if outstanding > 0:
        story.append(Spacer(1, 1*mm))
        ow_t = Table([
            [Paragraph(f"<b>OUTSTANDING BALANCE</b> (${monthly_salary:,.2f} salary − ${total_paid:,.2f} paid)", label_style),
             Paragraph(f"<b>${outstanding:,.2f}</b>", value_bold_right)],
        ], colWidths=[full_w * 0.7, full_w * 0.3])
        ow_t.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), HexColor("#FEF2F2")),
            ("BOX", (0,0), (-1,-1), 0.5, HexColor("#DC2626")),
            ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
            ("TOPPADDING", (0,0), (-1,-1), 3), ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ]))
        story.append(ow_t)

    story.append(Spacer(1, 2*mm))

    # Payment account
    story.append(section_bar("PAYMENT ACCOUNT"))
    story.append(Spacer(1, 0.5*mm))
    ba = Table([
        [Paragraph("<b>Bank</b>", label_style), Paragraph("Commonwealth Bank", value_style),
         Paragraph("<b>BSB</b>", label_style), Paragraph("062-439", value_style)],
        [Paragraph("<b>Account</b>", label_style), Paragraph("10596794", value_style),
         Paragraph("<b>Account Name</b>", label_style), Paragraph("Kevin Rae Geronimo", value_style)],
    ], colWidths=cw)
    ba.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0,0), (-1,-1), 4), ("RIGHTPADDING", (0,0), (-1,-1), 4),
        ("TOPPADDING", (0,0), (-1,-1), 2), ("BOTTOMPADDING", (0,0), (-1,-1), 2),
        ("BACKGROUND", (0,0), (0,-1), LIGHT_GREY),
        ("BACKGROUND", (2,0), (2,-1), LIGHT_GREY),
    ]))
    story.append(ba)
    story.append(Spacer(1, 2*mm))

    # YTD
    story.append(section_bar("YEAR TO DATE SUMMARY"))
    story.append(Spacer(1, 0.5*mm))
    ytd = Table([
        [Paragraph("<b>YTD Gross Earnings</b>", label_style), Paragraph(f"${ytd_gross:,.2f}", value_bold_right)],
        [Paragraph("<b>YTD Tax Withheld</b>", label_style), Paragraph("$0.00", value_bold_right)],
        [Paragraph("<b>YTD Net Pay</b>", label_style), Paragraph(f"${ytd_gross:,.2f}", value_bold_right)],
    ], colWidths=[full_w * 0.7, full_w * 0.3])
    ytd.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("TOPPADDING", (0,0), (-1,-1), 3), ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("BACKGROUND", (0,0), (0,-1), LIGHT_GREY),
    ]))
    story.append(ytd)
    story.append(Spacer(1, 3*mm))

    # Footer
    story.append(Paragraph(
        "Nationwide Projects Investments Pty Ltd  |  One Life Foundation Pty Ltd  |  ABN: 55 643 227 061  |  "
        "This is a computer-generated payslip.",
        footer_style))


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH, pagesize=A4,
        topMargin=8*mm, bottomMargin=8*mm,
        leftMargin=12*mm, rightMargin=12*mm
    )
    story = []

    # ── JUNE 2026 ──
    june_payments = [
        ("26 May 2026", "Kevin (advance)", 5000.00),
        ("11 Jun 2026", "Kevin Payment OLF", 5000.00),
        ("24 Jun 2026", "Kevin", 2500.00),
        ("27 Jun 2026", "Kevin", 2500.00),
    ]
    june_total = sum(p[2] for p in june_payments)
    june_outstanding = 15000.00 - june_total

    build_payslip(
        story,
        pay_period="1 June 2026 — 30 June 2026",
        pay_date="27 June 2026",
        payments=june_payments,
        monthly_salary=15000.00,
        ytd_gross=june_total,
        outstanding=june_outstanding
    )

    story.append(PageBreak())

    # ── JULY 2026 ──
    july_payments = [
        ("01 Jul 2026", "Kevin July month", 1000.00),
        ("08 Jul 2026", "To Kevin 1/6-15/6", 2000.00),
        ("09 Jul 2026", "Kevin 1-15/7", 1000.00),
        ("11 Jul 2026", "July 1-15 Kevin", 1000.00),
        ("15 Jul 2026", "Kevin", 1500.00),
        ("15 Jul 2026", "Kevin Wages July26", 2500.00),
        ("21 Jul 2026", "Kevin 15/7-30/7", 1500.00),
        ("23 Jul 2026", "Kevin 15/7-31/7", 1000.00),
    ]
    july_total = sum(p[2] for p in july_payments)
    july_outstanding = 15000.00 - july_total

    build_payslip(
        story,
        pay_period="1 July 2026 — 31 July 2026",
        pay_date="23 July 2026",
        payments=july_payments,
        monthly_salary=15000.00,
        ytd_gross=june_total + july_total,
        outstanding=july_outstanding
    )

    doc.build(story)
    print(f"PDF generated: {OUTPUT_PATH}")


if __name__ == "__main__":
    build_pdf()
