import { useState } from 'react';
import { HiXMark, HiDocumentArrowDown } from 'react-icons/hi2';

// SCHADS Award — Social and Community Services Employee stream
// Effective 1 October 2025 (Pay Guide G01002983)
const SCHADS_RATES = [
  { level: 1, pp: 1, weekly: 999.40, hourly: 26.30, casual: 32.88, label: 'Level 1 PP1 — Entry, no quals' },
  { level: 1, pp: 2, weekly: 1031.60, hourly: 27.15, casual: 33.94, label: 'Level 1 PP2' },
  { level: 1, pp: 3, weekly: 1068.40, hourly: 28.12, casual: 35.15, label: 'Level 1 PP3' },
  { level: 2, pp: 1, weekly: 1314.13, hourly: 34.58, casual: 43.23, label: 'Level 2 PP1 — Cert III or equivalent' },
  { level: 2, pp: 2, weekly: 1355.46, hourly: 35.67, casual: 44.59, label: 'Level 2 PP2' },
  { level: 2, pp: 3, weekly: 1396.67, hourly: 36.75, casual: 45.94, label: 'Level 2 PP3' },
  { level: 2, pp: 4, weekly: 1433.81, hourly: 37.73, casual: 47.16, label: 'Level 2 PP4' },
  { level: 3, pp: 1, weekly: 1468.78, hourly: 38.65, casual: 48.31, label: 'Level 3 PP1 — Experienced / Cert IV' },
  { level: 3, pp: 2, weekly: 1511.12, hourly: 39.77, casual: 49.71, label: 'Level 3 PP2' },
  { level: 3, pp: 3, weekly: 1543.37, hourly: 40.62, casual: 50.78, label: 'Level 3 PP3' },
  { level: 3, pp: 4, weekly: 1575.13, hourly: 41.45, casual: 51.81, label: 'Level 3 PP4' },
  { level: 4, pp: 1, weekly: 1694.22, hourly: 44.58, casual: 55.73, label: 'Level 4 PP1 — Senior / Team Leader' },
  { level: 4, pp: 2, weekly: 1738.44, hourly: 45.75, casual: 57.19, label: 'Level 4 PP2' },
  { level: 4, pp: 3, weekly: 1783.19, hourly: 46.93, casual: 58.66, label: 'Level 4 PP3' },
  { level: 4, pp: 4, weekly: 1822.92, hourly: 47.97, casual: 59.96, label: 'Level 4 PP4' },
  { level: 5, pp: 1, weekly: 1938.14, hourly: 51.00, casual: 63.75, label: 'Level 5 PP1 — Advanced / Specialist' },
  { level: 5, pp: 2, weekly: 1979.92, hourly: 52.10, casual: 65.13, label: 'Level 5 PP2' },
  { level: 5, pp: 3, weekly: 2025.96, hourly: 53.31, casual: 66.64, label: 'Level 5 PP3' },
  { level: 6, pp: 1, weekly: 2117.50, hourly: 55.72, casual: 69.65, label: 'Level 6 PP1 — Senior Specialist / Manager' },
  { level: 6, pp: 2, weekly: 2164.26, hourly: 56.95, casual: 71.19, label: 'Level 6 PP2' },
  { level: 6, pp: 3, weekly: 2211.16, hourly: 58.19, casual: 72.74, label: 'Level 6 PP3' },
  { level: 7, pp: 1, weekly: 2290.18, hourly: 60.27, casual: 75.34, label: 'Level 7 PP1 — Senior Management' },
  { level: 7, pp: 2, weekly: 2338.31, hourly: 61.53, casual: 76.91, label: 'Level 7 PP2' },
  { level: 7, pp: 3, weekly: 2385.88, hourly: 62.79, casual: 78.49, label: 'Level 7 PP3' },
  { level: 8, pp: 1, weekly: 2484.72, hourly: 65.39, casual: 81.74, label: 'Level 8 PP1 — Executive / Director' },
  { level: 8, pp: 2, weekly: 2533.59, hourly: 66.67, casual: 83.34, label: 'Level 8 PP2' },
  { level: 8, pp: 3, weekly: 2582.60, hourly: 67.96, casual: 84.95, label: 'Level 8 PP3' },
];

function fmt(n) { return '$' + n.toFixed(2); }
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function GenerateContractModal({ member, onClose }) {
  const [selectedRate, setSelectedRate] = useState('3'); // index into SCHADS_RATES (L2 PP1 default)
  const [employmentType, setEmploymentType] = useState(member.position_type || 'Casual');
  const [commenceDate, setCommenceDate] = useState(member.start_date || today());
  const [generating, setGenerating] = useState(false);

  const rate = SCHADS_RATES[parseInt(selectedRate)];
  const isCasual = employmentType === 'Casual';
  const effectiveHourly = isCasual ? rate.casual : rate.hourly;
  const baseRate = rate.hourly;

  async function handleGenerate() {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const PW = 210, PH = 297;
      const ML = 22, MR = 22, MT = 20;
      const CW = PW - ML - MR;
      const GREEN = [14, 128, 60];
      const DARK = [30, 30, 30];
      const MED = [80, 80, 80];
      const LIGHT = [140, 140, 140];
      const BORDER = [200, 200, 200];

      let y = MT;
      let pageNum = 1;
      let logoData = null;
      let signatureData = null;

      // ── Load images (logo + signature) ──
      async function loadImage(src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = src;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/png');
      }

      try { logoData = await loadImage('/logo.png'); } catch {}
      try { signatureData = await loadImage('/signature.png'); } catch {}

      // ── Helpers ──
      function setFont(style = 'normal', size = 10) {
        pdf.setFontSize(size);
        pdf.setFont('helvetica', style);
      }

      function setColor(c) { pdf.setTextColor(c[0], c[1], c[2]); }

      function checkPage(needed = 20) {
        if (y + needed > PH - 30) {
          addFooter();
          pdf.addPage();
          pageNum++;
          y = MT;
          addHeader();
        }
      }

      function addHeader() {
        pdf.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
        pdf.rect(0, 0, PW, 14, 'F');
        if (logoData) {
          // Logo is ~2:1 ratio (522x267), fit within header bar
          try { pdf.addImage(logoData, 'PNG', ML - 4, 2, 20, 10); } catch {}
        }
        setFont('bold', 8.5);
        pdf.setTextColor(255, 255, 255);
        pdf.text('One Life Foundation Pty Ltd', logoData ? ML + 18 : ML, 9);
        setFont('normal', 7);
        pdf.text('ABN 55 643 227 061  |  NDIS Reg. 405 012 0437', PW - MR, 9, { align: 'right' });
        y = MT + 4;
      }

      function addFooter() {
        setFont('normal', 7);
        setColor(LIGHT);
        const fy = PH - 12;
        pdf.text('One Life Foundation Pty Ltd  |  ABN 55 643 227 061  |  NDIS Registration No. 405 012 0437', PW / 2, fy, { align: 'center' });
        pdf.text('Phone: (04) 5222 7799  |  support@olfndisservices.com.au', PW / 2, fy + 4, { align: 'center' });
        pdf.text(`Page ${pageNum}`, PW - MR, fy + 4, { align: 'right' });
      }

      function heading(text) {
        checkPage(14);
        setFont('bold', 12);
        setColor(GREEN);
        pdf.text(text, ML, y);
        y += 3;
        pdf.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
        pdf.setLineWidth(0.5);
        pdf.line(ML, y, ML + CW, y);
        y += 7;
      }

      function sectionTitle(num, title) {
        checkPage(14);
        setFont('bold', 11);
        setColor(DARK);
        pdf.text(`${num}. ${title}`, ML, y);
        y += 7;
      }

      function para(text, indent = 0) {
        setFont('normal', 9.5);
        setColor(MED);
        const lines = pdf.splitTextToSize(text, CW - indent);
        for (const line of lines) {
          checkPage(5);
          pdf.text(line, ML + indent, y);
          y += 4.5;
        }
        y += 2;
      }

      function bullet(text, indent = 4) {
        setFont('normal', 9.5);
        setColor(MED);
        const lines = pdf.splitTextToSize(text, CW - indent - 4);
        checkPage(5);
        pdf.text('•', ML + indent, y);
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) checkPage(5);
          pdf.text(lines[i], ML + indent + 4, y);
          y += 4.5;
        }
      }

      function labelValue(label, value, xOffset = 0) {
        checkPage(6);
        setFont('bold', 9.5);
        setColor(DARK);
        pdf.text(label, ML + xOffset, y);
        setFont('normal', 9.5);
        setColor(MED);
        pdf.text(String(value || '—'), ML + 55 + xOffset, y);
        y += 6;
      }

      const fullName = `${member.first_name} ${member.last_name}`;
      const addr = member.address || 'Address on file';
      const levelLabel = `Level ${rate.level}, Pay Point ${rate.pp}`;

      // ══════════════════════════════════════════════════════════════
      // PAGE 1 — Cover / Position Details
      // ══════════════════════════════════════════════════════════════
      addHeader();

      // Company info block
      y = MT + 12;
      setFont('bold', 14);
      setColor(GREEN);
      pdf.text('One Life Foundation', ML, y);
      y += 5;
      setFont('normal', 8);
      setColor(LIGHT);
      pdf.text('ABN 55 643 227 061 • NDIS Registration No. 405 012 0437', ML, y);
      y += 4;
      pdf.text('1343-1345 Donnybrook Rd, Woodstock, VIC', ML, y);
      y += 4;
      pdf.text('(04) 5222 7799 • support@olfndisservices.com.au', ML, y);
      y += 10;

      // Date & recipient
      setFont('normal', 9.5);
      setColor(DARK);
      pdf.text(`Date:  ${fmtDate(today())}`, ML, y); y += 6;
      pdf.text(`To:  ${fullName}`, ML, y); y += 6;
      pdf.text(`Address: ${addr}`, ML, y); y += 10;

      // Title
      heading('Letter of Engagement — Disability Support Worker');

      para(`Dear ${member.first_name},`);
      para('We are pleased to offer you a position as a Disability Support Worker with One Life Foundation Pty Ltd. We believe your skills and experience will be a valuable addition to our team, and we look forward to working with you to deliver quality support to our participants.');
      para('Please read the following terms and conditions carefully before signing.');

      // Section 1 — Position Details
      sectionTitle('1', 'Position Details');

      labelValue('Position Title', 'Disability Support Worker');
      labelValue('Employment Type', employmentType);
      labelValue('Commencement Date', fmtDate(commenceDate));
      labelValue('Reporting To', 'General Manager and Operations Manager');
      labelValue('Primary Location', 'Various locations as directed');
      labelValue('Award Classification', `SCHADS Award 2010 — ${levelLabel}`);
      if (isCasual) {
        labelValue('Hourly Rate', `${fmt(effectiveHourly)} per hour (inclusive of 25% casual loading)`);
        y += 1;
        setFont('normal', 8.5);
        setColor(LIGHT);
        pdf.text(`Base rate: ${fmt(baseRate)}/hr + 25% casual loading = ${fmt(effectiveHourly)}/hr`, ML + 55, y);
        y += 8;
      } else {
        labelValue('Weekly Rate', `${fmt(rate.weekly)} per week`);
        labelValue('Hourly Rate', `${fmt(rate.hourly)} per hour`);
      }

      // Section 2 — Nature of Employment
      sectionTitle('2', 'Nature of Casual Employment');
      para(`Your employment will be on a ${employmentType.toLowerCase()} basis under section 15A of the Fair Work Act 2009 (Cth), commencing on the date specified above.`);
      if (isCasual) {
        para('As a casual employee:');
        bullet('One Life Foundation makes no firm advance commitment to continuing and indefinite work according to an agreed work pattern.');
        bullet('Work will be offered to you as it becomes available, and you may accept or decline each offer.');
        bullet('You will be paid a casual loading in lieu of entitlements such as paid annual leave and paid personal/carer\'s leave.');
        bullet('Each engagement stands alone — there is no guaranteed minimum number of hours per week.');
        y += 3;
        setFont('bold', 10);
        setColor(DARK);
        checkPage(8);
        pdf.text('Casual Conversion', ML, y); y += 6;
        para('As a casual employee, you may have the right to request conversion to permanent (full-time or part-time) employment under the Fair Work Act 2009. The general requirements are:');
        bullet('You have been employed by One Life Foundation for at least 12 months;');
        bullet('You have worked a regular pattern of hours for at least the last 6 months on an ongoing basis; and');
        bullet('Those hours could reasonably continue as a permanent employee without significant change.');
        para('If you believe you meet these requirements, you may submit a written request to your manager. One Life Foundation will respond within 21 days in accordance with its obligations under the Act.');
      }

      // Section 3 — Duties
      sectionTitle('3', 'Duties and Responsibilities');
      para('Your role as a Disability Support Worker will include, but is not limited to:');
      bullet('Providing in-home and community-based support to NDIS participants with daily living tasks, including personal care, meal preparation, domestic assistance, and transport.');
      bullet('Supporting participants with community access and social participation, including medical appointments, shopping, and recreational outings.');
      bullet('Assisting participants to build self-confidence, independence, and social skills in line with their individual goals and support plans.');
      bullet('Developing and implementing participant-specific programs in collaboration with coordinators and allied health professionals.');
      bullet('Safely operating mobility equipment, including hoists, wheelchairs, and shower chairs, in accordance with training provided.');
      bullet('Accurately completing shift notes, incident reports, and other documentation as required.');
      bullet('Following all participant support plans, risk assessments, and behavioural support plans.');
      bullet('Reporting any concerns regarding participant welfare, safety, or changes in condition to your supervisor promptly.');
      para('You may also be required to perform other duties reasonably directed by One Life Foundation, having regard to your skills, training, and experience.');

      // Section 4 — Terms and Conditions
      sectionTitle('4', 'Terms and Conditions of Employment');
      para('Unless more generous provisions are set out in this letter or the attached schedule, the terms and conditions of your employment will be those contained in the Social, Community, Home Care and Disability Services Industry Award 2010 and applicable legislation, including the National Employment Standards (NES) in the Fair Work Act 2009 (Cth).');
      para('You can access information about minimum terms and conditions of employment from the Fair Work Ombudsman on 13 13 94 or at www.fairwork.gov.au.');

      // Section 5 — Pre-Employment Requirements
      sectionTitle('5', 'Pre-Employment Requirements');
      para('This offer of employment is conditional upon satisfactory completion of the following:');
      bullet('NDIS Worker Screening Check — You must hold a valid and current NDIS Worker Screening clearance prior to commencing work.');
      bullet('First Aid and CPR Certification — A current First Aid and CPR certificate must be provided prior to your first shift.');
      bullet('Right to Work in Australia — Evidence of your right to work in Australia (e.g., passport, visa, birth certificate).');
      bullet('Driver\'s Licence — A current Australian driver\'s licence (where the role requires transport of participants).');
      bullet('Referee Checks — Satisfactory completion of reference checks from two professional referees.');
      para('Failure to provide the above documentation may result in the withdrawal of this offer or termination of employment.');

      // Section 6 — NDIS Code of Conduct
      sectionTitle('6', 'NDIS Code of Conduct');
      para('As an employee delivering NDIS-funded supports, you are required to comply with the NDIS Code of Conduct at all times. This means you must:');
      bullet('Act with respect for individual rights to freedom of expression, self-determination, and decision-making in accordance with applicable laws and conventions.');
      bullet('Respect the privacy of people with disability.');
      bullet('Provide supports and services in a safe and competent manner, with care and skill.');
      bullet('Act with integrity, honesty, and transparency.');
      bullet('Promptly take steps to raise and act on concerns about matters that may impact the quality and safety of supports and services provided to people with disability.');
      bullet('Take all reasonable steps to prevent and respond to all forms of violence against, and exploitation, neglect, and abuse of, people with disability.');
      bullet('Take all reasonable steps to prevent and respond to sexual misconduct.');
      para('A breach of the NDIS Code of Conduct may result in disciplinary action, including termination of employment, and may be reported to the NDIS Quality and Safeguards Commission.');

      // Section 7 — WHS
      sectionTitle('7', 'Work Health and Safety');
      para('One Life Foundation is committed to providing a safe working environment. You are required to:');
      bullet('Take reasonable care for your own health and safety and the health and safety of others.');
      bullet('Comply with all workplace health and safety policies, procedures, and reasonable instructions.');
      bullet('Use personal protective equipment (PPE) as required.');
      bullet('Report all hazards, incidents, near misses, and injuries immediately to your supervisor.');
      bullet('Not attend work while under the influence of drugs or alcohol.');
      bullet('Participate in WHS training and inductions as required.');

      // Section 8 — Incident Reporting
      sectionTitle('8', 'Incident Reporting');
      para('You are required to report all incidents, accidents, near misses, and allegations of abuse, neglect, or exploitation immediately to your supervisor and in accordance with One Life Foundation\'s Incident Management Policy. Reportable incidents must also be notified to the NDIS Quality and Safeguards Commission as required by law.');

      // Section 9 — Confidentiality
      sectionTitle('9', 'Confidentiality and Privacy');
      para('By accepting this offer, you acknowledge and agree that you will not, during or after your employment, except with the express written consent of One Life Foundation or as required by law or in the proper performance of your duties:');
      bullet('Use or disclose any confidential information relating to One Life Foundation\'s business, including but not limited to participant details, support plans, medical information, operational data, trade secrets, pricing structures, and internal policies.');
      bullet('Access, copy, or remove any records, documents, or data belonging to One Life Foundation or its participants except as necessary for your duties.');
      para('You must comply with the Privacy Act 1988 (Cth) and the Australian Privacy Principles at all times. This obligation of confidentiality survives the termination of your employment.');

      // Section 10 — Conflict of Interest
      sectionTitle('10', 'Conflict of Interest');
      para('You must disclose to One Life Foundation any actual, potential, or perceived conflict of interest that may arise during your employment. You must not, without prior written approval, engage in any outside employment or activity that may conflict with your duties or with the interests of One Life Foundation or its participants.');

      // Section 11 — Training
      sectionTitle('11', 'Training and Professional Development');
      para('You are required to:');
      bullet('Complete all mandatory induction and orientation training prior to or upon commencement.');
      bullet('Attend and complete ongoing training as directed by One Life Foundation, including refresher courses for First Aid, CPR, manual handling, and medication administration.');
      bullet('Maintain current and valid certifications as required for your role (NDIS Worker Screening, First Aid/CPR).');
      bullet('Participate in performance reviews and professional development discussions as scheduled.');
      para('One Life Foundation will provide reasonable support and access to training opportunities relevant to your role.');

      // Section 12 — Drug and Alcohol
      sectionTitle('12', 'Drug and Alcohol Policy');
      para('You must not attend work, or perform any duties on behalf of One Life Foundation, while under the influence of alcohol, illicit drugs, or any substance that may impair your ability to perform your duties safely. One Life Foundation reserves the right to conduct drug and alcohol testing in accordance with its policies and applicable law.');

      // Section 13 — Property
      sectionTitle('13', 'Use of Property and Technology');
      para('Any property, equipment, uniforms, keys, access cards, mobile devices, or technology provided to you by One Life Foundation remains the property of One Life Foundation and must be:');
      bullet('Used only for authorised work purposes.');
      bullet('Maintained in good condition.');
      bullet('Returned immediately upon request or upon termination of employment.');
      para('You must not use personal devices to photograph, record, or store participant information unless expressly authorised in writing.');

      // Section 14 — Termination
      sectionTitle('14', 'Termination of Employment');
      if (isCasual) {
        para('As a casual employee, your employment may be terminated at any time by either party. One Life Foundation may cease offering you shifts without notice, and you may cease accepting shifts without notice.');
      }
      para('Notwithstanding the above, One Life Foundation may terminate your employment immediately (summary dismissal) in cases of serious misconduct, including but not limited to:');
      bullet('Theft, fraud, or dishonesty.');
      bullet('Serious breach of the NDIS Code of Conduct.');
      bullet('Violence, harassment, or bullying.');
      bullet('Being under the influence of drugs or alcohol while on duty.');
      bullet('Serious or wilful neglect of duties.');
      bullet('Any conduct that poses a risk to the safety or wellbeing of participants, staff, or the public.');
      para('Upon termination, you must return all One Life Foundation property and cease using any confidential information.');

      // Section 15 — The Agreement
      sectionTitle('15', 'The Agreement');
      para('The terms and conditions set out in this letter and the attached schedule constitute the complete terms of your engagement and replace any prior understanding, agreement, or representation between you and One Life Foundation.');
      para('These terms may only be varied by a written agreement signed by both you and an authorised representative of One Life Foundation.');
      y += 2;
      setFont('bold', 10); setColor(DARK);
      checkPage(8);
      pdf.text('Attached Schedule', ML, y); y += 6;
      para('The following documents form part of this engagement:');
      bullet('Disability Support Worker — Position Description');
      bullet('Fair Work Information Statement (National Employment Standards)');
      bullet('Casual Employment Information Statement');
      bullet('One Life Foundation Policies and Procedures (available via the staff portal)');

      // Section 16 — Contact
      sectionTitle('16', 'Contact');
      para('If you have any questions about the terms and conditions of your employment, please do not hesitate to contact us:');
      labelValue('Email', 'support@olfndisservices.com.au');
      labelValue('Phone', '(04) 5222 7799');
      y += 4;
      para('We look forward to welcoming you to the One Life Foundation team and are confident you will make a positive contribution to the lives of the participants we support.');

      // Keep sign-off block together — needs ~45mm of space
      checkPage(50);
      y += 4;
      setFont('normal', 9.5); setColor(MED);
      pdf.text('Yours sincerely,', ML, y);
      y += 16;

      // Signature block — auto-filled
      const gmName = 'Kevin Rae Geronimo';
      const signDate = fmtDate(today());

      // Signature image
      if (signatureData) {
        try { pdf.addImage(signatureData, 'PNG', ML + 50, y - 14, 40, 20); } catch {}
      }

      pdf.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);

      // Labels
      setFont('bold', 8); setColor(LIGHT);
      pdf.text('NAME', ML, y);
      pdf.text('SIGNATURE', ML + 55, y);
      pdf.text('DATE', ML + 120, y);
      y += 2;
      pdf.line(ML, y, ML + 40, y);
      pdf.line(ML + 55, y, ML + 110, y);
      pdf.line(ML + 120, y, ML + CW, y);
      y += 5;

      // Auto-filled values
      setFont('normal', 10); setColor(DARK);
      pdf.text(gmName, ML, y);
      pdf.text(signDate, ML + 120, y);
      y += 5;
      setFont('normal', 8.5); setColor(LIGHT);
      pdf.text('General Manager', ML, y);
      pdf.text('One Life Foundation Pty Ltd', ML, y + 4);

      // ── ACCEPTANCE SECTION (flows after sign-off, no forced page break) ──
      y += 14;

      heading('Acceptance of Offer');
      para('I, the undersigned, confirm that I have read and understood the terms and conditions of employment set out in this letter and the attached schedule. I accept this offer of casual employment and acknowledge that:');
      bullet('I understand the nature of casual employment as described in this letter.');
      bullet('I agree to comply with the NDIS Code of Conduct at all times.');
      bullet('I agree to comply with all One Life Foundation policies and procedures.');
      bullet('I will maintain all required certifications and screening checks throughout my employment.');
      bullet('I understand my obligations regarding confidentiality, privacy, and incident reporting.');
      bullet('I have received and read the Fair Work Information Statement and the Casual Employment Information Statement.');

      y += 8;
      checkPage(30);
      setFont('bold', 10); setColor(DARK);
      pdf.text('Employee', ML, y); y += 8;

      setFont('bold', 9); setColor(DARK);
      pdf.text('FULL NAME', ML, y);
      pdf.text('SIGNATURE', ML + 55, y);
      pdf.text('DATE', ML + 120, y);
      y += 2;
      pdf.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
      pdf.line(ML, y, ML + 40, y);
      pdf.line(ML + 55, y, ML + 110, y);
      pdf.line(ML + 120, y, ML + CW, y);

      y += 10;
      setFont('italic', 9); setColor(LIGHT);
      para('Please return the signed acceptance to One Life Foundation within 7 days of the date of this letter.');

      addFooter();

      // Save
      const fileName = `Letter_of_Engagement_${member.first_name}_${member.last_name}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Contract generation error:', err);
      alert('Failed to generate contract: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#263554] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Generate Contract</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {member.first_name} {member.last_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Employment Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Employment Type
            </label>
            <select
              value={employmentType}
              onChange={e => setEmploymentType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#1e2d4a] px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Casual">Casual</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Full-Time">Full-Time</option>
            </select>
          </div>

          {/* SCHADS Level */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              SCHADS Award Classification
            </label>
            <select
              value={selectedRate}
              onChange={e => setSelectedRate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#1e2d4a] px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {SCHADS_RATES.map((r, i) => (
                <option key={i} value={i}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Rate Preview */}
          <div className="rounded-lg border border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#0f1a2e] p-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Pay Rate Preview
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400">Base Hourly</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{fmt(rate.hourly)}</p>
              </div>
              {isCasual && (
                <div>
                  <p className="text-xs text-slate-400">Casual Rate (+25%)</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{fmt(rate.casual)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400">Weekly (FT/PT)</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{fmt(rate.weekly)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Classification</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Level {rate.level}, PP {rate.pp}</p>
              </div>
            </div>
          </div>

          {/* Commencement Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Commencement Date
            </label>
            <input
              type="date"
              value={commenceDate}
              onChange={e => setCommenceDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#1e2d4a] px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-[#263554] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 dark:border-[#263554] px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {generating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating...
              </>
            ) : (
              <>
                <HiDocumentArrowDown className="h-4 w-4" />
                Generate PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
