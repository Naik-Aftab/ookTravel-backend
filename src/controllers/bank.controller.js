const bankService        = require('../services/bank.service');
const { successResponse } = require('../utils/response');

async function saveBankDetails(req, res, next) {
  try {
    const bank_details = await bankService.saveBankDetails(req.body.agent_id, req.body, req.files);
    successResponse(res, { bank_details }, 'Bank details saved successfully', 201);
  } catch (e) { next(e); }
}

async function editBankDetails(req, res, next) {
  try {
    const bank_details = await bankService.editBankDetails(req.body.agent_id, req.body, req.files);
    successResponse(res, { bank_details }, 'Bank details updated successfully');
  } catch (e) { next(e); }
}

module.exports = { saveBankDetails, editBankDetails };
