import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://YOUR_PROJECT_REF.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY'
);

// Helper: case-insensitive check if name contains any of the keywords
function nameContains(name, keywords) {
  const lower = name.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

function pathStartsWith(path, prefix) {
  return path.toLowerCase().startsWith(prefix.toLowerCase());
}

/**
 * Determine the COMPLETED RECORDS subcategory for a document from the
 * "completed forms" folder, based on what the form is actually about.
 */
function getCompletedSubcategory(name) {
  const n = name.toLowerCase();

  // Incidents & Complaints
  if (n.includes('improvement report') || n.includes('complaint') || n.includes('incident report') || n.includes('incident register'))
    return 'Incidents & Complaints';

  // Audits
  if (n.includes('internal audit'))
    return 'Audits';

  // Risk Management
  if (n.includes('risk register') || n.includes('risk assessment') || n.includes('continuous improvement'))
    return 'Risk Management';

  // Safety & WHS
  if (n.includes('emergency') || n.includes('hse') || n.includes('hazard'))
    return 'Safety & WHS';

  // Rostering
  if (n.includes('rostering'))
    return 'Rostering';

  // Induction
  if (n.includes('ndis code of conduct') || n.includes('induction'))
    return 'Induction';

  // Medication
  if (n.includes('medication'))
    return 'Medication';

  // Compliance
  if (n.includes('legislative compliance'))
    return 'Compliance';

  // General catch-all
  return 'General';
}

/**
 * Categorize a single document into department (category) and subcategory.
 *
 * Departments:
 *   - Human Resources
 *   - Onboarding
 *   - Clinical
 *   - Governance & Compliance
 *   - Operations
 *   - Completed Records
 */
function categorize(doc) {
  const { name, storage_path } = doc;
  const nameLower = name.toLowerCase();
  const pathLower = storage_path.toLowerCase();

  // ============================================================
  // 1. COMPLETED FORMS folder → Completed Records
  // ============================================================
  if (pathStartsWith(storage_path, 'completed forms/')) {
    return { category: 'Completed Records', subcategory: getCompletedSubcategory(name) };
  }

  // ============================================================
  // 2. WELCOME PACK folders → Onboarding / Welcome Packs
  // ============================================================
  if (pathStartsWith(storage_path, 'Records/Client Welcome Pack/') ||
      pathStartsWith(storage_path, 'Records/Staff Welcome Pack/')) {
    return { category: 'Onboarding', subcategory: 'Welcome Packs' };
  }

  // ============================================================
  // 3. JOB DESCRIPTION folder → Human Resources / Job Descriptions
  // ============================================================
  if (pathStartsWith(storage_path, 'Job Description/')) {
    return { category: 'Human Resources', subcategory: 'Job Descriptions' };
  }

  // ============================================================
  // 4. NDIS Manual folder → Governance & Compliance / NDIS Manual
  // ============================================================
  if (pathStartsWith(storage_path, 'NDIS Manual/')) {
    return { category: 'Governance & Compliance', subcategory: 'NDIS Manual' };
  }

  // ============================================================
  // 5. NDIS-Information folder → Governance & Compliance / NDIS Information
  // ============================================================
  if (pathStartsWith(storage_path, 'NDIS-Information/')) {
    return { category: 'Governance & Compliance', subcategory: 'NDIS Information' };
  }

  // ============================================================
  // 6. MODULE 1-5 folders → Governance & Compliance / Policies & Modules
  //    (default for module files unless they match a more specific rule below)
  // ============================================================
  const isModuleFile = pathStartsWith(storage_path, 'Module 1/') ||
                       pathStartsWith(storage_path, 'Module 2/') ||
                       pathStartsWith(storage_path, 'Module 3/') ||
                       pathStartsWith(storage_path, 'Module 5/');

  // ============================================================
  // 7. RECORDS sub-folders
  // ============================================================
  if (pathStartsWith(storage_path, 'Records/Complaint Report Records/') ||
      pathStartsWith(storage_path, 'Records/Incident Report Records/')) {
    return { category: 'Operations', subcategory: 'Incidents & Complaints' };
  }

  if (pathStartsWith(storage_path, 'Records/Legislative Compliance/')) {
    return { category: 'Operations', subcategory: 'Records' };
  }

  if (pathStartsWith(storage_path, 'Records/Client Form/')) {
    return { category: 'Operations', subcategory: 'Records' };
  }

  // ============================================================
  // NAME-BASED RULES (for "Forms Updated/" and loose files)
  // Most specific matches first
  // ============================================================

  // --- Human Resources / Job Descriptions ---
  if (nameContains(name, ['Job Description'])) {
    return { category: 'Human Resources', subcategory: 'Job Descriptions' };
  }

  // --- Human Resources / Employment ---
  if (nameContains(name, ['Letter of Offer', 'Employment Agreement', 'Worker Information Form', 'Subcontract Agreement'])) {
    return { category: 'Human Resources', subcategory: 'Employment' };
  }

  // --- Human Resources / Performance ---
  if (nameContains(name, ['Worker Performance Assessment'])) {
    return { category: 'Human Resources', subcategory: 'Performance' };
  }

  // --- Human Resources / Induction ---
  if (nameContains(name, ['Induction Checklist', 'NDIS Code of Conduct'])) {
    return { category: 'Human Resources', subcategory: 'Induction' };
  }

  // --- Human Resources / Training ---
  if (nameContains(name, ['Training Matrix', 'Training Program', 'Document Mapping'])) {
    return { category: 'Human Resources', subcategory: 'Training' };
  }

  // --- Clinical / Behaviour Support ---
  if (nameContains(name, ['BSP', 'Behaviour Support', 'Restrictive Practice', 'Consent to Use of Restrictive', 'Consent to the Use of Restrictive', 'ABC Recording', 'Positive behaviour'])) {
    return { category: 'Clinical', subcategory: 'Behaviour Support' };
  }

  // --- Clinical / Capability Assessments ---
  if (nameContains(name, ['Capability'])) {
    return { category: 'Clinical', subcategory: 'Capability Assessments' };
  }

  // --- Clinical / Medication ---
  if (nameContains(name, ['Medication', 'PRN', 'Cytotoxic', 'S8 Medication', 'Inhalant'])) {
    return { category: 'Clinical', subcategory: 'Medication' };
  }

  // --- Clinical / Complex Health ---
  if (nameContains(name, ['Bowel Care', 'Bowel Management', 'Complex Bowel', 'Enteral Feeding',
    'Tracheostomy', 'Urinary Catheter', 'Ventilator', 'Subcutaneous', 'Complex Wound',
    'Pressure Area', 'SC Injection', 'Seizure Care Plan', 'Diabetes Care Plan'])) {
    return { category: 'Clinical', subcategory: 'Complex Health' };
  }

  // --- Clinical / Nutrition ---
  if (nameContains(name, ['Dietary Chart', 'Food Diary', 'Mealtime Management', 'Nutrition Assessment',
    'Swallowing Risk', 'Nutrition and Swallowing', 'Severe Dysphagia', 'Fluid Balance',
    'Body Measurement', 'Oral Care'])) {
    return { category: 'Clinical', subcategory: 'Nutrition' };
  }

  // --- Clinical / Care Plans ---
  if (nameContains(name, ['Goal Plan', 'Initial Assessment and Support Plan', 'Support Notes',
    'Diabetes Care', 'Seizure Care', 'Intervention Plan'])) {
    return { category: 'Clinical', subcategory: 'Care Plans' };
  }

  // --- Onboarding / Participant Intake ---
  if (nameContains(name, ['Participant Intake', 'Participant Information Consent', 'Privacy & Confidentiality', 'Referral Form'])) {
    return { category: 'Onboarding', subcategory: 'Participant Intake' };
  }

  // --- Onboarding / Service Agreements ---
  if (nameContains(name, ['Service Agreement', 'SDA Service Agreement', 'SDA & SIL Collaboration', 'Tenancy Management Agreement'])) {
    return { category: 'Onboarding', subcategory: 'Service Agreements' };
  }

  // --- Onboarding / Transition ---
  if (nameContains(name, ['Transition Plan', 'Participant Exit'])) {
    return { category: 'Onboarding', subcategory: 'Transition' };
  }

  // --- Governance & Compliance / Audits ---
  if (nameContains(name, ['Internal Audit Report', 'Internal Audit Schedule'])) {
    return { category: 'Governance & Compliance', subcategory: 'Audits' };
  }

  // --- Governance & Compliance / Risk Management ---
  if (nameContains(name, ['Risk Register', 'Risk Assessment', 'Hazard identification', 'Risk Indemnity',
    'Risk Assessed Role Register', 'Home Risk Assessment', 'Participant Disaster and Risk Assessment'])) {
    return { category: 'Governance & Compliance', subcategory: 'Risk Management' };
  }

  // --- Governance & Compliance / Compliance ---
  if (nameContains(name, ['Legislative Compliance', 'Continuous Improvement', 'Management Review',
    'Delegations of Authority', 'Delegation of authority', 'Conflict of Interest'])) {
    return { category: 'Governance & Compliance', subcategory: 'Compliance' };
  }

  // --- Governance & Compliance / Business Plans ---
  if (nameContains(name, ['Business Plan', 'Business Strategic'])) {
    return { category: 'Governance & Compliance', subcategory: 'Business Plans' };
  }

  // --- Operations / SIL & SDA ---
  if (nameContains(name, ['SDA', 'SIL'])) {
    return { category: 'Operations', subcategory: 'SIL & SDA' };
  }

  // --- Operations / Safety & WHS ---
  if (nameContains(name, ['HSE Inspection', 'Hazardous Chemical', 'Emergency Drill', 'Emergency and Disaster',
    'COVID-19 Response', 'Preventative Maintenance', 'Waste Removal'])) {
    return { category: 'Operations', subcategory: 'Safety & WHS' };
  }

  // --- Operations / Rostering ---
  if (nameContains(name, ['Rostering Schedule', 'Travel and Transport'])) {
    return { category: 'Operations', subcategory: 'Rostering' };
  }

  // --- Operations / Incidents & Complaints ---
  if (nameContains(name, ['Incident Report', 'Incident Register', 'Complaint Report', 'Complaint Register', 'Improvement Report'])) {
    return { category: 'Operations', subcategory: 'Incidents & Complaints' };
  }

  // --- Module files that didn't match above → Governance & Compliance / Policies & Modules ---
  if (isModuleFile) {
    return { category: 'Governance & Compliance', subcategory: 'Policies & Modules' };
  }

  // --- Operations / General (catch-all) ---
  // notification-approval-consent, Advocate Nomination, Additional Support Request,
  // Client Money, Money Reconciliation, Group Activities, Table of Event,
  // Early Childhood Provider Report, High Risk Participant Register, Minutes, Personnel Required,
  // Participant Survey, Worker Handbook, etc.
  return { category: 'Operations', subcategory: 'General' };
}

async function main() {
  console.log('Fetching all documents from Supabase...\n');

  const { data: documents, error } = await supabase
    .from('documents')
    .select('*');

  if (error) {
    console.error('Error fetching documents:', error);
    process.exit(1);
  }

  console.log(`Found ${documents.length} documents.\n`);

  // Track changes and summary
  const summary = {};
  const updates = [];
  let unchanged = 0;
  let changed = 0;

  for (const doc of documents) {
    const { category, subcategory } = categorize(doc);

    // Track summary
    const key = `${category} > ${subcategory}`;
    if (!summary[key]) summary[key] = [];
    summary[key].push(doc.name);

    if (doc.category !== category || doc.subcategory !== subcategory) {
      changed++;
      updates.push({
        id: doc.id,
        category,
        subcategory,
        oldCategory: doc.category,
        oldSubcategory: doc.subcategory,
        name: doc.name,
      });
    } else {
      unchanged++;
    }
  }

  // Perform batch updates
  console.log(`Documents to update: ${changed}`);
  console.log(`Documents already correct: ${unchanged}\n`);

  if (updates.length > 0) {
    console.log('Updating documents...\n');

    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      const results = await Promise.all(
        batch.map(async (u) => {
          const { error } = await supabase
            .from('documents')
            .update({
              category: u.category,
              subcategory: u.subcategory,
              updated_at: new Date().toISOString(),
            })
            .eq('id', u.id);

          if (error) {
            console.error(`  ERROR updating "${u.name}": ${error.message}`);
            return false;
          }
          return true;
        })
      );

      successCount += results.filter(Boolean).length;
      errorCount += results.filter(r => !r).length;

      console.log(`  Batch ${Math.floor(i / batchSize) + 1}: ${results.filter(Boolean).length}/${batch.length} updated`);
    }

    console.log(`\nUpdate complete: ${successCount} succeeded, ${errorCount} failed.\n`);
  }

  // Print summary sorted by category
  console.log('='.repeat(70));
  console.log('RECATEGORIZATION SUMMARY');
  console.log('='.repeat(70));

  const sortedKeys = Object.keys(summary).sort();
  let totalCounted = 0;

  // Group by category
  const categoryGroups = {};
  for (const key of sortedKeys) {
    const parts = key.split(' > ');
    const cat = parts[0];
    const sub = parts[1];
    if (!categoryGroups[cat]) categoryGroups[cat] = {};
    categoryGroups[cat][sub] = summary[key];
  }

  for (const cat of Object.keys(categoryGroups).sort()) {
    let catTotal = 0;
    const subs = categoryGroups[cat];
    for (const sub of Object.keys(subs).sort()) {
      catTotal += subs[sub].length;
    }
    console.log(`\n${cat} (${catTotal} documents)`);
    console.log('-'.repeat(50));

    for (const sub of Object.keys(subs).sort()) {
      const docs = subs[sub];
      totalCounted += docs.length;
      console.log(`  ${sub}: ${docs.length}`);
      for (const d of docs.sort()) {
        console.log(`    - ${d}`);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`TOTAL: ${totalCounted} documents categorized`);
  console.log('='.repeat(70));
}

main().catch(console.error);
