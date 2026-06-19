const nodemailer = require('nodemailer');
const logger     = require('./logger');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'OOK Travel <noreply@ooktravel.com>',
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error('Email send failed:', err.message);
    throw err;
  }
}

function rmApprovalEmail(rm) {
  return {
    to:      rm.email,
    subject: 'OOK Travel — Account Approved',
    html: `
      <h2>Congratulations, ${rm.full_name}!</h2>
      <p>Your Relationship Manager account on OOK Travel has been <strong>approved</strong>.</p>
      <p>You can now log in using your registered email and password.</p>
      <br/><p>— OOK Travel Team</p>`,
  };
}

function forgotPasswordEmail(email, name, resetLink) {
  return {
    to:      email,
    subject: 'OOK Travel — Password Reset',
    html: `
      <h2>Hello, ${name}!</h2>
      <p>You requested a password reset. Click the link below (valid for 1 hour):</p>
      <a href="${resetLink}" style="padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:4px">
        Reset Password
      </a>
      <p>If you did not request this, please ignore this email.</p>
      <br/><p>— OOK Travel Team</p>`,
  };
}

function commissionPaidEmail(agent, amount) {
  return {
    to:      agent.email,
    subject: 'OOK Travel — Commission Payment',
    html: `
      <h2>Hello, ${agent.full_name}!</h2>
      <p>A commission payment of <strong>₹${amount}</strong> has been processed to your account.</p>
      <br/><p>— OOK Travel Team</p>`,
  };
}

module.exports = { sendEmail, rmApprovalEmail, forgotPasswordEmail, commissionPaidEmail };
