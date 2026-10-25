from fpdf import FPDF
import os


class OLFPolicy(FPDF):
    def __init__(self):
        super().__init__('P', 'mm', 'A4')
        self.set_auto_page_break(auto=True, margin=25)
        self.navy = (15, 82, 138)
        self.green = (14, 160, 62)
        self.dark = (30, 41, 59)
        self.medium = (71, 85, 105)
        self.light_bg = (245, 247, 250)
        self.border_color = (226, 232, 240)
        self.red = (220, 38, 38)
        self.amber = (217, 119, 6)

    def header(self):
        self.set_fill_color(*self.navy)
        self.rect(0, 0, 210, 8, 'F')
        logo_path = r'C:\Users\kevin\OneDrive\Desktop\CLAUDE\one-life-vault\public\logo.png'
        if os.path.exists(logo_path):
            self.image(logo_path, 80, 10, 50)
        self.ln(28)

    def footer(self):
        self.set_y(-20)
        self.set_draw_color(*self.border_color)
        self.set_line_width(0.3)
        self.line(16, self.get_y(), 194, self.get_y())
        self.ln(3)
        self.set_font('Helvetica', '', 7)
        self.set_text_color(*self.medium)
        self.cell(0, 4, 'One Life Foundation | ABN: 55 643 227 061 | Waste Management Policy & Procedure', 0, 0, 'L')
        self.cell(0, 4, f'Page {self.page_no()}', 0, 0, 'R')

    def section_heading(self, title, number=None):
        self.ln(4)
        if self.get_y() > 255:
            self.add_page()
        self.set_fill_color(*self.navy)
        self.rect(16, self.get_y(), 178, 7, 'F')
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(255, 255, 255)
        label = f'{number}. {title}' if number else title
        self.set_xy(19, self.get_y() + 1.5)
        self.cell(0, 4, label)
        self.ln(10)
        self.set_text_color(*self.dark)

    def sub_heading(self, title):
        if self.get_y() > 260:
            self.add_page()
        self.ln(2)
        self.set_font('Helvetica', 'B', 9.5)
        self.set_text_color(*self.navy)
        self.cell(0, 5, title, ln=True)
        self.set_text_color(*self.dark)
        self.set_font('Helvetica', '', 9)

    def body_text(self, text):
        self.set_font('Helvetica', '', 9)
        self.set_text_color(*self.dark)
        self.multi_cell(178, 4.5, text, align='L')
        self.ln(2)

    def bullet_point(self, text):
        self.set_font('Helvetica', '', 9)
        self.set_text_color(*self.dark)
        self.set_x(22)
        self.cell(4, 4.5, '-')
        self.multi_cell(168, 4.5, text, align='L')
        self.ln(0.5)

    def alert_box(self, label, text, color='red'):
        colors = {
            'red': ((254, 242, 242), self.red),
            'amber': ((255, 251, 235), self.amber),
            'blue': ((239, 246, 255), self.navy),
            'green': ((240, 253, 244), self.green),
        }
        bg, accent = colors.get(color, colors['blue'])
        lines = len(text) // 90 + 1
        h = 12 + lines * 4.5
        if self.get_y() + h > 260:
            self.add_page()
        y_start = self.get_y()
        self.set_fill_color(*bg)
        self.rect(20, y_start, 170, h, 'F')
        self.set_fill_color(*accent)
        self.rect(20, y_start, 1.5, h, 'F')
        self.set_xy(25, y_start + 3)
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(*accent)
        self.cell(0, 4, label)
        self.ln(4.5)
        self.set_x(25)
        self.set_font('Helvetica', '', 8.5)
        self.set_text_color(*self.dark)
        self.multi_cell(160, 4, text)
        self.set_y(y_start + h + 4)


pdf = OLFPolicy()
pdf.add_page()

# Title
pdf.set_font('Helvetica', 'B', 16)
pdf.set_text_color(*pdf.navy)
pdf.cell(0, 8, 'WASTE MANAGEMENT', 0, 1, 'C')
pdf.set_font('Helvetica', 'B', 12)
pdf.cell(0, 6, 'Policy & Procedure', 0, 1, 'C')
pdf.ln(3)

# Document control
control_data = [
    ('Document Number', 'OLF-POL-WM-001'),
    ('Version', '1.0'),
    ('Effective Date', '1 January 2026'),
    ('Review Date', '1 January 2027'),
    ('Approved By', 'Kevin Rae Geronimo - General Manager'),
    ('NDIS Module', 'Module 1 - High Intensity Daily Personal Activities'),
    ('Practice Standard', '4.5 Management of Waste'),
]
for label, value in control_data:
    pdf.set_fill_color(*pdf.light_bg)
    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(*pdf.medium)
    pdf.cell(45, 5.5, f'  {label}', 1, 0, 'L', fill=True)
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(*pdf.dark)
    pdf.cell(133, 5.5, f'  {value}', 1, 1, 'L')
pdf.ln(5)

# 1. Purpose
pdf.section_heading('Purpose', '1')
pdf.body_text(
    'This policy establishes the waste management framework for One Life Foundation to ensure '
    'all waste generated during the delivery of Supported Independent Living (SIL) services is '
    'managed safely, in compliance with regulatory requirements, and in a manner that minimises '
    'risk to participants, staff, visitors, and the environment.'
)
pdf.body_text(
    'This policy addresses the requirements of NDIS Practice Standard 4.5 (Management of Waste) '
    'which requires that waste, including clinical and hazardous waste, is managed to minimise '
    'risk to all persons.'
)

# 2. Scope
pdf.section_heading('Scope', '2')
pdf.body_text('This policy applies to:')
pdf.bullet_point('All One Life Foundation staff, contractors, and volunteers')
pdf.bullet_point('All properties where SIL support services are delivered')
pdf.bullet_point('All waste generated during the provision of support services')
pdf.bullet_point('General, clinical, sharps, pharmaceutical, and hazardous waste streams')

# 3. Legislative Framework
pdf.section_heading('Legislative & Regulatory Framework', '3')
pdf.bullet_point('NDIS (Quality Indicators) Guidelines 2018 - Practice Standard 4.5')
pdf.bullet_point('Environment Protection Act 2017 (Vic)')
pdf.bullet_point('Environment Protection Regulations 2021 (Vic)')
pdf.bullet_point('Public Health and Wellbeing Act 2008 (Vic)')
pdf.bullet_point('Occupational Health and Safety Act 2004 (Vic)')
pdf.bullet_point('AS/NZS 3816:2018 - Management of clinical and related wastes')
pdf.bullet_point('EPA Victoria - Industrial Waste Management Policy (Clinical and Related Wastes)')
pdf.bullet_point('National Code of Practice for the Management of Clinical and Related Wastes')

# 4. Waste Classification
pdf.section_heading('Waste Classification', '4')
pdf.body_text(
    'One Life Foundation classifies all waste generated at its properties into the following '
    'categories to ensure appropriate handling, storage, and disposal:'
)

pdf.sub_heading('4.1 General Waste')
pdf.body_text('Non-contaminated household waste that does not pose a risk to health or the environment.')
pdf.bullet_point('Food scraps and packaging')
pdf.bullet_point('Paper and cardboard (non-contaminated)')
pdf.bullet_point('General household rubbish')
pdf.bullet_point('Non-contaminated cleaning materials')
pdf.body_text('Disposal: Standard council waste collection via general waste bins lined with plastic bags.')

pdf.sub_heading('4.2 Recyclable Waste')
pdf.bullet_point('Clean paper, cardboard, plastics (types 1-5), glass, aluminium')
pdf.bullet_point('Empty non-contaminated medication packaging (outer boxes only)')
pdf.body_text('Disposal: Council recycling collection via recycling bins.')

pdf.sub_heading('4.3 Clinical Waste')
pdf.body_text('Waste that has the potential to cause disease or infection if not properly contained.')
pdf.bullet_point('Used continence aids (pads, pull-ups)')
pdf.bullet_point('Wound dressings and bandages')
pdf.bullet_point('Used single-use PPE (gloves, aprons, masks) contaminated with body fluids')
pdf.bullet_point('Blood or body fluid contaminated materials')
pdf.bullet_point('Stoma bags and accessories')
pdf.body_text('Disposal: Yellow clinical waste bags, stored securely in designated clinical waste bins. Collected by licensed clinical waste contractor.')

pdf.sub_heading('4.4 Sharps Waste')
pdf.body_text('Any item that could cause a cut or puncture wound and may be contaminated with blood or body fluids.')
pdf.bullet_point('Used insulin pen needles and lancets')
pdf.bullet_point('Blood glucose testing lancets')
pdf.bullet_point('Broken glass contaminated with blood/body fluids')
pdf.bullet_point('Any other sharp objects used in participant care')
pdf.body_text('Disposal: AS 4031-compliant sharps containers (yellow, puncture-resistant). Containers replaced when 3/4 full. Collected by licensed waste contractor.')

pdf.sub_heading('4.5 Pharmaceutical Waste')
pdf.body_text('Expired, unwanted, or contaminated medications that require safe disposal.')
pdf.bullet_point('Expired medications (tablets, liquids, creams, patches)')
pdf.bullet_point('Partially used medications no longer required')
pdf.bullet_point('Contaminated medications')
pdf.bullet_point('Empty S8 medication containers (must be documented)')
pdf.body_text('Disposal: Returned to pharmacy via the Return Unwanted Medicines (RUM) program. Never disposed in general waste, sink, or toilet. Disposal documented on Medication Management Form (Form24).')

pdf.sub_heading('4.6 Hazardous Chemical Waste')
pdf.body_text('Chemicals that may pose a risk to health or the environment.')
pdf.bullet_point('Cleaning chemical containers (when not fully empty)')
pdf.bullet_point('Pesticides or herbicides')
pdf.bullet_point('Batteries')
pdf.body_text('Disposal: Via council hazardous waste collection or EPA-approved drop-off facilities. Refer to Hazardous Chemical Register (Form35) for inventory.')

# 5. Waste Handling Procedures
pdf.section_heading('Waste Handling Procedures', '5')

pdf.sub_heading('5.1 General Principles')
pdf.bullet_point('Waste must be segregated at the point of generation into the correct waste stream')
pdf.bullet_point('Staff must wear appropriate PPE when handling any waste (minimum: gloves)')
pdf.bullet_point('Clinical waste and sharps must never be placed in general waste bins')
pdf.bullet_point('Waste containers must not be overfilled - replace when 3/4 full')
pdf.bullet_point('Hand hygiene must be performed after any waste handling activity')
pdf.bullet_point('Waste must not be stored in areas accessible to participants unless in secure containers')

pdf.sub_heading('5.2 Continence Waste')
pdf.bullet_point('Used continence aids wrapped in the outer packaging or disposal bag provided')
pdf.bullet_point('Placed directly into a lined clinical waste bin with a lid')
pdf.bullet_point('Bins emptied at least daily, or more frequently if odour is present')
pdf.bullet_point('Staff must wear gloves during continence care and waste disposal')
pdf.bullet_point('Bin area cleaned and disinfected regularly')

pdf.sub_heading('5.3 Sharps Handling')
pdf.alert_box('CRITICAL SAFETY', 'Sharps injuries are a significant occupational hazard. All staff must follow sharps handling protocols without exception.', 'red')
pdf.bullet_point('Never recap, bend, break, or remove needles from syringes')
pdf.bullet_point('Dispose of sharps immediately after use - do not carry to another location')
pdf.bullet_point('Use the sharps container at the point of care')
pdf.bullet_point('Never reach into a sharps container')
pdf.bullet_point('If a sharps injury occurs, follow the Sharps Injury Protocol (wash wound, report immediately, seek medical attention)')
pdf.bullet_point('Report all sharps injuries as an incident (Form41) and in the Infection Register')

pdf.sub_heading('5.4 Spill Management')
pdf.bullet_point('Blood and body fluid spills must be managed immediately')
pdf.bullet_point('Staff must don PPE (gloves, apron, eye protection if splash risk) before managing spill')
pdf.bullet_point('Contain the spill with absorbent granules or paper towels')
pdf.bullet_point('Clean area with detergent and water, then disinfect with hospital-grade disinfectant')
pdf.bullet_point('All contaminated materials placed in clinical waste')
pdf.bullet_point('Document the spill in the Infection Register')

# 6. Storage
pdf.section_heading('Waste Storage', '6')
pdf.bullet_point('General waste bins: Located in kitchen and common areas, lined with plastic bags, emptied daily')
pdf.bullet_point('Clinical waste bins: Foot-operated, lidded bins in bathrooms and care areas. Yellow clinical waste bags.')
pdf.bullet_point('Sharps containers: Wall-mounted or stable surface at point of care (e.g., medication preparation area). Must be out of reach of participants where a risk assessment indicates this is necessary.')
pdf.bullet_point('External waste storage: Clinical waste bags and full sharps containers stored in a locked, designated area awaiting collection. Separated from general waste.')
pdf.bullet_point('Storage area must be clean, ventilated, and inaccessible to animals or unauthorised persons')
pdf.bullet_point('Maximum storage time for clinical waste: as per EPA guidelines (typically 30 days for small generators)')

# 7. Collection & Disposal
pdf.section_heading('Collection & Disposal', '7')
pdf.body_text('One Life Foundation engages licensed waste contractors for clinical and sharps waste collection:')
pdf.bullet_point('Clinical waste and sharps collected on a scheduled basis (frequency determined by volume)')
pdf.bullet_point('Contractor must hold appropriate EPA licence for transporting and disposing of clinical waste')
pdf.bullet_point('Collection documented in the Waste Removal Register (Form58) including date, type, quantity, and contractor details')
pdf.bullet_point('Waste tracking certificates retained for a minimum of 3 years')
pdf.bullet_point('General Manager reviews waste collection records quarterly')

# 8. Documentation
pdf.section_heading('Documentation & Records', '8')
pdf.body_text('The following records must be maintained:')
pdf.bullet_point('Waste Removal Register (Form58) - records all clinical/sharps waste collections')
pdf.bullet_point('Hazardous Chemical Register (Form35) - inventory of all hazardous chemicals at properties')
pdf.bullet_point('Medication Management Form (Form24) - records pharmaceutical waste disposal')
pdf.bullet_point('Incident reports (Form41) - for any waste-related incidents (sharps injuries, spills)')
pdf.bullet_point('Infection Register - for any infection events related to waste exposure')
pdf.bullet_point('Waste contractor licences and agreements (retained in operational files)')
pdf.bullet_point('Staff training records (Form09 - Training Matrix)')

# 9. Staff Responsibilities
pdf.section_heading('Staff Responsibilities', '9')

pdf.sub_heading('General Manager')
pdf.bullet_point('Overall responsibility for waste management compliance')
pdf.bullet_point('Ensure adequate waste infrastructure at all properties')
pdf.bullet_point('Engage and monitor licensed waste contractors')
pdf.bullet_point('Review waste-related incidents and implement improvements')
pdf.bullet_point('Ensure staff training is current')

pdf.sub_heading('Coordinators')
pdf.bullet_point('Monitor waste management practices at assigned properties')
pdf.bullet_point('Ensure waste supplies are maintained (bags, containers, PPE)')
pdf.bullet_point('Report waste infrastructure issues promptly')
pdf.bullet_point('Conduct spot checks on waste segregation compliance')

pdf.sub_heading('Support Workers')
pdf.bullet_point('Segregate waste correctly at the point of generation')
pdf.bullet_point('Wear appropriate PPE when handling waste')
pdf.bullet_point('Replace sharps containers when 3/4 full')
pdf.bullet_point('Empty waste bins as per schedule (daily minimum for clinical waste)')
pdf.bullet_point('Report any waste-related incidents immediately')
pdf.bullet_point('Maintain the Waste Removal Register when waste is collected')

# 10. Training
pdf.section_heading('Training Requirements', '10')
pdf.body_text('All staff must receive waste management training as part of their induction and annually thereafter:')
pdf.bullet_point('Waste classification and segregation')
pdf.bullet_point('Safe handling of clinical waste and sharps')
pdf.bullet_point('PPE requirements for waste handling')
pdf.bullet_point('Spill management procedures')
pdf.bullet_point('Sharps injury protocol and reporting')
pdf.bullet_point('Location of waste infrastructure at each property')
pdf.bullet_point('Documentation requirements (Form58, incident reporting)')
pdf.body_text('Training completion recorded on Training Matrix - Module 1 (Form09) and Training Program (Form85).')

# 11. Risk Management
pdf.section_heading('Risk Management', '11')
pdf.body_text('Waste management risks are managed through:')
pdf.bullet_point('Risk assessments for each property identifying waste-related hazards (Form32 - Home Risk Assessment)')
pdf.bullet_point('Hazard Register entries for any identified waste hazards')
pdf.bullet_point('Incident reporting and investigation for waste-related events')
pdf.bullet_point('Regular review of waste management practices during property inspections')
pdf.bullet_point('Continuous improvement actions arising from incidents or audits recorded in CI Register')

# 12. Review
pdf.section_heading('Policy Review', '12')
pdf.body_text('This policy will be reviewed:')
pdf.bullet_point('Annually (next review: January 2027)')
pdf.bullet_point('Following any waste-related incident or near-miss')
pdf.bullet_point('Following changes to EPA regulations or NDIS Practice Standards')
pdf.bullet_point('Following feedback from audits, staff, or regulatory bodies')
pdf.body_text('All amendments are recorded in the document version control register.')

# Version history
pdf.ln(4)
pdf.set_font('Helvetica', 'B', 9)
pdf.set_text_color(*pdf.navy)
pdf.cell(0, 5, 'VERSION HISTORY', ln=True)
pdf.ln(2)
pdf.set_font('Helvetica', 'B', 8)
pdf.set_fill_color(*pdf.navy)
pdf.set_text_color(255, 255, 255)
pdf.cell(20, 5.5, '  Version', 1, 0, 'L', fill=True)
pdf.cell(30, 5.5, '  Date', 1, 0, 'L', fill=True)
pdf.cell(50, 5.5, '  Author', 1, 0, 'L', fill=True)
pdf.cell(78, 5.5, '  Changes', 1, 1, 'L', fill=True)
pdf.set_font('Helvetica', '', 8)
pdf.set_text_color(*pdf.dark)
pdf.cell(20, 5.5, '  1.0', 1, 0, 'L')
pdf.cell(30, 5.5, '  01/01/2026', 1, 0, 'L')
pdf.cell(50, 5.5, '  Kevin Rae Geronimo', 1, 0, 'L')
pdf.cell(78, 5.5, '  Initial release', 1, 1, 'L')

output_path = r'C:\Users\kevin\Downloads\OLF-Waste-Management-Policy-Procedure.pdf'
pdf.output(output_path)
print(f'PDF generated: {output_path}')
print(f'Pages: {pdf.page_no()}')
print(f'Size: {os.path.getsize(output_path)/1024:.0f} KB')
