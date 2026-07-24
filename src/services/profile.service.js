const path       = require('path');
const fs         = require('fs');
const bcrypt     = require('bcryptjs');
const crypto     = require('crypto');
const agentRepo  = require('../repositories/agent.repository');
const auditRepo  = require('../repositories/audit.repository');

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

function deleteFileIfExists(relativePath) {
  if (!relativePath) return;
  const fullPath = path.join(__dirname, '../../', relativePath.replace(/^\//, ''));
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
}

async function deleteAccount(agentId, password) {
  const agent = await agentRepo.findById(agentId);
  if (!agent) throw Object.assign(new Error('Account not found'), { statusCode: 404 });
  if (agent.status === 'suspended' || agent.email.endsWith('@ooktravel.invalid')) {
    throw Object.assign(new Error('This account has already been deleted'), { statusCode: 400 });
  }

  const match = await bcrypt.compare(password, agent.password);
  if (!match) throw Object.assign(new Error('Incorrect password'), { statusCode: 401 });

  deleteFileIfExists(agent.profile_photo);
  deleteFileIfExists(agent.pan_document);
  deleteFileIfExists(agent.bank_document);
  deleteFileIfExists(agent.aadhar_document);

  const unusablePasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
  await agentRepo.softDeleteAccount(agentId, unusablePasswordHash);

  await auditRepo.log({
    user_type: 'agent', user_id: agentId, user_name: agent.full_name,
    action: 'AGENT_SELF_DELETED_ACCOUNT',
    entity_type: 'agent', entity_id: agentId,
  });
}

module.exports = { updateDetails, updateProfilePhoto, deleteAccount };
