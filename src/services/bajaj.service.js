const axios  = require('axios');
const logger = require('../utils/logger');

const BASE_URL        = process.env.POLICYPLANNER_BASE_URL || 'https://policyplanner.com';
const REQUEST_TIMEOUT = 40000;

function thirdPartyError(err, fallbackMessage) {
  const status  = err.response?.status || 502;
  const message = err.response?.data?.message || fallbackMessage;
  return Object.assign(new Error(message), { statusCode: status, details: err.response?.data });
}

async function runCkyc(payload) {
  let result;
  try {
    const { data } = await axios.post(`${BASE_URL}/travel-insurance/ckyc/bajaj`, payload, { timeout: REQUEST_TIMEOUT });
    result = data;
  } catch (err) {
    logger.error(`Bajaj CKYC API failed: ${err.message}`);
    throw thirdPartyError(err, 'CKYC verification failed. Please try again.');
  }

  if (result.status && result.status !== 'success') {
    throw Object.assign(new Error(result.message || 'CKYC verification failed'), { statusCode: 422, details: result });
  }

  return result;
}

async function runProposal(payload) {
  let result;
  console.log("payload",payload)
  try {
    const { data } = await axios.post(`${BASE_URL}/travel-insurance/proposal/bajaj`, payload, { timeout: REQUEST_TIMEOUT });
    result = data;
  } catch (err) {
    logger.error(`Bajaj proposal API failed: ${err.message}`);
    throw thirdPartyError(err, 'Premium calculation failed. Please try again.');
  }

  if (result.pErrorCode_out && result.pErrorCode_out !== '0') {
    throw Object.assign(
      new Error(result.pError_out?.errText || 'Premium calculation failed'),
      { statusCode: 422, details: result }
    );
  }
  return result;
}

async function getBharatBhramanPremium(no_of_days) {
  let result;
  try {
    const { data } = await axios.post(
      `${BASE_URL}/travel-insurance/bajaj/bharat-bhraman`,
      { no_of_days },
      { timeout: REQUEST_TIMEOUT }
    );
    result = data;
  } catch (err) {
    logger.error(`Bharat Bhraman premium API failed: ${err.message}`);
    throw thirdPartyError(err, 'Failed to fetch premium. Please try again.');
  }
  return result;
}

async function getPlanDetails(planname) {
  let result;
  try {
    const { data } = await axios.get(`${BASE_URL}/travel-insurance/proposal/plan-details`, {
      params:  { planname },
      timeout: REQUEST_TIMEOUT,
    });
    result = data;
  } catch (err) {
    logger.error(`Bajaj plan-details API failed: ${err.message}`);
    throw thirdPartyError(err, 'Failed to fetch plan details. Please try again.');
  }

  const planData = result.data || result;
  if (planData.pErrorCode_out && planData.pErrorCode_out !== '0') {
    throw Object.assign(
      new Error(planData.pError_out?.errText || 'Failed to fetch plan details'),
      { statusCode: 422, details: result }
    );
  }
  return planData;
}

module.exports = { runCkyc, runProposal, getPlanDetails, getBharatBhramanPremium };
