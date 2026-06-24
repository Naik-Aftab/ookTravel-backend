const bcrypt       = require('bcryptjs');
const rmRepo       = require('../repositories/rm.repository');
const notifRepo    = require('../repositories/notification.repository');
const auditRepo    = require('../repositories/audit.repository');
const { sendEmail, rmApprovalEmail } = require('../utils/email');
const logger       = require('../utils/logger');

async function getAllRms(filters) {
  return rmRepo.findAll(filters);
}

async function getRmById(id) {
  const rm = await rmRepo.findById(id);
  if (!rm) throw Object.assign(new Error('RM not found'), { statusCode: 404 });
  return rm;
}

async function approveRm(id, adminId, adminName, ip) {
  const rm = await rmRepo.findById(id);
  if (!rm) throw Object.assign(new Error('RM not found'), { statusCode: 404 });
  if (rm.status === 'active') throw Object.assign(new Error('RM already active'), { statusCode: 400 });

  await rmRepo.updateStatus(id, 'active', adminId);
  await sendEmail(rmApprovalEmail(rm)).catch(err => {
    logger.error(`RM approval email failed for ${rm.email}: ${err.message}`);
  });
  await notifRepo.create({ user_type: 'rm', user_id: id, title: 'Account Approved', message: 'Your RM account has been approved. You can now log in.', type: 'approval' });
  await auditRepo.log({ user_type: 'admin', user_id: adminId, user_name: adminName, action: 'RM_APPROVED', entity_type: 'rm', entity_id: id, ip_address: ip });
}

async function suspendRm(id, adminId, adminName, ip) {
  const rm = await rmRepo.findById(id);
  if (!rm) throw Object.assign(new Error('RM not found'), { statusCode: 404 });
  await rmRepo.updateStatus(id, 'suspended');
  await auditRepo.log({ user_type: 'admin', user_id: adminId, user_name: adminName, action: 'RM_SUSPENDED', entity_type: 'rm', entity_id: id, ip_address: ip });
}

async function activateRm(id, adminId, adminName, ip) {
  await rmRepo.updateStatus(id, 'active');
  await auditRepo.log({ user_type: 'admin', user_id: adminId, user_name: adminName, action: 'RM_ACTIVATED', entity_type: 'rm', entity_id: id, ip_address: ip });
}

async function updateRm(id, data, adminId, adminName, ip) {
  const rm = await rmRepo.findById(id);
  if (!rm) throw Object.assign(new Error('RM not found'), { statusCode: 404 });
  await rmRepo.update(id, data);
  await auditRepo.log({ user_type: 'admin', user_id: adminId, user_name: adminName, action: 'RM_UPDATED', entity_type: 'rm', entity_id: id, new_values: data, ip_address: ip });
}

async function resetRmPassword(id, newPassword, adminId, adminName, ip) {
  const hashed = await bcrypt.hash(newPassword, 12);
  await rmRepo.updatePassword(id, hashed);
  await auditRepo.log({ user_type: 'admin', user_id: adminId, user_name: adminName, action: 'RM_PASSWORD_RESET', entity_type: 'rm', entity_id: id, ip_address: ip });
}

async function deleteRm(id, adminId, adminName, ip) {
  const rm = await rmRepo.findById(id);
  if (!rm) throw Object.assign(new Error('RM not found'), { statusCode: 404 });
  if (rm.agent_count > 0) throw Object.assign(new Error('Cannot delete RM with assigned agents'), { statusCode: 400 });
  await rmRepo.deleteById(id);
  await auditRepo.log({ user_type: 'admin', user_id: adminId, user_name: adminName, action: 'RM_DELETED', entity_type: 'rm', entity_id: id, ip_address: ip });
}

module.exports = { getAllRms, getRmById, approveRm, suspendRm, activateRm, updateRm, resetRmPassword, deleteRm };
