const bcrypt                    = require('bcryptjs');
const adminRepo                 = require('../repositories/admin.repository');
const rmRepo                    = require('../repositories/rm.repository');
const agentRepo                 = require('../repositories/agent.repository');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { sendEmail, forgotPasswordEmail } = require('../utils/email');
const auditRepo                 = require('../repositories/audit.repository');
const crypto                    = require('crypto');

async function adminLogin(email, password, ip) {
  const admin = await adminRepo.findByEmail(email);
  if (!admin || !admin.is_active) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const match = await bcrypt.compare(password, admin.password);
  if (!match) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  await adminRepo.updateLastLogin(admin.id);
  await auditRepo.log({ user_type: 'admin', user_id: admin.id, user_name: admin.full_name, action: 'LOGIN', ip_address: ip });

  const payload = { id: admin.id, role: 'admin', email: admin.email };
  return {
    accessToken:  signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: admin.id, full_name: admin.full_name, email: admin.email, role: admin.role },
  };
}

async function rmSignup(data) {
  const exists = await rmRepo.findByEmail(data.email);
  if (exists) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });

  const password = await bcrypt.hash(data.password, 12);
  const id = await rmRepo.create({ ...data, password });
  return id;
}

async function rmLogin(email, password, ip) {
  const rm = await rmRepo.findByEmail(email);
  if (!rm) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  if (rm.status !== 'active') throw Object.assign(new Error('Account not approved or suspended'), { statusCode: 403 });

  const match = await bcrypt.compare(password, rm.password);
  if (!match) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  await rmRepo.updateLastLogin(rm.id);
  await auditRepo.log({ user_type: 'rm', user_id: rm.id, user_name: rm.full_name, action: 'LOGIN', ip_address: ip });

  const payload      = { id: rm.id, role: 'rm', email: rm.email };
  const refreshToken = signRefreshToken(payload);
  await rmRepo.saveRefreshToken(rm.id, refreshToken);

  return {
    accessToken: signAccessToken(payload),
    refreshToken,
    user: { id: rm.id, full_name: rm.full_name, email: rm.email, status: rm.status },
  };
}

async function agentSignup(data) {
  const { fullName, email, phoneNumber, password } = data;

  const emailExists = await agentRepo.findByEmail(email);
  if (emailExists) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });

  const phoneExists = await agentRepo.findByMobile(phoneNumber);
  if (phoneExists) throw Object.assign(new Error('Phone number already registered'), { statusCode: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const id = await agentRepo.create({ full_name: fullName, email, mobile: phoneNumber, password: hashed });

  const agent = await agentRepo.findById(id);
  return agent;
}

async function agentLogin(email, password, ip) {
  const agent = await agentRepo.findByEmail(email);
  if (!agent) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  if (agent.status !== 'active') throw Object.assign(new Error('Account not active'), { statusCode: 403 });

  const match = await bcrypt.compare(password, agent.password);
  if (!match) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  await agentRepo.updateLastLogin(agent.id);

  const payload      = { id: agent.id, role: 'agent', email: agent.email };
  const refreshToken = signRefreshToken(payload);
  await agentRepo.saveRefreshToken(agent.id, refreshToken);

  return {
    accessToken: signAccessToken(payload),
    refreshToken,
    agent: agent,
  };
}

async function refreshTokens(token) {
  const decoded = verifyRefreshToken(token);
  const payload = { id: decoded.id, role: decoded.role, email: decoded.email };
  return {
    accessToken:  signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

async function adminForgotPassword(email) {
  const admin = await adminRepo.findByEmail(email);
  if (!admin) return; // silent fail for security

  const token  = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await adminRepo.updateResetToken(admin.id, token, expiry);

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail(forgotPasswordEmail(admin.email, admin.full_name, resetLink));
}

async function adminResetPassword(token, newPassword) {
  const admin = await adminRepo.findByResetToken(token);
  if (!admin) throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });

  const hashed = await bcrypt.hash(newPassword, 12);
  await adminRepo.updatePassword(admin.id, hashed);
}

async function agentResetPassword(mobile, newPassword) {
  const otpRepo = require('../repositories/otp.repository');

  // Ensure OTP was verified for this phone within last 10 minutes
  const verified = await otpRepo.findRecentlyVerified(mobile, 'forgot_password', 10);
  if (!verified) {
    throw Object.assign(
      new Error('OTP not verified. Please verify your OTP before resetting password.'),
      { statusCode: 403 }
    );
  }

  const agent = await agentRepo.findByMobile(mobile);
  if (!agent) throw Object.assign(new Error('No account found with this mobile number'), { statusCode: 404 });

  const hashed = await bcrypt.hash(newPassword, 12);
  await agentRepo.updatePassword(agent.id, hashed);
}

async function changePassword(role, userId, oldPassword, newPassword) {
  let repo, user;
  if (role === 'admin') { repo = adminRepo; user = await adminRepo.findByEmail((await adminRepo.findById(userId)).email); }
  else if (role === 'rm') { repo = rmRepo; user = await rmRepo.findByEmail((await rmRepo.findById(userId)).email); }
  else throw Object.assign(new Error('Invalid role'), { statusCode: 400 });

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) throw Object.assign(new Error('Old password is incorrect'), { statusCode: 400 });

  const hashed = await bcrypt.hash(newPassword, 12);
  await repo.updatePassword(userId, hashed);
}

module.exports = { adminLogin, rmSignup, rmLogin, agentSignup, agentLogin, agentResetPassword, refreshTokens, adminForgotPassword, adminResetPassword, changePassword };
