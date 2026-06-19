const notifRepo = require('../repositories/notification.repository');

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

module.exports = { getNotifications, markRead, markAllRead, getUnreadCount };
