const path = require('path');
const PDFDocument = require('pdfkit');
const { LOGO_PATH, LOGO_ASPECT } = require('./logo');

const CURSIVE_FONT_PATH = path.join(__dirname, '../assets/GreatVibes-Regular.ttf');

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

    doc.registerFont('Cursive', CURSIVE_FONT_PATH);

    const orange     = '#f97316';
    const red        = '#e11d48';
    const gold       = '#d4a017';
    const navy       = '#1a1a2e';
    const peachBg    = '#fff1e6';
    const peachLine  = '#fbd7b8';
    const paperBg    = '#fffaf5';

    const W = doc.page.width;
    const H = doc.page.height;
    const M = 24; // outer margin

    function brandGradient(x0, y0, x1, y1) {
      return doc.linearGradient(x0, y0, x1, y1).stop(0, orange).stop(0.55, red).stop(1, gold);
    }

    // Page background — bright warm white
    doc.rect(0, 0, W, H).fill(paperBg);

    // Outer gradient border
    doc.rect(M, M, W - 2 * M, H - 2 * M).fill(brandGradient(M, 0, W - M, 0));
    // Inner white panel
    const innerM = M + 7;
    doc.rect(innerM, innerM, W - 2 * innerM, H - 2 * innerM).fill('#ffffff');
    // Thin gold rule inset
    const ruleM = innerM + 8;
    doc.rect(ruleM, ruleM, W - 2 * ruleM, H - 2 * ruleM).strokeColor(peachLine).lineWidth(1).stroke();

    // Corner flourishes
    const corners = [
      [ruleM + 14, ruleM + 14], [W - ruleM - 14, ruleM + 14],
      [ruleM + 14, H - ruleM - 14], [W - ruleM - 14, H - ruleM - 14],
    ];
    corners.forEach(([cx, cy]) => {
      doc.circle(cx, cy, 3.5).fill(orange);
      doc.circle(cx, cy, 7).lineWidth(0.75).strokeColor(peachLine).stroke();
    });

    const contentX = ruleM + 46;
    const contentW = W - 2 * (ruleM + 46);
    let y = ruleM + 26;

    // Brand header
    doc.fillColor('#666666').font('Helvetica').fontSize(10)
      .text('MAA PRANAAM FORTUNE LLP', contentX, y, { width: contentW, align: 'center', characterSpacing: 3 });
    y += 15;
    const logoW = 150;
    const logoH = logoW * LOGO_ASPECT;
    doc.image(LOGO_PATH, contentX + (contentW - logoW) / 2, y, { width: logoW, height: logoH });
    y += logoH + 26;

    // Certificate title — one line, single elegant script font throughout
    const titleText = 'Certificate of Onboarding';
    doc.font('Cursive').fontSize(52);
    doc.fillColor(brandGradient(contentX, 0, contentX + contentW, 0))
      .text(titleText, contentX, y, { width: contentW, align: 'center' });
    y += 78;

    // Body text
    doc.fillColor('#4d4d4d').font('Helvetica').fontSize(12)
      .text('This is to certify that', contentX, y, { width: contentW, align: 'center' });
    y += 24;

    doc.fillColor(brandGradient(contentX, 0, contentX + contentW, 0))
      .font('Helvetica-BoldOblique').fontSize(26)
      .text(agent.full_name, contentX, y, { width: contentW, align: 'center' });
    y += 36;

    const nameLineW = contentW * 0.35;
    doc.moveTo(contentX + (contentW - nameLineW) / 2, y)
      .lineTo(contentX + (contentW + nameLineW) / 2, y)
      .strokeColor(orange).lineWidth(1).stroke();
    y += 24;

    const paraW = Math.min(contentW, 480);
    doc.fillColor('#444444').font('Helvetica').fontSize(11)
      .text(
        `has been successfully verified and onboarded as an Authorized Travel Agent on the OOK Travel platform, ` +
        `operated by Maa Pranaam Fortune LLP. This agent is duly authorized to promote and distribute the ` +
        `Trip Secure Program through our platform.`,
        contentX + (contentW - paraW) / 2, y,
        { width: paraW, align: 'center', lineGap: 4 }
      );
    y = doc.y + 26;

    // Details band
    const bandH = 60;
    doc.roundedRect(contentX, y, contentW, bandH, 6).fillAndStroke(peachBg, peachLine);
    doc.moveTo(contentX + contentW / 2, y + 10).lineTo(contentX + contentW / 2, y + bandH - 10)
      .strokeColor(peachLine).lineWidth(1).stroke();

    doc.fillColor('#737373').font('Helvetica').fontSize(9)
      .text('AGENT ID', contentX, y + 13, { width: contentW / 2, align: 'center', characterSpacing: 2 });
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(15)
      .text(agentCode, contentX, y + 27, { width: contentW / 2, align: 'center' });

    doc.fillColor('#737373').font('Helvetica').fontSize(9)
      .text('ISSUE DATE', contentX + contentW / 2, y + 13, { width: contentW / 2, align: 'center', characterSpacing: 2 });
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(15)
      .text(issueDate, contentX + contentW / 2, y + 27, { width: contentW / 2, align: 'center' });

    y += bandH + 26;

    // Bottom gradient rule
    doc.rect(contentX, y, contentW, 3).fill(brandGradient(contentX, 0, contentX + contentW, 0));
    y += 14;

    // Footer
    doc.fillColor(orange).font('Helvetica-Bold').fontSize(9)
      .text('MAA PRANAAM FORTUNE LLP', contentX, y, { width: contentW, align: 'center', characterSpacing: 2 });
    y += 13;
    doc.fillColor('#808080').font('Helvetica').fontSize(9.5)
      .text('Powered by OOK Travel  |  www.ooktravel.in', contentX, y, { width: contentW, align: 'center' });

    // Sub-note below the certificate border
    doc.fillColor('#737373').font('Helvetica').fontSize(9)
      .text(
        'This is a system-generated certificate and does not require a physical signature or seal.',
        M, H - M + 6, { width: W - 2 * M, align: 'center' }
      );

    doc.end();
  });
}

module.exports = { generateOnboardingCertificatePdf };
