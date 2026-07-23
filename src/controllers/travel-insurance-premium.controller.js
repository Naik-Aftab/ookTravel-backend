const premiumService      = require('../services/travel-insurance-premium.service');
const { successResponse } = require('../utils/response');

async function getPremium(req, res, next) {
  try {
    const result = await premiumService.getPremium(req.body.no_of_days);
    successResponse(res, result, 'Premium fetched successfully');
  } catch (e) { next(e); }
}

module.exports = { getPremium };
