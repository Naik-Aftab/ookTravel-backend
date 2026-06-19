const rmService = require('../services/rm.service');
const { successResponse, paginatedResponse } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const { rows, total } = await rmService.getAllRms({ status, search, page: +page, limit: +limit });
    paginatedResponse(res, rows, total, page, limit, 'RMs retrieved');
  } catch (e) { next(e); }
}

async function getOne(req, res, next) {
  try {
    const rm = await rmService.getRmById(+req.params.id);
    successResponse(res, rm, 'RM retrieved');
  } catch (e) { next(e); }
}

async function approve(req, res, next) {
  try {
    await rmService.approveRm(+req.params.id, req.user.id, req.user.full_name || req.user.email, req.ip);
    successResponse(res, null, 'RM approved successfully');
  } catch (e) { next(e); }
}

async function suspend(req, res, next) {
  try {
    await rmService.suspendRm(+req.params.id, req.user.id, req.user.full_name || req.user.email, req.ip);
    successResponse(res, null, 'RM suspended');
  } catch (e) { next(e); }
}

async function activate(req, res, next) {
  try {
    await rmService.activateRm(+req.params.id, req.user.id, req.user.full_name || req.user.email, req.ip);
    successResponse(res, null, 'RM activated');
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    await rmService.updateRm(+req.params.id, req.body, req.user.id, req.user.full_name || req.user.email, req.ip);
    successResponse(res, null, 'RM updated');
  } catch (e) { next(e); }
}

async function resetPassword(req, res, next) {
  try {
    await rmService.resetRmPassword(+req.params.id, req.body.new_password, req.user.id, req.user.full_name || req.user.email, req.ip);
    successResponse(res, null, 'Password reset successful');
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    await rmService.deleteRm(+req.params.id, req.user.id, req.user.full_name || req.user.email, req.ip);
    successResponse(res, null, 'RM deleted');
  } catch (e) { next(e); }
}

module.exports = { getAll, getOne, approve, suspend, activate, update, resetPassword, remove };
