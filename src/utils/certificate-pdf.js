const PDFDocument = require('pdfkit');
const { LOGO_PATH, LOGO_ASPECT } = require('./logo');

// Renders the same onboarding certificate shown in the email as a landscape PDF buffer, for use
// as an email attachment.
function generateOnboardingCertificatePdf(agent) {
  const agentCode = `OOK-${String(agent.id).padStart(5, '0')}`;
  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const gold      = '#b8860b';
    const cream     = '#fffdf5';
    const paperBg   = '#f4f1eb';
    const navy      = '#1a1a2e';
    const goldLight = '#e8d5a3';
    const goldBand  = '#fdf6e0';

    const W = doc.page.width;
    const H = doc.page.height;
    const M = 28; // outer margin

    // Page background
    doc.rect(0, 0, W, H).fill(paperBg);

    // Outer gold border
    doc.rect(M, M, W - 2 * M, H - 2 * M).fill(gold);
    // Inner cream panel
    const innerM = M + 5;
    doc.rect(innerM, innerM, W - 2 * innerM, H - 2 * innerM).fill(cream);
    // Thin gold rule inset
    const ruleM = innerM + 8;
    doc.rect(ruleM, ruleM, W - 2 * ruleM, H - 2 * ruleM).strokeColor(goldLight).lineWidth(1).stroke();

    const contentX = ruleM + 40;
    const contentW = W - 2 * (ruleM + 40);
    let y = ruleM + 30;

    // Brand header
    doc.fillColor('#888888').font('Helvetica').fontSize(9)
      .text('MAA PRANAAM FORTUNE LLP', contentX, y, { width: contentW, align: 'center', characterSpacing: 3 });
    y += 16;
    const logoW = 160;
    const logoH = logoW * LOGO_ASPECT;
    doc.image(LOGO_PATH, contentX + (contentW - logoW) / 2, y, { width: logoW, height: logoH });
    y += logoH + 20;

    // Gold rule
    doc.moveTo(contentX, y).lineTo(contentX + contentW, y).strokeColor(gold).lineWidth(1.5).stroke();
    y += 22;

    // Certificate title
    doc.fillColor('#888888').font('Helvetica').fontSize(10)
      .text('CERTIFICATE OF', contentX, y, { width: contentW, align: 'center', characterSpacing: 4 });
    y += 16;
    doc.fillColor(navy).font('Helvetica-BoldOblique').fontSize(34)
      .text('Onboarding', contentX, y, { width: contentW, align: 'center' });
    y += 46;

    // Thin divider
    const thinW = contentW * 0.4;
    doc.moveTo(contentX + (contentW - thinW) / 2, y)
      .lineTo(contentX + (contentW + thinW) / 2, y)
      .strokeColor(goldLight).lineWidth(1).stroke();
    y += 24;

    // Body text
    doc.fillColor('#666666').font('Helvetica').fontSize(11)
      .text('This is to certify that', contentX, y, { width: contentW, align: 'center' });
    y += 22;

    doc.fillColor(gold).font('Helvetica-Oblique').fontSize(24)
      .text(agent.full_name, contentX, y, { width: contentW, align: 'center' });
    y += 34;

    const nameLineW = contentW * 0.35;
    doc.moveTo(contentX + (contentW - nameLineW) / 2, y)
      .lineTo(contentX + (contentW + nameLineW) / 2, y)
      .strokeColor(gold).lineWidth(1).stroke();
    y += 20;

    const paraW = Math.min(contentW, 480);
    doc.fillColor('#555555').font('Helvetica').fontSize(10.5)
      .text(
        `has been successfully verified and onboarded as an Authorized Travel Agent on the OOK Travel platform, ` +
        `operated by Maa Pranaam Fortune LLP. This agent is duly authorized to promote and distribute travel ` +
        `insurance products through our platform.`,
        contentX + (contentW - paraW) / 2, y,
        { width: paraW, align: 'center', lineGap: 4 }
      );
    y = doc.y + 22;

    // Details band
    const bandH = 58;
    doc.roundedRect(contentX, y, contentW, bandH, 4).fillAndStroke(goldBand, goldLight);
    doc.moveTo(contentX + contentW / 2, y).lineTo(contentX + contentW / 2, y + bandH)
      .strokeColor(goldLight).lineWidth(1).stroke();

    doc.fillColor('#888888').font('Helvetica').fontSize(8)
      .text('AGENT ID', contentX, y + 12, { width: contentW / 2, align: 'center', characterSpacing: 2 });
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(14)
      .text(agentCode, contentX, y + 26, { width: contentW / 2, align: 'center' });

    doc.fillColor('#888888').font('Helvetica').fontSize(8)
      .text('ISSUE DATE', contentX + contentW / 2, y + 12, { width: contentW / 2, align: 'center', characterSpacing: 2 });
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(14)
      .text(issueDate, contentX + contentW / 2, y + 26, { width: contentW / 2, align: 'center' });

    y += bandH + 18;

    // Bottom gold rule
    doc.moveTo(contentX, y).lineTo(contentX + contentW, y).strokeColor(gold).lineWidth(1.5).stroke();
    y += 12;

    // Footer
    doc.fillColor(gold).font('Helvetica').fontSize(9)
      .text('MAA PRANAAM FORTUNE LLP', contentX, y, { width: contentW, align: 'center', characterSpacing: 2 });
    y += 13;
    doc.fillColor('#aaaaaa').font('Helvetica').fontSize(8.5)
      .text('Powered by OOK Travel  |  www.ooktravel.in', contentX, y, { width: contentW, align: 'center' });

    // Sub-note below the certificate border
    doc.fillColor('#999999').font('Helvetica').fontSize(8)
      .text(
        'This is a system-generated certificate and does not require a physical signature or seal.',
        M, H - M + 6, { width: W - 2 * M, align: 'center' }
      );

    doc.end();
  });
}

module.exports = { generateOnboardingCertificatePdf };
