const bajajService        = require('../services/bajaj.service');
const { successResponse } = require('../utils/response');

async function ckyc(req, res, next) {
  try {
    const result = await bajajService.runCkyc(req.body);
    successResponse(res, result, 'CKYC verification completed successfully');
  } catch (e) { next(e); }
}

async function proposal(req, res, next) {
  try {
    const result = await bajajService.runProposal(req.body);
    // console.log("proposal result",result)
    const premiumAmount = result.proposalResponse.pTrvPolDtls_inout?.finalPremium ?? null;
    successResponse(res, { ...result, premiumAmount }, 'Premium calculated successfully');
  } catch (e) { next(e); }
}

async function planDetails(req, res, next) {
  try {
    const result = await bajajService.getPlanDetails(req.query.planname);
    successResponse(res, result, 'Plan details fetched successfully');
  } catch (e) { next(e); }
}

async function bharatBhramanPremium(req, res, next) {
  try {
    const result = await bajajService.getBharatBhramanPremium(req.body.no_of_days);
    successResponse(res, result, 'Premium fetched successfully');
  } catch (e) { next(e); }
}

module.exports = { ckyc, proposal, planDetails, bharatBhramanPremium };
