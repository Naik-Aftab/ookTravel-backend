const policyService = require('../services/policy.service');
const { successResponse, paginatedResponse } = require('../utils/response');
const path = require('path');

async function createRequest(req, res, next) {
  try {
    const paymentScreenshot = req.file ? `/uploads/payments/${req.file.filename}` : null;
    const data = {
      ...req.body,
      agent_id:            req.user.id,
      payment_screenshot:  paymentScreenshot,
    };
    const result = await policyService.createRequest(data, req.ip);
    successResponse(res, result, 'Policy request submitted', 201);
  } catch (e) { next(e); }
}

async function getAllRequests(req, res, next) {
  try {
    const { status, rm_id, agent_id, search, page = 1, limit = 20 } = req.query;
    const effectiveRmId    = req.user.role === 'rm' ? req.user.id : rm_id;
    const effectiveAgentId = req.user.role === 'agent' ? req.user.id : agent_id;
    const { rows, total } = await policyService.getAllRequests({ status, rm_id: effectiveRmId, agent_id: effectiveAgentId, search, page: +page, limit: +limit });
    paginatedResponse(res, rows, total, page, limit, 'Requests retrieved');
  } catch (e) { next(e); }
}

async function getRequestById(req, res, next) {
  try {
    const req_ = await policyService.getRequestById(+req.params.id);
    successResponse(res, req_, 'Request retrieved');
  } catch (e) { next(e); }
}

async function updateStatus(req, res, next) {
  try {
    const { status, remarks } = req.body;
    await policyService.updateRequestStatus(+req.params.id, status, remarks, req.user.id, req.user.role, req.ip);
    successResponse(res, null, 'Status updated');
  } catch (e) { next(e); }
}

async function issuePolicy(req, res, next) {
  try {
    const pdfPath = req.file ? `/uploads/policies/${req.file.filename}` : null;
    const result = await policyService.issuePolicy(+req.params.id, req.body, pdfPath, req.user.id, req.user.role, req.ip);
    successResponse(res, result, 'Policy issued successfully', 201);
  } catch (e) { next(e); }
}

async function getAllPolicies(req, res, next) {
  try {
    const { agent_id, rm_id, status, search, page = 1, limit = 20 } = req.query;
    const effectiveRmId    = req.user.role === 'rm' ? req.user.id : rm_id;
    const effectiveAgentId = req.user.role === 'agent' ? req.user.id : agent_id;
    const { rows, total } = await policyService.getAllPolicies({ agent_id: effectiveAgentId, rm_id: effectiveRmId, status, search, page: +page, limit: +limit });
    paginatedResponse(res, rows, total, page, limit, 'Policies retrieved');
  } catch (e) { next(e); }
}

async function getPolicyById(req, res, next) {
  try {
    const policy = await policyService.getPolicyById(+req.params.id);
    successResponse(res, policy, 'Policy retrieved');
  } catch (e) { next(e); }
}

module.exports = { createRequest, getAllRequests, getRequestById, updateStatus, issuePolicy, getAllPolicies, getPolicyById };
