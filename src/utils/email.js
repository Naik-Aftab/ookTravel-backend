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

async function sendEmail({ to, subject, html, attachments }) {
  try {
    ensureSmtpConfig();
    await verifyTransport();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      attachments,
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
<body style="margin:0;padding:0;background:#fff8f2;font-family:Georgia,'Times New Roman',serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f2;padding:30px 0;">
  <tr><td align="center">
    <table width="660" cellpadding="0" cellspacing="0" style="max-width:660px;">

      <!-- Outer gradient border -->
      <tr><td style="background-color:#f97316;background-image:linear-gradient(120deg,#f97316,#e11d48,#d4a017);padding:5px;border-radius:6px;">
        <!-- Inner white bg -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:3px;">
          <tr><td style="padding:6px;">
            <!-- Inner thin border -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fbd7b8;">
              <tr><td style="padding:40px 50px;">

                <!-- Brand header -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td align="center">
                    <p style="margin:0 0 8px;font-size:11px;letter-spacing:5px;color:#666666;text-transform:uppercase;font-family:Arial,sans-serif;">Maa Pranaam Fortune LLP</p>
                    <img src="cid:ooktravel-logo" alt="OOK Travel" width="150" style="display:inline-block;" />
                  </td></tr>
                </table>

                <!-- Certificate title -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 0;">
                  <tr><td align="center">
                    <p style="margin:0;font-size:46px;color:#e11d48;font-family:'Brush Script MT','Segoe Script','Lucida Handwriting',cursive;">Certificate of Onboarding</p>
                  </td></tr>
                </table>

                <!-- Body text -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:34px 0 0;">
                  <tr><td align="center">
                    <p style="margin:0;font-size:15px;color:#4d4d4d;font-family:Arial,sans-serif;">This is to certify that</p>

                    <!-- Agent name -->
                    <p style="margin:14px 0 6px;font-size:32px;font-weight:bold;color:#f97316;font-style:italic;">${agent.full_name}</p>
                    <table width="55%" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="border-top:1px solid #f97316;"></td></tr></table>

                    <p style="margin:22px auto 0;font-size:14px;color:#444444;line-height:1.9;max-width:480px;font-family:Arial,sans-serif;">
                      has been successfully verified and onboarded as an
                      <strong style="color:#1a1a2e;">Authorized Travel Agent</strong> on the
                      <strong style="color:#1a1a2e;">OOK Travel</strong> platform, operated by
                      <strong style="color:#1a1a2e;">Maa Pranaam Fortune LLP</strong>.
                      This agent is duly authorized to promote and distribute the
                      Trip Secure Program through our platform.
                    </p>
                  </td></tr>
                </table>

                <!-- Details band -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0 0;background:#fff1e6;border:1px solid #fbd7b8;border-radius:6px;">
                  <tr>
                    <td align="center" style="padding:18px 0;width:50%;border-right:1px solid #fbd7b8;">
                      <p style="margin:0;font-size:10px;letter-spacing:3px;color:#737373;text-transform:uppercase;font-family:Arial,sans-serif;">Agent ID</p>
                      <p style="margin:6px 0 0;font-size:18px;font-weight:bold;color:#1a1a2e;font-family:Arial,sans-serif;">${agentCode}</p>
                    </td>
                    <td align="center" style="padding:18px 0;width:50%;">
                      <p style="margin:0;font-size:10px;letter-spacing:3px;color:#737373;text-transform:uppercase;font-family:Arial,sans-serif;">Issue Date</p>
                      <p style="margin:6px 0 0;font-size:18px;font-weight:bold;color:#1a1a2e;font-family:Arial,sans-serif;">${issueDate}</p>
                    </td>
                  </tr>
                </table>

                <!-- Bottom gradient rule -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
                  <tr><td height="3" style="background-color:#f97316;background-image:linear-gradient(90deg,#f97316,#e11d48,#d4a017);font-size:0;line-height:0;">&nbsp;</td></tr>
                </table>

                <!-- Footer -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;">
                  <tr><td align="center">
                    <p style="margin:0;font-size:10px;letter-spacing:3px;color:#f97316;text-transform:uppercase;font-weight:bold;font-family:Arial,sans-serif;">Maa Pranaam Fortune LLP</p>
                    <p style="margin:5px 0 0;font-size:11px;color:#808080;font-family:Arial,sans-serif;">Powered by OOK Travel &nbsp;|&nbsp; www.ooktravel.in</p>
                  </td></tr>
                </table>

              </td></tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>

    <!-- Sub-note below certificate -->
    <p style="margin:16px 0 0;font-size:12px;color:#737373;font-family:Arial,sans-serif;text-align:center;">
      This is a system-generated certificate and does not require a physical signature or seal.
    </p>

  </td></tr>
</table>

</body>
</html>`,
  };
}

function policyRequestInvoiceEmail(request) {
  const {
    request_number, traveler_name, traveler_email,
    travel_date, return_date, plan_type, num_travelers,
    estimated_premium, payment_amount,
  } = request;

  const travellers  = Number(num_travelers) || 1;
  const basePremium = Number(estimated_premium) || 0;
  const subtotal    = basePremium * travellers;
  const totalPaid   = Number(payment_amount) || subtotal;
  const platformFee = Math.max(totalPaid - subtotal, 0);

  const fmt = n => `Rs. ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  return {
    to: traveler_email,
    subject: `OOK Travel - Invoice for Request ${request_number}`,
    html: `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">

      <tr><td style="background:#0c4a6e;padding:20px 32px;">
        <div style="background:#ffffff;display:inline-block;padding:8px 12px;border-radius:6px;">
          <img src="cid:ooktravel-logo" alt="OOK Travel" width="130" style="display:block;" />
        </div>
        <p style="margin:10px 0 0;color:#bae6fd;font-size:13px;">Trip Secure Program Invoice</p>
      </td></tr>

      <tr><td style="padding:28px 32px 0;">
        <p style="margin:0;color:#334155;font-size:15px;">Hi ${traveler_name || 'Traveller'},</p>
        <p style="margin:8px 0 0;color:#475569;font-size:14px;line-height:1.6;">
          Thank you for your payment. Your Trip Secure Program request has been received and is being processed. Here are your invoice details:
        </p>
      </td></tr>

      <tr><td style="padding:20px 32px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;">
          <tr>
            <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;width:50%;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Request Number</p>
              <p style="margin:4px 0 0;font-size:14px;font-weight:bold;color:#0f172a;">${request_number}</p>
            </td>
            <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;width:50%;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Plan Type</p>
              <p style="margin:4px 0 0;font-size:14px;font-weight:bold;color:#0f172a;text-transform:capitalize;">${plan_type || '-'}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 16px;width:50%;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Travel Date</p>
              <p style="margin:4px 0 0;font-size:14px;font-weight:bold;color:#0f172a;">${fmtDate(travel_date)}</p>
            </td>
            <td style="padding:14px 16px;width:50%;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Return Date</p>
              <p style="margin:4px 0 0;font-size:14px;font-weight:bold;color:#0f172a;">${fmtDate(return_date)}</p>
            </td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:24px 32px 0;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:bold;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">Premium Breakup</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;">
          <tr style="background:#f8fafc;">
            <td style="padding:10px 16px;font-size:13px;color:#64748b;">Base Premium (per traveller)</td>
            <td align="right" style="padding:10px 16px;font-size:13px;color:#0f172a;">${fmt(basePremium)}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;font-size:13px;color:#64748b;">Travellers</td>
            <td align="right" style="padding:10px 16px;font-size:13px;color:#0f172a;">${travellers}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:10px 16px;font-size:13px;color:#64748b;">Subtotal</td>
            <td align="right" style="padding:10px 16px;font-size:13px;color:#0f172a;">${fmt(subtotal)}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;font-size:13px;color:#64748b;">Platform Fee</td>
            <td align="right" style="padding:10px 16px;font-size:13px;color:#0f172a;">${fmt(platformFee)}</td>
          </tr>
          <tr>
            <td style="padding:14px 16px;font-size:15px;font-weight:bold;color:#0f172a;border-top:2px solid #0c4a6e;">Total Amount Paid</td>
            <td align="right" style="padding:14px 16px;font-size:15px;font-weight:bold;color:#0c4a6e;border-top:2px solid #0c4a6e;">${fmt(totalPaid)}</td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:24px 32px 28px;">
        <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
          This is a system-generated invoice for your payment confirmation. Your policy document will be shared once your request is approved and issued.
        </p>
        <p style="margin:16px 0 0;font-size:13px;color:#334155;">- OOK Travel Team</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`,
  };
}

module.exports = {
  sendEmail, rmApprovalEmail, forgotPasswordEmail, commissionPaidEmail,
  agentWelcomeEmail, onboardingCertificateEmail, policyRequestInvoiceEmail,
};
