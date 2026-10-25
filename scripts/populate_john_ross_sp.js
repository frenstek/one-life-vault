const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGxlbXV0c2ltdndmcHd5bHhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjQ3NCwiZXhwIjoyMDkwMjQyNDc0fQ.ZueFz5cozYoC_TNUH_wX5Ak5G2PAdBMzJyrr_0gzPHk";
const URL = "https://czdlemutsimvwfpwylxh.supabase.co";
const SP_ID = "89af7ed2-3846-41c0-9574-f0ef3cd52683";

const data = {
  status: "active",

  short_term_goals: `1. Establish a consistent daily routine with support workers for personal care, medication management, and wound care within the first 4 weeks of SIL placement.

2. Achieve stable blood glucose levels (BGL 4-10 mmol/L) through regular monitoring (4x daily) and timely insulin administration with support worker assistance.

3. Maintain skin integrity and prevent further wound deterioration through daily wound assessments, dressing changes as per wound management plan, and regular repositioning schedule (minimum every 2 hours).

4. Attend all scheduled haemodialysis appointments (3x per week) with reliable transport and support worker accompaniment.

5. Establish a safe and comfortable SIL environment with all required equipment (ceiling hoist, hospital bed, pressure-relieving mattress, transit wheelchair) within the first 2 weeks.`,

  long_term_goals: `1. Maintain optimal health and prevent hospital readmissions through consistent daily care routines, proactive health monitoring, and early intervention for any changes in condition.

2. Rebuild and strengthen family relationships by reducing carer burden on Beverly, enabling regular family visits and quality time without the stress of full-time caregiving.

3. Increase community participation and social engagement through supported outings (minimum 2x per month), family visits, and exploring interests such as finance and current affairs.

4. Maximise physical function and comfort through ongoing physiotherapy exercises (as tolerated), pain management strategies, and appropriate use of assistive equipment.

5. Develop a trusting and collaborative relationship with the support team to ensure John feels safe, respected, and in control of decisions about his care and daily life.`,

  daily_support_needs: `MORNING ROUTINE (06:00-10:00)
• Blood glucose level (BGL) monitoring and insulin administration (Novorapid + Optisulin as prescribed)
• Sponge bath/personal hygiene assistance (2 support workers required for all transfers)
• Hoist transfer from bed to wheelchair using ceiling hoist and sling
• Oral medication administration
• Wound assessment and dressing changes (abdominal and lower limb wounds per wound care plan)
• Suprapubic catheter (SPC) care — empty drainage bag, check for blockages, clean site
• Breakfast preparation and meal setup (open packaging, cut food — John has impaired hand dexterity)
• Fluid intake monitoring (1L daily restriction due to ESKD)

AFTERNOON (12:00-16:00)
• BGL monitoring and insulin administration (Novorapid lunchtime dose)
• Lunch preparation and meal setup assistance
• Repositioning in wheelchair (pressure injury prevention — every 2 hours)
• Monitor fluid intake and record on fluid balance chart
• Catheter bag management
• Support with leisure activities, phone calls to family, watching TV
• Haemodialysis transport and accompaniment (Mon/Wed/Fri)

EVENING (16:00-22:00)
• BGL monitoring and insulin administration (Novorapid + Protaphane evening doses)
• Dinner preparation and meal setup
• Evening sponge bath/personal care if required
• Wound check — report any redness, swelling, odour, or increased exudate
• Oral medication administration
• Hoist transfer from wheelchair to bed
• Position comfortably with pressure-relieving supports

OVERNIGHT
• Repositioning every 2-3 hours to prevent pressure injuries
• Catheter bag monitoring — check for output and any blockages
• BGL check if John is symptomatic (sweating, tremors, confusion = possible hypoglycaemia)
• Respond to any call for assistance`,

  health_medical: `DIAGNOSES
• Type 2 Diabetes Mellitus (insulin-dependent — Novorapid, Optisulin, Protaphane)
• End Stage Kidney Disease (ESKD) — haemodialysis 3x weekly
• Severe Diabetic Peripheral Neuropathy — sensorimotor impairment affecting all limbs
• Functional bowel and bladder incontinence
• Suprapubic Cystostomy (SPC) in situ for bladder management
• Multiple lower limb and abdominal wounds — high risk of pressure injuries
• Chronic pain, fatigue, and significantly reduced functional endurance

MEDICATION MANAGEMENT
• All medications administered by support workers due to impaired hand function
• BGL monitoring 4x daily: morning, lunch, dinner, bedtime
• Insulin: Novorapid (3x daily with meals), Optisulin (morning), Protaphane (evening)
• Fluid restriction: 1 litre per day — monitor and record all intake
• Haemodialysis: Monday, Wednesday, Friday — transport required

WOUND CARE
• Daily wound assessment for all wound sites (lower limbs and abdomen)
• Dressing changes as per wound management care plan
• Report any signs of infection immediately (increased redness, warmth, odour, exudate)
• Refer to Wound Management Care Plan for detailed protocols

CATHETER CARE
• Empty SPC drainage bag regularly, record output
• Clean catheter site daily during personal care
• Monitor for signs of UTI (cloudy/foul-smelling urine, fever, confusion)
• Refer to Catheter Management Care Plan for detailed protocols

DIABETES MANAGEMENT
• Refer to Diabetes Management Plan for detailed BGL targets, hypo/hyper protocols
• Always have hypo kit available (juice, jelly beans, glucagon if prescribed)
• Never skip meals — risk of hypoglycaemia with insulin`,

  behaviour_support: `John does not have a formal Behaviour Support Plan. He is described as cooperative, polite, and engaged in his care. He communicates his needs clearly and participates in care discussions.

Potential behavioural considerations:
• John may become frustrated or low in mood due to the significant loss of independence he has experienced since hospitalisation. Support workers should be empathetic and provide encouragement.
• John values his autonomy — always ask for his preferences and involve him in decisions about his daily routine.
• If John becomes withdrawn or expresses hopelessness, document and report to the Support Coordinator and consider referral for psychological support.
• Pain and fatigue can impact John's mood and engagement. Adjust activity levels based on how he is feeling each day.`,

  community_access: `• John requires full support for all community access due to being wheelchair-dependent and requiring support worker accompaniment at all times.
• Transport to haemodialysis (3x weekly) is the primary community access requirement — ensure reliable transport is booked in advance.
• Family visits: John's wife Beverly and daughter visit regularly. Facilitate visits and ensure John is comfortable and presentable.
• Supported outings: When John is well enough, support community outings such as shopping centres, parks, or coffee with family (minimum 2x per month as tolerated).
• John previously enjoyed finance and working from home — support access to technology (tablet/laptop) for reading news, managing personal affairs, and staying connected with family via video calls.`,

  communication: `John has no communication deficits. He can understand both written and verbal communication and can express his wants and needs clearly. He is able to participate in complex discussions regarding his care.

Communication preferences:
• Speak directly to John, not around him. He values being treated as an active participant in his care.
• Use plain language when discussing medical procedures or changes to care.
• Provide information in advance where possible — John likes to know what is happening and when.
• Keep John informed about scheduling changes, particularly haemodialysis transport.
• Ensure communication with family (Beverly, son Nicholas, daughter in Kilmore) — John values family connection and wants to maintain strong relationships.`,

  risk_management: `HIGH PRIORITY RISKS

1. FALLS & TRANSFER INJURIES
• John is non-ambulant — ALL transfers require 2 support workers + ceiling hoist with sling
• Never attempt manual handling or allow John to bear weight
• Ensure hoist is maintained and serviced regularly
• Use wheelchair brakes before any transfer

2. PRESSURE INJURIES
• John is at very high risk due to immobility, poor circulation, and existing wounds
• Reposition every 2-3 hours (day and night)
• Use pressure-relieving mattress and cushions at all times
• Daily skin assessments — check sacrum, heels, elbows, and existing wound sites

3. HYPOGLYCAEMIA
• Monitor BGL 4x daily and if symptomatic
• Hypo signs: sweating, tremors, confusion, pallor, irritability
• Immediate response: fast-acting sugar (juice, jelly beans), recheck BGL in 15 mins
• If unconscious: recovery position, call 000, do NOT give food/drink

4. FLUID OVERLOAD
• Strict 1L/day fluid restriction — record all intake
• Monitor for signs: swelling, shortness of breath, rapid weight gain
• Report any concerns immediately

5. INFECTION
• Wound sites and SPC catheter are high-risk for infection
• Monitor for fever, redness, swelling, odour, cloudy urine
• Strict hand hygiene before any wound or catheter care
• Report concerns immediately to GP/nurse

6. MEDICAL EMERGENCY
• If John becomes unresponsive, has a seizure, or shows signs of stroke — call 000 immediately
• Keep emergency contacts visible in the home
• All support workers must be trained in first aid`,

  overnight_support: `John requires active overnight support due to:

• Repositioning every 2-3 hours for pressure injury prevention
• Catheter bag monitoring — check for adequate output and blockages
• BGL monitoring if John is symptomatic (hypo signs: sweating, tremors, confusion)
• Responding to John's calls for assistance (pain management, toileting, comfort)
• Monitoring general wellbeing — John's multiple comorbidities mean his condition can change rapidly

OVERNIGHT ROUTINE
• 22:00 — Final BGL check, evening medication, ensure comfortable positioning, catheter bag emptied
• 00:00 — Reposition, check catheter output, brief welfare check
• 02:00 — Reposition, check catheter
• 04:00 — Reposition, check catheter
• 06:00 — Morning routine begins

IMPORTANT: If John appears confused, excessively sweaty, or unresponsive during the night, perform an immediate BGL check. If BGL is below 4 mmol/L, follow hypoglycaemia protocol. If unable to rouse John, call 000.`,

  additional_notes: `KEY CONTACTS
• Wife: Beverly Ross — 0416 104 301
• Support Coordinator: Gulsun Ali (Interconnection Support Services) — 0407 346 180
• Plan Manager: Distinctability Services — planmanagers@distinctability.or.au
• Pharmacy: Terry White Pharmacy South Morang — 9408 3222

EQUIPMENT REQUIRED
• Ceiling hoist with appropriate sling (rated for John's weight)
• Electric hospital bed with pressure-relieving mattress
• Transit wheelchair
• Shower chair/commode (if bathroom accessible)
• BGL monitor, lancets, test strips
• Wound care supplies (as per wound management plan)
• Catheter care supplies
• Hypo kit (juice boxes, jelly beans)

RELATED CARE PLANS
• Diabetes Management Plan
• Catheter Management Care Plan
• Wound Management Care Plan
• Individual Support Plan

This support plan should be reviewed in conjunction with all related care plans. All support workers must read and sign off on all care plans before commencing shifts with John.`,
};

async function run() {
  const res = await fetch(`${URL}/rest/v1/support_plans?id=eq.${SP_ID}`, {
    method: 'PATCH',
    headers: {
      'apikey': SK,
      'Authorization': `Bearer ${SK}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (Array.isArray(result) && result[0]) {
    console.log('Support plan updated successfully!');
    console.log('ID:', result[0].id);
    console.log('Status:', result[0].status);
    console.log('Fields populated:', Object.keys(data).filter(k => data[k]).length);
  } else {
    console.log('Error:', JSON.stringify(result));
  }
}

run();
