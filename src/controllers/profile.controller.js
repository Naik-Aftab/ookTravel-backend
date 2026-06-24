const profileService     = require('../services/profile.service');
const agentRepo          = require('../repositories/agent.repository');
const { successResponse } = require('../utils/response');

async function updateDetails(req, res, next) {
  try {
    const agent = await profileService.updateDetails(req.body.agent_id, req.body);
    successResponse(res, { agent }, 'Profile updated successfully');
  } catch (e) { next(e); }
}

async function updateProfilePhoto(req, res, next) {
  try {
    const agent = await profileService.updateProfilePhoto(req.body.agent_id, req.file);
    successResponse(res, { agent }, 'Profile photo updated successfully');
  } catch (e) { next(e); }
}

async function getAssignedRm(req, res, next) {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    const rm = await agentRepo.findAssignedRm(agentId);
    res.json({ ok: true, data: rm || null });
  } catch (e) { next(e); }
}

module.exports = { updateDetails, updateProfilePhoto, getAssignedRm };
