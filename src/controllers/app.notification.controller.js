const pushTokenRepo = require('../repositories/pushToken.repository');
const notifService  = require('../services/notification.service');
const { successResponse, paginatedResponse } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const { agent_id, page = 1, limit = 20 } = req.query;
    const { rows, total } = await notifService.getNotifications('agent', +agent_id, { page: +page, limit: +limit });
    paginatedResponse(res, rows, total, page, limit, 'Notifications retrieved');
  } catch (e) { next(e); }
}

async function unreadCount(req, res, next) {
  try {
    const count = await notifService.getUnreadCount('agent', +req.query.agent_id);
    successResponse(res, { count }, 'Unread count retrieved');
  } catch (e) { next(e); }
}

async function markRead(req, res, next) {
  try {
    await notifService.markRead(+req.params.id, 'agent', +req.body.agent_id);
    successResponse(res, null, 'Notification marked as read');
  } catch (e) { next(e); }
}

async function markAllRead(req, res, next) {
  try {
    await notifService.markAllRead('agent', +req.body.agent_id);
    successResponse(res, null, 'All notifications marked as read');
  } catch (e) { next(e); }
}

async function registerToken(req, res, next) {
  try {
    const { agent_id, expo_push_token, platform, device_info } = req.body;
    await pushTokenRepo.upsert(agent_id, expo_push_token, platform, device_info);
    successResponse(res, null, 'Push token registered');
  } catch (e) { next(e); }
}

async function unregisterToken(req, res, next) {
  try {
    await pushTokenRepo.deactivate(req.body.agent_id, req.body.expo_push_token);
    successResponse(res, null, 'Push token unregistered');
  } catch (e) { next(e); }
}

module.exports = { getAll, unreadCount, markRead, markAllRead, registerToken, unregisterToken };
