const path       = require('path');
const fs         = require('fs');
const agentRepo  = require('../repositories/agent.repository');

async function updateDetails(agentId, { fullName, email, phoneNumber }) {
  // Check email uniqueness (exclude self)
  if (email) {
    const taken = await agentRepo.findByEmailExcluding(email, agentId);
    if (taken) throw Object.assign(new Error('Email is already in use by another account'), { statusCode: 409 });
  }

  // Check phone uniqueness (exclude self)
  if (phoneNumber) {
    const taken = await agentRepo.findByMobileExcluding(phoneNumber, agentId);
    if (taken) throw Object.assign(new Error('Phone number is already in use by another account'), { statusCode: 409 });
  }

  await agentRepo.updateDetails(agentId, {
    full_name: fullName,
    email,
    mobile: phoneNumber,
  });

  return agentRepo.findById(agentId);
}

async function updateProfilePhoto(agentId, file) {
  if (!file) throw Object.assign(new Error('No photo uploaded'), { statusCode: 400 });

  // Delete old photo from disk if it exists
  const agent = await agentRepo.findById(agentId);
  if (agent.profile_photo) {
    const oldPath = path.join(__dirname, '../../', agent.profile_photo.replace(/^\//, ''));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  // Save relative URL path in DB  e.g. /uploads/profiles/1234567890-123.jpg
  const photoUrl = `/uploads/profiles/${file.filename}`;
  await agentRepo.updateProfilePhoto(agentId, photoUrl);

  return agentRepo.findById(agentId);
}

module.exports = { updateDetails, updateProfilePhoto };
