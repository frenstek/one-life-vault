// Bulk import Nicole Knight progress notes from handwritten staff notes
// Covers 17 April – 5 May 2026

const VAULT_URL = 'https://onelifefoundationndis.app';

const notes = [
  // ── 17 April 2026 (Friday) ─────────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-04-17",
    shift: "Morning 6am-12pm",
    day_of_week: "Friday",
    staff_name: "SW",
    content: "Started shift, Nicole was sleeping. H/O received, she was settled around 2:30AM. Swept floor, did laundry. Cleaned staff room and toilet. Folded clothes, wiped kitchen bench. Blood sugar was monitored throughout the shift, remained stable. Nicole was sleeping throughout the shift, so no medication was administered till 12PM. Cleaning and household tasks done. Finished shift with nil concerns reportable. H/O given to next staff. BSL was high (6.7) @ 11:50AM — took insulin.",
    bsl_reading: "High 6.7 @ 11:50AM - took insulin",
    medication_notes: "No medication administered as Nicole was sleeping. Insulin taken at 11:50AM.",
    concerns: null,
    mood: "Neutral",
    sleep_quality: "Good",
    meals: null,
    activities: "Swept floor, did laundry, cleaned staff room and toilet, folded clothes, wiped kitchen bench"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-17",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Friday",
    staff_name: "AK",
    content: "Started shift at 4:00pm. On arrival, Nicole was resting in her room. Received handover from previous SW who reported pm med already administered and Nicole was stable. At start of shift, BGL was 9.1 mmol/L. Spent some time with Nicole. Following this, Nicole was resting and using her laptop. In mean time, writer swept floor and did some dusting. Approximately at 7:53pm Nicole experienced seizure episode. Regular 8pm meds along with Panamax and Ibuprofen was administered. Later around 8:20pm, Nicole's BGL was low at 5.4 mmol/L and writer provided her some fruits. Around 9:00pm, Nicole had her dinner along with a cup of tea and afterwards she continued resting. At 10:00pm, Nicole had a bed bath with writer's assistance. After bed bath, Nicole took Cetirizine and requested a cup of tea and a nut bar. However, afterwards she prepared for bed. At 11:56pm, Nicole asked for DayVigo which was provided at 12:00am. Additionally she requested toast which was provided. During night, Nicole was stable. Nil concerns/injury reported or observed. In the morning at 6:36am Nicole asked for toast and a cup of tea which was provided. Regular checks done on Nicole.",
    bsl_reading: "9.1 mmol/L at start of shift; 5.4 mmol/L at 8:20pm (low - fruits provided)",
    medication_notes: "Regular 8pm meds, Panamax, Ibuprofen, Cetirizine, DayVigo at 12:00am",
    concerns: "Seizure episode at approximately 7:53pm. BGL dropped to 5.4 mmol/L at 8:20pm — fruits provided to stabilise.",
    mood: "Neutral",
    sleep_quality: "Good",
    meals: "Dinner at 9:00pm with cup of tea. Nut bar after bed bath. Toast at 12:00am. Toast and tea at 6:36am.",
    activities: "Swept floor, dusting, bed bath assistance"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-17",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Friday",
    staff_name: "AK",
    content: "SEIZURE INCIDENT REPORT — 17 April 2026: At 7:53pm, Nicole was resting and writer was cleaning kitchen. Writer heard noise and went to her room to check on her. Writer found Nicole fainted on floor. She reported that she was trying to get her vapes from her handbag. At 7:55pm, she started experiencing shakes and tremors. Writer supported her head with pillow and cleared surrounding for safety. Her breathing was monitored during the episode (HR - 65bpm). Writer assisted her to the bed after she partially recovered at around 8:00pm. Following the episode, Nicole continued resting.",
    bsl_reading: null,
    medication_notes: null,
    concerns: "SEIZURE INCIDENT: 7:53pm — Found Nicole fainted on floor. Shakes and tremors from 7:55pm. HR 65bpm. Supported head with pillow, cleared surroundings. Partially recovered by 8:00pm, assisted to bed. Nil injury.",
    mood: null,
    sleep_quality: null,
    meals: null,
    activities: null
  },

  // ── 18 April 2026 (Saturday) ───────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-04-18",
    shift: "Morning 8am-12pm",
    day_of_week: "Saturday",
    staff_name: "SW",
    content: "H/O received, Nicole was sleeping. Around 8:30AM, she came in lounge room, she mentioned she wasn't able to sleep. BGL was normal throughout the shift. Made tea for Nicole, she had morning meds and Oxazepam as requested by her. She went back to bed and she slept until the end of my shift. Cleaning done of staff room and toilet, wiped kitchen benches and swept floor.",
    bsl_reading: "Normal throughout shift",
    medication_notes: "Morning meds and Oxazepam administered as requested",
    concerns: null,
    mood: "Neutral",
    sleep_quality: "Poor",
    meals: "Tea",
    activities: "Cleaned staff room and toilet, wiped kitchen benches, swept floor"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-18",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Saturday",
    staff_name: "AK / JW",
    content: "Started shift at 4:00pm. On arrival Nicole was in her room resting. Received handover from previous SW who reported Nicole's BGL was high and she already had insulin. Regular 4:00pm medication was given. Monitored her BGL. She was resting in her bed and using her laptop. Additionally, writer spent some time with her. At 5:05pm, Nicole was administered 0.5mg of Propranolol on her request. Later approximately at 6:30pm her BGL started dropping so writer provided her some fruits and juice. Following this, at 7:15pm, Nicole had a shower with writer's assistance. Regular 8pm medication was administered. At 9:00pm, Nicole had her dinner and later she had a cup of tea. Approximately at 10:10pm Nicole experienced seizure episode. However, her BGL dropped at 4.2 mmol/L following this seizure episode. Nicole was provided with some cut fruits. Afterwards, she prepared for bed. At 1:50am, Nicole had DayVigo and approximately at 1:56am Oxazepam, Panamax and Ibuprofen was administered. Later in the morning, Nicole requested toast around 5:30am which was provided and then she went back to bed. Approximately at 7:58pm, Nicole's BGL was 16.8 mmol/L so writer encouraged her to take insulin. Nicole had 3 sachets of Movicol around 10:30pm.",
    bsl_reading: "High at start (insulin already taken). Dropped to 4.2 mmol/L after seizure at 10:10pm. 16.8 mmol/L at 7:58pm.",
    medication_notes: "Regular 4pm meds, Propranolol 0.5mg at 5:05pm, Regular 8pm meds, DayVigo at 1:50am, Oxazepam/Panamax/Ibuprofen at 1:56am, Movicol x3 sachets at 10:30pm",
    concerns: "Seizure episode at 10:10pm. BGL dropped to 4.2 mmol/L post-seizure. BGL fluctuations throughout shift.",
    mood: "Neutral",
    sleep_quality: "Fair",
    meals: "Fruits and juice at 6:30pm. Dinner at 9:00pm with tea. Cut fruits after seizure. Toast at 5:30am.",
    activities: "Shower assistance at 7:15pm"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-18",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Saturday",
    staff_name: "AK",
    content: "SEIZURE INCIDENT REPORT — 18 April 2026: At approximately 10:00pm, Nicole came out in kitchen to prepare tea for her. Writer and Nicole both were in kitchen. Suddenly, at 10:10pm Nicole felt dizzy while she was sitting in her wheelchair. Writer safely assisted her to the bedroom and she experienced shakes and tremors till 10:15pm. Afterwards, she recovered and continued resting. Nil injury reported or observed.",
    bsl_reading: null,
    medication_notes: null,
    concerns: "SEIZURE INCIDENT: 10:10pm — Nicole felt dizzy in wheelchair in kitchen. Shakes and tremors until 10:15pm (~5 minutes). Safely assisted to bedroom. Nil injury.",
    mood: null,
    sleep_quality: null,
    meals: null,
    activities: null
  },

  // ── 19 April 2026 (Sunday) ─────────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-04-19",
    shift: "Morning 8am-12pm",
    day_of_week: "Sunday",
    staff_name: "SW",
    content: "Started shift, Nicole was in her room sleeping. H/O received. Wiped kitchen bench, settled up the dishes, swept floor. Monitored BGL throughout the shift, it remained stable. Nicole woke up around 11AM. Administered morning meds with Nuvigil (1), Propranolol (½) tablet as requested. Made toast with tea for breakfast. H/O given to next staff. Finished shift with nil concerns reportable.",
    bsl_reading: "Stable throughout shift",
    medication_notes: "Morning meds with Nuvigil x1, Propranolol ½ tablet as requested",
    concerns: null,
    mood: "Neutral",
    sleep_quality: "Good",
    meals: "Toast with tea for breakfast at 11AM",
    activities: "Wiped kitchen bench, settled dishes, swept floor"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-19",
    shift: "Leave/Outing",
    day_of_week: "Sunday",
    staff_name: "SW",
    content: "Leave meds taken: Cetirizine 1x tab, Metoclopramide 1x tab, Ondansetron 1x tab, Nuvigil 1x tab, Propranolol 1x tab, 4PM meds. Nicole left at 1:15pm for Dad's place. Arrived back at 4:30pm. Nicole had Movicol 3 sachets at 9:10pm. Nicole had another 3 sachets of Movicol around 10:25pm.",
    bsl_reading: null,
    medication_notes: "Leave meds: Cetirizine, Metoclopramide, Ondansetron, Nuvigil, Propranolol, 4PM meds. Movicol 3 sachets at 9:10pm, another 3 sachets at 10:25pm.",
    concerns: null,
    mood: "Content",
    sleep_quality: null,
    meals: null,
    activities: "Visited Dad's place (1:15pm – 4:30pm)"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-19",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Sunday",
    staff_name: "AK",
    content: "Started shift at 4:00pm. On arrival, Nicole was not at home as she had gone to visit her family. The writer waited outside in the car. Nicole returned home at approximately 4:30pm. Received handover. 4pm med was already administered. At start of shift, Nicole's BGL was high at 16.4 mmol/L and she already took insulin reported by previous SW. After coming back, Nicole went to her room and continued resting. In mean time writer cooked chicken soup for her. At 6:30pm, writer checked on Nicole and she reported at 6:00pm she had Ibuprofen, Metoclopramide and Cetirizine from community med box. Additionally she asked for Oxazepam & Panamax, and writer administered med as charted. Nicole had chicken soup following these medications. Around 7:00pm, Nicole came out in kitchen area and spent some time with writer. At 8:00pm, regular pm medication was given. At 8:30pm, Nicole had more chicken soup and continued resting. At 9:10pm, Nicole had toast with hummus. Later approximately at 10:00pm, Nicole had quick cleanup in bathroom with writer's assistance. Following this Nicole had a cup of tea and at 11:05pm Nicole took DayVigo. Afterwards, she prepared for bed. Her BGL was stable during night time, however in the morning at 4:17am Nicole's BGL was low but writer didn't hear any notification on phone and at 4:57am Nicole pressed call bell and writer provided her some fruits for sugar levels. Nicole reported being constipated.",
    bsl_reading: "16.4 mmol/L at start (insulin already taken). Low at 4:17am — no phone notification heard. Fruits given at 4:57am.",
    medication_notes: "4pm meds already administered. Ibuprofen, Metoclopramide, Cetirizine (self-administered from community med box at 6pm). Oxazepam & Panamax charted. Regular 8pm meds. DayVigo at 11:05pm.",
    concerns: "BGL low at 4:17am — phone notification not received by writer. Nicole pressed call bell at 4:57am. Constipation reported.",
    mood: "Content",
    sleep_quality: "Fair",
    meals: "Chicken soup at 6:30pm and 8:30pm. Toast with hummus at 9:10pm. Cup of tea at 10pm.",
    activities: "Visited family. Bathroom cleanup assistance. Writer cooked chicken soup."
  },

  // ── 20 April 2026 (Monday) ─────────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-04-20",
    shift: "Morning 6am-12pm",
    day_of_week: "Monday",
    staff_name: "SW",
    content: "Writer started shift at 6am. Received hand over. Nicole was stable however BGL went low around 4:15am and fruits were served at that time. Nicole called the writer by ringing room bell. Writer asked if Nicole needs something. Nicole greeted well and happily met with writer. Nicole said she would like to have lentil rice (soup), if writer can cook for her. Writer happily agreed. Nicole came out of her room and asked for PRN Cetirizine (x1) and Oxazepam (x1), along with morning med. Writer made cup of tea for Nicole. Nicole chatted about her niece, she looked happy and mentioned she met her family. Nicole looked tired and went back to her room. At 7:15am writer asked Nicole if she had her insulin as BGL is going high (13.3). Nicole said yes she just had it. Around 9:30am BGL was low, writer supplied with juice and toast (margarine) along with 2 Panamax and 2 Ibuprofen. At 11:03am BGL was high 11.0, reported to Nicole. 11:27am BGL was 16.7, writer encouraged Nicole if she can have her insulin. Writer put the insulin kit closer to Nicole. 11:50am writer scanned again (BGL 18). Nicole had insulin and went back to sleep. Meds: 6:30am PRN Cetirizine x1, Oxazepam x1, Ibuprofen x2, Panamax x2. 9:30am morning meds administered. Meal prep: Lentil & rice (soup) at Nicole's request was cooked.",
    bsl_reading: "Low at 4:15am (fruits served). 13.3 at 7:15am. Low at 9:30am (juice & fruits given). 11.0 at 11:03am. 16.7 at 11:27am. 18 at 11:50am — insulin taken.",
    medication_notes: "PRN Cetirizine x1, Oxazepam x1, Ibuprofen x2, Panamax x2 at 6:30am. Morning meds at 9:30am. Insulin self-administered.",
    concerns: "Significant BGL fluctuations throughout shift — low at 4:15am and 9:30am, then climbing to 18 by 11:50am.",
    mood: "Happy",
    sleep_quality: "Poor",
    meals: "Tea and toast with margarine. Juice and fruits. Lentil & rice soup prepared.",
    activities: "Writer cooked lentil & rice soup at Nicole's request"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-20",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Monday",
    staff_name: "AK",
    content: "Started shift at 4:00pm. On arrival Nicole was resting in her room. Received handover from previous SW. On start of shift, Nicole's BGL was 11.3 mmol/L. Regular 4pm medication administered. At 4:55pm approximately, Nicole had Oxazepam. Around 6:17pm Nicole's BGL was going up so she self-administered insulin. Following this, Nicole had lentil and rice soup. Afterwards, Nicole continued resting and using laptop. Regular 8pm medication was given. After taking meds, Nicole had a wrap with avocado, hummus and spinach. Nicole reported her mood as frustrated, exhausted and dizzy. Later around 9:10pm, Nicole prepared for shower however she experienced seizure episode in bathroom. Around 9:17pm, Nicole had Oxazepam. Approximately around 10:00pm, Nicole had 2 sachets of Movicol. At 11:17pm, Nicole changed her CGM Dexcom patch and it reconnected with the app around 12:00am. After this, Nicole rested in her bed and however she reported difficulty sleeping. Writer provided reassurance and will continue to monitor. At 4:00am, Nicole took Metoclopramide, Nausicalm and Ondansetron. Nicole was awake whole night and hasn't slept for whole night. Writer did regular checks and closely monitored her BGL regularly.",
    bsl_reading: "11.3 mmol/L at start. Rising at 6:17pm — insulin self-administered.",
    medication_notes: "Regular 4pm meds. Oxazepam at 4:55pm and 9:17pm. Regular 8pm meds. Movicol x2 sachets at 10pm. Metoclopramide, Nausicalm, Ondansetron at 4:00am.",
    concerns: "Seizure episode in bathroom at 9:10pm. Nicole reported mood as frustrated, exhausted and dizzy. Difficulty sleeping — awake whole night. Dexcom CGM patch changed at 11:17pm.",
    mood: "Upset",
    sleep_quality: "Restless",
    meals: "Lentil and rice soup. Wrap with avocado, hummus and spinach.",
    activities: "CGM Dexcom patch changed at 11:17pm"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-20",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Monday",
    staff_name: "AK",
    content: "SEIZURE INCIDENT REPORT I — 20 April 2026: Around 9:10pm, Nicole prepared for shower and she went to toilet, and washing her hands while sitting on chair when she experienced seizure episode. She became unconscious and started experiencing shakes and tremors. Writer safely assisted her to lie down on floor and supported her head with pillow. Around 9:17pm when Nicole partially recovered, writer assisted her to bed. Writer closely monitored her BGL and chest rise and fall.",
    bsl_reading: null,
    medication_notes: null,
    concerns: "SEIZURE INCIDENT: 9:10pm — Nicole became unconscious in bathroom while sitting on chair. Shakes and tremors. Assisted to floor, head supported with pillow. Partially recovered by 9:17pm, assisted to bed. Writer monitored BGL and breathing.",
    mood: null,
    sleep_quality: null,
    meals: null,
    activities: null
  },

  // ── 21 April 2026 (Tuesday) ────────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-04-21",
    shift: "Night 10pm-6am",
    day_of_week: "Tuesday",
    staff_name: "AK",
    content: "SEIZURE INCIDENT REPORT II — 21 April 2026: Approximately at 5:44am, writer checked on Nicole and found her fainted on floor. Writer assisted her to lie down properly on floor and supported her neck with pillow. Writer cleared surrounding to ensure safety. Nicole experienced shakes, tremors and jerks consistently till 5:53am and then writer supported her to bed when she partially recovered. Nil injuries reported or observed.",
    bsl_reading: null,
    medication_notes: null,
    concerns: "SEIZURE INCIDENT: 5:44am — Found Nicole fainted on floor. Shakes, tremors and jerks consistently until 5:53am (~9 minutes). Supported to bed after partial recovery. Nil injuries.",
    mood: null,
    sleep_quality: null,
    meals: null,
    activities: null
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-21",
    shift: "Morning 6am-12pm",
    day_of_week: "Tuesday",
    staff_name: "Preet Kaur",
    content: "Writer started shift at 6am, however arrived at 5:53am. Writer found SW in Nicole's room, Nicole had seizures and was in recovery mode. Writer was asked to stay out. Writer received hand over from SW that Nicole didn't sleep whole night. Nicole called writer by ringing bell and asked to cover her with blankets, as she has no energy and legs are numb. Writer supported Nicole to rest in bed and made her comfortable. Nicole asked to close the door. Nicole mentioned to cook chicken thighs, writer gave choice of chicken stir-fried (with vege). Nicole agreed. Writer prepared the meal. Writer monitored BGL throughout the shift and informed Nicole @ 11am that BGL is on higher side 12.9. Nicole said needs to wait until beeps high BGL. At the end of the shift BGL was 15.8. Writer received courier for Nicole. Goals achieved: Meds — nil administered. Meals — prep meal. BGL — monitored, nil concerns.",
    bsl_reading: "12.9 at 11am. 15.8 at end of shift.",
    medication_notes: "Nil meds administered",
    concerns: "Nicole had seizures before shift (in recovery mode). Didn't sleep whole night. No energy, legs numb. BGL trending high (12.9 → 15.8).",
    mood: "Neutral",
    sleep_quality: "Poor",
    meals: "Chicken stir-fried with vegetables prepared",
    activities: "Meal prep (chicken stir-fry with vege). Received courier."
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-21",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Tuesday",
    staff_name: "Vishali",
    content: "Started shift, Nicole was in her room. H/O received, her BGL was fluctuating throughout the morning. She had insulin, after that BGL came back to normal after 20 minutes. Folded washed clothes and settled them in her room. Prepared bathroom for shower. Around 6:30PM, Nicole had shower, she was a bit dizzy, assisted her with showering. Cleaned up bathroom afterwards. She was settled after the shower, had Khichdi as dinner. Monitored BGL throughout the night, it was normal. She slept until the end of my shift.",
    bsl_reading: "Fluctuating in morning. Normal throughout the night after insulin.",
    medication_notes: "Insulin administered (morning, by previous shift)",
    concerns: "Nicole was a bit dizzy during shower — assisted with showering.",
    mood: "Neutral",
    sleep_quality: "Good",
    meals: "Khichdi for dinner",
    activities: "Folded clothes, prepared bathroom, shower assistance, cleaned bathroom"
  },

  // ── 22 April 2026 (Wednesday) ──────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-04-22",
    shift: "Morning 6am-12pm",
    day_of_week: "Wednesday",
    staff_name: "Preet",
    content: "Writer started shift at 6am, Nicole was sleeping in her room, door closed. Received H/O that Nicole slept well last night. BGL was stable, she had shower. Nil concerns. During shift writer monitored BGL, which was stable. Writer did meal prep (fish & steamed veg). Swept the floor, fold the laundry. Nicole slept well during the shift. Nil concerns. Med — no meds administered, as Nicole was sleeping. Meal prep — Done. House chores — Done. BGL — monitored, nil concerns.",
    bsl_reading: "Stable throughout shift",
    medication_notes: "No meds administered — Nicole was sleeping",
    concerns: null,
    mood: "Neutral",
    sleep_quality: "Good",
    meals: "Meal prep: fish & steamed vegetables",
    activities: "Meal prep, swept floor, folded laundry"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-22",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Wednesday",
    staff_name: "AK",
    content: "Started shift at 4pm. On arrival Nicole was resting in her room. Received handover from previous SW who reported Nicole's BGL was high since he started. At start of shift Nicole's BGL was 14.2 mmol/L. Nicole was administered 4pm medication and continued resting. Around 7pm, Nicole had her dinner (reheated frozen meal). 8pm regular medication was given. Nicole reported her mood as teary, stressed and exhausted due to her Godfather's death. At 9:20pm, writer roasted pumpkin and chickpeas for Nicole. Following this Nicole continued resting and writer observed Nicole being tearful at times so writer provided reassurance. Around 12:00am Nicole came to kitchen and writer and Nicole had a conversation. Nicole reported that she's unable to sleep and then she went back to her bedroom. Around 1:00am, writer heard noise and went to check on her and found Nicole was sitting on floor. Writer asked Nicole about it and she informed that she went to toilet and lost her balance. Writer assisted her to bed safely and also Nicole seemed frustrated and exhausted. Writer was in her room and she burst into tears so water was provided and writer provided reassurance and support. Around 2:00pm (am), Nicole had 2 sachets of Movicol. Approximately at 2:25am, Nicole experienced seizure episode. After recovery, Nicole took quick bed bath with writer's assistance. At 3:05am, Nicole's BGL was high so she was encouraged to take insulin, however it was not going down. Around 3:28am, Nicole was required to take an additional dose of insulin as her BGL was 19.6 mmol/L and she complied. Writer closely monitored her BGL throughout the shift. Nicole hasn't slept whole night. Meds: Panamax 1000mg (2tab) 12:10am, Ibuprofen 400mg (2tabs) 12:10am, Oxazepam 30mg each 4:12pm and 12:00am, Metoclopramide 1tab (10mg) 2:45am, Ondansetron 1tab (8mg) 2:45am, Apclizine/Nausicalm 1tab (50mg) 2:45am, DayVigo 10mg (2tabs) 3:05am.",
    bsl_reading: "14.2 mmol/L at start. 19.6 mmol/L at 3:28am — additional insulin dose required.",
    medication_notes: "4pm meds. Oxazepam 30mg at 4:12pm and 12:00am. Panamax 1000mg (2tab) at 12:10am. Ibuprofen 400mg (2tabs) at 12:10am. Metoclopramide 10mg at 2:45am. Ondansetron 8mg at 2:45am. Nausicalm 50mg at 2:45am. DayVigo 10mg (2tabs) at 3:05am. Movicol x2 sachets at 2am.",
    concerns: "Nicole emotionally distressed — teary, stressed and exhausted due to Godfather's death. Found sitting on floor at 1am after losing balance going to toilet. Seizure episode at 2:25am. BGL very high at 19.6 mmol/L requiring additional insulin. Did not sleep all night.",
    mood: "Upset",
    sleep_quality: "Restless",
    meals: "Reheated frozen meal at 7pm. Roasted pumpkin and chickpeas at 9:20pm.",
    activities: "Bed bath assistance. Roasted pumpkin and chickpeas. Emotional support."
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-23",
    shift: "Night 10pm-6am",
    day_of_week: "Thursday",
    staff_name: "AK",
    content: "SEIZURE INCIDENT REPORT — 23 April 2026 (overnight from 22nd): Writer was in her bedroom as Nicole was tearful and stressed because of her Godfather's death. Around 2:25am, Nicole rolled her eyes and experienced shakes, tremors and jerks. Writer quickly cleared her surroundings to ensure her safety and also writer supported her neck with pillow. Nicole experienced consistent shakes and tremors until 2:35am while she was in her bed. Writer gave her some water when she partially recovered. Till 2:37am Nicole was fully recovered. Writer closely monitored her breathing during the episode.",
    bsl_reading: null,
    medication_notes: null,
    concerns: "SEIZURE INCIDENT: 2:25am — Nicole rolled eyes, experienced shakes, tremors and jerks until 2:35am (~10 minutes). In bed. Supported neck with pillow, surroundings cleared. Fully recovered by 2:37am. Emotionally distressed due to Godfather's death.",
    mood: "Upset",
    sleep_quality: null,
    meals: null,
    activities: null
  },

  // ── 23 April 2026 (Thursday) ───────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-04-23",
    shift: "Morning 6am-12pm",
    day_of_week: "Thursday",
    staff_name: "SW",
    content: "Writer started shift at 6am, received H/O that Nicole did not sleep whole night. She is stressed and low in mood due to her Godfather's passing. However dietary intake was good. Writer monitored BGL throughout the shift, which was settled. Writer cooked meal — lentil & rice soup and fish curry. Nil concerns. Meds — no meds administered. House chores — Done. Meal — Done. BGL — monitored, nil concerns.",
    bsl_reading: "Settled throughout shift",
    medication_notes: "No meds administered",
    concerns: "Nicole stressed and low in mood due to Godfather's passing. Did not sleep whole night.",
    mood: "Upset",
    sleep_quality: "Poor",
    meals: "Lentil & rice soup and fish curry prepared",
    activities: "Meal prep (lentil & rice soup, fish curry), house chores"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-23",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Thursday",
    staff_name: "Vishali",
    content: "Started shift, Nicole was in her room. H/O received, she BGL was stable. Administered 4PM meds and Oxazepam as requested. Swept floor, wiped kitchen benches, settled utensils. Around 5:30PM, heated up food for Nicole. BGL got high @ 7:00PM, she took insulin. Around 8:30PM, it became normal. Did the dishes. Administered night meds and PRNs as requested. Around 10:00PM, Nicole had shower, assisted her with setting up and cleanup afterwards. She requested an Oxazepam. Put the towels to wash in the machine. Gave 2 DayVigo around 11:00PM as requested. Monitored BGL throughout the night, it remained stable. H/O given to next staff. Nil concerns reportable.",
    bsl_reading: "Stable at start. High at 7pm — insulin taken, normal by 8:30pm. Stable overnight.",
    medication_notes: "4pm meds, Oxazepam, night meds, PRNs, Oxazepam (after shower), DayVigo x2 at 11pm",
    concerns: null,
    mood: "Neutral",
    sleep_quality: "Fair",
    meals: "Heated up food at 5:30pm",
    activities: "Swept floor, wiped kitchen benches, settled utensils, dishes, shower assistance, laundry"
  },

  // ── 24 April 2026 (Friday) ─────────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-04-24",
    shift: "Morning 6am-12pm",
    day_of_week: "Friday",
    staff_name: "Preet",
    content: "Writer started shift at 6am, received H/O that Nicole had good sleep and shower. At 7:30am Nicole came out, made herself tea. Writer asked how is she feeling. Nicole said tired. Nicole went back to her room. Writer asked if she would like to have morning meds, Nicole said not now, she needs rest. Nicole remained in her room. Writer prepared meal — chicken soup & chicken stuffing for sandwiches. Laundry was dried & folded. Nil concerns. Morning: Med — asked but wanted to take later. Meals — chicken soup, chicken stuffing for sandwiches. Laundry — folded.",
    bsl_reading: null,
    medication_notes: "Morning meds offered but Nicole declined — wanted to take later",
    concerns: null,
    mood: "Neutral",
    sleep_quality: "Good",
    meals: "Tea at 7:30am. Chicken soup & chicken stuffing for sandwiches prepared.",
    activities: "Meal prep (chicken soup, chicken stuffing), laundry dried & folded"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-24",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Friday",
    staff_name: "AK",
    content: "Writer commenced shift at 4:00pm. On arrival Nicole was taking shower with assistance of SW on previous shift and suddenly she experienced seizure — due to which she was lying on floor. Previous SW assisted her with seizure episode until 4:13pm. Received handover and nil concerns reported. Regular 4pm meds administered by writer. After her recovery, writer assisted her in dressing up and settled down in her bed. Around 4:42pm, Nicole had Ondansetron. Prior to this around 4:36pm, Nicole had another seizure episode. Following the seizure episode, Nicole had Khichdi as a meal that already prepared and writer reheated for her. Afterwards, she continued using her laptop. Around 5:10pm, Nicole's BGL was low at 5.4 mmol/L so writer provided her some fruits and writer closely monitored her sugar levels. Around 5:14pm her sugars came back into normal range. Around 6:30pm, Nicole had Oxazepam. Afterwards, writer roasted pumpkin for her and she ate pumpkin around 7:12pm. Later approximately at 7:30pm writer gave her massage and her regular 8pm medication was given. Additionally, at 7:25pm Nicole was given Panamax, Ibuprofen, Cetirizine and Metoclopramide. Nicole reported that she's dizzy and was in pain. Around 10:30pm, Nicole requested for a cup of tea which was provided. Later approximately at 11:25pm, Nicole took 2 tablets of DayVigo and prepared for bed. Around 11:45pm, Nicole took her regular dose of long-acting insulin. Nicole was nauseous and vomiting during the shift, so she took Gaviscon around 11:40pm. Around 1:30am, Nicole's BGL was low at 5.4 mmol/L, so writer woke her up and provided her with fruits; however her sugars were still same not increasing and writer encouraged her to eat some more fruits. She agreed then writer provided her some fruits around 2:00am. Writer continued monitoring her BGLs. Nicole slept well during night. Nil issues reported or observed. Nicole was sleeping till end of my shift.",
    bsl_reading: "5.4 mmol/L at 5:10pm (low, fruits given — normalised by 5:14pm). 5.4 mmol/L at 1:30am (low, fruits given at 2am). Long-acting insulin at 11:45pm.",
    medication_notes: "Regular 4pm meds. Ondansetron at 4:42pm. Oxazepam at 6:30pm. Panamax, Ibuprofen, Cetirizine, Metoclopramide at 7:25pm. Regular 8pm meds. DayVigo x2 at 11:25pm. Long-acting insulin at 11:45pm. Gaviscon at 11:40pm.",
    concerns: "Two seizure episodes — first during shower (recovered by 4:13pm), second at 4:36pm. BGL low twice (5.4 mmol/L at 5:10pm and 1:30am). Nauseous and vomiting. Dizzy and in pain.",
    mood: "Upset",
    sleep_quality: "Good",
    meals: "Khichdi (reheated). Fruits. Roasted pumpkin at 7:12pm. Cup of tea at 10:30pm.",
    activities: "Massage. Roasted pumpkin. Shower assistance (by previous SW)."
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-24",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Friday",
    staff_name: "AK",
    content: "SEIZURE INCIDENT REPORT — 24 April 2026 (Friday): Around 4:36pm, Nicole was lying down on bed and writer was cleaning her bathroom. She rolled her eyes and became unconscious. After one minute, she started experiencing shakes, tremors and jerks. Writer cleared surrounding for safety and removed wedge under her neck. Writer put pillow under head to support her neck. She consistently experienced shakes and tremors. She was unconscious and writer monitored her breathing by looking at chest rise and fall. While she was experiencing seizure she became conscious and requested Ondansetron which was given along with water. Approximately at 4:47pm, she recovered from her seizure episode and continued resting.",
    bsl_reading: null,
    medication_notes: "Ondansetron administered during seizure (when she became briefly conscious)",
    concerns: "SEIZURE INCIDENT: 4:36pm — Lying in bed, rolled eyes, became unconscious. Shakes, tremors and jerks. Pillow under head, surroundings cleared. Became conscious during episode and requested Ondansetron. Recovered by 4:47pm (~11 minutes).",
    mood: null,
    sleep_quality: null,
    meals: null,
    activities: null
  },

  // ── 25 April 2026 (Saturday) ───────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-04-25",
    shift: "Morning 6am-12pm",
    day_of_week: "Saturday",
    staff_name: "Vishali",
    content: "When started shift, Nicole was asleep. H/O received. Swept floor, settled the kitchen. She woke up around 8:30AM, served her with toast and tea. Gave PRNs as requested. She wanted to go sleep again, sorted her clothes in wardrobe, she goes back to sleep. I did the dishes, cleaned kitchen bench. Till the end of my shift, she remained asleep as she was tired in the morning as observed. Nil concerns reportable. H/O passed.",
    bsl_reading: null,
    medication_notes: "PRNs administered as requested",
    concerns: null,
    mood: "Neutral",
    sleep_quality: "Fair",
    meals: "Toast and tea at 8:30am",
    activities: "Swept floor, settled kitchen, sorted clothes in wardrobe, dishes, cleaned kitchen bench"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-25",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Saturday",
    staff_name: "AK",
    content: "Started shift at 4:00pm. On arrival Nicole just had a shower and was in her room. Received handover from previous SW who reported nil concerns. Writer administered her regular 4pm medication and assisted her in dressing up after shower. Later, writer cleaned her shower. At start of shift Nicole's BGL was high and writer asked about insulin, she reported that she already taken her insulin. Writer closely monitored her BGL and her BGL started dropping within normal range around 4:40pm. Following this, writer and Nicole watched some videos on her laptop. Afterwards around 5:55pm, Nicole took Oxazepam and continued watching her laptop. In meantime, writer prepared Khichdi for her. Around 6:30pm, Nicole ate Khichdi and chicken soup. Regular 8pm medication was administered. Approximately around 8:30pm, Nicole's BGL was 5.5 mmol/L, writer encouraged her to eat some fruits and she did. It came back within normal parameters around 9:00pm. Writer swept and mop the floor, did laundry, dishes and did some dusting while Nicole was resting. Approximately at 10:00pm, Nicole had a cup of tea which was prepared by writer. At 10:55pm, Nicole took another tablet of Oxazepam and also she took 4 units of long-acting insulin (Levemir). At 11:40pm Nicole took Metoclopramide. At 12:00am Nicole took Panamax, Ibuprofen, Cetirizine and DayVigo. After taking meds, Nicole reported feeling hungry so writer cut some fruits for her and following this, she prepared for bed. Around 4:25am, Nicole's BGL was low at 5.4 mmol/L and writer gave her juice and some fruits to help her with BGL. Writer closely monitored her BGL. Nil concerns reported or observed. At the end of shift Nicole was awake and also around 5:00am Nicole had a cup of tea and toast prepared by writer. After this she went to her room. Nil issues reported.",
    bsl_reading: "High at start — insulin already taken, normalised by 4:40pm. 5.5 mmol/L at 8:30pm (low, fruits given — normal by 9pm). 5.4 mmol/L at 4:25am (low, juice and fruits given).",
    medication_notes: "Regular 4pm meds. Oxazepam at 5:55pm and 10:55pm. Khichdi. Regular 8pm meds. Levemir 4 units (long-acting insulin) at 10:55pm. Metoclopramide at 11:40pm. Panamax, Ibuprofen, Cetirizine, DayVigo at 12am.",
    concerns: "BGL dropped to 5.5 at 8:30pm and 5.4 at 4:25am — fruits and juice provided both times.",
    mood: "Neutral",
    sleep_quality: "Fair",
    meals: "Khichdi and chicken soup at 6:30pm. Fruits at 8:30pm. Tea at 10pm. Fruits before bed. Tea and toast at 5am.",
    activities: "Shower assistance/cleanup, watched videos with Nicole, swept/mopped floor, laundry, dishes, dusting"
  },

  // ── 26 April 2026 (Sunday) ─────────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-04-26",
    shift: "Morning 6am-12pm",
    day_of_week: "Sunday",
    staff_name: "SW",
    content: "Started shift at 6AM, Nicole was up already. H/O received. Gave morning tea to Nicole. Swept floor and did dishes. Washed laundry. Administered morning meds with PRNs as requested. BGL remained stable throughout my shift. Nicole went back to sleep around 8:00am. Finished shift with nil concerns reportable.",
    bsl_reading: "Stable throughout shift",
    medication_notes: "Morning meds with PRNs administered as requested",
    concerns: null,
    mood: "Neutral",
    sleep_quality: "Fair",
    meals: "Morning tea",
    activities: "Swept floor, dishes, washed laundry"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-26",
    shift: "Afternoon 4pm-8pm",
    day_of_week: "Sunday",
    staff_name: "SW",
    content: "I started shift at 4:00. Nicole administered scheduled medication as per care plan. 5:00PM — Nicole's blood glucose level recorded as low. Provided juice. Condition monitored. 6:06PM — Nicole experienced a seizure episode lasting approximately 10 minutes. Post episode — administered prescribed medications: Metoclopramide (WGR), Ondansetron ODT (WGR). 6:35PM — Nicole had dinner. 8:01 — Nicole took 8pm medication as per care plan.",
    bsl_reading: "Low at 5pm — juice provided",
    medication_notes: "4pm scheduled meds. Metoclopramide (WGR) and Ondansetron ODT (WGR) post-seizure. 8pm meds as per care plan.",
    concerns: "Seizure episode at 6:06pm lasting approximately 10 minutes. BGL low at 5pm.",
    mood: "Neutral",
    sleep_quality: null,
    meals: "Juice at 5pm. Dinner at 6:35pm.",
    activities: null
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-26",
    shift: "Sleepover 8pm-6am",
    day_of_week: "Sunday",
    staff_name: "Vishali",
    content: "Started shift, Nicole was in her room. H/O received. Made egg and avocado toast with tea for her. Did the laundry. We sat for a while in the lounge area. Around 10:00pm, she wanted to have shower but after she went to the toilet, the BGL was dropped and she was very dizzy. So we waited till the BGL stabilise, gave her apple juice. She had shower around 11:30PM, assisted her in the shower and she went back to bed. Heated up food for her. Administered PRNs as requested. Around 12:40AM, I came to the room for sleepover. But around 1:30am, her BGL started to drop, gave her toast with juice. It was constantly dropping until 3:00AM. Again she had some juice, it came stable around 4AM. Then she slept till 6AM. Finished shift. H/O given to next staff.",
    bsl_reading: "Dropped at 10pm (dizzy, waited to stabilise, apple juice given). Dropping from 1:30am to 3am — toast and juice provided. Stable by 4am.",
    medication_notes: "PRNs administered as requested",
    concerns: "BGL dropping significantly from 10pm. Dizzy at 10pm — shower delayed. BGL continued dropping 1:30am–3am requiring multiple interventions (juice, toast).",
    mood: "Neutral",
    sleep_quality: "Poor",
    meals: "Egg and avocado toast with tea. Food heated up. Toast with juice at 1:30am.",
    activities: "Laundry, sat together in lounge, shower assistance"
  },

  // ── 27 April 2026 (Monday) ─────────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-04-27",
    shift: "Morning 6am-12pm",
    day_of_week: "Monday",
    staff_name: "Sukh",
    content: "Shift started at 6am. Upon arrival, Nichole was asleep in bed. Observation were completed and her BGL was within the normal range. At 9:17am, her BGL was observed to be decreasing, recorded at 5.3. I attended Nichole's room and informed her of the reading. Nichole requested juice which was provided. After consuming the juice, her BGL returned to within the normal range. Completed household tasks including folding clothes and leaving them in the laundry area. Washed and dried the towels. Swept the floor and tidied the kitchen area. She awoke at 11:00am. She took her morning med (main) including PRN Propranolol and Armodafinil, as requested. She then asked for toasted bread with avocado, which was prepared and provided. Shift over.",
    bsl_reading: "Normal at start. 5.3 at 9:17am (low — juice provided, returned to normal).",
    medication_notes: "Morning meds including PRN Propranolol and Armodafinil at 11am",
    concerns: "BGL dropped to 5.3 at 9:17am — juice provided, stabilised.",
    mood: "Neutral",
    sleep_quality: "Good",
    meals: "Juice at 9:17am. Toasted bread with avocado at 11am.",
    activities: "Folded clothes, washed/dried towels, swept floor, tidied kitchen"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-27",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Monday",
    staff_name: "AK",
    content: "Writer started shift at 4:00pm. On arrival, Nicole was in her bedroom resting. Received handover from previous SW who reported Nicole being exhausted and tired throughout the day. Regular 4pm medication was administered. At the start of shift, Nicole's BGL was 11.1 mmol/L. Nicole continued resting and using her laptop in her room. Later, at 17:05, Nicole took Oxazepam, Apclizine, Ondansetron and Metoclopramide. Nicole was observed tired and exhausted during the shift. Writer roasted some vegetables and prepared salad for her while she was resting. Approximately around 19:30, Nicole ate some vegetables and salad. Regular 8pm med was given as charted. Following this, writer and Nicole watched some videos on her laptop. At 21:05, Nicole took Panamax and Ibuprofen as she reported headache. Writer gave her head massage and afterwards she continued resting. Later at night, around 22:05 Nicole took another tablet of Oxazepam. Writer continued monitoring her. Around 22:30, Nicole had a cup of tea prepared by writer. At 23:30, Nicole had a bed bath with writer's assistance. During the bed bath, Nicole experienced some shakes and tremors, and she was conscious. Nicole was expressing some suicidal thoughts; however, no intent to do and it was passive thoughts. Around 12:15am, Nicole had severe pain so she took Aspirin along with fruits. Writer spent some time with her and around 12:40am, Nicole took 2 tabs of DayVigo. Following this, she prepared for bed. Nicole slept around 1:00am, writer continued monitoring. However, around 3:29am, Nicole's BGL was low and after 7 minutes it settled within normal range.",
    bsl_reading: "11.1 mmol/L at start. Low at 3:29am — settled within normal range after 7 minutes.",
    medication_notes: "Regular 4pm meds. Oxazepam, Apclizine, Ondansetron, Metoclopramide at 5:05pm. Regular 8pm meds. Panamax, Ibuprofen at 9:05pm. Oxazepam at 10:05pm. DayVigo x2 at 12:40am. Aspirin at 12:15am.",
    concerns: "Nicole expressing passive suicidal thoughts during bed bath — no intent, passive only. Writer provided support. Shakes and tremors during bed bath (conscious). Headache. Severe pain at 12:15am. BGL low at 3:29am. Exhausted and tired throughout.",
    mood: "Upset",
    sleep_quality: "Fair",
    meals: "Roasted vegetables and salad at 7:30pm. Tea at 10:30pm. Fruits at 12:15am.",
    activities: "Roasted vegetables, prepared salad, head massage, bed bath assistance, watched videos together, emotional support"
  },

  // ── 28 April 2026 (Tuesday) ────────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-04-28",
    shift: "Morning 6am-12pm",
    day_of_week: "Tuesday",
    staff_name: "Preet",
    content: "Writer started the shift at 6am. Received H/O that Nicole slept at 1am this morning. She was stressed and low. SW mentioned Nicole had bed bath. At 7am writer saw low BGL indication 4.6, writer offered juice to Nicole, which she had. Juice was half in juice box. Nicole came out of her room and said she ran out of juice, and started looking for glucose. Nicole had glucose and toast with margarine and Vegemite. After went back to her room, said she would like to sleep. Nicole mentioned she doesn't need any cooking today. Around 8:30am BGL indicated high 15.6, writer went to Nicole. Nicole said she already had insulin. After that writer kept monitoring and BGL started dropping. Writer dried laundry, fold it and hang on hanger. Nil concerns.",
    bsl_reading: "4.6 at 7am (low — juice, glucose, toast given). 15.6 at 8:30am (high — insulin already taken, BGL started dropping).",
    medication_notes: "Insulin self-administered",
    concerns: "BGL low at 4.6 at 7am. BGL high at 15.6 at 8:30am. Nicole stressed and low mood.",
    mood: "Upset",
    sleep_quality: "Poor",
    meals: "Juice, glucose, toast with margarine and Vegemite",
    activities: "Dried laundry, folded, hung on hangers"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-28",
    shift: "Afternoon 4pm-8pm",
    day_of_week: "Tuesday",
    staff_name: "Vishali",
    content: "When started shift, Nicole was in lounge room. H/O received. BGL was fluctuating. Made her avocado toast with tea. Administered 4PM meds, folded washed clothes, sorted dishes. Around 5:30PM, made her another tea. We watched Netflix for a while. Then she had 8PM meds. She went to shower after meds, assisted her throughout the shower, cleaned up afterwards. Heated up food for dinner, she had some fruits afterwards. Nicole sat in lounge room till 10:30PM, then she went to her room. Administered 2 DayVigo as requested. Her BGL was high, she took insulin, after quite while it came back stable. Washed the laundry and put them to dry. Monitored BGL throughout the night, it remained stable. She slept throughout the night, nil concerns reportable.",
    bsl_reading: "Fluctuating. High later — insulin taken, stabilised.",
    medication_notes: "4pm meds. 8pm meds. DayVigo x2. Insulin self-administered.",
    concerns: null,
    mood: "Neutral",
    sleep_quality: "Good",
    meals: "Avocado toast with tea. Tea at 5:30pm. Dinner (heated up). Fruits.",
    activities: "Folded clothes, sorted dishes, Netflix, shower assistance, laundry"
  },

  // ── 29 April 2026 (Wednesday) ──────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-04-29",
    shift: "Morning 6am-12pm",
    day_of_week: "Wednesday",
    staff_name: "Preet",
    content: "Writer started shift at 6am, received H/O that Nicole had shower and had good sleep. BGL was stable. Nil concerns. At 6am Nicole was sleeping in her room. At 7am BGL level indicated low, writer offered juice. Nicole had it and went back to sleep. At 8:45am, Nicole requested Panamax x2, Ibuprofen x2, Oxazepam x1 — which was administered. Medication — PRN administered, recorded in med sheet. House chores — general chores done. Meal prep — asked not to cook. General wellbeing — stable. BGL — low @ 7am — after maintained. No alert till 12PM.",
    bsl_reading: "Low at 7am — juice provided, maintained after. No alerts till 12pm.",
    medication_notes: "PRN: Panamax x2, Ibuprofen x2, Oxazepam x1 at 8:45am",
    concerns: "BGL low at 7am — juice provided.",
    mood: "Neutral",
    sleep_quality: "Good",
    meals: "Juice at 7am. Asked not to cook.",
    activities: "General house chores"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-29",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Wednesday",
    staff_name: "SW",
    content: "Started shift, Nicole was in her room. Offered her tea but she denied as she was very tired and wanted to rest. The BGL was normal. Heated up food around 7:00PM for dinner. Had some tea with it. Folded washed laundry. Nicole had some fruit around 8:30PM. Administered her 8pm/night meds with PRNs as requested. She didn't have shower yesterday because she was very tired. Moreover, she had yogurt and fruit to eat. Monitored BGL. She had 2 DayVigo before bed, it remained stable. Around 5:30AM, her BGL got high (15.3), she had insulin. Administered Ondansetron WGR as requested by her. Finished shift with nil concerns. H/O given to next staff.",
    bsl_reading: "Normal at start. 15.3 at 5:30am (high — insulin taken).",
    medication_notes: "8pm/night meds with PRNs. DayVigo x2 before bed. Insulin at 5:30am. Ondansetron WGR.",
    concerns: "BGL high at 15.3 at 5:30am. Nicole very tired — declined shower.",
    mood: "Neutral",
    sleep_quality: "Fair",
    meals: "Dinner (heated up) with tea at 7pm. Fruit at 8:30pm. Yogurt and fruit.",
    activities: "Folded washed laundry"
  },

  // ── 30 April 2026 (Thursday) ───────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-04-30",
    shift: "Morning 6am-12pm",
    day_of_week: "Thursday",
    staff_name: "Sukh",
    content: "At the start of the shift, Nichole was awake. Her BGL was elevated at 16.5. Between 6am and 7am, her BGL remained high. Nichole was informed, and she self-administered insulin as prescribed. She also requested and was provided with PRN medications including Oxazepam and Paracetamol along with her regular morning med. Nichole then requested tea, which was provided. Following this, her BGL began to decrease and started to return to the normal range. At 7:30am, Nichole returned to sleep. Dry towels were folded and left in the laundry area. Clothes were hung on hangers. Previous utensils were cleaned and washed. The kitchen area was tidied, and the floor was swept. At 11:30 she took medications (Nuvigil and Propranolol) and had fried eggs with toasted bread.",
    bsl_reading: "16.5 at start (elevated). Remained high 6-7am. Insulin self-administered. BGL decreasing towards normal after insulin.",
    medication_notes: "PRN Oxazepam, Paracetamol, regular morning meds. Insulin self-administered. Nuvigil and Propranolol at 11:30am.",
    concerns: "BGL elevated at 16.5 from 6-7am.",
    mood: "Neutral",
    sleep_quality: "Fair",
    meals: "Tea. Fried eggs with toasted bread at 11:30am.",
    activities: "Folded towels, hung clothes on hangers, cleaned utensils, tidied kitchen, swept floor"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-04-30",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Thursday",
    staff_name: "Vishali",
    content: "Started shift, Nicole was in lounge room. H/O received. Monitored BGL, it was stable but was fluctuating before as got H/O. Nicole was stressed and tired because of things disappearing from the house. She started to put most of the things in the room, but she wasn't settled still late 2AM. Assisted her with sorting things, laundry. Heated up food for dinner. BGL was low (4.9) around 2AM, gave banana and juice to stable the BGL, which worked. She had a rough night because of stress. She was up @ 5:55, gave morning meds. INCIDENT REPORT — Reported by Vishali, Timing 6:20PM: Nicole was tired and exhausted mentally because of few reasons. She was settling things in her room. Around 6:05PM, she sat on the floor because she was dizzy. After few minutes, the seizure started. Given towel under her head. Monitored her in the situation. The seizure was finished @ 6:29. She asked for an Oxazepam, which was administered. Later, she got up to bed and laid down for a while. After some while, she became conscious.",
    bsl_reading: "Stable at start (was fluctuating before). 4.9 at 2am (low — banana and juice given).",
    medication_notes: "Morning meds at 5:55am. Oxazepam after seizure.",
    concerns: "SEIZURE INCIDENT: 6:05-6:29pm (~24 minutes) — Nicole sat on floor due to dizziness, seizure started. Towel under head, monitored. Oxazepam administered after recovery. Nicole stressed about items disappearing from house. Unsettled until 2am. BGL low at 4.9 at 2am.",
    mood: "Anxious",
    sleep_quality: "Poor",
    meals: "Dinner (heated up). Banana and juice at 2am.",
    activities: "Assisted with sorting things, laundry"
  },

  // ── 1 May 2026 (Friday) ────────────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-05-01",
    shift: "Morning 6am-12pm",
    day_of_week: "Friday",
    staff_name: "Preet",
    content: "Writer started shift at 6am. Received H/O that Nicole did not sleep whole night. She was stressed. SW was giving morning med and PRN to Nicole on Nicole's request, before finishing her (SW's) shift. SW mentioned Nicole had seizures, which has been noted. Writer kept monitoring BGL. However around 7am, Nicole came out, head phones on her head, looked tired, no eye contact — writer said good morning, but there was no response. Nicole took a bar and went back to her room. Writer checked BGL which was low, however there was no notification or alert message. Writer checked the phone, ring was on, volume was high. Writer put the message in team group, to check if anyone else has experienced the same to identify the issue — no reply yet. Writer started sweeping the floor and realised Nicole has put door stopper under the door. In this situation, writer realises that if in case of emergency, writer will not be able to open the door. Writer will hand over to Harry. At the same time while sweeping the floor at 8:38, writer heard the Nicole was shaking insulin pen, as BGL was rising to 8:33am 14.3. By 8:52am it started dropping and noted 12.3, by 9:14am it started dropping and noted 9.6. At 9:50am, Nicole came out and had Oxazepam x1, Nuvigil x1. Nicole shared in past someone stole her laptop. Nicole picked utensils from kitchen and takes to her room. Nicole asked the writer, she expecting canvas from Amazon, take that and keep outside. She wants to spend time with herself. Writer agreed. Nicole went back to her room. Nicole got notification of parcel on her phone, she collected it. Engaged well, however did not sleep at all from last night. Nicole looked drowsy and tired. Nil concerns. Medication — Oxazepam x1, Nuvigil x1. No food intake except bar.",
    bsl_reading: "Low at 7am (no notification/alert on phone). Rising to 14.3 at 8:33am. 12.3 at 8:52am. 9.6 at 9:14am.",
    medication_notes: "Morning meds and PRN (by previous SW). Oxazepam x1, Nuvigil x1 at 9:50am. Insulin self-administered.",
    concerns: "Nicole put door stopper under bedroom door — emergency access concern (handed over to Harry). BGL notification/alert system not working on phone. Nicole did not sleep all night. Nicole stressed — reported past theft of laptop, taking utensils to room. No food intake except bar.",
    mood: "Anxious",
    sleep_quality: "Poor",
    meals: "Bar only — no other food intake",
    activities: "Swept floor. Collected parcel for Nicole."
  },
  {
    participant_name: "Nicole",
    note_date: "2026-05-01",
    shift: "Afternoon 12pm-4pm",
    day_of_week: "Friday",
    staff_name: "Sukh",
    content: "Shift started at 12:00pm. Upon arrival, Nichole was awake. Morning staff reported that she did not sleep throughout the night. Her BGL was within normal range. At 1:30pm she called for assistance and reported feeling upset and tired. Nichole requested PRN med (Metoclopramide and Oxazepam). Records indicated Oxazepam had already been administered at 9:50am; therefore it was not administered again. Metoclopramide PRN was administered as requested. Nichole was provided with fruit (2 kiwis and 1 banana), which she consumed. At 3pm she requested a Pepsi Max, which was provided. At 3:15pm, Nichole requested Cetirizine and Oxazepam PRN med. Household tasks completed included sweeping and mopping the floor and washing clothes. At 3:30pm, Nichole came out of her room, took Pepsi Max, and returned to her room. While in her wheelchair she experienced a seizure at 3:30pm. She returned to her normal state shortly after. INCIDENT REPORT: At 3:30pm, Nichole came out of her room, took Pepsi Max, and returned to her room. While in her wheelchair, she experienced a seizure and dropped the Pepsi Max bottle onto the floor. I immediately attended to Nichole and assisted her safely into bed, placing a pillow under her head. The seizure lasted for a few minutes, after she returned to her normal state. Nichole appeared tired, possibly due to stress and lack of sleep.",
    bsl_reading: "Within normal range",
    medication_notes: "Metoclopramide PRN (Oxazepam not given — already administered at 9:50am). Cetirizine and Oxazepam PRN at 3:15pm.",
    concerns: "SEIZURE INCIDENT: 3:30pm — Seizure in wheelchair, dropped Pepsi Max. Assisted to bed, pillow under head. Lasted a few minutes. Tired due to stress and lack of sleep. Did not sleep all night.",
    mood: "Upset",
    sleep_quality: "Poor",
    meals: "Fruit (2 kiwis, 1 banana). Pepsi Max.",
    activities: "Sweeping, mopping floor, washing clothes"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-05-01",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Friday",
    staff_name: "AK",
    content: "Started at 4:00pm. On arrival, Nicole was in her room recovered from seizure episode. Received handover from previous SW who reported Nicole being tired and sleep deprived. Regular medication (4:00pm) was administered. After that, Nicole continued resting and using her laptop. Writer roasted some vegetables and prepared egg toast for Nicole for dinner. Regular 8pm medication was administered. Later, around 8:40pm, Nicole took Oxazepam, Panamax and Ibuprofen as she reported pain in her body. Following this, writer assisted Nicole with bed bath and prepared a cup of tea for Nicole. Nicole reported sore throat and tired. Writer gave her massage as Nicole had pain in her muscle. Around 12:30am, Nicole took DayVigo and prepared for bed. Approximately 12:40am, Nicole's BGL was at 16.4 mmol/L, so writer changed needle of insulin pen, primed it and drew up 2.5 units of insulin. Then Nicole self-administered insulin under supervision and go back to bed. BGL was stable during night. Nicole slept well. She was noticeably tired and stated pain 8/10 (severe pain). Nil concerns reported. Nicole was sleeping till end of my shift. No seizure episode during the shift.",
    bsl_reading: "16.4 mmol/L at 12:40am — insulin 2.5 units administered. Stable during night.",
    medication_notes: "Regular 4pm meds. Regular 8pm meds. Oxazepam, Panamax, Ibuprofen at 8:40pm. DayVigo at 12:30am. Insulin 2.5 units at 12:40am (writer prepared pen, Nicole self-administered).",
    concerns: "Pain 8/10 (severe). Sore throat. Body pain — massage given. Sleep deprived. BGL 16.4 at 12:40am.",
    mood: "Upset",
    sleep_quality: "Good",
    meals: "Roasted vegetables and egg toast for dinner. Cup of tea.",
    activities: "Bed bath assistance, massage, roasted vegetables, prepared egg toast"
  },

  // ── 2 May 2026 (Saturday) ──────────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-05-02",
    shift: "Morning 6am-12pm",
    day_of_week: "Saturday",
    staff_name: "Sukh",
    content: "Shift started at 6am. On arrival, Nichole was asleep. BGL was within normal range. At 11:30am, her BGL was elevated at 15.4. Insulin was administered as requested. She also requested and was given her morning medications along with PRN Propranolol. At 11:48am, she requested Nuvigil, which was provided. At 12:15pm, she requested food and was provided fried egg with 2 slices of bread and butter. At 12:30pm, her BGL began returning to the normal range. Dried the towels and hung them on hangers. Swept the floor. At 2:14pm she came out of her room and requested Nuvigil, which was provided. She then had roasted pumpkin and chickpeas along with Pepsi Max. INCIDENT REPORT: At 3pm, she reported feeling that a seizure was imminent and informed me. She requested PRN medication, and Oxazepam and Metoclopramide were administered as per request. She subsequently experienced a seizure lasting 20 minutes. She was monitored throughout the episode and supported as required.",
    bsl_reading: "Normal at start. 15.4 at 11:30am (elevated — insulin administered). Returning to normal by 12:30pm.",
    medication_notes: "Morning meds with PRN Propranolol. Insulin. Nuvigil at 11:48am and 2:14pm. Oxazepam and Metoclopramide at 3pm (pre-seizure).",
    concerns: "SEIZURE INCIDENT: 3pm — Nicole reported feeling seizure was imminent. PRN meds given. Seizure lasted 20 minutes. Monitored and supported. BGL elevated to 15.4 at 11:30am.",
    mood: "Neutral",
    sleep_quality: "Good",
    meals: "Fried egg with 2 slices bread and butter at 12:15pm. Roasted pumpkin and chickpeas with Pepsi Max at 2:14pm.",
    activities: "Dried towels, hung on hangers, swept floor"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-05-02",
    shift: "Afternoon 4pm-8pm",
    day_of_week: "Saturday",
    staff_name: "SW",
    content: "At the commencement of my shift at 4:00PM, I administered Nicole's scheduled 4:00PM medication as per the medication chart. At approximately 5:00PM, Nicole requested half a tablet of Propranolol (WGR) which was provided as per her request and medication guidelines. At 5:15 Nicole consumed fruit. At 7:00PM, I prepared and cooked dinner for Nicole. At approximately 7:06PM, Nicole requested Oxazepam (WGR), which was administered as per the prescribed instructions. At 7:30PM — Nicole had dinner. At 8:00PM — Nicole took her medication as per the medication chart.",
    bsl_reading: null,
    medication_notes: "4pm scheduled meds. Propranolol ½ tab (WGR) at 5pm. Oxazepam (WGR) at 7:06pm. 8pm meds.",
    concerns: null,
    mood: "Neutral",
    sleep_quality: null,
    meals: "Fruit at 5:15pm. Dinner at 7:30pm.",
    activities: "Prepared and cooked dinner"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-05-02",
    shift: "Sleepover 8pm-6am",
    day_of_week: "Saturday",
    staff_name: "AK",
    content: "Started shift at 8:00pm. On arrival, Nicole was watching TV in sitting area. Received handover from previous SW who reported pm medication was already administered. Writer spent some time with Nicole in sitting area and later assisted her in organising her stuff. After this, Nicole reported feeling tired and dizzy and writer encouraged her to rest which she complied. Around 11:25pm, Nicole's BGL was high at 15.4 mmol/L. Writer requested Nicole to take NovoRapid and she took insulin. Before that, around 11:00pm, Nicole took Levemir (long-acting insulin) and had a cup of tea. Following this, Nicole continued resting and using her laptop. Approximately at 12:25pm (am), Nicole experienced seizure episode. After recovery, Nicole had a shower around 1:00am with writer's assistance. However, at 12:40pm (am) Nicole took Oxazepam. Also, at 10:55pm, Nicole was administered Panamax, Metoclopramide and Aspirin as she reported severe headache. Later at 1:28am Nicole's BGL was low at 5.3 mmol/L so writer provided her some fruits and it returned to normal range after 10 minutes. Additionally, Nicole took 2 sachets of Movicol because she reported feeling bloated. At 2:40am Nicole took 1 tab of DayVigo and brushed her teeth. At 3:10am Nicole took another tablet of DayVigo and prepared for bed. In the morning, around 7:30am, Nicole called writer and reported feeling dizzy. Nicole asked her BGL and it was 6.5 mmol/L. Nicole then checked manually by pricking finger and it was 6.5 mmol/L. Writer asked if needs anything then Nicole requested banana which was provided. Following this, Nicole went back to sleep. Nil concerns. Writer closely monitored Nicole's BGL throughout the shift. SEIZURE INCIDENT REPORT: Around 12:25am, Nicole went to toilet and writer was in kitchen area. After, writer went to her room to check on her and Nicole was sitting on floor. Writer immediately got pillow and towel to support her neck. Writer assisted Nicole to lie down on floor and cleared surrounding area to ensure safety. Around 12:27am, Nicole started experiencing minor shakes and tremors. She was unconscious during the episode. She experienced shakes and tremors for only 3 minutes inconsistently; however, she was unconscious and was lying on floor till 12:37am. After she partially recovered, writer assisted her to bed and gave her water. After episode, she requested Oxazepam, which was administered. Nil injuries reported. Writer monitored Nicole's breathing throughout the episode.",
    bsl_reading: "15.4 mmol/L at 11:25pm (high — NovoRapid insulin taken). 5.3 mmol/L at 1:28am (low — fruits given, normalised in 10 min). 6.5 mmol/L at 7:30am.",
    medication_notes: "Panamax, Metoclopramide, Aspirin at 10:55pm (severe headache). Levemir (long-acting insulin) at 11pm. NovoRapid insulin at 11:25pm. Oxazepam at 12:40am. Movicol x2 sachets. DayVigo at 2:40am and 3:10am.",
    concerns: "SEIZURE INCIDENT: 12:25am — Found on floor after going to toilet. Shakes/tremors from 12:27am, unconscious until 12:37am (~10 min unconscious, 3 min active seizure). Pillow and towel for neck support. Assisted to bed. Nil injuries. Severe headache at 10:55pm. BGL fluctuations (high 15.4, low 5.3). Feeling bloated.",
    mood: "Upset",
    sleep_quality: "Poor",
    meals: "Cup of tea at 11pm. Fruits at 1:28am. Banana at 7:30am.",
    activities: "Assisted with organising stuff, shower assistance at 1am"
  },

  // ── 3 May 2026 (Sunday) ────────────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-05-03",
    shift: "Morning 8am-12pm",
    day_of_week: "Sunday",
    staff_name: "Vishali",
    content: "Started shift @ 8AM, H/O received. Nicole was already up. The BGL was stable but got high (17.8) around 8:40AM, she took insulin. About 15 min later, it got back to normal. Offered tea, administered morning meds with an Oxazepam as requested. Folded the dried laundry. Monitored BGL, it was stable. Did dishes, wiped kitchen benches. Cleaned toilet and sink of staff bathroom. Nicole mentioned she has high heart rate @ 10:00AM, administered Propranolol as requested. She had toast. Around 10:48AM, administered 2 Panamax, 2 Ibuprofen and 1 Nuvigil. The BGL remained stable till the end of shift. Finished shift @ 12PM.",
    bsl_reading: "High 17.8 at 8:40am — insulin taken, normal in 15 min. Stable thereafter.",
    medication_notes: "Morning meds with Oxazepam. Insulin. Propranolol at 10am (high heart rate). 2 Panamax, 2 Ibuprofen, 1 Nuvigil at 10:48am.",
    concerns: "BGL high 17.8 at 8:40am. High heart rate reported at 10am.",
    mood: "Neutral",
    sleep_quality: null,
    meals: "Tea. Toast.",
    activities: "Folded laundry, dishes, wiped kitchen benches, cleaned staff toilet and sink"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-05-03",
    shift: "Afternoon 4pm-8pm",
    day_of_week: "Sunday",
    staff_name: "Prabhjot",
    content: "At the commencement of the shift at 4:00PM, Nicole took her scheduled medication. Nicole spent time in her room watching a movie. She had lunch consisting of bread and avocado toast. After eating, Nicole rested in her room. At 6:00PM, dinner was prepared for Nicole. At 6:40PM, Nicole had her dinner. Regular 8PM medication was administered. Nil concerns reported.",
    bsl_reading: null,
    medication_notes: "4pm scheduled meds. 8pm meds.",
    concerns: null,
    mood: "Neutral",
    sleep_quality: null,
    meals: "Bread and avocado toast (lunch). Dinner at 6:40pm.",
    activities: "Watched a movie. Prepared dinner."
  },
  {
    participant_name: "Nicole",
    note_date: "2026-05-03",
    shift: "Sleepover 8pm-6am",
    day_of_week: "Sunday",
    staff_name: "AK",
    content: "Started shift at 8:00pm. On arrival Nicole was in her room appeared tired and dizzy. Received handover from previous SW who reported Nicole being exhausted throughout shift. Regular 8pm medication was already administered. At 8:05pm, Nicole took Ondansetron, Metoclopramide, Nausicalm as she reported feeling nauseous. Following this, writer had Khichdi for dinner. Later at 9:00pm, Nicole was administered Oxazepam, Panamax and Aspirin because of severe headache. Nicole was observed tearful, exhausted and stressed; writer provided emotional support to her. However, at 10:00pm, Nicole took Levemir (long-acting insulin) under supervision. After this, later at 10:20pm Nicole took 2 tablets of DayVigo and writer settled her in bed and comfort. But around 11:00pm, writer heard noise from Nicole's room and found her on floor with minor cuts on her arm which she did by herself under stress situation. Following this incident writer provided emotional support and assisted her to the bed. Later around 11:40pm, she went to sleep and around 11:44pm her BGL was low so writer provided her juice and apples. Unfortunately, her BGL continued being low and she refused eating more fruits and to drink juice. At 2:30am, Nicole did finger prick to check her BGL and it was 12.4 mmol/L. App (Dexcom) was not notifying any updates and readings were inaccurate. At 4:30am, the Dexcom app reading appeared inaccurate again, so a finger-prick BGL check was performed. Nicole reported that the sensor needed to be changed. The Dexcom patch was changed by Nicole under writer's supervision and it took 26 mins to reconnect to Dexcom app. At 5:30am, Nicole came out from her room to get toast and a cup of tea, writer assisted her with preparation. Following this, she returned back to her room. Nil concerns.",
    bsl_reading: "Low at 11:44pm — juice and apples provided (refused more). 12.4 mmol/L at 2:30am (finger prick). Dexcom readings inaccurate — sensor changed at 4:30am.",
    medication_notes: "Ondansetron, Metoclopramide, Nausicalm at 8:05pm. Oxazepam, Panamax, Aspirin at 9pm. Levemir (long-acting insulin) at 10pm. DayVigo x2 at 10:20pm.",
    concerns: "SELF-HARM INCIDENT: 11pm — Found Nicole on floor with minor cuts on her arm, self-inflicted under stress. Emotional support provided. Nicole tearful, exhausted and stressed. Dexcom CGM readings inaccurate — sensor changed at 4:30am. BGL low at 11:44pm — refused further food/juice.",
    mood: "Upset",
    sleep_quality: "Poor",
    meals: "Khichdi for dinner. Juice and apples at 11:44pm. Toast and tea at 5:30am.",
    activities: "Emotional support, Dexcom sensor change supervision"
  },

  // ── 4 May 2026 (Monday) ────────────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-05-04",
    shift: "Morning 6am-12pm",
    day_of_week: "Monday",
    staff_name: "Sukh",
    content: "Shift started at 6:00am. Upon arrival, Nichole was already awake. Her BGL was within the normal range. At 7:33am, she took her regular morning med along with PRN medications including Propranolol and Nuvigil. At 9:00am she had toast and then took a shower. At 9:40am, she left home for her dental appointment. At 9:50am, Nichole took PRN med including Propranolol, Nuvigil, Ondansetron, Oxazepam, Panamax (2 tablets), and Metoclopramide. At 1:17pm, we returned home. At 1:20pm, while she was sitting on the floor next to her wheelchair, Nichole experienced a seizure. The seizure lasted approximately 15 minutes, after which she recovered. Following recovery, Nichole had her lunch. When I checked on her in her room, she appeared upset and was crying, stating she was not feeling well. At 3:00pm, she took another dose of PRN Metoclopramide. At 3:16pm, her BGL had increased to 19. At 4:00pm, her BGL returned to the normal range. She took her regular 4:00pm meditation along with PRN Ondansetron. Washed utensils, swept the floor and washed and dried towels. INCIDENT REPORT: At approximately 1:20pm, upon returning home from her appointment, Nichole experienced a seizure. The incident occurred while she was sitting on the floor next to her wheelchair. The seizure happened in my presence. I immediately ensured her safety by placing a pillow under her head to prevent injury. After a few minutes, with my assistance, she was carefully repositioned onto the bed. The seizure lasted approximately 10 minutes, after which Nichole gradually regained consciousness and recovered.",
    bsl_reading: "Normal at start. 19 at 3:16pm (high). Normal by 4pm.",
    medication_notes: "Morning meds with PRN Propranolol and Nuvigil at 7:33am. PRN Propranolol, Nuvigil, Ondansetron, Oxazepam, Panamax x2, Metoclopramide at 9:50am. PRN Metoclopramide at 3pm. 4pm meds with PRN Ondansetron.",
    concerns: "SEIZURE INCIDENT: 1:20pm — Seizure while sitting on floor next to wheelchair after returning from dental appointment. Lasted ~10-15 minutes. Pillow under head, repositioned to bed. Nicole upset and crying — stated not feeling well. BGL spiked to 19 at 3:16pm.",
    mood: "Upset",
    sleep_quality: null,
    meals: "Toast at 9am. Lunch after seizure recovery.",
    activities: "Dental appointment. Washed utensils, swept floor, washed/dried towels."
  },
  {
    participant_name: "Nicole",
    note_date: "2026-05-04",
    shift: "Sleepover 6pm-6am",
    day_of_week: "Monday",
    staff_name: "Vishali",
    content: "When started, Nicole was in her room. H/O received. Nicole was stressed and had migraine, she mentioned she was having suicidal thoughts and severe pain. Staff before in the morning had given a Aspirin to Nicole, which she took around 6:30PM. Gave tea and toast with banana. Monitored BGL, it remained stable. She came out in the lounge room, had toast again. Administered night meds with Oxazepam and 2 Panamax. She watched TV till 9:30PM, went back to the room because she was tired. Refilled her water bottle, gave 2 DayVigo @ 10:00PM, assured she was settled. She went to sleep @ 1:30AM, her BGL dropped to (5.3) @ 2:30AM. Given apple juice, after 10 min, it came back to normal. She was asleep until the end of my shift. H/O given to next staff.",
    bsl_reading: "Stable during evening. 5.3 at 2:30am (low — apple juice given, normalised in 10 min).",
    medication_notes: "Aspirin at 6:30pm (given by morning staff). Night meds with Oxazepam and 2 Panamax. DayVigo x2 at 10pm.",
    concerns: "Nicole mentioned having suicidal thoughts. Severe pain and migraine. Stressed. BGL dropped to 5.3 at 2:30am.",
    mood: "Upset",
    sleep_quality: "Fair",
    meals: "Tea and toast with banana at 6:30pm. Toast again in lounge room. Apple juice at 2:30am.",
    activities: "Watched TV"
  },

  // ── 5 May 2026 (Tuesday) ───────────────────────────────────────
  {
    participant_name: "Nicole",
    note_date: "2026-05-05",
    shift: "Morning 6am-12pm",
    day_of_week: "Tuesday",
    staff_name: "AK",
    content: "Writer started shift at 6:00am. On arrival, Nicole was sleeping in her bedroom. Handover received from previous SW who reported Nicole had severe migraine pain last night and she was tired and exhausted. While Nicole was sleeping writer did dishes, swept and mopped floor. Around 9:20am, Nicole woke up and came out of her room. Writer prepared toast with avocado and a cup of tea. At 9:40am, Nicole took regular (AM) medication. Additionally, Nicole took pre-breakfast insulin (NovoRapid). Her BGL was stable during the shift. Nil concerns. Nil seizure episode. Writer closely monitored Nicole's BGL. However, at 11:10am, Nicole's BGL was going down and it was 5.5 mmol/L. Writer provided her some fruits to help her with BGL. Around 11:20am, it was 6.9 mmol/L within normal range. At 11:57am, Nicole took Oxazepam and 1 tablet of Nuvigil.",
    bsl_reading: "Stable. 5.5 mmol/L at 11:10am (dropping — fruits given). 6.9 mmol/L at 11:20am (normal).",
    medication_notes: "Regular AM meds at 9:40am. NovoRapid insulin (pre-breakfast). Oxazepam and Nuvigil at 11:57am.",
    concerns: "Nicole had severe migraine previous night. BGL dropped to 5.5 at 11:10am — fruits provided.",
    mood: "Neutral",
    sleep_quality: "Good",
    meals: "Toast with avocado and tea at 9:20am. Fruits at 11:10am.",
    activities: "Dishes, swept and mopped floor"
  },
  {
    participant_name: "Nicole",
    note_date: "2026-05-05",
    shift: "Afternoon 4pm-6am",
    day_of_week: "Tuesday",
    staff_name: "Vishali",
    content: "When started my shift, Nicole was getting her bedsheets changed. H/O received. Administered 4PM meds. Offered her a cup of tea. Then, washed the sheets and dried them. Settled utensils, wiped kitchen benches. Cleaned staff toilet and bathroom sink. Monitored BGL, it was stable and Nicole was in her room. Heated up omelette for dinner. She came out around 7:00PM, mentioned she was dizzy. She had tea and meal. Administered 1 Oxazepam as requested for pain. Around 8PM, administered evening meds and Cetirizine @ 8:30PM. Nicole was tired and she came out to the kitchen to have something but had seizure then, took her in the room. She settled down after a while. Administered 2 DayVigo @ 10:30PM. Monitored BGL throughout the night, it remained stable. Finished shift @ 6AM. H/O given to next staff. INCIDENT REPORT — 5 May: Around 9:12PM, Nicole came down to the kitchen. She was tired, while she was writing on the white board (on the fridge), she felt dizzy. @ 9:16PM, the seizure started. I took her wheelchair manually to transfer her to room. She lied down in the bed while seizure stopped @ 9:27PM. She was stable around 10PM.",
    bsl_reading: "Stable throughout shift",
    medication_notes: "4pm meds. Oxazepam for pain. 8pm evening meds. Cetirizine at 8:30pm. DayVigo x2 at 10:30pm.",
    concerns: "SEIZURE INCIDENT: 9:16-9:27pm (~11 minutes) — Nicole in kitchen writing on whiteboard, felt dizzy. Seizure started at 9:16pm. Transferred to room via wheelchair. Seizure stopped at 9:27pm. Stable by 10pm. Also dizzy at 7pm.",
    mood: "Neutral",
    sleep_quality: "Fair",
    meals: "Tea. Omelette for dinner at 7pm.",
    activities: "Changed bedsheets, washed/dried sheets, settled utensils, wiped kitchen benches, cleaned staff toilet/bathroom"
  },
];

async function importBatch(batch, batchNum) {
  const res = await fetch(`${VAULT_URL}/api/features?action=pn-bulk-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: batch }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Batch ${batchNum} failed (${res.status}):`, text.slice(0, 500));
    return 0;
  }
  const result = JSON.parse(text);
  console.log(`Batch ${batchNum}: imported ${result.imported} notes`);
  return result.imported;
}

async function importNotes() {
  console.log(`Importing ${notes.length} progress notes for Nicole Knight...`);
  const BATCH_SIZE = 10;
  let total = 0;

  for (let i = 0; i < notes.length; i += BATCH_SIZE) {
    const batch = notes.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const imported = await importBatch(batch, batchNum);
    total += imported;
    // small delay between batches
    if (i + BATCH_SIZE < notes.length) await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nTotal imported: ${total} / ${notes.length}`);

  const incidents = notes.filter(n =>
    n.concerns && (n.concerns.includes('SEIZURE INCIDENT') || n.concerns.includes('SELF-HARM INCIDENT'))
  );
  console.log(`Notes with incident reports: ${incidents.length}`);
  const dates = [...new Set(notes.map(n => n.note_date))].sort();
  console.log(`Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
}

importNotes();
