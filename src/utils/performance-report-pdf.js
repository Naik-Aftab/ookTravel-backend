const PDFDocument = require('pdfkit');
const { LOGO_PATH, LOGO_ASPECT } = require('./logo');

const NAVY        = '#0c4a6e';
const SLATE       = '#334155';
const LIGHT_SLATE = '#94a3b8';
const BORDER      = '#e2e8f0';
const GREEN       = '#16a34a';
const RED         = '#dc2626';
const INK         = '#0f172a';

function fmtMoney(n) {
  return `Rs. ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function fmtPct(n) {
  const v = Number(n || 0);
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Renders the RM & Agent performance report as a pdfkit-built PDF buffer, following the same
// header/color conventions as invoice-pdf.js.
function generatePerformanceReportPdf({ summary, rmRows, agentRows }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const marginX      = 40;
    const pageWidth     = doc.page.width;
    const contentWidth  = pageWidth - marginX * 2;
    const pageBottom    = doc.page.height - 45;
    let y;

    function drawHeader(subtitle) {
      const headerH = 90;
      doc.rect(0, 0, pageWidth, headerH).fill(NAVY);

      const logoW = 90;
      const logoH = logoW * LOGO_ASPECT;
      doc.roundedRect(marginX, 15, logoW + 14, logoH + 14, 6).fill('#ffffff');
      doc.image(LOGO_PATH, marginX + 7, 22, { width: logoW, height: logoH });

      const textX = marginX + logoW + 30;
      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
        .text('RM & Agent Performance Report', textX, 28, { width: contentWidth - logoW - 30 });
      doc.fillColor('#bae6fd').fontSize(9.5).font('Helvetica')
        .text(subtitle, textX, 50, { width: contentWidth - logoW - 30 });

      return headerH + 25;
    }

    function ensureSpace(height) {
      if (y + height > pageBottom) {
        doc.addPage();
        y = 40;
        return true;
      }
      return false;
    }

    function sectionTitle(text) {
      ensureSpace(30);
      doc.fillColor(INK).fontSize(13).font('Helvetica-Bold').text(text, marginX, y);
      y += 19;
      doc.moveTo(marginX, y).lineTo(marginX + contentWidth, y).strokeColor(BORDER).stroke();
      y += 12;
    }

    function table(title, columns, rows) {
      sectionTitle(title);
      const headerRowH = 20;
      const rowH = 18;

      function drawTableHeader() {
        doc.rect(marginX, y, contentWidth, headerRowH).fill('#f1f5f9');
        let x = marginX;
        columns.forEach(col => {
          doc.fillColor(SLATE).fontSize(7.5).font('Helvetica-Bold')
            .text(col.label.toUpperCase(), x + 6, y + 6, { width: col.width - 10, align: col.align || 'left' });
          x += col.width;
        });
        y += headerRowH;
      }

      ensureSpace(headerRowH + rowH);
      drawTableHeader();

      if (!rows.length) {
        doc.fillColor(LIGHT_SLATE).fontSize(9).font('Helvetica').text('No data for this period', marginX + 6, y + 4);
        y += rowH;
        return;
      }

      rows.forEach((row, i) => {
        if (ensureSpace(rowH)) drawTableHeader();

        if (i % 2 === 1) doc.rect(marginX, y, contentWidth, rowH).fill('#f8fafc');
        let x = marginX;
        columns.forEach(col => {
          const val = col.render ? col.render(row) : row[col.key];
          doc.fillColor(col.color ? col.color(row) : INK).fontSize(8.5).font('Helvetica')
            .text(val === null || val === undefined ? '-' : String(val), x + 6, y + 5, { width: col.width - 10, align: col.align || 'left' });
          x += col.width;
        });
        y += rowH;
      });
      y += 15;
    }

    // --- Header ---
    y = drawHeader(`${summary.period_label}  ·  ${fmtDate(summary.from)} - ${fmtDate(summary.to)}  ·  Generated ${fmtDate(new Date())}`);

    // --- Business Summary KPI grid ---
    sectionTitle('Business Summary');
    const kpis = [
      ['Total Revenue',        fmtMoney(summary.total_revenue),  summary.revenue_growth_pct],
      ['Policies Issued',      String(summary.total_policies),   summary.policies_growth_pct],
      ['Commission Paid',      fmtMoney(summary.commission_paid), null],
      ['Commission Pending',   fmtMoney(summary.commission_pending), null],
      ['New Agents Onboarded', String(summary.new_agents),       null],
      ['Active Agents',        `${summary.active_agents} / ${summary.total_agents}`, null],
    ];
    const cols3 = 3;
    const colW  = contentWidth / cols3;
    const kpiRowH = 58;
    const gridRows = Math.ceil(kpis.length / cols3);
    ensureSpace(gridRows * kpiRowH);
    kpis.forEach(([label, value, growth], idx) => {
      const col = idx % cols3;
      const row = Math.floor(idx / cols3);
      const x = marginX + col * colW;
      const boxY = y + row * kpiRowH;
      doc.roundedRect(x, boxY, colW - 10, kpiRowH - 10, 4).strokeColor(BORDER).stroke();
      doc.fillColor(LIGHT_SLATE).fontSize(7.5).font('Helvetica-Bold').text(label.toUpperCase(), x + 10, boxY + 9, { width: colW - 30 });
      doc.fillColor(INK).fontSize(13).font('Helvetica-Bold').text(value, x + 10, boxY + 22, { width: colW - 30 });
      if (growth !== null && growth !== undefined) {
        doc.fillColor(growth >= 0 ? GREEN : RED).fontSize(8).font('Helvetica-Bold')
          .text(`${fmtPct(growth)} vs previous period`, x + 10, boxY + 40, { width: colW - 30 });
      }
    });
    y += gridRows * kpiRowH + 15;

    // --- RM Performance table ---
    table('RM Performance', [
      { key: 'rank',               label: '#',           width: 25,  align: 'center' },
      { key: 'full_name',          label: 'RM Name',     width: 135 },
      { key: 'agent_count',        label: 'Agents',      width: 50,  align: 'center' },
      { key: 'policies_issued',    label: 'Policies',     width: 55,  align: 'center' },
      { key: 'revenue',            label: 'Revenue',      width: 90,  align: 'right', render: r => fmtMoney(r.revenue) },
      { key: 'commission_paid',    label: 'Comm. Paid',   width: 80,  align: 'right', render: r => fmtMoney(r.commission_paid) },
      { key: 'growth_pct',         label: 'Growth',        width: 80,  align: 'right', render: r => fmtPct(r.growth_pct), color: r => r.growth_pct >= 0 ? GREEN : RED },
    ], rmRows);

    // --- Agent Performance table ---
    table('Agent Performance', [
      { key: 'rank',               label: '#',           width: 25,  align: 'center' },
      { key: 'full_name',          label: 'Agent Name',   width: 120 },
      { key: 'rm_name',            label: 'RM',            width: 95 },
      { key: 'policies_issued',    label: 'Policies',      width: 50,  align: 'center' },
      { key: 'revenue',            label: 'Revenue',        width: 85,  align: 'right', render: r => fmtMoney(r.revenue) },
      { key: 'commission_paid',    label: 'Comm. Paid',     width: 65,  align: 'right', render: r => fmtMoney(r.commission_paid) },
      { key: 'growth_pct',         label: 'Growth',          width: 75,  align: 'right', render: r => fmtPct(r.growth_pct), color: r => r.growth_pct >= 0 ? GREEN : RED },
    ], agentRows);

    doc.end();
  });
}

module.exports = { generatePerformanceReportPdf };
