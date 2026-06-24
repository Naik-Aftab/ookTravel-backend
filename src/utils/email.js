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

function commissionPaidEmail(agent, amount) {
  return {
    to: agent.email,
    subject: 'OOK Travel - Commission Payment',
    html: `
      <h2>Hello, ${agent.full_name}!</h2>
      <p>A commission payment of <strong>Rs. ${amount}</strong> has been processed to your account.</p>
      <br/><p>- OOK Travel Team</p>`,
  };
}

function agentWelcomeEmail(agent) {
  return {
    to: agent.email,
    subject: 'Welcome to OOK Travel - Registration Received',
    html: `
      <h2>Welcome, ${agent.full_name}!</h2>
      <p>Thank you for registering with <strong>OOK Travel</strong>.</p>
      <p>Your account is currently <strong>pending approval</strong> by our admin team.
         You will be able to log in once your account is activated.</p>
      <p>In the meantime, if you have any questions, feel free to reach out to us.</p>
      <br/><p>- OOK Travel Team</p>`,
  };
}

module.exports = { sendEmail, rmApprovalEmail, forgotPasswordEmail, commissionPaidEmail, agentWelcomeEmail };
