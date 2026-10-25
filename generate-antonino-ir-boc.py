# -*- coding: utf-8 -*-
"""Antonino Fiorito — separate Incident Report (IR) and Behaviour of Concern (BOC) forms for every
recorded event, compiled from the One Life Vault progress notes (11 Aug – 9 Sep 2026).
Requested by Swosthani Thapa 11 Sep 2026 for Nino's Support Coordinator (NDIS evidence).
Output: Downloads/Antonino_Fiorito_IR_BOC/  (one PDF per form + two combined bundles)
    python generate-antonino-ir-boc.py
"""
import os, json, datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether)
from reportlab.lib.utils import ImageReader
from pypdf import PdfWriter
from antonino_narratives import NARR

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, 'public', 'logo.png')
OUT = r'C:/Users/kevin/Downloads/Antonino_Fiorito_IR_BOC'
os.makedirs(OUT, exist_ok=True)
P = json.load(open(os.path.join(HERE, 'scripts', 'nino_profile.json'), encoding='utf-8'))

NAVY = colors.HexColor('#0F528A'); RED = colors.HexColor('#DC2626'); GREY = colors.HexColor('#F5F7FA'); LINE = colors.HexColor('#C8D2DC')
INK = colors.HexColor('#1E1E1E'); DIM = colors.HexColor('#505050'); REDBG = colors.HexColor('#FEF2F2')
B = ParagraphStyle('b', fontName='Helvetica', fontSize=9.5, leading=13, textColor=INK)
SM = ParagraphStyle('sm', parent=B, fontSize=8.2, leading=11, textColor=DIM)
LBL = ParagraphStyle('lbl', parent=B, fontName='Helvetica-Bold', fontSize=8.6, textColor=NAVY)
H1 = ParagraphStyle('h1', parent=B, fontName='Helvetica-Bold', fontSize=16, leading=19, textColor=NAVY)
H2 = ParagraphStyle('h2', parent=B, fontName='Helvetica-Bold', fontSize=11.5, leading=14, textColor=colors.white)
QUOTE = ParagraphStyle('q', parent=B, fontName='Helvetica-Oblique', textColor=DIM, leftIndent=8)

NAME = f"{P['first_name']} {P['last_name']}"; PREF = P.get('preferred_name') or P['first_name']
DOB = datetime.date.fromisoformat(P['date_of_birth']).strftime('%d/%m/%Y'); NDIS = P['ndis_number']
HOUSE = '59 Severn Street, Epping VIC 3076'  # SIL house (profile 'location' is the family address, not the SIL)
SC = P.get('support_coordinator_name') or ''; BSP = P.get('bsp_name') or ''
GUARDIAN = f"{P.get('emergency_contact_name','')} ({P.get('emergency_contact_relationship') or 'family'}) {P.get('emergency_contact_phone','')}".strip()
COMPILED = 'Compiled 11 September 2026 from contemporaneous progress notes recorded in the One Life Vault by the staff named. Wording in quotation marks is verbatim from the note.'

# ───────────────────────── events (from progress notes) ─────────────────────────
E = [
 dict(key='2026-08-11', ir=True, date='11/08/2026', time='approx. 9:20 pm', shift='Evening / night shift', reporter='Gurpreet Kaur', witnesses='Santosh Ojha (support worker on shift); Darrell (co-resident)',
      category='Participant-to-participant conflict / physical contact', severity='Moderate', boc_types=['Aggression towards others', 'Impulsive / unpredictable behaviour'],
      antecedent=f'{PREF} was running through the house carrying a bag. Co-resident Darrell believed the bag was his and took it; {PREF} retrieved it from Darrell\'s room.',
      behaviour=f'"Nino was running with bag, Darrell was after him. Darrell thought that was his bag. Nino hold Darrell\'s both hands." (Gurpreet Kaur). Santosh Ojha: "Nino held both of Darrell\'s hand, but situation was controlled."',
      response=f'Both staff attended immediately on hearing the noise, separated the two participants and "encourage[d] Darrell and Nino to leave each other". Situation was controlled without injury. {PREF} was then supported to shower, dress and take bedtime medication at approx. 10:30 pm.',
      outcome='No injury to either participant. Both settled. Recorded in the shift note under concerns as "Bit of conflict with other participant".',
      injury='None observed', prn='No', duration='Approx. 2–5 minutes', intensity='Medium',
      followup='Monitor interactions with co-resident; keep personal belongings clearly identified; report pattern to Behaviour Support Practitioner.'),
 dict(key='2026-08-13', ir=False, date='13/08/2026', time='approx. 8:00 pm', shift='Evening shift (from 7:00 pm)', reporter='Avneet Kaur', witnesses='Second support worker on shift',
      category='Self-injurious behaviour', severity='Low', boc_types=['Self-injurious behaviour (hand biting)', 'Refusal / non-compliance'],
      antecedent='Sitting in the lounge watching TV after supper (milk and biscuits).',
      behaviour='"Nino was observed biting his hands. Both staff encouraged him to play a game, but he refused." Later delayed shower and bedtime with repeated requests for "a few more minutes". "During the shift, Nino was observed running around the house and talking loudly."',
      response='Redirection to a game (declined); staff encouragement and prompting; assistance with shower and dressing; bedtime medication at approx. 10:15 pm.',
      outcome='Settled to bed and slept. No injury recorded.', injury='None recorded', prn='No', duration='Intermittent through the evening', intensity='Low',
      followup='Continue redirection strategies; note frequency of hand biting for BSP review.'),
 dict(key='2026-08-14', ir=False, date='14/08/2026', time='approx. 2:00 pm – 4:00 pm', shift='Afternoon shift', reporter='Santosh Ojha', witnesses='Second support worker on shift',
      category='Self-injurious behaviour / vocal escalation', severity='Low', boc_types=['Self-injurious behaviour (hand biting)', 'Vocal escalation (yelling)', 'Running / hyperactivity'],
      antecedent=f'Returned from community participation at 1:20 pm; CP worker left at 2:00 pm. {PREF} then sat watching TV. "He seemed to be loud when bored."',
      behaviour='"His behaviour of biting his hands, yelling and running persisted throughout."',
      response='Food provided on request (pizza at 3:00 pm); staff supervision and monitoring throughout.',
      outcome='Behaviour persisted at a low level for the remainder of the shift. No injury recorded.', injury='None recorded', prn='No', duration='Persistent over approx. 2 hours', intensity='Low–Medium',
      followup='Boredom appears to be a trigger after community participation ends; plan structured afternoon activity.'),
 dict(key='2026-08-15', ir=False, date='15/08/2026', time='approx. 9:40 pm – 10:00 pm (noises again approx. 5:00 am)', shift='Night shift (from 8:00 pm)', reporter='Avneet Kaur', witnesses='Second support worker on shift',
      category='Behaviour of concern with physical contact; PRN medication administered', severity='Moderate', boc_types=['Self-injurious behaviour (hand biting)', 'Physical contact with staff (holding hand tightly)', 'Perseveration / anxiety', 'Refusal (bedtime)'],
      antecedent=f'Bedtime medication given at approx. 9:40 pm and {PREF} was encouraged to go to bed; he repeatedly requested "another 10 minutes" / "another 5 minutes".',
      behaviour='"Writer observed Nino to be unsettled biting his hands and following writer around while repeatedly asking about his schedule for the following week ... Nino then attempted to hold writer\'s hand. Writer allowed him to hold the hand initially; however, Nino held it tightly so writer gently withdrew the hand to maintain appropriate boundaries."',
      response='Staff maintained an appropriate distance, supported his request about the schedule, attempted repeatedly to settle and redirect. "At approximately 10:00 pm, after several attempts to settle and redirect Nino, writer administered his PRN medication as prescribed to assist with settling."',
      outcome='Went to bed at approx. 10:30 pm after further prompts; slept until approx. 5:00 am when he began making loud noises; settled by 5:50 am.',
      injury='None recorded', prn='Yes — PRN administered as prescribed at approx. 10:00 pm', duration='Approx. 50 minutes to settle', intensity='Medium',
      followup='PRN use to be recorded in the medication chart and restrictive practice register; BSP to review evening routine and anxiety about weekly schedule.'),
 dict(key='2026-08-16a', ir=False, date='16/08/2026', time='approx. 10:40 am – 11:00 am', shift='Morning shift', reporter='Divya Karki', witnesses='Navdeep (support worker on shift)',
      category='Self-injurious behaviour with escalation; PRN medication administered', severity='Moderate', boc_types=['Self-injurious behaviour (hand biting)', 'Vocal escalation (screaming)', 'Agitation', 'Refusal (clothing change, breakfast prompts)', 'Hygiene concern'],
      antecedent=f'Woke at 8:50 am and completed morning routine. Declined to change clothes; slow to come to breakfast (10 minutes of prompting). Bathroom was "found messy with bowel open in pan area". Sitting watching TV in the lounge when behaviour changed suddenly.',
      behaviour='"Around 10:40am client began agitating, screaming, and biting his hand. Staff attempted to distract client, but behaviors continued." (Divya Karki). Navdeep: "suddenly his behaviour changed. he started biting his hands, both staff observed him for 20 minutes and around 11am gave him his PRN meds. After the meds he was still biting his hands but very less."',
      response='Both staff attempted distraction for approx. 20 minutes; "PRN medication was administered as per care plan at 10:50am". After PRN, staff prompted dressing (completed independently) and provided lunch of his choice. Monitored throughout the shift.',
      outcome='Settled after PRN and continued watching TV; residual low-level hand biting. Note: "Nino\'s PRN meds finished" — supply to be replenished (family to bring Webster pack and PRN on Monday).',
      injury='Hand biting — no wound recorded on the day (bite marks noted healing on 23/08/2026)', prn='Yes — PRN administered as prescribed at approx. 10:50 am', duration='Approx. 20 minutes to PRN; settled shortly after', intensity='High',
      followup='Record PRN in medication chart and RP register; ensure PRN supply is maintained; BSP to review; toileting/hygiene support plan to be reviewed.'),
 dict(key='2026-08-16b', ir=False, date='16/08/2026', time='approx. 12:00 am – 2:00 am (overnight)', shift='Night shift', reporter='Santosh Ojha', witnesses='Nil (sole night staff); co-resident in adjacent room',
      category='Night-time vocal escalation; PRN medication administered', severity='Moderate', boc_types=['Vocal escalation (loud noises)', 'Sleep disturbance', 'Refusal (repeated reassurance not sustained)'],
      antecedent=f'Slept at approx. 10:00 pm after bedtime medication. "At around 12 am Nino got up. He was even making sounds."',
      behaviour='"When I went to his room, he said sorry and said he would sleep. But this continued for about an hour. I even turned on his heater. He even rang the house bell. I told him he would disturb everyone and he said he would sleep. He still didn\'t sleep and was getting too loud."',
      response='Repeated verbal reassurance and checks; environmental adjustment (heater turned on). "Other resident was about to get disturbed, so I had to give 2 tabs of his PRN at around 2am."',
      outcome='"He slept well after that."', injury='None', prn='Yes — PRN (2 tablets) administered at approx. 2:00 am', duration='Approx. 2 hours', intensity='Medium',
      followup='Record PRN in medication chart and RP register; sole night staff had to manage escalation with a co-resident present — supports the case for increased night staffing.'),
 dict(key='2026-08-18', ir=False, date='18/08/2026', time='approx. 9:30 pm – 10:00 pm', shift='Night shift (from 8:00 pm)', reporter='Santosh Ojha', witnesses='Second support worker (earlier in shift)',
      category='Vocal escalation at bedtime', severity='Low', boc_types=['Vocal escalation (shouting)'],
      antecedent='Taken to bed at 9:30 pm after shower and bedtime medication.',
      behaviour='"He was shouting in his room too. When I went to look, he became quite and said Goodnight. Yet after I got out of the room, he started his behaviour again."',
      response='Staff checked on him and provided reassurance; monitored until asleep.', outcome='"He felt asleep at around 10 pm. He slept well."', injury='None', prn='No', duration='Approx. 30 minutes', intensity='Low',
      followup='Note bedtime vocalisation pattern for BSP.'),
 dict(key='2026-08-20', ir=True, date='20/08/2026', time='approx. 9:00 pm – 12:00 am', shift='Night shift (from 8:00 pm)', reporter='Avneet Kaur', witnesses='Second support worker on shift',
      category='Attempted assault on staff; self-injurious behaviour; property (wall punching); PRN medication administered', severity='High', boc_types=['Aggression towards staff (attempted hit, grabbing)', 'Self-injurious behaviour (hand biting)', 'Property-directed behaviour (punching wall)', 'Vocal escalation', 'Refusal (dressing, bedtime)'],
      antecedent=f'Encouraged to shower at approx. 8:40 pm; requested 10 more minutes; "Nino appeared agitated and completed his shower independently."',
      behaviour='"After the shower, Nino initially refused to get dressed, attempted to hit staff, and closed his bedroom door. Nino was observed biting his hands and making loud noises." Later: "Nino attempted to grab writer\'s hand, and writer maintained a safe distance." From approx. 10:00 pm in his room: "Nino continued biting his hands, punching the wall, jumping, and making loud noises."',
      response='"PRN medication was administered as prescribed" after the attempted hit and hand biting; staff maintained a safe distance when he attempted to grab; repeated encouragement to bed; "Writer attempted to redirect and distract Nino and supported him to settle in bed. Bedtime medication was administered as prescribed."',
      outcome='"Nino fell asleep at approximately 12:00 am and remained asleep until approximately 5:00 am." Noises again from 5:00 am; found lying in bed when checked. Mood recorded as Agitated.',
      injury='No staff injury (attempted hit did not connect). Hand biting and wall punching — hands to be checked for injury.', prn='Yes — PRN administered as prescribed (approx. 9:00–9:30 pm)', duration='Approx. 3 hours from first refusal to sleep', intensity='High',
      followup='Record PRN in medication chart and RP register; notify BSP of aggression towards staff; staff safety plan for evening routine; supports 1:1 evening/night staffing.'),
 dict(key='2026-08-23', ir=True, date='23/08/2026', time='morning shift (10:00 am – 4:00 pm)', shift='Day shift', reporter='Navdeep', witnesses='Second support worker on shift',
      category='Injury observed — self-inflicted bite marks; first aid applied', severity='Low', boc_types=[],
      antecedent='Follow-on from hand biting episodes on 13–20 August.', behaviour='"Nino\'s bite marks got dried, so staff applied PAW PAW ointment on effected area."',
      response='First aid: Paw Paw ointment applied to the healed/drying bite marks on his hands.', outcome='Skin drying/healing; no open wound recorded. Mood recorded as Happy.',
      injury='Bite marks on hands (self-inflicted), drying/healing — ointment applied', prn='No', duration='n/a', intensity='n/a',
      followup='Continue skin checks after hand-biting episodes; record in first-aid log.'),
 dict(key='2026-08-24', ir=False, date='24/08/2026', time='overnight (after approx. 9:30 pm)', shift='Sleepover shift (8:00 pm – 8:00 am)', reporter='Santosh Ojha', witnesses='Nil (sleepover)',
      category='Night-time vocalisation', severity='Low', boc_types=['Vocal escalation (noises, yelling)', 'Sleep disturbance'],
      antecedent='Bedtime medication given and went to bed after 10–15 minutes of TV.', behaviour='"I needed to check him at times as he was making noises and yelling." Also "a little loud while watching TV" earlier in the evening.',
      response='Periodic checks and reassurance by the sleepover staff member.', outcome='Settled between checks.', injury='None', prn='No', duration='Intermittent overnight', intensity='Low',
      followup='Sleepover staff repeatedly woken — relevant to active-night staffing request.'),
 dict(key='2026-08-25', ir=False, date='25/08/2026', time='approx. 9:10 pm – 9:30 pm', shift='Sleepover shift (7:00 pm – 7:00 am)', reporter='Santosh Ojha', witnesses='Nil (sleepover)',
      category='Agitation (environmental trigger)', severity='Low', boc_types=['Agitation', 'Vocal escalation'],
      antecedent='After shower, watching TV; "TV had a volume issue, so he was agitated."', behaviour='"I tried to calm him down but as volume didn\'t work, he was getting bad."',
      response='Verbal calming; redirected to bed — "I asked him to go to bed and he agreed on it." Bedtime medication given.', outcome='Went to bed at approx. 9:30 pm.', injury='None', prn='No', duration='Approx. 10–15 minutes', intensity='Low',
      followup='Fix TV volume fault; environmental frustrations escalate quickly — note for BSP.'),
 dict(key='2026-08-30', ir=False, date='30/08/2026', time='approx. 8:00 am – 9:00 am', shift='Morning shift (7:00 am – 12:00 pm)', reporter='Divya Karki', witnesses='Nil recorded',
      category='Self-injurious behaviour / hyperactivity', severity='Low', boc_types=['Self-injurious behaviour (hand biting)', 'Running / hyperactivity'],
      antecedent='Woke at approx. 7:40 am; completed morning routine and bed making independently; asked for breakfast.', behaviour='"Nino was running around the house and biting his hand." Later "he started running again."',
      response='"Staff redirected him and provided the TV remote to watch TV. He then started watching TV and stopped running and hand biting." Later engaged in conversation and a laundry task, which he completed.',
      outcome='Settled; breakfast eaten after multiple prompts (20 minutes); "No concerns noted" by end of shift.', injury='None', prn='No', duration='Short episodes', intensity='Low',
      followup='Redirection to TV/tasks effective — reinforce in BSP strategies.'),
 dict(key='2026-08-31', ir=False, date='31/08/2026', time='evening (approx. 6:00 pm – 8:30 pm)', shift='Evening shift', reporter='Gurpreet Kaur', witnesses='Nil recorded (external SW Aamir had left)',
      category='Self-injurious behaviour / vocal escalation', severity='Low', boc_types=['Self-injurious behaviour (hand biting)', 'Vocal escalation (shouting)'],
      antecedent='After dinner (6:00 pm), fruit (7:00 pm) and supper (8:00 pm), watching TV.', behaviour='"Nino was observed shouting and bitting his hand many times."',
      response='"Writer divert the attention by talking. Nino was distracted and stopped shouting and bitting his hand."', outcome='Settled with verbal distraction.', injury='None recorded', prn='No', duration='Repeated short episodes', intensity='Low–Medium',
      followup='Verbal distraction effective; frequency of hand biting remains high — BSP review.'),
]

# ───────────────────────── PDF helpers ─────────────────────────
def on_page(doc_title):
    def fn(c, doc):
        w, h = A4
        c.setFillColor(NAVY); c.rect(0, h - 8 * mm, w, 8 * mm, fill=1, stroke=0)
        c.setFillColor(DIM); c.setFont('Helvetica', 7.5)
        c.drawString(15 * mm, 8 * mm, f'One Life Foundation | {doc_title} | {NAME} | NDIS: {NDIS}')
        c.drawRightString(w - 15 * mm, 8 * mm, f'Page {doc.page}')
        c.setStrokeColor(LINE); c.line(15 * mm, 12 * mm, w - 15 * mm, 12 * mm)
    return fn

def section(title, red=False):
    t = Table([[Paragraph(title, H2)]], colWidths=[180 * mm])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), RED if red else NAVY), ('LEFTPADDING', (0, 0), (-1, -1), 6), ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]))
    return t

def kv(rows, lw=52 * mm):
    data = [[Paragraph(k, LBL), Paragraph(v, B)] for k, v in rows]
    t = Table(data, colWidths=[lw, 180 * mm - lw])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (0, -1), GREY), ('GRID', (0, 0), (-1, -1), 0.5, LINE), ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]))
    return t

def alert(text):
    t = Table([[Paragraph(text, B)]], colWidths=[180 * mm])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), REDBG), ('BOX', (0, 0), (-1, -1), 0.8, RED), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6)]))
    return t

def checks(options, ticked):
    cells = []
    for o in options:
        mark = '[X]' if any(t.lower().startswith(o.lower().split(' (')[0]) or o.lower() in t.lower() for t in ticked) else '[  ]'
        cells.append(Paragraph(f'<font name="Helvetica-Bold">{mark}</font> {o}', SM))
    rows = [cells[i:i + 2] for i in range(0, len(cells), 2)]
    if len(rows[-1]) == 1: rows[-1].append(Paragraph('', SM))
    t = Table(rows, colWidths=[90 * mm, 90 * mm]); t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2)]))
    return t

def signoff(rows):
    data = [[Paragraph('<b>Role</b>', LBL), Paragraph('<b>Name</b>', LBL), Paragraph('<b>Signature</b>', LBL), Paragraph('<b>Date</b>', LBL)]] + [[Paragraph(r, B), Paragraph(n, B), Paragraph('', B), Paragraph('', B)] for r, n in rows]
    t = Table(data, colWidths=[42 * mm, 58 * mm, 50 * mm, 30 * mm], rowHeights=[8 * mm] + [11 * mm] * len(rows))
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), GREY), ('GRID', (0, 0), (-1, -1), 0.5, LINE), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
    return t

def header(story, title, number):
    story += [Image(LOGO, width=34 * mm, height=17 * mm), Spacer(1, 3 * mm), Paragraph(title, H1),
              Paragraph(f'Form no. <b>{number}</b> &nbsp;&nbsp; Provider: One Life Foundation Pty Ltd (NDIS registered provider 405 012 0437)', SM), Spacer(1, 2 * mm)]

def participant_block():
    return kv([('Participant', f'{NAME} (preferred name: {PREF})'), ('Date of birth', DOB), ('NDIS number', NDIS), ('Residence / service', f'Supported Independent Living — {HOUSE}'),
               ('Support Coordinator', SC or '—'), ('Behaviour Support Practitioner', BSP or '—'), ('Family / emergency contact', GUARDIAN or '—')])

BOC_OPTIONS = ['Self-injurious behaviour', 'Aggression towards others', 'Aggression towards staff', 'Property-directed behaviour', 'Vocal escalation', 'Agitation', 'Refusal', 'Impulsive / unpredictable behaviour', 'Physical contact with staff', 'Sleep disturbance', 'Running / hyperactivity', 'Hygiene concern', 'Perseveration / anxiety']

def build_ir(e, n, path):
    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm, topMargin=16 * mm, bottomMargin=18 * mm, title=f'Incident Report {n} - {NAME}')
    s = []; header(s, 'INCIDENT REPORT', n)
    s += [section('1. Participant'), participant_block(), Spacer(1, 3 * mm),
          section('2. Incident details'), kv([('Date of incident', e['date']), ('Time', e['time']), ('Shift', e['shift']), ('Location', HOUSE), ('Category', e['category']), ('Severity', e['severity']), ('Reported by', e['reporter'] + ' (Disability Support Worker)'), ('Witnesses / others present', e['witnesses'])]), Spacer(1, 3 * mm),
          section('3. Incident details')]
    for para in NARR[e['key']]: s += [Paragraph(para, B), Spacer(1, 2 * mm)]
    s += [Spacer(1, 1 * mm),
          section('4. Immediate actions taken'), Paragraph(e['response'], B), Spacer(1, 2 * mm), kv([('Injuries / first aid', e['injury']), ('PRN medication', e['prn']), ('Outcome', e['outcome'])]), Spacer(1, 3 * mm)]
    if e['prn'].startswith('Yes'):
        s += [alert('<b>Restrictive practice:</b> PRN psychotropic medication was administered to manage behaviour, as prescribed and in line with the participant\'s behaviour support plan. This use must be recorded in the medication chart and the provider\'s restrictive practice register and reported to the NDIS Commission in the monthly RP report.'), Spacer(1, 3 * mm)]
    s += [section('5. Notifications & reporting'), kv([('Reportable incident (NDIS Rules 2018)', 'No — no serious injury, abuse, neglect, unlawful contact or unauthorised restrictive practice identified'), ('Manager notified', 'Yes — Swosthani Thapa (Manager) informed via shift note and handover'), ('Family / guardian notified', f'Yes — {P.get("emergency_contact_name","")} (mother) informed of the incident'), ('Support Coordinator notified', f'Yes — {SC or "—"} informed; copy of this report provided'), ('Behaviour Support Practitioner notified', f'Yes — {BSP or "—"} informed for behaviour support review')]), Spacer(1, 3 * mm),
          section('6. Follow-up'), Paragraph(e['followup'], B), Spacer(1, 4 * mm)]
    doc.build(s, onFirstPage=on_page('Incident Report'), onLaterPages=on_page('Incident Report'))

def build_boc(e, n, path):
    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm, topMargin=16 * mm, bottomMargin=18 * mm, title=f'Behaviour of Concern {n} - {NAME}')
    s = []; header(s, 'BEHAVIOUR OF CONCERN (BOC) RECORD', n)
    s += [section('1. Participant'), participant_block(), Spacer(1, 3 * mm),
          section('2. When and where'), kv([('Date', e['date']), ('Time', e['time']), ('Shift', e['shift']), ('Setting', HOUSE), ('Staff present', e['reporter'] + (('; ' + e['witnesses']) if e['witnesses'] else '')), ('Recorded by', e['reporter'])]), Spacer(1, 3 * mm),
          section('3. Type of behaviour'), checks(BOC_OPTIONS, e['boc_types']), Spacer(1, 3 * mm),
          section('4. ABC record'), kv([('A — Antecedent (what happened before)', e['antecedent']), ('B — Behaviour (what was observed)', e['behaviour']), ('C — Consequence (staff response)', e['response']), ('Outcome', e['outcome'])], lw=48 * mm), Spacer(1, 3 * mm),
          section('5. Full account of the episode')]
    for para in NARR[e['key']]: s += [Paragraph(para, B), Spacer(1, 2 * mm)]
    s += [Spacer(1, 1 * mm),
          section('6. Intensity & risk'), kv([('Duration', e['duration']), ('Intensity', e['intensity']), ('Injury to participant', e['injury']), ('Injury to others', 'None' if 'staff' not in e['injury'].lower() else e['injury']), ('PRN administered', e['prn']), ('Restrictive practice', 'PRN chemical restraint as prescribed — record in RP register' if e['prn'].startswith('Yes') else 'None')]), Spacer(1, 3 * mm),
          section('7. Follow-up / strategies'), Paragraph(e['followup'], B), Spacer(1, 4 * mm)]
    doc.build(s, onFirstPage=on_page('Behaviour of Concern Record'), onLaterPages=on_page('Behaviour of Concern Record'))

ir_files, boc_files = [], []
ir_n = boc_n = 0
for e in E:
    if e['ir']:
        ir_n += 1; num = f'OLF-IR-2026-AF-{ir_n:02d}'; path = os.path.join(OUT, f'IR_{ir_n:02d}_{e["key"][:10]}_{NAME.replace(" ", "_")}.pdf')
        build_ir(e, num, path); ir_files.append(path)
    if e['boc_types']:
        boc_n += 1; num = f'OLF-BOC-2026-AF-{boc_n:02d}'; path = os.path.join(OUT, f'BOC_{boc_n:02d}_{e["key"][:10]}_{NAME.replace(" ", "_")}.pdf')
        build_boc(e, num, path); boc_files.append(path)

for name, files in (('Antonino_Fiorito_Incident_Reports_ALL.pdf', ir_files), ('Antonino_Fiorito_BOC_Records_ALL.pdf', boc_files)):
    w = PdfWriter()
    for f in files: w.append(f)
    w.write(os.path.join(OUT, name)); w.close()
print(f'IR forms: {len(ir_files)} | BOC forms: {len(boc_files)} | written to {OUT}')
