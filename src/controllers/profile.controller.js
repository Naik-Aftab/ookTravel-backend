const profileService     = require('../services/profile.service');
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

module.exports = { updateDetails, updateProfilePhoto };
