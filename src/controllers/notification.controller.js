const notifService = require('../services/notification.service');
const { successResponse, paginatedResponse } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { rows, total } = await notifService.getNotifications(req.user.role, req.user.id, { page: +page, limit: +limit });
    paginatedResponse(res, rows, total, page, limit, 'Notifications retrieved');
  } catch (e) { next(e); }
}

async function markRead(req, res, next) {
  try {
    await notifService.markRead(+req.params.id, req.user.role, req.user.id);
    successResponse(res, null, 'Notification marked as read');
  } catch (e) { next(e); }
}

async function markAllRead(req, res, next) {
  try {
    await notifService.markAllRead(req.user.role, req.user.id);
    successResponse(res, null, 'All notifications marked as read');
  } catch (e) { next(e); }
}

async function unreadCount(req, res, next) {
  try {
    const count = await notifService.getUnreadCount(req.user.role, req.user.id);
    successResponse(res, { count }, 'Unread count retrieved');
  } catch (e) { next(e); }
}

async function send(req, res, next) {
  try {
    const result = await notifService.sendNotification(
      req.body, req.user.id, req.user.full_name || req.user.email, req.ip
    );
    successResponse(res, result, 'Notification sent');
  } catch (e) { next(e); }
}

async function sentHistory(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { rows, total } = await notifService.getSentHistory({ page: +page, limit: +limit });
    paginatedResponse(res, rows, total, page, limit, 'Sent notifications retrieved');
  } catch (e) { next(e); }
}

module.exports = { getAll, markRead, markAllRead, unreadCount, send, sentHistory };
