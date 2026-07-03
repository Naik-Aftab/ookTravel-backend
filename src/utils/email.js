const nodemailer = require('nodemailer');
const logger = require('./logger');

const smtpPort = Number.parseInt(process.env.SMTP_PORT, 10) || 587;
const smtpSecure = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === 'true'
  : smtpPort === 465;

let verifiedTransportPromise;

function ensureSmtpConfig() {
  const missing = ['SMTP_USER', 'SMTP_PASS'].filter(key => !process.env[key]);

  if (missing.length) {
    throw new Error(`SMTP is not configured. Missing: ${missing.join(', ')}`);
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpSecure,
  requireTLS: !smtpSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    minVersion: 'TLSv1.2',
  },
});

async function verifyTransport() {
  if (!verifiedTransportPromise) {
    verifiedTransportPromise = transporter.verify()
      .then(() => {
        logger.info(`SMTP transport verified on ${process.env.SMTP_HOST || 'smtp.gmail.com'}:${smtpPort}`);
      })
      .catch(err => {
        verifiedTransportPromise = null;
        throw err;
      });
  }

  return verifiedTransportPromise;
}

async function sendEmail({ to, subject, html }) {
  try {
    ensureSmtpConfig();
    await verifyTransport();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });

    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email send failed for ${to}: ${err.message}`);
    throw err;
  }
}

function rmApprovalEmail(rm) {
  return {
    to: rm.email,
    subject: 'OOK Travel - Account Approved',
    html: `
      <h2>Congratulations, ${rm.full_name}!</h2>
      <p>Your Relationship Manager account on OOK Travel has been <strong>approved</strong>.</p>
      <p>You can now log in using your registered email and password.</p>
      <br/><p>- OOK Travel Team</p>`,
  };
}

function forgotPasswordEmail(email, name, resetLink) {
  return {
    to: email,
    subject: 'OOK Travel - Password Reset',
    html: `
      <h2>Hello, ${name}!</h2>
      <p>You requested a password reset. Click the link below (valid for 1 hour):</p>
      <a href="${resetLink}" style="padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:4px">
        Reset Password
      </a>
      <p>If you did not request this, please ignore this email.</p>
      <br/><p>- OOK Travel Team</p>`,
  };
}

function commissionPaidEmail(agent, monthLabel, commissionAmount) {
  return {
    to: agent.email,
    subject: 'OOK Travel - Commission Payment',
    html: `
      <h2>Hello, ${agent.full_name}!</h2>
      <p>Your commission for <strong>${monthLabel}</strong> has been marked as paid.</p>
      <p>Commission Amount: <strong>Rs. ${commissionAmount}</strong></p>
      <br/><p>- OOK Travel Team</p>`,
  };
}

function agentWelcomeEmail(agent) {
  const isActive = agent.status === 'active';
  return {
    to:      agent.email,
    subject: isActive
      ? 'Welcome to OOK Travel — Your Account is Active'
      : 'Welcome to OOK Travel — Registration Received',
    html: `
      <h2>Welcome, ${agent.full_name}!</h2>
      <p>Thank you for registering with <strong>OOK Travel</strong>.</p>
      ${isActive
        ? `<p>Great news — your account has been <strong>activated</strong> and a Relationship Manager has been assigned to assist you. You can log in right away.</p>`
        : `<p>Your account is currently <strong>pending approval</strong> by our admin team. You will be able to log in once your account is activated.</p>`
      }
      <p>If you have any questions, feel free to reach out to us.</p>
      <br/><p>- OOK Travel Team</p>`,
  };
}

function onboardingCertificateEmail(agent) {
  const agentCode = `OOK-${String(agent.id).padStart(5, '0')}`;
  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return {
    to:      agent.email,
    subject: `OOK Travel — Certificate of Onboarding | ${agentCode}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f1eb;font-family:Georgia,'Times New Roman',serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1eb;padding:30px 0;">
  <tr><td align="center">
    <table width="660" cellpadding="0" cellspacing="0" style="max-width:660px;">

      <!-- Outer gold border -->
      <tr><td style="background:#b8860b;padding:4px;border-radius:4px;">
        <!-- Inner cream bg -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffdf5;border-radius:2px;">
          <tr><td style="padding:6px;">
            <!-- Inner thin border -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d4a017;">
              <tr><td style="padding:40px 50px;">

                <!-- Corner decorations -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="40" style="font-size:22px;color:#b8860b;line-height:1;">❧</td>
                    <td align="center">
                      <!-- Brand header -->
                      <p style="margin:0 0 4px;font-size:10px;letter-spacing:5px;color:#888;text-transform:uppercase;font-family:Arial,sans-serif;">Maa Pranaam Fortune LLP</p>
                      <p style="margin:0;font-size:30px;font-weight:bold;color:#1a1a2e;letter-spacing:4px;font-family:Arial,sans-serif;">OOK TRAVEL</p>
                    </td>
                    <td width="40" align="right" style="font-size:22px;color:#b8860b;line-height:1;">❧</td>
                  </tr>
                </table>

                <!-- Gold rule -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;">
                  <tr>
                    <td style="border-top:2px solid #b8860b;"></td>
                    <td width="14" align="center" style="font-size:16px;color:#b8860b;padding:0 6px;">✦</td>
                    <td style="border-top:2px solid #b8860b;"></td>
                  </tr>
                </table>

                <!-- Certificate title -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
                  <tr><td align="center">
                    <p style="margin:0;font-size:11px;letter-spacing:6px;color:#888;text-transform:uppercase;font-family:Arial,sans-serif;">Certificate of</p>
                    <p style="margin:6px 0 0;font-size:38px;color:#1a1a2e;font-style:italic;font-weight:bold;">Onboarding</p>
                  </td></tr>
                </table>

                <!-- Thin divider -->
                <table width="60%" cellpadding="0" cellspacing="0" style="margin:18px auto 0;">
                  <tr>
                    <td style="border-top:1px solid #d4a017;"></td>
                    <td width="20" align="center" style="font-size:12px;color:#b8860b;padding:0 5px;">◆</td>
                    <td style="border-top:1px solid #d4a017;"></td>
                  </tr>
                </table>

                <!-- Body text -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
                  <tr><td align="center">
                    <p style="margin:0;font-size:14px;color:#666;font-family:Arial,sans-serif;">This is to certify that</p>

                    <!-- Agent name -->
                    <p style="margin:14px 0 6px;font-size:32px;color:#b8860b;font-style:italic;">${agent.full_name}</p>
                    <table width="55%" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="border-top:1px solid #b8860b;"></td></tr></table>

                    <p style="margin:22px auto 0;font-size:14px;color:#555;line-height:1.9;max-width:480px;font-family:Arial,sans-serif;">
                      has been successfully verified and onboarded as an
                      <strong style="color:#1a1a2e;">Authorized Travel Agent</strong> on the
                      <strong style="color:#1a1a2e;">OOK Travel</strong> platform, operated by
                      <strong style="color:#1a1a2e;">Maa Pranaam Fortune LLP</strong>.
                      This agent is duly authorized to promote and distribute travel
                      insurance products through our platform.
                    </p>
                  </td></tr>
                </table>

                <!-- Details band -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0 0;background:#fdf6e0;border:1px solid #e8d5a3;border-radius:4px;">
                  <tr>
                    <td align="center" style="padding:18px 0;width:50%;border-right:1px solid #e8d5a3;">
                      <p style="margin:0;font-size:9px;letter-spacing:3px;color:#888;text-transform:uppercase;font-family:Arial,sans-serif;">Agent ID</p>
                      <p style="margin:6px 0 0;font-size:18px;font-weight:bold;color:#1a1a2e;font-family:Arial,sans-serif;">${agentCode}</p>
                    </td>
                    <td align="center" style="padding:18px 0;width:50%;">
                      <p style="margin:0;font-size:9px;letter-spacing:3px;color:#888;text-transform:uppercase;font-family:Arial,sans-serif;">Issue Date</p>
                      <p style="margin:6px 0 0;font-size:18px;font-weight:bold;color:#1a1a2e;font-family:Arial,sans-serif;">${issueDate}</p>
                    </td>
                  </tr>
                </table>

                <!-- Bottom gold rule -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
                  <tr>
                    <td style="border-top:2px solid #b8860b;"></td>
                    <td width="14" align="center" style="font-size:16px;color:#b8860b;padding:0 6px;">✦</td>
                    <td style="border-top:2px solid #b8860b;"></td>
                  </tr>
                </table>

                <!-- Footer -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;">
                  <tr>
                    <td width="40" style="font-size:22px;color:#b8860b;">❧</td>
                    <td align="center">
                      <p style="margin:0;font-size:10px;letter-spacing:3px;color:#b8860b;text-transform:uppercase;font-family:Arial,sans-serif;">Maa Pranaam Fortune LLP</p>
                      <p style="margin:5px 0 0;font-size:10px;color:#aaa;font-family:Arial,sans-serif;">Powered by OOK Travel &nbsp;|&nbsp; www.ooktravel.in</p>
                    </td>
                    <td width="40" align="right" style="font-size:22px;color:#b8860b;">❧</td>
                  </tr>
                </table>

              </td></tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>

    <!-- Sub-note below certificate -->
    <p style="margin:16px 0 0;font-size:11px;color:#999;font-family:Arial,sans-serif;text-align:center;">
      This is a system-generated certificate and does not require a physical signature or seal.
    </p>

  </td></tr>
</table>

</body>
</html>`,
  };
}

module.exports = { sendEmail, rmApprovalEmail, forgotPasswordEmail, commissionPaidEmail, agentWelcomeEmail, onboardingCertificateEmail };
