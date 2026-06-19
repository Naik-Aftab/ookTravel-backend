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

module.exports = { getAll, markRead, markAllRead, unreadCount };
