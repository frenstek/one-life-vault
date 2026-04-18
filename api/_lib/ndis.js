/**
 * NDIS compliance constants and helpers.
 */

// All required document types for NDIS disability support workers
export const REQUIRED_DOCUMENT_TYPES = [
  'Police Check (National)',
  'Working with Children Check (WWCC)',
  'NDIS Worker Screening Check',
  'First Aid Certificate',
  'CPR Certificate',
  "Driver's License",
  'Manual Handling Certificate',
  'Medication Administration Certificate',
  'COVID-19 Vaccination',
  'Qualifications/Degree',
  'Employment Contract',
  'Visa/Work Rights',
];

/**
 * Calculate document status based on expiry date.
 * @param {string|null} expiryDate - ISO date string or null
 * @returns {'valid'|'expiring'|'expired'|'valid'} status
 */
export function calcDocumentStatus(expiryDate) {
  if (!expiryDate) return 'valid'; // No expiry means perpetually valid (e.g. qualifications)

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < now) return 'expired';

  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expiry <= thirtyDaysFromNow) return 'expiring';

  return 'valid';
}

/**
 * Build compliance summary for a staff member given their documents.
 * @param {Array} documents - Array of staff_documents records
 * @returns {Object} compliance summary
 */
export function buildComplianceSummary(documents) {
  const totalRequired = REQUIRED_DOCUMENT_TYPES.length;
  const uploadedTypes = new Set(documents.map((d) => d.document_type));
  const docsUploaded = REQUIRED_DOCUMENT_TYPES.filter((t) => uploadedTypes.has(t)).length;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  let docsExpiring = 0;
  let docsExpired = 0;

  for (const doc of documents) {
    if (!doc.expiry_date) continue;
    const expiry = new Date(doc.expiry_date);
    expiry.setHours(0, 0, 0, 0);
    if (expiry < now) {
      docsExpired++;
    } else if (expiry <= thirtyDaysFromNow) {
      docsExpiring++;
    }
  }

  const isFullyCompliant = docsUploaded === totalRequired && docsExpired === 0;

  return {
    total_required: totalRequired,
    docs_uploaded: docsUploaded,
    docs_expiring: docsExpiring,
    docs_expired: docsExpired,
    is_fully_compliant: isFullyCompliant,
  };
}
