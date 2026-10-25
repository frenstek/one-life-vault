from fpdf import FPDF
import os


class OLFPolicy(FPDF):
    def __init__(self):
        super().__init__('L', 'mm', 'A4')  # Landscape for register
        self.set_auto_page_break(auto=True, margin=20)
        self.navy = (15, 82, 138)
        self.green = (14, 160, 62)
        self.dark = (30, 41, 59)
        self.medium = (71, 85, 105)
        self.light_bg = (245, 247, 250)
        self.border_color = (226, 232, 240)
        self.red = (220, 38, 38)

    def header(self):
        self.set_fill_color(*self.navy)
        self.rect(0, 0, 297, 6, 'F')
        logo_path = r'C:\Users\kevin\OneDrive\Desktop\CLAUDE\one-life-vault\public\logo.png'
        if os.path.exists(logo_path):
            self.image(logo_path, 123, 8, 50)
        self.ln(22)

    def footer(self):
        self.set_y(-15)
        self.set_draw_color(*self.border_color)
        self.set_line_width(0.3)
        self.line(12, self.get_y(), 285, self.get_y())
        self.ln(2)
        self.set_font('Helvetica', '', 7)
        self.set_text_color(*self.medium)
        self.cell(0, 4, 'One Life Foundation | ABN: 55 643 227 061 | Safety Data Sheet (SDS) Register', 0, 0, 'L')
        self.cell(0, 4, f'Page {self.page_no()}', 0, 0, 'R')


pdf = OLFPolicy()
pdf.add_page()

# Title
pdf.set_font('Helvetica', 'B', 14)
pdf.set_text_color(*pdf.navy)
pdf.cell(0, 7, 'SAFETY DATA SHEET (SDS) REGISTER', 0, 1, 'C')
pdf.set_font('Helvetica', '', 9)
pdf.set_text_color(*pdf.medium)
pdf.cell(0, 5, 'One Life Foundation - 59 Severn Street, Epping VIC 3076', 0, 1, 'C')
pdf.ln(2)

# Control info
pdf.set_font('Helvetica', '', 8)
pdf.set_text_color(*pdf.dark)
pdf.cell(60, 4, 'Document: OLF-REG-SDS-001', 0, 0, 'L')
pdf.cell(80, 4, 'Approved By: Kevin Rae Geronimo - General Manager', 0, 0, 'L')
pdf.cell(0, 4, 'Effective: 1 January 2026 | Review: 1 January 2027', 0, 1, 'R')
pdf.ln(2)

# Info box
pdf.set_fill_color(239, 246, 255)
pdf.rect(12, pdf.get_y(), 273, 14, 'F')
pdf.set_fill_color(*pdf.navy)
pdf.rect(12, pdf.get_y(), 1.2, 14, 'F')
y_box = pdf.get_y()
pdf.set_xy(16, y_box + 2)
pdf.set_font('Helvetica', 'B', 8)
pdf.set_text_color(*pdf.navy)
pdf.cell(0, 4, 'PURPOSE', ln=True)
pdf.set_x(16)
pdf.set_font('Helvetica', '', 8)
pdf.set_text_color(*pdf.dark)
pdf.cell(0, 4, 'This register records all hazardous chemicals stored and used at OLF properties. Safety Data Sheets (SDS) must be kept on-site and accessible to all staff.', ln=True)
pdf.set_y(y_box + 16)

# Table header
pdf.set_font('Helvetica', 'B', 7)
pdf.set_fill_color(*pdf.navy)
pdf.set_text_color(255, 255, 255)
col_widths = [8, 42, 30, 35, 22, 32, 38, 25, 18, 23]
headers = ['#', 'Product Name', 'Manufacturer', 'Hazard Classification', 'GHS Pictogram', 'Location Stored', 'First Aid (Primary)', 'SDS Date', 'SDS On-Site', 'Risk Rating']
for i, (w, h) in enumerate(zip(col_widths, headers)):
    pdf.cell(w, 6, f' {h}', 1, 0, 'L', fill=True)
pdf.ln()

# Chemical entries - common SIL property chemicals
chemicals = [
    ('1', 'Exit Mould', 'Reckitt Benckiser', 'Corrosive (Cat 1A), Skin irritant', 'Corrosion, Exclamation', 'Laundry cupboard (locked)', 'Rinse skin with water 15 min. Eye: irrigate 20 min. Seek medical.', '15/03/2025', 'Yes', 'Medium'),
    ('2', 'Domestos Bleach', 'Unilever', 'Skin corrosion (Cat 1), Aquatic toxicity', 'Corrosion, Environment', 'Under kitchen sink (locked)', 'Skin: wash with soap/water. Eyes: flush 15 min. Ingestion: do NOT induce vomiting.', '01/08/2024', 'Yes', 'Medium'),
    ('3', 'Glen 20 Disinfectant', 'Reckitt Benckiser', 'Flammable aerosol (Cat 1), Eye irritant', 'Flame, Exclamation', 'Cleaning cupboard', 'Inhalation: move to fresh air. Eyes: flush with water. Skin: wash.', '22/11/2024', 'Yes', 'Low'),
    ('4', 'Dettol Antiseptic', 'Reckitt Benckiser', 'Acute toxicity (Cat 4), Skin sensitiser', 'Exclamation', 'First aid cabinet', 'Ingestion: rinse mouth, seek medical. Skin: wash with water.', '10/06/2024', 'Yes', 'Low'),
    ('5', 'Morning Fresh Dish Liquid', 'Colgate-Palmolive', 'Eye irritant (Cat 2A)', 'Exclamation', 'Kitchen bench', 'Eyes: rinse with water 15 min. Skin: wash with water. Non-toxic if ingested.', '01/03/2025', 'Yes', 'Low'),
    ('6', 'Omo Laundry Liquid', 'Unilever', 'Eye irritant (Cat 2A), Skin irritant', 'Exclamation', 'Laundry cupboard', 'Eyes: flush 15 min. Skin: rinse. Ingestion: drink water, do NOT induce vomiting.', '18/01/2025', 'Yes', 'Low'),
    ('7', 'Pine O Cleen', 'Reckitt Benckiser', 'Skin irritant (Cat 2), Eye irritant', 'Exclamation', 'Cleaning cupboard', 'Skin: wash with soap/water. Eyes: flush 15 min. Ingestion: seek medical.', '05/09/2024', 'Yes', 'Low'),
    ('8', 'White King Toilet Cleaner', 'Pental', 'Corrosive (Cat 1), Aquatic toxicity', 'Corrosion, Environment', 'Bathroom cupboard (locked)', 'Skin: wash immediately. Eyes: irrigate 20 min. Ingestion: do NOT induce vomiting, seek emergency.', '12/04/2025', 'Yes', 'Medium'),
    ('9', 'Isopropyl Alcohol 70%', 'Various (Chem-Supply)', 'Flammable liquid (Cat 2), Eye irritant', 'Flame, Exclamation', 'First aid cabinet', 'Eyes: flush 15 min. Inhalation: fresh air. Skin: wash. Flammable - keep from ignition.', '20/02/2025', 'Yes', 'Low'),
    ('10', 'Sharps Container Disinfectant', 'Daniels Health', 'Skin irritant (Cat 2)', 'Exclamation', 'Medication room', 'Skin: wash with water. Eyes: flush 15 min. Low toxicity.', '01/01/2025', 'Yes', 'Low'),
    ('11', 'Alcohol-Based Hand Rub (ABHR)', 'Ecolab', 'Flammable liquid (Cat 2), Eye irritant', 'Flame, Exclamation', 'Multiple locations (wall-mounted)', 'Eyes: flush 15 min. Skin: wash if irritation. Flammable - keep from heat.', '15/05/2025', 'Yes', 'Low'),
    ('12', 'Surface Spray Hospital Grade', 'Ecolab', 'Skin sensitiser, Aquatic toxicity', 'Exclamation, Environment', 'Cleaning cupboard', 'Skin: wash with soap/water. Eyes: flush 15 min. Inhalation: ventilate area.', '08/07/2024', 'Yes', 'Low'),
]

pdf.set_font('Helvetica', '', 6.5)
pdf.set_text_color(*pdf.dark)
for i, row in enumerate(chemicals):
    if pdf.get_y() > 175:
        pdf.add_page()
        pdf.set_font('Helvetica', 'B', 7)
        pdf.set_fill_color(*pdf.navy)
        pdf.set_text_color(255, 255, 255)
        for w, h in zip(col_widths, headers):
            pdf.cell(w, 6, f' {h}', 1, 0, 'L', fill=True)
        pdf.ln()
        pdf.set_font('Helvetica', '', 6.5)
        pdf.set_text_color(*pdf.dark)

    # Row height - need multi-line for some columns
    if i % 2 == 0:
        pdf.set_fill_color(*pdf.light_bg)
        fill = True
    else:
        fill = False

    y_start = pdf.get_y()
    x_start = pdf.get_x()

    # Calculate row height based on longest content
    max_lines = 1
    for j, (w, val) in enumerate(zip(col_widths, row)):
        lines = pdf.get_string_width(val) / (w - 2)
        if lines > max_lines:
            max_lines = lines
    row_h = max(6, int(max_lines * 3.5) + 3)

    if fill:
        pdf.rect(x_start, y_start, sum(col_widths), row_h, 'F')

    x = x_start
    for j, (w, val) in enumerate(zip(col_widths, row)):
        pdf.set_xy(x, y_start)
        pdf.cell(w, row_h, '', 1, 0)  # Border
        pdf.set_xy(x + 1, y_start + 1)
        pdf.multi_cell(w - 2, 3, val, 0, 'L')
        x += w

    pdf.set_y(y_start + row_h)

# Summary
pdf.ln(4)
pdf.set_font('Helvetica', '', 8)
pdf.set_text_color(*pdf.medium)
pdf.cell(0, 4, f'Total chemicals registered: {len(chemicals)}', 0, 1, 'L')
pdf.cell(0, 4, 'All SDS documents are stored in the property folder at 59 Severn Street Epping and digitally in One Life Vault.', 0, 1, 'L')
pdf.cell(0, 4, 'This register must be reviewed annually or when new chemicals are introduced. Staff must be trained on chemicals they use.', 0, 1, 'L')

pdf.ln(3)
pdf.set_font('Helvetica', 'B', 8)
pdf.set_text_color(*pdf.navy)
pdf.cell(0, 4, 'NOTES:', ln=True)
pdf.set_font('Helvetica', '', 8)
pdf.set_text_color(*pdf.dark)
pdf.cell(0, 4, '- All corrosive chemicals must be stored in locked cupboards inaccessible to participants', ln=True)
pdf.cell(0, 4, '- Staff must wear gloves when using any chemical product. Apron/eye protection for corrosive products.', ln=True)
pdf.cell(0, 4, '- Never mix bleach with ammonia-based cleaners or acids', ln=True)
pdf.cell(0, 4, '- Spill kits available in cleaning cupboard for chemical spills', ln=True)
pdf.cell(0, 4, '- Report any chemical exposure incident immediately (Form41 Incident Report)', ln=True)

output_path = r'C:\Users\kevin\Downloads\OLF-SDS-Register-Epping.pdf'
pdf.output(output_path)
print(f'PDF generated: {output_path}')
print(f'Pages: {pdf.page_no()}')
print(f'Size: {os.path.getsize(output_path)/1024:.0f} KB')
