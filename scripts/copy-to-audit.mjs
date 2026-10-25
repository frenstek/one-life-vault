import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://czdlemutsimvwfpwylxh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGxlbXV0c2ltdndmcHd5bHhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjQ3NCwiZXhwIjoyMDkwMjQyNDc0fQ.ZueFz5cozYoC_TNUH_wX5Ak5G2PAdBMzJyrr_0gzPHk'
);

const SRC = 'documents';
const DST = 'auditor-portal';

const F = {
  m1:  'bd49260a-30be-4689-ba20-d60f1146bd95',
  m2:  'bd14592e-4649-4b63-b557-7241025e1906',
  m3:  '4298ed63-bb7d-4b93-85e0-9ae063030880',
  m4:  '56fca35d-b12f-4edc-863a-05de35fb1eb6',
  m5:  'ac10614b-9215-4185-a125-3a05606e0d33',
  m6:  'd491d546-c2d2-45bd-8561-0795493ec768',
  m7:  'efc3c35b-597b-4fc2-9828-f87f5b076799',
  m8:  '2739523f-b53a-41cd-9c7f-7d7e18ef5595',
  m9:  'f5290eb6-8767-488e-89e8-9ce0f4799f55',
  m10: '652e8024-91d7-4640-9224-67733f73cf04',
  m11: '95b2d070-8cd9-4063-bde0-098de63cdfbf',
  m12: '786f2212-c223-45f6-9e51-eb9950fb4f77',
  m13: 'b111ff9c-92ac-41e2-9f06-91b48e427855',
  m14: '07d62b38-cc5d-46d8-bb51-5dcff30f4d3b',
  m15: 'a3b7db84-7fc7-4020-945d-f31e3510d22c',
  hi:  'cfa8179f-d329-423d-8da4-4161e6f1e42b',
  staff: '258e8135-1ff9-41e0-8dd2-f80676cdeed3',
  part:  '6240dc5b-3dc2-4dda-95e0-89f730f78da2',
  reg:   '7c21faaa-5102-440f-9c57-6ed161015697',
};

const MAP = [
  // Module 1: Rights & Responsibilities
  ['Policies and Procedures/Core 1 - Rights & Responsibilities/Form111.OLF Code of Conduct.pdf', F.m1],
  ['Policies and Procedures/Core 1 - Rights & Responsibilities/Participant Handbook V02 - June 2026.pdf', F.m1],
  ['Governance & Compliance/NDIS-Code-of-Conduct-Know-your-obligations-PDF.pdf', F.m1],
  ['Governance & Compliance/make-it-known-make-it-betterposterdestiny-and-rita.pdf', F.m1],
  ['NDIS-Information/The NDIS Code of Conduct (Guidance for Workers).pdf', F.m1],
  ['NDIS-Information/The NDIS Code of Conduct (Guidance for Providers).pdf', F.m1],
  ['NDIS-Information/The NDIS Code of Conduct (Poster).pdf', F.m1],
  ['NDIS-Information/Easy to Read Participant Letter-July 2019 .pdf', F.m1],
  ['Records/Client Welcome Pack/3-Client-Rights-Easy-To-Read.pdf', F.m1],
  ['NDIS Manual/3-Participant Handbook.pdf', F.m1],
  ['Records/Client Form/Form31.Participant Survey (Client Satisfaction Survey).docx', F.m1],

  // Module 2: Service Agreements
  ['Operations/Form22.Service Agreement.docx', F.m2],
  ['Onboarding/Form46.SDA Service Agreement.docx', F.m2],
  ['Onboarding/MTA_Service_Agreement_One_Life_Foundation.pdf', F.m2],
  ['Policies & Procedures/MTA_Service_Agreement_One_Life_Foundation.docx', F.m2],
  ['Operations/SDA Agreement.pdf', F.m2],
  ['Records/Client Welcome Pack/4-Service-Agreement-Easy-To-Read.pdf', F.m2],
  ['Forms Updated/Form36.Client Money and Property Consent Form.docx', F.m2],
  ['Forms Updated/Form37.Money Reconciliation Record.docx', F.m2],

  // Module 3: Governance & Operational Management
  ['Policies and Procedures/Core 2 - Governance & Operations/Form05.Business Plan 2026-2028.pdf', F.m3],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form100.Organisation Chart.pdf', F.m3],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form104.Digital Compliance Monitoring Policy.pdf', F.m3],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form105.Digital Registers Management Policy.pdf', F.m3],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form107.Policy Document Register.pdf', F.m3],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form108.NDIS Policy Manual Addendum V02.pdf', F.m3],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form112.Insurance Register.pdf', F.m3],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form25.Management Review Meeting Minutes - June 2026.pdf', F.m3],
  ['Forms Updated/Form28.Delegations of Authority Register.docx', F.m3],
  ['Forms Updated/Form29.Conflict of Interest Register.docx', F.m3],
  ['Forms Updated/Form30.Minutes Of Meeting.docx', F.m3],
  ['Forms Updated/Form34.Conflict of Interest Declaration Form (Employee).docx', F.m3],
  ['Forms Updated/Form86.Delegation of authority declaration.docx', F.m3],
  ['Forms Updated/Form87.Conflict of Interest Declaration Letter (Participant).docx', F.m3],
  ['NDIS Manual/1-NDIS Manual(Policies and Procedures).pdf', F.m3],

  // Module 4: Risk Management
  ['Forms Updated/Form01.Risk Register.xlsx', F.m4],
  ['completed forms/Form01.Risk Register completed.xlsx', F.m4],
  ['Forms Updated/Form14.Hazard identification report .docx', F.m4],
  ['Forms Updated/Form35.Hazardous Chemical Register.docx', F.m4],
  ['Forms Updated/Form61.Risk Assessed Role Register.xlsx', F.m4],
  ['Forms Updated/Form63.HSE Inspection Checklist.docx', F.m4],
  ['completed forms/Form63.HSE Inspection Checklist completed.docx', F.m4],
  ['Forms Updated/Form65.Risk Indemnity.docx', F.m4],
  ['Records/Client Form/Form32.Home Risk Assessment.docx', F.m4],
  ['Records/Client Form/Form33.Participant Disaster and Risk Assessment.docx', F.m4],

  // Module 5: Quality Management
  ['Forms Updated/Form03.Improvement Report Form.docx', F.m5],
  ['completed forms/Form03.Improvement Report Form completed 01.docx', F.m5],
  ['completed forms/Form03.Improvement Report Form completed 02.docx', F.m5],
  ['completed forms/Form03.Improvement Report Form completed 03.docx', F.m5],
  ['completed forms/Form03.Improvement Report Form completed 04.docx', F.m5],
  ['Forms Updated/Form15.Internal Audit Report.docx', F.m5],
  ['Forms Updated/Form16.Internal Audit Schedule.docx', F.m5],
  ['completed forms/Form16.Internal Audit Schedule completed.docx', F.m5],
  ['Forms Updated/Form59.Continuous Improvement Register.xlsx', F.m5],
  ['completed forms/Form59.Continuous Improvement Register completed.xlsx', F.m5],
  ['Forms Updated/Document Mapping - Certification.xlsx', F.m5],
  ['Forms Updated/Document Mapping - Module 1.xlsx', F.m5],
  ['Forms Updated/Document Mapping - Module 2A.xlsx', F.m5],
  ['Forms Updated/Document Mapping - Module 3.xlsx', F.m5],
  ['Forms Updated/Document Mapping - Module 5.xlsx', F.m5],
  ['NDIS-Information/National Disability Insurance Scheme (Quality Indicators) Guidelines 2020.pdf', F.m5],

  // Module 6: Human Resource Management
  ['Human Resources/Form06.Worker Information Form.docx', F.m6],
  ['Human Resources/Form08.Induction Checklist.docx', F.m6],
  ['Human Resources/SCHADS Award Pay Rates - One Life Foundation.pdf', F.m6],
  ['Human Resources/SCHADS-OLF-Oct2025.pdf', F.m6],
  ['Forms Updated/Form09.Training Matrix.xlsx', F.m6],
  ['Forms Updated/Form09.Training Matrix- Module1.xlsx', F.m6],
  ['Forms Updated/Form10.Worker Performance Assessment.docx', F.m6],
  ['Forms Updated/Letter of Offer Casual Employment Agreement.docx', F.m6],
  ['Forms Updated/Letter of Offer Full-time or Part-time Employment.docx', F.m6],
  ['Forms Updated/Letter of Offer Subcontract Agreement.docx', F.m6],
  ['NDIS Manual/2-Worker Handbook (Staff Welcome Pack).pdf', F.m6],
  ['Records/Staff Welcome Pack/Form19.Privacy & Confidentiality Agreement.docx', F.m6],
  ['Records/Staff Welcome Pack/Personnel Required Documentation NDIS.pdf', F.m6],
  ['Human Resources/Employment Pack/Staff_Intake_Form_OLF.pdf', F.m6],
  ['Human Resources/Employment Pack/Letter_of_Engagement_DSW_Template.pdf', F.m6],
  ['Human Resources/Employment Pack/Tax Form.pdf', F.m6],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form109.Worker Screening and Recruitment Procedure.pdf', F.m6],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form113.Professional Development Policy.pdf', F.m6],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form114.Performance Management Procedure.pdf', F.m6],
  ['Policies and Procedures/Core 2 - Governance & Operations/Worker Handbook V02 - June 2026.pdf', F.m6],

  // Module 7: Continuity of Supports
  ['Forms Updated/Form60.Rostering Schedule.xlsx', F.m7],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form103.Business Continuity Plan.pdf', F.m7],

  // Module 8: Emergency & Disaster Management
  ['Forms Updated/Form81.Emergency Drill Reporting Form.docx', F.m8],
  ['completed forms/Form81.Emergency Drill Reporting Form completed.docx', F.m8],
  ['Forms Updated/Form82.Emergency and Disaster Management Plans.docx', F.m8],
  ['completed forms/Form82.Emergency and Disaster Management Plans completed.docx', F.m8],
  ['Training Resources/Emergency-Contacts-59-Severn-St-Epping.pdf', F.m8],
  ['Forms Updated/Form102.COVID-19 Response Plan.docx', F.m8],

  // Module 9: Information Management
  ['Human Resources/Employment Pack/Form19-Privacy-Confidentiality-Updated.pdf', F.m9],
  ['Records/Client Welcome Pack/5-Consent-Form - Easy-To-Read.pdf', F.m9],
  ['Records/Client Form/Form18.Participant Information Consent Form.docx', F.m9],

  // Module 10: Feedback & Complaints
  ['Forms Updated/Form02.Complaint Report Form.docx', F.m10],
  ['Policies & Procedures/OLF_Complaints_Flowchart.pdf', F.m10],
  ['Records/Complaint Report Records/Form12.Complaint Register.xlsx', F.m10],
  ['Records/Client Welcome Pack/1-Complaint-Management-Easy-To-Read.pdf', F.m10],
  ['Records/Client Welcome Pack/ndis-commission-complaints-and-feedback-easy-read-sept-2020.pdf', F.m10],

  // Module 11: Incident Management
  ['Forms Updated/Form04.Incident Report.docx', F.m11],
  ['Records/Incident Report Records/Form11.Incident Register.xlsx', F.m11],
  ['NDIS-Information/Incident Management(Guidance for Providers).pdf', F.m11],
  ['Records/Client Welcome Pack/2-Incident-Management-Easy-To-Read.pdf', F.m11],

  // Module 12: Access to Supports
  ['Onboarding/Form 44_Referral Form.docx', F.m12],
  ['Records/Client Form/Form20.Participant Intake Form.docx', F.m12],
  ['Governance & Compliance/One Life Foundation - Participant Profile Template.docx', F.m12],
  ['NDIS-Information/Provider Information Pack.pdf', F.m12],
  ['Onboarding/Medication_Consent_Form_One_Life_Foundation.pdf', F.m12],
  ['Onboarding/Medication Purpose Form June 2022.pdf', F.m12],

  // Module 13: Support Planning
  ['Module 3/Form38. Additional Support Request Form.docx', F.m13],
  ['Module 3/Form76. Intervention Plan.docx', F.m13],
  ['Records/Client Form/Form26.Goal Plan for Participant.docx', F.m13],
  ['Records/Client Form/Form27.Initial Assessment and Support Plan.docx', F.m13],
  ['Records/Client Form/Form43.Support Notes.docx', F.m13],

  // Module 14: Provision of Supports
  ['Forms Updated/Form99.Travel and Transport Tracking Sheet.docx', F.m14],
  ['Forms Updated/Form101.Group & Centre Based Activities Agenda.docx', F.m14],
  ['Records/Client Form/Form13.Advocate Nomination Form.docx', F.m14],
  ['Training Resources/OLF-Support-Worker-Guide.pdf', F.m14],

  // Module 15: Transitions
  ['Records/Client Form/Form21.Participant Exit Form.docx', F.m15],
  ['Records/Client Form/Form23.Transition Plan.docx', F.m15],

  // High Intensity (SIL)
  ['Module 1/Form15.Internal Audit Report-Module 1.docx', F.hi],
  ['Module 1/Form16.Internal Audit Schedule-Module 1.docx', F.hi],
  ['Module 1/Form41.Medication Incident Report.docx', F.hi],
  ['Module 1/Form49. Complex Bowel Care Plan and Monitoring Form.docx', F.hi],
  ['Module 1/Form50.Enteral Feeding and Management Plan and Monitoring Form.docx', F.hi],
  ['Module 1/Form51.Tracheostomy Management  Plan and Monitoring Form.docx', F.hi],
  ['Module 1/Form52. Urinary Catheter Management Plan and Monitoring Form.docx', F.hi],
  ['Module 1/Form53.Ventilator Management Plan and Monitoring Form.docx', F.hi],
  ['Module 1/Form54. Subcutaneous Injections Plan and Monitoring Form.docx', F.hi],
  ['Module 1/Form55.Complex Wound Management Plan and Monitoring Form.docx', F.hi],
  ['Module 1/Form56.High Risk Participant Register.docx', F.hi],
  ['Module 1/Form58.Waste Removal Register.docx', F.hi],
  ['Module 1/Form64. Fluid Balance Chart.docx', F.hi],
  ['Module 1/Form67.Pressure Area Care and Wound Management Capability.docx', F.hi],
  ['Module 1/Form68.Tracheostomy Management Capability.docx', F.hi],
  ['Module 1/Form69. Urinary Catheter Care Capability.docx', F.hi],
  ['Module 1/Form70. Bowel Management Capability.docx', F.hi],
  ['Module 1/Form73. SC Injection Capability.docx', F.hi],
  ['Module 1/Form74. Enteral Feeding Capability .docx', F.hi],
  ['Policies and Procedures/Module 1 - High Intensity/Form110.Clinical Governance Framework.pdf', F.hi],
  ['Forms Updated/Form75.Consent to the Use of Restrictive Practices.docx', F.hi],
  ['Forms Updated/Form77.Mealtime Management Plan Form.docx', F.hi],
  ['Forms Updated/Form78.Nutrition Assessment.docx', F.hi],
  ['Forms Updated/Form79.Nutrition and Swallowing Risk Checklist.docx', F.hi],
  ['Forms Updated/Form80.Food Diary.docx', F.hi],
  ['Forms Updated/Form83. Severe Dysphagia Management plan.docx', F.hi],
  ['Forms Updated/Form84. Ventilator Management Capability.docx', F.hi],
  ['Forms Updated/Form85. Positive behaviour supports and Restrictive practices Capability.docx', F.hi],
  ['Forms Updated/Form91. Weekly Body Measurement and Weight Chart.docx', F.hi],
  ['Forms Updated/Form93. Severe Dysphagia Management Capability.docx', F.hi],
  ['Forms Updated/Form94.Diabetes Care Plan and Monitoring Form.docx', F.hi],
  ['Forms Updated/Form95.Seizure Care Plan and Monitoring Form.docx', F.hi],
  ['Forms Updated/Form96. Seizure Capability.docx', F.hi],
  ['Forms Updated/Form97. Diabetes Capability.docx', F.hi],
  ['Forms Updated/Form98. Oral Care Form.docx', F.hi],
  ['Forms Updated/Form103.Inhalant Medication Administration Capability.docx', F.hi],
  ['Forms Updated/Form104.S8 Medication Administration Capability.docx', F.hi],
  ['Forms Updated/Form105.Inhalant Medication With A Nebuliser  Capability.docx', F.hi],
  ['Forms Updated/Form106.Cytotoxic Drug Administration Capability.docx', F.hi],
  ['Forms Updated/Form107.PRN Medication Register.docx', F.hi],
  ['Forms Updated/Form108.Medication Risk Assessment.docx', F.hi],
  ['Forms Updated/Form85.Training Program for Module 1.xlsx', F.hi],
  ['NDIS Manual/1-NDIS Manual-Module 1.pdf', F.hi],
  ['Training Resources/OLF-TG-HI-001 Urinary Catheter Care Guide.pdf', F.hi],
  ['Training Resources/OLF-TG-HI-002 Wound Care Guide.pdf', F.hi],
  ['Training Resources/OLF-TG-HI-003 Diabetes Management Guide.pdf', F.hi],
  ['Records/Client Form/Form24.Medication Management Form .docx', F.hi],
  ['Module 2/Form102. ABC Recording Chart.docx', F.hi],
  ['Module 2/Form39.Dietary Chart.docx', F.hi],
  ['Module 2/Form40.Medication Chart.docx', F.hi],
  ['Module 2/Form42.Behaviour Support Risk Assessment Form.docx', F.hi],
  ['Module 2/Comprehensive BSP Template V3.DOCX', F.hi],
  ['Module 2/Interim BSP Template Version 3.DOCX', F.hi],

  // Registers
  ['Records/Legislative Compliance/Form17.Legislative Compliance Register- VIC.doc', F.reg],
  ['Records/Legislative Compliance/Form17.Legislative Compliance Register- NSW.doc', F.reg],
  ['Records/Legislative Compliance/Form17.Legislative Compliance Register- QLD.doc', F.reg],
  ['Records/Legislative Compliance/Form17.Legislative Compliance Register- SA.doc', F.reg],
  ['Records/Legislative Compliance/Form17.Legislative Compliance Register- WA.doc', F.reg],
  ['Records/Legislative Compliance/Form17.Legislative Compliance Register- TAS.doc', F.reg],
  ['Records/Legislative Compliance/Form17.Legislative Compliance Register- ACT.doc', F.reg],
  ['Records/Legislative Compliance/Form17.Legislative Compliance Register- NT.doc', F.reg],
  ['Forms Updated/Form76.Table of Event.xlsx', F.reg],

  // Staff Files
  ['Job Description/Form07.Job Description- Disability Support Worker.doc', F.staff],
  ['Job Description/Form07.Job Description- HR-Manager.doc', F.staff],
  ['Job Description/Form07.Job Description- Managing Director.doc', F.staff],
  ['Job Description/Form07.Job Description- Registered Nurse.doc', F.staff],
  ['Job Description/Form07.Job Description- Administrator.doc', F.staff],
  ['Job Description/Form07.Job Description- Specialised Support Coordinator.doc', F.staff],
  ['Job Description/Form07.Job Description-Tenancy Manager.doc', F.staff],
  ['Job Description/Form07.Job Description- Builder.doc', F.staff],

  // Participant Files
  ['Records/Client Welcome Pack/Participant Information Pack.pdf', F.part],
  ['Records/Client Welcome Pack/About the NDIS Commission.pdf', F.part],
  ['NDIS Manual/3-Participant Handbook Module 5.pdf', F.part],
  ['Policies and Procedures/Core 4 - Support Environment/Form106.SIL House Accommodation Audit Checklist.pdf', F.part],
];

let ok = 0, fail = 0;

async function copy(src, destFolder) {
  const fileName = src.split('/').pop();
  try {
    const { data, error } = await sb.storage.from(SRC).download(src);
    if (error) throw error;
    const buf = Buffer.from(await data.arrayBuffer());
    const { error: upErr } = await sb.storage.from(DST).upload(
      destFolder + '/' + fileName, buf,
      { contentType: data.type || 'application/octet-stream', upsert: true }
    );
    if (upErr) throw upErr;
    ok++;
    process.stdout.write('.');
  } catch (e) {
    fail++;
    console.error('\nFAIL: ' + src + ' => ' + e.message);
  }
}

console.log('Copying ' + MAP.length + ' files...');

for (let i = 0; i < MAP.length; i += 5) {
  const batch = MAP.slice(i, i + 5);
  await Promise.all(batch.map(([src, dst]) => copy(src, dst)));
}

console.log('\nDone! ' + ok + ' copied, ' + fail + ' failed');
