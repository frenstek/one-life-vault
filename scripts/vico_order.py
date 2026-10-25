"""
Vico (Dairy Farmers) Order Form — Seisia Groceries
"""

import os
import shutil
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

DOWNLOADS = r"C:\Users\kevin\Downloads"
FILENAME = "Vico_Order_Seisia.pdf"
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

title_style = ParagraphStyle("Title", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=16, textColor=NAVY, alignment=TA_CENTER, leading=20)
sub_style = ParagraphStyle("Sub", parent=styles["Normal"],
    fontName="Helvetica", fontSize=9, textColor=MED_TEXT, alignment=TA_CENTER, leading=12)
section_style = ParagraphStyle("Section", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=9, textColor=white, alignment=TA_LEFT, leading=11)
label = ParagraphStyle("Label", parent=styles["Normal"],
    fontName="Helvetica", fontSize=9, textColor=DARK_TEXT, leading=11)
label_bold = ParagraphStyle("LabelBold", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=9, textColor=DARK_TEXT, leading=11)
qty_style = ParagraphStyle("Qty", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=9, textColor=DARK_TEXT, alignment=TA_CENTER, leading=11)
footer_style = ParagraphStyle("Footer", parent=styles["Normal"],
    fontName="Helvetica", fontSize=7, textColor=MED_TEXT, alignment=TA_CENTER, leading=9)
meta_label = ParagraphStyle("MetaL", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=8, textColor=MED_TEXT, leading=10)
meta_val = ParagraphStyle("MetaV", parent=styles["Normal"],
    fontName="Helvetica", fontSize=8, textColor=DARK_TEXT, leading=10)


def section_bar(text):
    t = Table([[Paragraph(text, section_style)]], colWidths=[W - 24*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("ROUNDEDCORNERS", [2, 2, 2, 2]),
    ]))
    return t


def order_table(items):
    full_w = W - 24*mm
    header = [Paragraph("<b>Product</b>", label_bold), Paragraph("<b>Qty</b>", label_bold)]
    data = [header]
    for product, qty in items:
        data.append([Paragraph(product, label), Paragraph(str(qty), qty_style)])
    t = Table(data, colWidths=[full_w - 20*mm, 20*mm])
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BLUE),
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    for r in range(1, len(data)):
        if r % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, r), (-1, r), LIGHT_GREY))
    t.setStyle(TableStyle(style_cmds))
    return t


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH, pagesize=A4,
        topMargin=12*mm, bottomMargin=10*mm,
        leftMargin=12*mm, rightMargin=12*mm
    )
    story = []
    full_w = W - 24*mm

    # Header
    story.append(Paragraph("SEISIA GROCERIES", title_style))
    story.append(Paragraph("Dairy Farmers / Vico Order Form", sub_style))
    story.append(Spacer(1, 3*mm))

    # Order details
    meta = [
        [Paragraph("<b>TO:</b>", meta_label), Paragraph("Vico Pty Ltd — admin@vicomilk.com.au", meta_val),
         Paragraph("<b>PHONE:</b>", meta_label), Paragraph("07 4035 1112", meta_val)],
        [Paragraph("<b>FROM:</b>", meta_label), Paragraph("Seisia Groceries — Account #150", meta_val),
         Paragraph("<b>DELIVERY DATE:</b>", meta_label), Paragraph("_______________", meta_val)],
        [Paragraph("<b>ADDRESS:</b>", meta_label), Paragraph("5 Tumema Street, Seisia QLD 4876", meta_val),
         Paragraph("<b>ORDER DATE:</b>", meta_label), Paragraph("_______________", meta_val)],
    ]
    mt = Table(meta, colWidths=[25*mm, full_w/2 - 25*mm, 30*mm, full_w/2 - 30*mm])
    mt.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, GREY_BORDER),
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GREY),
        ("BACKGROUND", (2, 0), (2, -1), LIGHT_GREY),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(mt)
    story.append(Spacer(1, 4*mm))

    # MILK
    story.append(section_bar("MILK"))
    story.append(Spacer(1, 1*mm))
    story.append(order_table([
        ("3LT MILK", 27),
        ("2LT MILK", 22),
        ("1LT MILK", 8),
        ("500ML MILK", 8),
        ("1LT LITE MILK", 8),
        ("3LT DAIRY CHOICE", 27),
        ("2LT DAIRY CHOICE", 22),
    ]))
    story.append(Spacer(1, 3*mm))

    # FLAVOURED MILK
    story.append(section_bar("FLAVOURED MILK"))
    story.append(Spacer(1, 1*mm))
    story.append(order_table([
        ("CHOC 2L CLASSIC", 4),
        ("CHOC 300ML CLASSIC", 8),
        ("STRAW 300ML CLASSIC", 8),
        ("CHOC 500ML CLASSIC", 16),
        ("STRAW 500ML CLASSIC", 8),
        ("COFFEE 500ML CLASSIC", 12),
        ("DOUBLE ESPRESSO 500ML", 14),
        ("ESPRESSO COFFEE 500ML", 14),
        ("MOCHA 500ML", 8),
    ]))
    story.append(Spacer(1, 3*mm))

    # CREAM
    story.append(section_bar("CREAM"))
    story.append(Spacer(1, 1*mm))
    story.append(order_table([
        ("5LT THICK CREAM", 4),
        ("2LT THICK CREAM", 6),
        ("300 THICK CREAM", 12),
        ("THK CREAMY VANILLA 150g", 12),
        ("THK CREAMY STRAW 150g", 12),
        ("THK CREAM LEMON 150g", 12),
        ("250g SOUR CREAM", 12),
        ("2kg SOUR CREAM LITE", 4),
    ]))
    story.append(Spacer(1, 3*mm))

    # YOGURT
    story.append(section_bar("YOGURT"))
    story.append(Spacer(1, 1*mm))
    story.append(order_table([
        ("F/U 2KG GREEK STYLE", 6),
        ("F/U 1KG GREEK STYLE", 8),
        ("F/U 500g GREEK STYLE", 12),
        ("F/U 240g GREEK STYLE", 12),
        ("YOP 1KG STRAWBERRY", 8),
        ("YOP 1KG MANGO", 8),
        ("YOP 1kg VANILLA", 8),
        ("YOP 160g BERRY", 12),
        ("YOP 160g CLASSICS", 12),
        ("YOP 160g VANILLA", 12),
        ("YOP 100g BERRY", 12),
        ("YOP 100g CLASSICS", 12),
        ("YOP 100g SMOOTH MIX", 12),
    ]))
    story.append(Spacer(1, 4*mm))

    # Total summary
    total_items = 27+22+8+8+8+27+22 + 4+8+8+16+8+12+14+14+8 + 4+6+12+12+12+12+12+4 + 6+8+12+12+8+8+8+12+12+12+12+12+12
    summary = Table([
        [Paragraph("<b>TOTAL ITEMS</b>", label_bold), Paragraph(f"<b>{total_items}</b>", qty_style)],
    ], colWidths=[full_w - 20*mm, 20*mm])
    summary.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GREEN),
        ("BOX", (0, 0), (-1, -1), 1, HexColor("#16a34a")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(summary)
    story.append(Spacer(1, 4*mm))

    # Footer
    story.append(Paragraph(
        "Seisia Groceries  |  5 Tumema Street, Seisia QLD 4876  |  "
        "Orders in by 11AM  |  EFT: BSB 014 577, ACC 228511595  |  "
        "Payable to: Vico Pty Ltd, ABN: 80 010 773 092",
        footer_style
    ))

    doc.build(story)
    print(f"PDF generated: {OUTPUT_PATH}")


if __name__ == "__main__":
    build_pdf()
