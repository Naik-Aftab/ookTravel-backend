const axios     = require('axios');
const otpRepo   = require('../repositories/otp.repository');
const agentRepo = require('../repositories/agent.repository');
const logger    = require('../utils/logger');

const OTP_EXPIRY_MINUTES = 15;
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildOtpSmsUrl(mobile, otp) {
  return `http://bhashsms.com/api/sendmsg.php?user=polcyp&pass=123456&sender=POLCYP&phone=${encodeURIComponent(mobile)}&text=Your+OTP+is+${otp}+and+is+valid+for+15+minutes.+Please+use+this+OTP+to+verify+your+account.+-+Team+Policyplanner+-+Policy+Planner&priority=ndnd&stype=normal`;
}

async function sendOtp(phoneNumber, purpose) {
  // For signup: phone must NOT already be a registered agent
  if (purpose === 'signup') {
    const existing = await agentRepo.findByMobile(phoneNumber);
    if (existing) throw Object.assign(new Error('Phone number already registered'), { statusCode: 409 });
  }

  // For forgot_password: phone MUST belong to an active agent
  if (purpose === 'forgot_password') {
    const agent = await agentRepo.findByMobile(phoneNumber);
    if (!agent) throw Object.assign(new Error('No account found with this phone number'), { statusCode: 404 });
  }

  // Enforce resend cooldown — prevent spam
  const latest = await otpRepo.findLatest(phoneNumber, purpose);
  if (latest) {
    const secondsSinceLast = (Date.now() - new Date(latest.created_at).getTime()) / 1000;
    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast);
      throw Object.assign(
        new Error(`Please wait ${wait} seconds before requesting a new OTP`),
        { statusCode: 429 }
      );
    }
  }

  const otp       = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  await otpRepo.create(phoneNumber, otp, purpose, expiresAt);

  // Send SMS
  try {
    const url = buildOtpSmsUrl(phoneNumber, otp);
    const response = await axios.get(url, { timeout: 10000 });
    logger.info(`OTP SMS sent to ${phoneNumber} | purpose=${purpose} | sms_response=${response.data}`);
  } catch (smsErr) {
    logger.error(`OTP SMS failed for ${phoneNumber}: ${smsErr.message}`);
    // Don't expose SMS failure to client — OTP is still in DB for dev/testing
    // In production you may want to throw here
  }

  return { message: `OTP sent to ${phoneNumber}`, expiresInMinutes: OTP_EXPIRY_MINUTES };
}

async function verifyOtp(phoneNumber, otp, purpose) {
  // Find the latest unused OTP for this phone+purpose (regardless of code) to track attempts
  const latest = await otpRepo.findLatest(phoneNumber, purpose);

  if (!latest) {
    throw Object.assign(new Error('No OTP found. Please request a new OTP.'), { statusCode: 400 });
  }

  // Check attempt count
  if (latest.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw Object.assign(new Error('Too many failed attempts. Please request a new OTP.'), { statusCode: 429 });
  }

  // Check expiry
  if (new Date(latest.expires_at) < new Date()) {
    throw Object.assign(new Error('OTP has expired. Please request a new OTP.'), { statusCode: 400 });
  }

  // Increment attempt before checking (prevents brute-force even on timing)
  await otpRepo.incrementAttempts(latest.id);

  // Validate code
  if (latest.otp !== otp) {
    const remaining = MAX_VERIFY_ATTEMPTS - latest.attempts - 1;
    throw Object.assign(
      new Error(`Invalid OTP. ${remaining} attempt(s) remaining.`),
      { statusCode: 400 }
    );
  }

  // Mark as used
  await otpRepo.markUsed(latest.id);

  return { verified: true, phone: phoneNumber, purpose };
}

module.exports = { sendOtp, verifyOtp };
