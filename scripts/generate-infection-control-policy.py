from fpdf import FPDF
import os
from datetime import date


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
        # Navy top bar
        self.set_fill_color(*self.navy)
        self.rect(0, 0, 210, 8, 'F')
        # Logo
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
        self.cell(0, 4, 'One Life Foundation | ABN: 55 643 227 061 | Infection Control Management Policy & Procedure', 0, 0, 'L')
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


# Build the document
pdf = OLFPolicy()
pdf.add_page()

# Title block
pdf.set_font('Helvetica', 'B', 16)
pdf.set_text_color(*pdf.navy)
pdf.cell(0, 8, 'INFECTION CONTROL MANAGEMENT', 0, 1, 'C')
pdf.set_font('Helvetica', 'B', 12)
pdf.cell(0, 6, 'Policy & Procedure', 0, 1, 'C')
pdf.ln(3)

# Document control table
pdf.set_font('Helvetica', '', 8.5)
pdf.set_text_color(*pdf.medium)
control_data = [
    ('Document Number', 'OLF-POL-IC-001'),
    ('Version', '1.0'),
    ('Effective Date', '1 January 2026'),
    ('Review Date', '1 January 2027'),
    ('Approved By', 'Kevin Rae Geronimo - General Manager'),
    ('NDIS Module', 'Module 1 - High Intensity Daily Personal Activities'),
    ('Practice Standards', '4.3 Medication | 4.4 Mealtime | 4.5 Waste Management'),
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
    'This policy establishes the infection prevention and control framework for One Life Foundation '
    'to protect participants, staff, and visitors from healthcare-associated infections. It ensures '
    'compliance with the NDIS Practice Standards Module 1 (High Intensity Daily Personal Activities) '
    'and relevant state and federal health regulations.'
)
pdf.body_text(
    'One Life Foundation is committed to providing safe, clean, and hygienic environments for all '
    'participants receiving Supported Independent Living (SIL) services.'
)

# 2. Scope
pdf.section_heading('Scope', '2')
pdf.body_text('This policy applies to:')
pdf.bullet_point('All One Life Foundation staff, contractors, and volunteers')
pdf.bullet_point('All participants receiving SIL support services')
pdf.bullet_point('All properties and environments where support is delivered')
pdf.bullet_point('Visitors to One Life Foundation properties')
pdf.body_text(
    'This policy covers standard precautions, transmission-based precautions, environmental cleaning, '
    'waste management, outbreak management, and staff training requirements.'
)

# 3. Legislative Framework
pdf.section_heading('Legislative & Regulatory Framework', '3')
pdf.bullet_point('NDIS (Quality Indicators) Guidelines 2018 - Module 1: High Intensity Daily Personal Activities')
pdf.bullet_point('NDIS Practice Standards - 4.3 Medication Management, 4.4 Mealtime Management, 4.5 Waste Management')
pdf.bullet_point('Public Health and Wellbeing Act 2008 (Vic)')
pdf.bullet_point('Occupational Health and Safety Act 2004 (Vic)')
pdf.bullet_point('Australian Guidelines for the Prevention and Control of Infection in Healthcare (NHMRC 2019)')
pdf.bullet_point('AS/NZS 3816:2018 Management of clinical and related wastes')
pdf.bullet_point('National Hand Hygiene Initiative (Hand Hygiene Australia)')

# 4. Standard Precautions
pdf.section_heading('Standard Precautions', '4')
pdf.body_text(
    'Standard precautions are the minimum infection prevention practices that apply to all care, '
    'regardless of suspected or confirmed infection status of the participant.'
)

pdf.sub_heading('4.1 Hand Hygiene')
pdf.body_text(
    'Hand hygiene is the single most effective measure to prevent the spread of infection. '
    'Staff must perform hand hygiene using the WHO 5 Moments framework:'
)
pdf.bullet_point('Before touching a participant')
pdf.bullet_point('Before a clean or aseptic procedure')
pdf.bullet_point('After body fluid exposure risk')
pdf.bullet_point('After touching a participant')
pdf.bullet_point('After touching participant surroundings')
pdf.body_text(
    'Alcohol-based hand rub (ABHR) must be available at all properties and used when hands are not '
    'visibly soiled. Soap and water must be used when hands are visibly soiled or after caring for '
    'participants with gastroenteritis.'
)

pdf.sub_heading('4.2 Personal Protective Equipment (PPE)')
pdf.body_text('Appropriate PPE must be worn based on the task and anticipated exposure:')
pdf.bullet_point('Gloves: Personal care, handling body fluids, continence management, wound care')
pdf.bullet_point('Apron/Gown: When clothing may be contaminated (e.g., showering assistance, handling soiled linen)')
pdf.bullet_point('Face mask: When participant has respiratory symptoms or during aerosol-generating procedures')
pdf.bullet_point('Eye protection: When there is risk of splash or spray of body fluids')
pdf.body_text(
    'PPE must be single-use where indicated, removed safely to avoid self-contamination, '
    'and disposed of in appropriate waste streams.'
)

pdf.sub_heading('4.3 Respiratory Hygiene & Cough Etiquette')
pdf.bullet_point('Cover coughs and sneezes with a tissue or elbow')
pdf.bullet_point('Dispose of tissues immediately into a lined bin')
pdf.bullet_point('Perform hand hygiene after coughing, sneezing, or blowing nose')
pdf.bullet_point('Staff with respiratory symptoms must wear a surgical mask and inform their coordinator')

pdf.sub_heading('4.4 Sharps Management')
pdf.bullet_point('Sharps containers available in all properties where sharps are used (e.g., insulin pens, lancets)')
pdf.bullet_point('Never recap, bend, or break needles')
pdf.bullet_point('Dispose immediately after use into approved sharps container')
pdf.bullet_point('Replace sharps containers when 3/4 full')
pdf.bullet_point('Sharps injury protocol displayed at each property')

# 5. Environmental Cleaning
pdf.section_heading('Environmental Cleaning & Disinfection', '5')
pdf.body_text(
    'Effective environmental cleaning reduces the bioburden of infectious agents and is essential '
    'to infection prevention.'
)

pdf.sub_heading('5.1 Routine Cleaning')
pdf.bullet_point(
    'All properties must be cleaned daily using a two-step process: detergent clean followed by '
    'disinfection of high-touch surfaces'
)
pdf.bullet_point(
    'High-touch surfaces include: door handles, light switches, tap handles, toilet flush, '
    'bedrails, remote controls, mobility aids'
)
pdf.bullet_point('Cleaning schedules must be displayed and signed off by responsible staff (refer to OLF Cleaning Schedule)')
pdf.bullet_point('Dedicated cleaning equipment for bathrooms/toilets (colour-coded system)')

pdf.sub_heading('5.2 Spill Management')
pdf.bullet_point('Blood and body fluid spills must be managed immediately using the spill kit')
pdf.bullet_point('Wear appropriate PPE before managing any spill')
pdf.bullet_point('Contain the spill, apply granules/absorbent, remove, clean area with detergent, then disinfect')
pdf.bullet_point('Document all spills in the Infection Register')

pdf.sub_heading('5.3 Laundry')
pdf.bullet_point('Soiled linen handled with gloves and placed directly into a waterproof bag')
pdf.bullet_point('Wash at minimum 60 degrees Celsius for 10 minutes or 70 degrees for 3 minutes')
pdf.bullet_point('Contaminated linen must not be sorted or rinsed at the location of use')
pdf.bullet_point('Staff must perform hand hygiene after handling soiled linen')

# 6. Waste Management
pdf.section_heading('Waste Management (NDIS 4.5)', '6')
pdf.alert_box(
    'NDIS REQUIREMENT',
    'Practice Standard 4.5 requires that waste, including clinical and hazardous waste, is managed '
    'to minimise risk to participants, workers, and the community.',
    'blue'
)
pdf.body_text('One Life Foundation classifies waste into the following categories:')

pdf.sub_heading('6.1 General Waste')
pdf.bullet_point('Non-contaminated household waste disposed in general waste bins')
pdf.bullet_point('General waste bins lined with plastic bags and emptied daily')

pdf.sub_heading('6.2 Clinical Waste')
pdf.bullet_point('Includes: used continence aids, wound dressings, soiled PPE')
pdf.bullet_point('Disposed in yellow clinical waste bags')
pdf.bullet_point('Clinical waste stored securely until collection')
pdf.bullet_point('Clinical waste collection by licensed contractor (refer to Waste Removal Register - Form58)')

pdf.sub_heading('6.3 Sharps Waste')
pdf.bullet_point('Disposed in AS 4031-compliant sharps containers')
pdf.bullet_point('Containers replaced when 3/4 full')
pdf.bullet_point('Collected by licensed waste contractor')

pdf.sub_heading('6.4 Pharmaceutical Waste')
pdf.bullet_point('Expired or unwanted medications returned to pharmacy (Return Unwanted Medicines program)')
pdf.bullet_point('Never disposed in general waste or flushed')
pdf.bullet_point('Staff must document disposal on Medication Management Form (Form24)')

# 7. Medication Management IC
pdf.section_heading('Infection Control in Medication Management (NDIS 4.3)', '7')
pdf.body_text('Infection control practices must be integrated into all medication administration:')
pdf.bullet_point('Hand hygiene before and after medication administration')
pdf.bullet_point('Clean preparation surface before setting up medications')
pdf.bullet_point('Single-use gloves when administering topical medications, suppositories, or injections')
pdf.bullet_point('Insulin pen needles are single-use and participant-specific - never shared')
pdf.bullet_point('Blood glucose monitoring equipment cleaned between uses as per manufacturer instructions')
pdf.bullet_point('Nebuliser equipment cleaned and dried after each use; replaced as per schedule')
pdf.bullet_point('Medication incidents involving contamination recorded on Form41 (Medication Incident Report)')

# 8. Mealtime Management IC
pdf.section_heading('Infection Control in Mealtime Management (NDIS 4.4)', '8')
pdf.body_text('Food safety and infection control during meal preparation and service:')
pdf.bullet_point('Staff must wash hands thoroughly before preparing or serving food')
pdf.bullet_point('Food stored at correct temperatures: cold food below 5C, hot food above 60C')
pdf.bullet_point('Check food temperature before serving to participants')
pdf.bullet_point('Separate cutting boards for raw meat and ready-to-eat foods')
pdf.bullet_point('Kitchen surfaces cleaned and sanitised before and after food preparation')
pdf.bullet_point('Staff with gastrointestinal illness must not prepare or serve food until 48 hours symptom-free')
pdf.bullet_point('Participant-specific dietary and swallowing plans followed (Form77 - Mealtime Management Plan)')
pdf.bullet_point('Thickened fluids prepared with clean equipment using correct ratios per speech pathology recommendations')

# 9. Outbreak Management
pdf.section_heading('Outbreak Management', '9')
pdf.alert_box(
    'CRITICAL',
    'An outbreak is defined as two or more linked cases of an infectious illness in a property '
    'within a defined period. Immediate action is required.',
    'red'
)

pdf.sub_heading('9.1 Identification & Notification')
pdf.bullet_point('Staff must report any suspected infectious illness to the Coordinator immediately')
pdf.bullet_point('Coordinator notifies Managing Director within 2 hours')
pdf.bullet_point('Notifiable diseases reported to Department of Health as per Public Health and Wellbeing Act 2008')
pdf.bullet_point('NDIS Commission notified of any reportable incident involving infection')

pdf.sub_heading('9.2 Outbreak Response')
pdf.bullet_point('Isolate affected participant(s) where safe and appropriate')
pdf.bullet_point('Implement transmission-based precautions (contact, droplet, or airborne as appropriate)')
pdf.bullet_point('Increase cleaning frequency - minimum twice daily for high-touch surfaces')
pdf.bullet_point('Restrict non-essential visitors to affected property')
pdf.bullet_point('Staff cohorting where possible (dedicated staff for affected participants)')
pdf.bullet_point('Monitor all participants and staff for symptoms daily')
pdf.bullet_point('Document all actions in Infection Register')

pdf.sub_heading('9.3 Return to Normal Operations')
pdf.bullet_point('Outbreak declared over when no new cases for 48 hours (gastro) or as per health authority advice')
pdf.bullet_point('Terminal clean of affected areas')
pdf.bullet_point('Debrief with staff and update risk register if required')
pdf.bullet_point('Record outcome in Continuous Improvement Register')

# 10. Staff Training
pdf.section_heading('Staff Training Requirements', '10')
pdf.body_text(
    'All staff providing high-intensity support must complete infection control training '
    'as part of Module 1 competency requirements:'
)

pdf.sub_heading('Mandatory Training')
pdf.bullet_point('Infection Control Fundamentals - on commencement and annually thereafter')
pdf.bullet_point('Hand Hygiene (National Hand Hygiene Initiative) - on commencement and annually')
pdf.bullet_point('PPE donning and doffing - practical assessment on commencement')
pdf.bullet_point('Blood and body fluid spill management - on commencement and annually')
pdf.bullet_point('Food safety and hygiene (for staff involved in meal preparation) - on commencement')
pdf.bullet_point('Sharps handling (for staff administering medications involving sharps) - on commencement')

pdf.sub_heading('Training Records')
pdf.bullet_point('Training completion recorded on Training Matrix - Module 1 (Form09)')
pdf.bullet_point('Training Program for Module 1 (Form85) outlines schedule and competency requirements')
pdf.bullet_point('Staff not current in training must not perform high-intensity tasks until re-certified')

# 11. Risk Management
pdf.section_heading('Risk Management & Documentation', '11')
pdf.body_text('Infection control risks are managed through the following framework:')
pdf.bullet_point('Infection risks identified and documented in the Risk Register (Form01)')
pdf.bullet_point('Individual participant infection risks assessed during intake (Home Risk Assessment - Form32)')
pdf.bullet_point('High-risk participants flagged on High Risk Participant Register (Form56)')
pdf.bullet_point('All infection events, exposures, and near-misses recorded in the Infection Register')
pdf.bullet_point('Infection Register reviewed monthly by the Managing Director')
pdf.bullet_point('Trends and patterns analysed and actioned via Continuous Improvement Register')

# 12. Infection Register
pdf.section_heading('Infection Register', '12')
pdf.body_text(
    'One Life Foundation maintains a digital Infection Register to document all infection-related events. '
    'The register captures:'
)
pdf.bullet_point('Date and location of event')
pdf.bullet_point('Type of infection/exposure (gastroenteritis, respiratory, wound, blood/body fluid, other)')
pdf.bullet_point('Persons affected (staff/participant - no identifying details in aggregate reports)')
pdf.bullet_point('Actions taken (isolation, PPE, cleaning, notification)')
pdf.bullet_point('Outcome and resolution')
pdf.bullet_point('Follow-up requirements')
pdf.body_text(
    'The Infection Register is accessible via the One Life Vault digital management system and is '
    'reviewed during internal audits and management review meetings.'
)

# 13. Review
pdf.section_heading('Policy Review', '13')
pdf.body_text('This policy will be reviewed:')
pdf.bullet_point('Annually (next review: January 2027)')
pdf.bullet_point('Following any infection outbreak')
pdf.bullet_point('Following changes to legislation or NDIS Practice Standards')
pdf.bullet_point('Following feedback from audits, incidents, or staff')
pdf.body_text('All amendments are recorded in the document version control register.')

# Version history table
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

# Save
output_path = r'C:\Users\kevin\Downloads\OLF-Infection-Control-Management-Policy-Procedure.pdf'
pdf.output(output_path)
print(f'PDF generated: {output_path}')
print(f'Pages: {pdf.page_no()}')
print(f'Size: {os.path.getsize(output_path)/1024:.0f} KB')
