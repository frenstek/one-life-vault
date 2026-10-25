"""
Kevin Rae Geronimo — Contractor Invoices to One Life Foundation
June & July 2026
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
DOWNLOADS = r"C:\Users\kevin\Downloads"
FILENAME = "Invoices_Kevin_Jun_Jul_2026.pdf"
OUTPUT_PATH = os.path.join(DOWNLOADS, FILENAME)

NAVY = HexColor("#0F528A")
LIGHT_BLUE = HexColor("#EBF4FB")
LIGHT_GREY = HexColor("#F5F7FA")
GREY_BORDER = HexColor("#D1D5DB")
DARK_TEXT = HexColor("#1E293B")
MED_TEXT = HexColor("#475569")
GREEN = HexColor("#166534")
LIGHT_GREEN = HexColor("#F0FDF4")
DARK_GREEN = HexColor("#15803d")

W, H = A4
styles = getSampleStyleSheet()

title_style = ParagraphStyle("Title", fontName="Helvetica-Bold", fontSize=22, textColor=NAVY, alignment=TA_RIGHT, leading=26)
from_label = ParagraphStyle("FromL", fontName="Helvetica-Bold", fontSize=8, textColor=NAVY, leading=10)
from_val = ParagraphStyle("FromV", fontName="Helvetica", fontSize=8, textColor=DARK_TEXT, leading=10)
section_style = ParagraphStyle("Section", fontName="Helvetica-Bold", fontSize=8, textColor=white, alignment=TA_LEFT, leading=10)
label_style = ParagraphStyle("Label", fontName="Helvetica-Bold", fontSize=8, textColor=DARK_TEXT, leading=10)
value_style = ParagraphStyle("Value", fontName="Helvetica", fontSize=8, textColor=DARK_TEXT, leading=10)
value_right = ParagraphStyle("ValueR", fontName="Helvetica", fontSize=8, textColor=DARK_TEXT, alignment=TA_RIGHT, leading=10)
value_bold_right = ParagraphStyle("ValueBR", fontName="Helvetica-Bold", fontSize=8, textColor=DARK_TEXT, alignment=TA_RIGHT, leading=10)
footer_style = ParagraphStyle("Footer", fontName="Helvetica", fontSize=6.5, textColor=MED_TEXT, alignment=TA_CENTER, leading=8)
total_style = ParagraphStyle("Total", fontName="Helvetica-Bold", fontSize=11, textColor=GREEN, alignment=TA_RIGHT, leading=14)
total_label = ParagraphStyle("TotalL", fontName="Helvetica-Bold", fontSize=11, textColor=DARK_TEXT, alignment=TA_LEFT, leading=14)
paid_style = ParagraphStyle("Paid", fontName="Helvetica-Bold", fontSize=9, textColor=DARK_GREEN, alignment=TA_CENTER, leading=12)
meta_label = ParagraphStyle("MetaL", fontName="Helvetica-Bold", fontSize=8, textColor=MED_TEXT, leading=10)
meta_val = ParagraphStyle("MetaV", fontName="Helvetica", fontSize=8, textColor=DARK_TEXT, leading=10)


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


def build_invoice(story, inv_number, inv_date, pay_period, payments, monthly_amount, status):
    full_w = W - 24*mm

    # ── Header: From / Invoice Title ──
    from_block = Paragraph(
        "<b>Kevin Rae Geronimo</b><br/>"
        "ABN: 57 612 711 362<br/>"
        "877 Edgars Rd, Epping VIC 3076<br/>"
        "kevin@onelifefoundation.com.au",
        from_val
    )
    inv_title = Paragraph("TAX INVOICE", title_style)

    header_t = Table([[from_block, inv_title]], colWidths=[full_w * 0.5, full_w * 0.5])
    header_t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(header_t)
    story.append(Spacer(1, 3*mm))

    # ── Invoice details ──
    inv_meta = [
        [Paragraph("<b>Invoice Number</b>", meta_label), Paragraph(inv_number, meta_val),
         Paragraph("<b>Invoice Date</b>", meta_label), Paragraph(inv_date, meta_val)],
        [Paragraph("<b>Pay Period</b>", meta_label), Paragraph(pay_period, meta_val),
         Paragraph("<b>Terms</b>", meta_label), Paragraph("Due on receipt", meta_val)],
    ]
    cw = [28*mm, full_w/2 - 28*mm, 28*mm, full_w/2 - 28*mm]
    imt = Table(inv_meta, colWidths=cw)
    imt.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GREY),
        ("BACKGROUND", (2, 0), (2, -1), LIGHT_GREY),
    ]))
    story.append(imt)
    story.append(Spacer(1, 3*mm))

    # ── Bill To ──
    story.append(section_bar("BILL TO"))
    story.append(Spacer(1, 0.5*mm))
    bill_data = [
        [Paragraph("<b>Company</b>", label_style), Paragraph("One Life Foundation Pty Ltd (subsidiary of Nationwide Projects Investments)", value_style)],
        [Paragraph("<b>ABN</b>", label_style), Paragraph("55 643 227 061", value_style)],
        [Paragraph("<b>Address</b>", label_style), Paragraph("59 Severn Street, Epping VIC 3076", value_style)],
        [Paragraph("<b>NDIS Provider #</b>", label_style), Paragraph("4050120437", value_style)],
    ]
    bt = Table(bill_data, colWidths=[30*mm, full_w - 30*mm])
    bt.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GREY),
    ]))
    story.append(bt)
    story.append(Spacer(1, 3*mm))

    # ── Services ──
    story.append(section_bar("SERVICES RENDERED"))
    story.append(Spacer(1, 0.5*mm))
    svc_data = [
        [Paragraph("<b>Description</b>", label_style),
         Paragraph("<b>Period</b>", label_style),
         Paragraph("<b>Amount</b>", label_style)],
        [Paragraph("General Manager — Full-time management services including:<br/>"
                    "• Operational management of SIL/SDA services<br/>"
                    "• Staff coordination, rostering and supervision<br/>"
                    "• Participant care oversight and compliance<br/>"
                    "• NDIS reporting, documentation and audit preparation<br/>"
                    "• Stakeholder management (Support Coordinators, families, allied health)", value_style),
         Paragraph(pay_period, value_style),
         Paragraph(f"${monthly_amount:,.2f}", value_right)],
    ]
    sw = [full_w * 0.6, full_w * 0.2, full_w * 0.2]
    st = Table(svc_data, colWidths=sw)
    st.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BLUE),
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(st)
    story.append(Spacer(1, 1*mm))

    # Subtotal / GST / Total
    total_data = [
        [Paragraph("<b>Subtotal</b>", label_style), Paragraph(f"${monthly_amount:,.2f}", value_bold_right)],
        [Paragraph("<b>GST</b>", label_style), Paragraph("N/A — not registered for GST", value_right)],
    ]
    tt = Table(total_data, colWidths=[full_w * 0.7, full_w * 0.3])
    tt.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GREY),
    ]))
    story.append(tt)
    story.append(Spacer(1, 0.5*mm))

    # Total due
    total_box = Table([
        [Paragraph("TOTAL DUE", total_label), Paragraph(f"${monthly_amount:,.2f}", total_style)],
    ], colWidths=[full_w * 0.6, full_w * 0.4])
    total_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GREEN),
        ("BOX", (0, 0), (-1, -1), 1, HexColor("#16a34a")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROUNDEDCORNERS", [3, 3, 3, 3]),
    ]))
    story.append(total_box)
    story.append(Spacer(1, 3*mm))

    # ── Payment Record ──
    story.append(section_bar("PAYMENT RECORD"))
    story.append(Spacer(1, 0.5*mm))
    pay_header = [
        Paragraph("<b>Date</b>", label_style),
        Paragraph("<b>Reference</b>", label_style),
        Paragraph("<b>Method</b>", label_style),
        Paragraph("<b>Amount</b>", label_style),
    ]
    pw = [25*mm, full_w * 0.38, full_w * 0.2, full_w - 25*mm - full_w*0.38 - full_w*0.2]
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
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BLUE),
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    for r in range(1, len(pay_data)):
        if r % 2 == 0:
            pcmds.append(("BACKGROUND", (0, r), (-1, r), LIGHT_GREY))
    pt.setStyle(TableStyle(pcmds))
    story.append(pt)
    story.append(Spacer(1, 0.5*mm))

    # Total paid
    tp = Table([
        [Paragraph("<b>TOTAL PAID</b>", label_style), Paragraph(f"<b>${total_paid:,.2f}</b>", value_bold_right)],
    ], colWidths=[full_w * 0.7, full_w * 0.3])
    tp.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GREY),
        ("BOX", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(tp)

    # Outstanding
    outstanding = monthly_amount - total_paid
    if outstanding > 0:
        story.append(Spacer(1, 0.5*mm))
        ow = Table([
            [Paragraph("<b>BALANCE OUTSTANDING</b>", label_style), Paragraph(f"<b>${outstanding:,.2f}</b>", value_bold_right)],
        ], colWidths=[full_w * 0.7, full_w * 0.3])
        ow.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), HexColor("#FEF2F2")),
            ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#DC2626")),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(ow)
    elif outstanding <= 0:
        story.append(Spacer(1, 0.5*mm))
        paid_box = Table([
            [Paragraph("\u2714  PAID IN FULL", paid_style)],
        ], colWidths=[full_w])
        paid_box.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GREEN),
            ("BOX", (0, 0), (-1, -1), 1, HexColor("#16a34a")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("ROUNDEDCORNERS", [3, 3, 3, 3]),
        ]))
        story.append(paid_box)

    story.append(Spacer(1, 3*mm))

    # ── Payment Details ──
    story.append(section_bar("PAYMENT DETAILS"))
    story.append(Spacer(1, 0.5*mm))
    ba = Table([
        [Paragraph("<b>Account Name</b>", label_style), Paragraph("Kevin Rae Geronimo", value_style),
         Paragraph("<b>Bank</b>", label_style), Paragraph("Commonwealth Bank", value_style)],
        [Paragraph("<b>BSB</b>", label_style), Paragraph("062-439", value_style),
         Paragraph("<b>Account</b>", label_style), Paragraph("10596794", value_style)],
    ], colWidths=cw)
    ba.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GREY),
        ("BACKGROUND", (2, 0), (2, -1), LIGHT_GREY),
    ]))
    story.append(ba)
    story.append(Spacer(1, 4*mm))

    # Footer
    story.append(Paragraph(
        "Kevin Rae Geronimo  |  ABN: 57 612 711 362  |  "
        "This invoice is issued for services rendered to One Life Foundation Pty Ltd (subsidiary of Nationwide Projects Investments Pty Ltd).",
        footer_style))


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH, pagesize=A4,
        topMargin=10*mm, bottomMargin=10*mm,
        leftMargin=12*mm, rightMargin=12*mm
    )
    story = []

    # ── JUNE 2026 ──
    june_payments = [
        ("26 May 2026", "Kevin (advance for June)", 5000.00),
        ("11 Jun 2026", "Kevin Payment OLF", 5000.00),
        ("24 Jun 2026", "Kevin", 2500.00),
        ("27 Jun 2026", "Kevin", 2500.00),
    ]
    build_invoice(story,
        inv_number="KRG-2026-06",
        inv_date="30 June 2026",
        pay_period="1 June — 30 June 2026",
        payments=june_payments,
        monthly_amount=15000.00,
        status="paid"
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
    build_invoice(story,
        inv_number="KRG-2026-07",
        inv_date="31 July 2026",
        pay_period="1 July — 31 July 2026",
        payments=july_payments,
        monthly_amount=15000.00,
        status="partial"
    )

    doc.build(story)
    print(f"PDF generated: {OUTPUT_PATH}")


if __name__ == "__main__":
    build_pdf()
