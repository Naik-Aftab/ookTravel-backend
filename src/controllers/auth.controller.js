const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');

async function adminLogin(req, res, next) {
  try {
    const result = await authService.adminLogin(req.body.email, req.body.password, req.ip);
    successResponse(res, result, 'Login successful');
  } catch (e) { next(e); }
}

async function rmSignup(req, res, next) {
  try {
    const id = await authService.rmSignup(req.body);
    successResponse(res, { id }, 'Registration successful — pending admin approval', 201);
  } catch (e) { next(e); }
}

async function rmLogin(req, res, next) {
  try {
    const result = await authService.rmLogin(req.body.email, req.body.password, req.ip);
    successResponse(res, result, 'Login successful');
  } catch (e) { next(e); }
}

async function agentSignup(req, res, next) {
  try {
    const agent = await authService.agentSignup(req.body);
    successResponse(res, { agent }, 'Registration successful. Awaiting admin approval.', 201);
  } catch (e) { next(e); }
}

async function agentLogin(req, res, next) {
  try {
    const result = await authService.agentLogin(req.body.email, req.body.password, req.ip);
    successResponse(res, result, 'Login successful');
  } catch (e) { next(e); }
}

async function refreshTokens(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 'Refresh token required', 400);
    const result = await authService.refreshTokens(refreshToken);
    successResponse(res, result, 'Tokens refreshed');
  } catch (e) { next(e); }
}

async function forgotPassword(req, res, next) {
  try {
    await authService.adminForgotPassword(req.body.email);
    successResponse(res, null, 'If email exists, reset link has been sent');
  } catch (e) { next(e); }
}

async function resetPassword(req, res, next) {
  try {
    await authService.adminResetPassword(req.body.token, req.body.password);
    successResponse(res, null, 'Password reset successful');
  } catch (e) { next(e); }
}

async function changePassword(req, res, next) {
  try {
    await authService.changePassword(req.user.role, req.user.id, req.body.old_password, req.body.new_password);
    successResponse(res, null, 'Password changed successfully');
  } catch (e) { next(e); }
}

async function agentResetPassword(req, res, next) {
  try {
    await authService.agentResetPassword(req.body.mobile, req.body.newPassword);
    successResponse(res, null, 'Password reset successfully');
  } catch (e) { next(e); }
}

async function logout(req, res) {
  successResponse(res, null, 'Logged out successfully');
}

module.exports = { adminLogin, rmSignup, rmLogin, agentSignup, agentLogin, agentResetPassword, refreshTokens, forgotPassword, resetPassword, changePassword, logout };
