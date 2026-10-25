import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const NAVY = [15, 82, 138]; // #0F528A
const LIGHT_BG = [245, 247, 250];
const LOGO_URL = '/logo.png';

/**
 * Export a register table to PDF
 * @param {object} opts
 * @param {string} opts.title - Register name e.g. "Incident Register"
 * @param {string[]} opts.columns - Column headers
 * @param {string[][]} opts.rows - Array of row data (strings)
 * @param {string} [opts.orientation] - 'portrait' or 'landscape' (default: auto based on column count)
 * @param {string} [opts.filename] - Output filename
 * @param {string} [opts.subtitle] - Optional subtitle line
 * @param {number[]} [opts.columnWidths] - Optional column width ratios
 */
export async function exportRegisterPdf({
  title,
  columns,
  rows,
  orientation,
  filename,
  subtitle,
  columnWidths,
}) {
  const orient = orientation || (columns.length > 6 ? 'landscape' : 'portrait');
  const pdf = new jsPDF({ orientation: orient, unit: 'mm', format: 'a4' });
  const pageW = orient === 'landscape' ? 297 : 210;
  const margin = 12;

  // Load logo
  let logoImg = null;
  try {
    const resp = await fetch(LOGO_URL);
    const blob = await resp.blob();
    const reader = new FileReader();
    logoImg = await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch { /* logo optional */ }

  // Header
  let y = 10;
  if (logoImg) {
    pdf.addImage(logoImg, 'PNG', pageW / 2 - 20, y, 40, 16);
    y += 20;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...NAVY);
  pdf.text(title.toUpperCase(), pageW / 2, y, { align: 'center' });
  y += 5;

  if (subtitle) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(subtitle, pageW / 2, y, { align: 'center' });
    y += 4;
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(160, 160, 160);
  pdf.text(
    `One Life Foundation | ABN: 55 643 227 061 | Generated: ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    pageW / 2, y, { align: 'center' }
  );
  y += 6;

  // Table
  const tableOpts = {
    startY: y,
    head: [columns],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 2.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 6.5,
      cellPadding: 2,
      textColor: [50, 50, 50],
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: LIGHT_BG,
    },
    margin: { left: margin, right: margin },
    styles: {
      overflow: 'linebreak',
      cellWidth: 'auto',
    },
    didDrawPage: (data) => {
      // Footer on every page
      const pageH = orient === 'landscape' ? 210 : 297;
      pdf.setFontSize(6);
      pdf.setTextColor(180, 180, 180);
      pdf.text(
        `One Life Foundation | ${title}`,
        margin, pageH - 7
      );
      pdf.text(
        `Page ${pdf.internal.getCurrentPageInfo().pageNumber}`,
        pageW - margin, pageH - 7, { align: 'right' }
      );
    },
  };

  if (columnWidths) {
    const totalW = pageW - margin * 2;
    const sum = columnWidths.reduce((a, b) => a + b, 0);
    tableOpts.columnStyles = {};
    columnWidths.forEach((w, i) => {
      tableOpts.columnStyles[i] = { cellWidth: (w / sum) * totalW };
    });
  }

  autoTable(pdf, tableOpts);

  // Summary line
  const finalY = pdf.lastAutoTable.finalY + 4;
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Total records: ${rows.length}`, margin, finalY);

  // Save
  const safeName = filename || `OLF-${title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(safeName);
}
