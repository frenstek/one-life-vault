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
        self.cell(0, 4, 'One Life Foundation | ABN: 55 643 227 061 | Module 1 High Intensity - Documentation Compilation', 0, 0, 'L')
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

    def manual_ref(self, section, title, pages):
        """Reference to NDIS Manual Module 1"""
        if self.get_y() > 265:
            self.add_page()
        self.set_font('Helvetica', 'B', 8.5)
        self.set_text_color(*self.navy)
        self.set_x(22)
        self.cell(0, 4.5, f'NDIS Manual Module 1 - Section {section}: {title}', ln=True)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(*self.medium)
        self.set_x(26)
        self.cell(0, 4, f'Pages {pages} of NDIS Manual-Module 1.pdf', ln=True)
        self.ln(1)

    def form_ref(self, form_num, title, purpose):
        if self.get_y() > 265:
            self.add_page()
        self.set_font('Helvetica', 'B', 8.5)
        self.set_text_color(*self.navy)
        self.set_x(22)
        self.cell(0, 4.5, f'{form_num} - {title}', ln=True)
        self.set_font('Helvetica', '', 8.5)
        self.set_text_color(*self.medium)
        self.set_x(26)
        self.multi_cell(164, 4, purpose)
        self.ln(1.5)

    def new_policy_ref(self, doc_num, title, note):
        """Reference to newly created standalone policies"""
        if self.get_y() > 265:
            self.add_page()
        y = self.get_y()
        self.set_fill_color(240, 253, 244)
        self.rect(22, y, 166, 10, 'F')
        self.set_fill_color(*self.green)
        self.rect(22, y, 1.2, 10, 'F')
        self.set_xy(26, y + 1)
        self.set_font('Helvetica', 'B', 8.5)
        self.set_text_color(*self.green)
        self.cell(0, 4, f'NEW: {doc_num} - {title}', ln=True)
        self.set_x(26)
        self.set_font('Helvetica', '', 8)
        self.set_text_color(*self.dark)
        self.cell(0, 4, note)
        self.set_y(y + 12)

    def alert_box(self, label, text, color='blue'):
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
pdf.cell(0, 8, 'MODULE 1: HIGH INTENSITY', 0, 1, 'C')
pdf.set_font('Helvetica', 'B', 12)
pdf.cell(0, 6, 'Daily Personal Activities', 0, 1, 'C')
pdf.set_font('Helvetica', '', 10)
pdf.set_text_color(*pdf.medium)
pdf.cell(0, 6, 'Documentation Compilation & Evidence Guide', 0, 1, 'C')
pdf.ln(3)

# Document control
control_data = [
    ('Document Number', 'OLF-MOD1-COMP-001'),
    ('Version', '1.0'),
    ('Effective Date', '1 January 2026'),
    ('Approved By', 'Kevin Rae Geronimo - General Manager'),
    ('NDIS Registration Group', '0104 - High Intensity Daily Personal Activities'),
    ('Practice Standards', '4.3 Medication | 4.4 Mealtime | 4.5 Waste Management'),
    ('Audit Scope', 'DNV Recertification - June 2026'),
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

# 1. Overview & Core Reference Document
pdf.section_heading('Overview & Core Reference Document', '1')
pdf.body_text(
    'This compilation maps all Module 1 High Intensity documentation maintained by One Life Foundation. '
    'The core policy and procedure reference for Module 1 is the NDIS Manual - Module 1 High Intensity '
    'Daily Personal Activities (114 pages), which contains detailed policies for all high intensity '
    'support areas. This compilation cross-references that manual alongside supporting forms, registers, '
    'capability assessments, and newly developed standalone policies.'
)

pdf.alert_box('CORE DOCUMENT',
    'NDIS Manual - Module 1 High Intensity Daily Personal Activities (114 pages) '
    'Location: One Life Vault > NDIS Manual > 1-NDIS Manual-Module 1.pdf '
    'This manual contains the primary policies and procedures for all 12 high intensity support areas.', 'blue')

pdf.ln(2)
pdf.body_text('The NDIS Manual Module 1 contains the following policy sections:')

# Manual TOC
manual_sections = [
    ('1', 'Applicable Practice Standards Policy & Procedure', '5-7'),
    ('2', 'Complex Bowel Care Policy & Procedure', '8-17'),
    ('3', 'Enteral (NG/PEG) Feeding and Management Policy & Procedure', '18-27'),
    ('4', 'Tracheostomy Management Policy & Procedure', '28-37'),
    ('5', 'Urinary Catheter Management Policy & Procedure', '37-47'),
    ('6', 'Ventilator Management Policy & Procedure', '47-54'),
    ('7', 'Subcutaneous Injections Policy & Procedure', '55-63'),
    ('8', 'Complex Wound Management Policy & Procedure', '64-72'),
    ('9', 'Severe Dysphagia Management Policy & Procedure', '73-92'),
    ('10', 'Diabetes Management Policy & Procedure', '93-100'),
    ('11', 'Seizure Management Policy & Procedure', '100-109'),
    ('12', 'Stoma Care Policy & Procedure', '110-113'),
]

pdf.set_font('Helvetica', 'B', 7.5)
pdf.set_fill_color(*pdf.navy)
pdf.set_text_color(255, 255, 255)
pdf.cell(12, 5, '  Sec', 1, 0, 'L', fill=True)
pdf.cell(120, 5, '  Policy & Procedure', 1, 0, 'L', fill=True)
pdf.cell(46, 5, '  Manual Pages', 1, 1, 'L', fill=True)
pdf.set_font('Helvetica', '', 7.5)
pdf.set_text_color(*pdf.dark)
for i, (sec, title, pages) in enumerate(manual_sections):
    if i % 2 == 0:
        pdf.set_fill_color(*pdf.light_bg)
        pdf.cell(12, 4.5, f'  {sec}', 1, 0, 'L', fill=True)
        pdf.cell(120, 4.5, f'  {title}', 1, 0, 'L', fill=True)
        pdf.cell(46, 4.5, f'  Pages {pages}', 1, 1, 'L', fill=True)
    else:
        pdf.cell(12, 4.5, f'  {sec}', 1, 0, 'L')
        pdf.cell(120, 4.5, f'  {title}', 1, 0, 'L')
        pdf.cell(46, 4.5, f'  Pages {pages}', 1, 1, 'L')

pdf.ln(3)
pdf.alert_box('NEW STANDALONE POLICIES (2026)',
    'The following areas were not covered in the original NDIS Manual and have been developed as '
    'standalone policies to address audit requirements for 4.3/4.4/4.5: '
    '(1) Infection Control Management Policy & Procedure (OLF-POL-IC-001) '
    '(2) Waste Management Policy & Procedure (OLF-POL-WM-001)', 'green')

# 2. Practice Standard 4.3 - Medication Management
pdf.section_heading('Practice Standard 4.3 - Medication Management', '2')
pdf.body_text(
    'Medication management policies are documented in the NDIS Manual Module 1 across multiple '
    'sections. Staff competency is assessed and documented before independent administration.'
)

pdf.sub_heading('NDIS Manual References')
pdf.manual_ref('7', 'Subcutaneous Injections Policy & Procedure', '55-63')
pdf.body_text('Covers insulin pen administration, dose calculation, two levels of responsibility, clinical oversight, and diabetes-specific injection support.')
pdf.manual_ref('10', 'Diabetes Management Policy & Procedure', '93-100')
pdf.body_text('Covers Diabetes Management Plans, BGL monitoring (target ranges: 3-6 ideal, 6-7 satisfactory, >10 unacceptable), insulin administration, hypo/hyperglycaemia management.')
pdf.manual_ref('1', 'Applicable Practice Standards - Compliance Management', '5-7')
pdf.body_text('Overarching compliance framework for all high intensity supports.')

pdf.sub_heading('New Standalone Policy')
pdf.new_policy_ref('OLF-POL-IC-001', 'Infection Control Policy - Section 7',
    'Covers infection control practices specific to medication administration (hand hygiene, clean surfaces, single-use items)')

pdf.sub_heading('Supporting Forms')
pdf.form_ref('Form24', 'Medication Management Form', 'Individual medication plan - prescribed medications, dosages, times, routes, special instructions')
pdf.form_ref('Form40', 'Medication Chart', 'Daily medication administration record with staff sign-off for each dose')
pdf.form_ref('Form41', 'Medication Incident Report', 'Documents medication errors, near-misses, or adverse reactions with investigation')
pdf.form_ref('Form54', 'Subcutaneous Injections Plan and Monitoring', 'Individual insulin/injection plan including BGL monitoring protocol')
pdf.form_ref('Form107', 'PRN Medication Register', 'Records PRN (as needed) medication administration - reason, dose, time, outcome')
pdf.form_ref('Form108', 'Medication Risk Assessment', 'Assesses risks of participant medication regime with identified controls')

pdf.sub_heading('Capability Assessments (Staff Competency)')
pdf.form_ref('Form73', 'SC Injection Capability', 'Practical assessment - subcutaneous injection administration')
pdf.form_ref('Form103', 'Inhalant Medication Administration Capability', 'Practical assessment - inhaler use')
pdf.form_ref('Form104', 'S8 Medication Administration Capability', 'Practical assessment - Schedule 8 controlled substances')
pdf.form_ref('Form105', 'Inhalant Medication With Nebuliser Capability', 'Practical assessment - nebuliser administration')

pdf.sub_heading('Onboarding & Consent')
pdf.form_ref('', 'Medication Consent Form (PDF)', 'Participant/guardian consent for OLF staff to administer medications')
pdf.form_ref('', 'Medication Purpose Form (PDF)', 'Documents purpose and expected outcomes of each medication')

# 3. Practice Standard 4.4 - Mealtime Management
pdf.section_heading('Practice Standard 4.4 - Mealtime Management', '3')
pdf.body_text(
    'Mealtime management policies are primarily documented in the NDIS Manual Module 1 under '
    'the Dysphagia and Enteral Feeding sections. Participants with swallowing difficulties have '
    'individualised plans based on speech pathology assessment.'
)

pdf.sub_heading('NDIS Manual References')
pdf.manual_ref('9', 'Severe Dysphagia Management Policy & Procedure', '73-92')
pdf.body_text('Comprehensive 20-page policy covering: what dysphagia is, risk factors, diagnosis, management strategies, texture modifications (IDDSI framework), positioning, supervision levels, emergency choking procedures, staff training by qualified health practitioners.')
pdf.manual_ref('3', 'Enteral (NG/PEG) Feeding and Management Policy & Procedure', '18-27')
pdf.body_text('Covers PEG/NG tube feeding protocols, rate/volume management, flush protocols, troubleshooting, monitoring, and staff competency requirements.')

pdf.sub_heading('New Standalone Policy')
pdf.new_policy_ref('OLF-POL-IC-001', 'Infection Control Policy - Section 8',
    'Covers food safety, hand hygiene before meals, temperature checks, kitchen hygiene, thickened fluid preparation')

pdf.sub_heading('Supporting Forms')
pdf.form_ref('Form77', 'Mealtime Management Plan Form', 'Individual plan - food texture, fluid consistency, positioning, supervision level, equipment')
pdf.form_ref('Form78', 'Nutrition Assessment', 'Assessment of nutritional needs, dietary requirements, food preferences')
pdf.form_ref('Form79', 'Nutrition and Swallowing Risk Checklist', 'Screening tool for speech pathology/dietitian referral')
pdf.form_ref('Form64', 'Fluid Balance Chart', 'Monitors fluid intake/output for participants requiring fluid management')
pdf.form_ref('Form50', 'Enteral Feeding and Management Plan', 'PEG/NG plan - rate, volume, flush protocol, troubleshooting')

pdf.sub_heading('Capability Assessments')
pdf.form_ref('Form74', 'Enteral Feeding Capability', 'Practical assessment - enteral feeding administration')

pdf.sub_heading('Evidence of Implementation')
pdf.bullet_point('Progress notes documenting meals provided, intake, and concerns')
pdf.bullet_point('Feedback register entry FC-202606-003: food temperature complaint resolved same day (kitchen reminder note installed)')
pdf.bullet_point('Cleaning schedule showing kitchen hygiene compliance (OLF Cleaning Schedule Epping)')

# 4. Practice Standard 4.5 - Waste Management
pdf.section_heading('Practice Standard 4.5 - Waste Management', '4')
pdf.body_text(
    'Waste management was referenced in the NDIS Manual Module 1 (e.g., Section 8 Complex Wound Care '
    'references disposal of clinical waste) but did not have a dedicated policy. A standalone Waste '
    'Management Policy has been developed to fully address Practice Standard 4.5.'
)

pdf.sub_heading('NDIS Manual References')
pdf.manual_ref('8', 'Complex Wound Management - Waste Disposal', '70')
pdf.body_text('Section 8 references that wound care materials must be "handled and disposed of in accordance with Waste Management Policy & Procedure."')

pdf.sub_heading('New Standalone Policy')
pdf.new_policy_ref('OLF-POL-WM-001', 'Waste Management Policy & Procedure',
    'Full standalone policy: waste classification, handling procedures, sharps safety, spill management, storage, contractor disposal, documentation')

pdf.sub_heading('Supporting Forms & Registers')
pdf.form_ref('Form58', 'Waste Removal Register', 'Records all clinical/sharps waste collections - date, type, quantity, contractor, tracking certificate')
pdf.form_ref('Form35', 'Hazardous Chemical Register', 'Inventory of hazardous chemicals at each property with SDS references')
pdf.form_ref('Form24', 'Medication Management Form', 'Also used to document pharmaceutical waste disposal (returned to pharmacy via RUM program)')

# 5. Infection Control
pdf.section_heading('Infection Prevention & Control', '5')
pdf.body_text(
    'Infection control was not included as a standalone section in the original NDIS Manual Module 1. '
    'A comprehensive Infection Control Management Policy has been developed to address this gap, '
    'integrating with medication management (4.3), mealtime management (4.4), and waste management (4.5).'
)

pdf.sub_heading('New Standalone Policy')
pdf.new_policy_ref('OLF-POL-IC-001', 'Infection Control Management Policy & Procedure',
    '13 sections: standard precautions, hand hygiene, PPE, sharps, cleaning, waste, medication IC, mealtime IC, outbreak management, training, risk')

pdf.sub_heading('Digital Register')
pdf.form_ref('', 'Infection Register (One Life Vault)', 'Digital register tracking infection events, exposures, actions taken, outcomes. Entry INF-202606-001: staff gastro at Epping, resolved 48hrs, zero transmission.')

pdf.sub_heading('Supporting Documents')
pdf.form_ref('', 'OLF Cleaning Schedule (Epping)', 'Daily cleaning checklist with staff sign-off for routine and enhanced cleaning')

# 6. Risk Management (Module 1)
pdf.section_heading('Risk Management (Module 1 Specific)', '6')
pdf.body_text(
    'Each section of the NDIS Manual Module 1 includes risk identification and management requirements '
    'specific to that clinical area. The following forms support the broader risk framework:'
)

pdf.sub_heading('Governance')
pdf.form_ref('Form110', 'Clinical Governance Framework', 'Overarching framework for clinical decision-making, escalation, and oversight in high intensity support')

pdf.sub_heading('Risk Forms')
pdf.form_ref('Form01', 'Risk Register', 'Organisation-wide risk register including clinical/high intensity risks')
pdf.form_ref('Form32', 'Home Risk Assessment', 'Property-specific risk assessment - infection, falls, medication storage, waste')
pdf.form_ref('Form33', 'Participant Disaster and Risk Assessment', 'Individual emergency and risk planning')
pdf.form_ref('Form56', 'High Risk Participant Register', 'Register of participants requiring heightened monitoring')
pdf.form_ref('Form108', 'Medication Risk Assessment', 'Specific to medication management risks')
pdf.form_ref('Form79', 'Nutrition and Swallowing Risk Checklist', 'Mealtime-related risk screening')

# 7. Complex Health Support Plans
pdf.section_heading('Complex Health Support Plans & Monitoring', '7')
pdf.body_text(
    'The NDIS Manual Module 1 requires that each complex health support area has an individualised '
    'plan developed by a qualified health practitioner. The following forms implement this requirement:'
)

plans = [
    ('Form49', 'Complex Bowel Care Plan and Monitoring', 'NDIS Manual Sec 2, pp 8-17'),
    ('Form50', 'Enteral Feeding and Management Plan', 'NDIS Manual Sec 3, pp 18-27'),
    ('Form51', 'Tracheostomy Management Plan', 'NDIS Manual Sec 4, pp 28-37'),
    ('Form52', 'Urinary Catheter Management Plan', 'NDIS Manual Sec 5, pp 37-47'),
    ('Form53', 'Ventilator Management Plan', 'NDIS Manual Sec 6, pp 47-54'),
    ('Form54', 'Subcutaneous Injections Plan', 'NDIS Manual Sec 7, pp 55-63'),
    ('Form55', 'Complex Wound Management Plan', 'NDIS Manual Sec 8, pp 64-72'),
]

pdf.set_font('Helvetica', 'B', 7.5)
pdf.set_fill_color(*pdf.navy)
pdf.set_text_color(255, 255, 255)
pdf.cell(22, 5, '  Form', 1, 0, 'L', fill=True)
pdf.cell(85, 5, '  Plan Name', 1, 0, 'L', fill=True)
pdf.cell(71, 5, '  Policy Reference', 1, 1, 'L', fill=True)
pdf.set_font('Helvetica', '', 7.5)
pdf.set_text_color(*pdf.dark)
for i, (form, name, ref) in enumerate(plans):
    if i % 2 == 0:
        pdf.set_fill_color(*pdf.light_bg)
        pdf.cell(22, 4.5, f'  {form}', 1, 0, 'L', fill=True)
        pdf.cell(85, 4.5, f'  {name}', 1, 0, 'L', fill=True)
        pdf.cell(71, 4.5, f'  {ref}', 1, 1, 'L', fill=True)
    else:
        pdf.cell(22, 4.5, f'  {form}', 1, 0, 'L')
        pdf.cell(85, 4.5, f'  {name}', 1, 0, 'L')
        pdf.cell(71, 4.5, f'  {ref}', 1, 1, 'L')

# 8. Training & Competency
pdf.section_heading('Training & Competency (Module 1)', '8')
pdf.body_text(
    'Each section of the NDIS Manual Module 1 specifies training requirements. The manual states '
    'training must be provided by qualified health practitioners, recorded on Form09 Training Matrix, '
    'and scheduled via Form85 Training Program. Staff must be assessed as competent before delivering '
    'high intensity support independently.'
)

pdf.sub_heading('Training Records')
pdf.form_ref('Form09', 'Training Matrix - Module 1', 'Tracks individual staff completion of all required Module 1 training topics')
pdf.form_ref('Form85', 'Training Program for Module 1 (2026)', 'Annual schedule with quarterly/biannual training dates for all high intensity topics')
pdf.form_ref('', 'Document Mapping - Module 1', 'Maps NDIS Practice Standard requirements to OLF documentation')

pdf.sub_heading('Capability Assessments (as per NDIS Manual)')
caps = [
    ('Form67', 'Pressure Area Care and Wound Management', 'NDIS Manual Sec 8'),
    ('Form68', 'Tracheostomy Management', 'NDIS Manual Sec 4'),
    ('Form69', 'Urinary Catheter Care', 'NDIS Manual Sec 5'),
    ('Form70', 'Bowel Management', 'NDIS Manual Sec 2'),
    ('Form73', 'SC Injection', 'NDIS Manual Sec 7'),
    ('Form74', 'Enteral Feeding', 'NDIS Manual Sec 3'),
    ('Form103', 'Inhalant Medication Administration', 'NDIS Manual Sec 7'),
    ('Form104', 'S8 Medication Administration', 'NDIS Manual Sec 7'),
    ('Form105', 'Nebuliser Medication', 'NDIS Manual Sec 7'),
]

pdf.set_font('Helvetica', 'B', 7.5)
pdf.set_fill_color(*pdf.navy)
pdf.set_text_color(255, 255, 255)
pdf.cell(22, 5, '  Form', 1, 0, 'L', fill=True)
pdf.cell(85, 5, '  Capability Assessment', 1, 0, 'L', fill=True)
pdf.cell(71, 5, '  Policy Reference', 1, 1, 'L', fill=True)
pdf.set_font('Helvetica', '', 7.5)
pdf.set_text_color(*pdf.dark)
for i, (form, name, ref) in enumerate(caps):
    if i % 2 == 0:
        pdf.set_fill_color(*pdf.light_bg)
        pdf.cell(22, 4.5, f'  {form}', 1, 0, 'L', fill=True)
        pdf.cell(85, 4.5, f'  {name}', 1, 0, 'L', fill=True)
        pdf.cell(71, 4.5, f'  {ref}', 1, 1, 'L', fill=True)
    else:
        pdf.cell(22, 4.5, f'  {form}', 1, 0, 'L')
        pdf.cell(85, 4.5, f'  {name}', 1, 0, 'L')
        pdf.cell(71, 4.5, f'  {ref}', 1, 1, 'L')

pdf.ln(3)
pdf.sub_heading('2026 Training Schedule (Form85)')
pdf.bullet_point('Quarterly (Jan/Apr/Jul/Oct): Infection Control, Medication Management, Diabetes, SC Injections, Epilepsy')
pdf.bullet_point('Quarterly (Jan/Mar/Jun/Sep/Dec): Mealtime Preparation & Delivery')
pdf.bullet_point('Biannual (Jan/Jun): Complex Bowel Care, Dysphagia, Manual Handling')
pdf.bullet_point('Biannual (Feb/Aug): Continence Management')
pdf.bullet_point('Biannual (Mar/Sep): Complex Wound Care')

# 9. Internal Audit
pdf.section_heading('Internal Audit & Continuous Improvement', '9')
pdf.form_ref('Form15', 'Internal Audit Report - Module 1', 'Findings from internal audit of Module 1 compliance')
pdf.form_ref('Form16', 'Internal Audit Schedule - Module 1', 'Planned internal audit schedule for high intensity supports')
pdf.bullet_point('Continuous Improvement Register - improvement actions from audits/incidents/feedback (One Life Vault)')
pdf.bullet_point('Feedback & Complaints Register - participant/family feedback with resolution (One Life Vault)')
pdf.bullet_point('Infection Register - reviewed monthly for trends (One Life Vault)')
pdf.bullet_point('Risk Register - reviewed quarterly (One Life Vault)')

# 10. Digital Management Systems
pdf.section_heading('Digital Management Systems (One Life Vault)', '10')
pdf.body_text(
    'One Life Foundation maintains digital registers via the One Life Vault '
    '(onelifefoundationndis.app) to support real-time documentation, audit readiness, and '
    'continuous improvement:'
)
pdf.bullet_point('Progress Notes - daily shift documentation (medication, meals, BGL, concerns, mood)')
pdf.bullet_point('Incident Register - incident reporting with investigation and corrective actions')
pdf.bullet_point('Infection Register - infection event tracking with actions, outcomes, follow-up')
pdf.bullet_point('Feedback & Complaints Register - participant/family feedback with resolution tracking')
pdf.bullet_point('Risk Register - organisational risk management with review dates')
pdf.bullet_point('Hazard Register - property-specific hazard identification and controls')
pdf.bullet_point('Continuous Improvement Register - actions from audits, incidents, feedback')
pdf.bullet_point('Cleaning Schedule - daily property cleaning with staff sign-off')
pdf.bullet_point('Staff Compliance Dashboard - training expiry tracking and alerts')
pdf.bullet_point('Auditor Portal - external auditor access to documentation (audit.onelifefoundationndis.app)')

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
pdf.cell(78, 5.5, '  Initial compilation for DNV recertification audit', 1, 1, 'L')

output_path = r'C:\Users\kevin\Downloads\OLF-Module1-High-Intensity-Compilation.pdf'
pdf.output(output_path)
print(f'PDF generated: {output_path}')
print(f'Pages: {pdf.page_no()}')
print(f'Size: {os.path.getsize(output_path)/1024:.0f} KB')
