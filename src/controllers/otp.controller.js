const otpService = require('../services/otp.service');
const { successResponse } = require('../utils/response');

async function sendOtp(req, res, next) {
  try {
    const { phoneNumber, purpose } = req.body;
    const result = await otpService.sendOtp(phoneNumber, purpose);
    successResponse(res, result, result.message);
  } catch (e) { next(e); }
}

async function verifyOtp(req, res, next) {
  try {
    const { phoneNumber, otp, purpose } = req.body;
    const result = await otpService.verifyOtp(phoneNumber, otp, purpose);
    successResponse(res, result, 'OTP verified successfully');
  } catch (e) { next(e); }
}

module.exports = { sendOtp, verifyOtp };
