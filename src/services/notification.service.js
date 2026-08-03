const notifRepo     = require('../repositories/notification.repository');
const batchRepo      = require('../repositories/notificationBatch.repository');
const pushTokenRepo  = require('../repositories/pushToken.repository');
const agentRepo      = require('../repositories/agent.repository');
const auditRepo      = require('../repositories/audit.repository');
const pushService    = require('./push.service');

async function getNotifications(userType, userId, pagination) {
  return notifRepo.findByUser(userType, userId, pagination);
}

async function markRead(id, userType, userId) {
  await notifRepo.markRead(id, userType, userId);
}

async function markAllRead(userType, userId) {
  await notifRepo.markAllRead(userType, userId);
}

async function getUnreadCount(userType, userId) {
  return notifRepo.unreadCount(userType, userId);
}

async function sendNotification({ title, message, category, target_type, target_value }, adminId, adminName, ip) {
  let agentIds;

  if (target_type === 'single') {
    const agent = await agentRepo.findById(+target_value);
    if (!agent || agent.deleted_at) throw Object.assign(new Error('Agent not found'), { statusCode: 404 });
    agentIds = [agent.id];
  } else {
    agentIds = await agentRepo.findIdsByTarget(target_type, target_value);
  }

  if (!agentIds.length) throw Object.assign(new Error('No matching agents found for this target'), { statusCode: 400 });

  const batchId = await batchRepo.create({
    admin_id: adminId, title, message, category, target_type,
    target_meta: target_type === 'all' ? null : String(target_value),
    recipient_count: agentIds.length,
  });

  await notifRepo.createBatch({ batchId, agentIds, title, message, category });

  const tokenRows  = await pushTokenRepo.findActiveByAgentIds(agentIds);
  const pushTokens = tokenRows.map(r => r.expo_push_token);
  const { sent, failed } = await pushService.sendToTokens(pushTokens, {
    title, body: message, data: { category, batchId },
  });
  await batchRepo.updatePushCounts(batchId, { sent, failed });

  await auditRepo.log({
    user_type: 'admin', user_id: adminId, user_name: adminName,
    action: 'NOTIFICATION_SENT', entity_type: 'notification_batch', entity_id: batchId,
    new_values: { title, category, target_type, target_value, recipient_count: agentIds.length },
    ip_address: ip,
  });

  return { batchId, recipientCount: agentIds.length, pushSent: sent, pushFailed: failed };
}

async function getSentHistory(pagination) {
  return batchRepo.findAll(pagination);
}

async function pushToAgent(agentId, { title, body, data } = {}) {
  const tokenRows  = await pushTokenRepo.findActiveByAgentIds([agentId]);
  const pushTokens = tokenRows.map(r => r.expo_push_token);
  return pushService.sendToTokens(pushTokens, { title, body, data });
}

module.exports = {
  getNotifications, markRead, markAllRead, getUnreadCount,
  sendNotification, getSentHistory, pushToAgent,
};
