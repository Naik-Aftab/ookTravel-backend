const PDFDocument = require('pdfkit');
const { LOGO_PATH, LOGO_ASPECT } = require('./logo');

function fmtMoney(n) {
  return `Rs. ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Renders the same premium breakup shown in the invoice email as a PDF buffer, for use as an
// email attachment.
function generatePolicyInvoicePdf(request) {
  const {
    request_number, traveler_name,
    travel_date, return_date, plan_type, num_travelers,
    estimated_premium, payment_amount,
  } = request;

  const travellers  = Number(num_travelers) || 1;
  const basePremium = Number(estimated_premium) || 0;
  const subtotal    = basePremium * travellers;
  const totalPaid   = Number(payment_amount) || subtotal;
  const platformFee = Math.max(totalPaid - subtotal, 0);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const navy = '#0c4a6e';
    const slate = '#475569';
    const lightSlate = '#94a3b8';
    const border = '#e2e8f0';

    // Header band
    const headerH = 120;
    doc.rect(0, 0, doc.page.width, headerH).fill(navy);

    const logoW = 120;
    const logoH = logoW * LOGO_ASPECT;
    const logoBoxY = 16;
    doc.roundedRect(42, logoBoxY, logoW + 16, logoH + 16, 6).fill('#ffffff');
    doc.image(LOGO_PATH, 50, logoBoxY + 8, { width: logoW, height: logoH });

    doc.fillColor('#bae6fd').fontSize(11).font('Helvetica')
      .text('Trip Secure Program Invoice', 50, logoBoxY + logoH + 16 + 10);

    doc.fillColor(slate).fontSize(11).font('Helvetica')
      .text(`Hi ${traveler_name || 'Traveller'},`, 50, headerH + 20);
    doc.moveDown(0.5);
    doc.text(
      'Thank you for your payment. Your Trip Secure Program request has been received and is being processed. Please find your invoice details below.',
      50, doc.y, { width: 495 }
    );

    let y = doc.y + 20;

    function infoBox(label, value, x, width) {
      doc.fillColor(lightSlate).fontSize(8).font('Helvetica-Bold').text(label.toUpperCase(), x, y, { width });
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(value || '-', x, y + 12, { width });
    }

    infoBox('Request Number', request_number, 50, 230);
    infoBox('Plan Type', plan_type ? plan_type[0].toUpperCase() + plan_type.slice(1) : '-', 300, 245);
    y += 45;
    infoBox('Travel Date', fmtDate(travel_date), 50, 230);
    infoBox('Return Date', fmtDate(return_date), 300, 245);
    y += 45;

    doc.moveTo(50, y).lineTo(545, y).strokeColor(border).stroke();
    y += 20;

    doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('PREMIUM BREAKUP', 50, y);
    y += 22;

    function row(label, value, opts = {}) {
      const bold = !!opts.bold;
      const shaded = !!opts.shaded;
      const rowHeight = 26;

      if (shaded) {
        doc.rect(50, y - 6, 495, rowHeight).fill('#f8fafc');
      }
      if (opts.topRule) {
        doc.moveTo(50, y - 6).lineTo(545, y - 6).strokeColor(navy).lineWidth(1.5).stroke();
      }

      doc.fillColor(bold ? '#0f172a' : '#64748b')
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(bold ? 12 : 10)
        .text(label, 60, y, { width: 300 });
      doc.fillColor(bold ? navy : '#0f172a')
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(bold ? 12 : 10)
        .text(value, 60, y, { width: 475, align: 'right' });

      y += rowHeight;
    }

    doc.roundedRect(50, y - 6, 495, 26 * 5 + 4, 4).strokeColor(border).stroke();

    row('Base Premium (per traveller)', fmtMoney(basePremium), { shaded: true });
    row('Travellers', String(travellers));
    row('Subtotal', fmtMoney(subtotal), { shaded: true });
    row('Platform Fee', fmtMoney(platformFee));
    row('Total Amount Paid', fmtMoney(totalPaid), { bold: true, topRule: true });

    y += 30;
    doc.fillColor(lightSlate).fontSize(9).font('Helvetica').text(
      'This is a system-generated invoice for your payment confirmation. Your policy document will be shared once your request is approved and issued.',
      50, y, { width: 495 }
    );
    doc.moveDown(1);
    doc.fillColor(slate).fontSize(10).text('- OOK Travel Team');

    doc.end();
  });
}

module.exports = { generatePolicyInvoicePdf };
