const { Expo } = require('expo-server-sdk');
const pushTokenRepo = require('../repositories/pushToken.repository');
const logger = require('../utils/logger');

const expo = new Expo();

async function sendToTokens(pushTokens, { title, body, data } = {}) {
  const messages = pushTokens
    .filter(token => Expo.isExpoPushToken(token))
    .map(token => ({ to: token, sound: 'default', title, body, data, priority: 'high' }));

  if (!messages.length) return { sent: 0, failed: 0 };

  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;
  let failed = 0;

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        if (ticket.status === 'error') {
          failed++;
          logger.error(`Expo push ticket error for ${chunk[i].to}: ${ticket.message}`);
          if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
            pushTokenRepo.deactivateByToken(chunk[i].to).catch(() => {});
          }
        } else {
          sent++;
        }
      });
    } catch (err) {
      failed += chunk.length;
      logger.error(`Expo push chunk send failed: ${err.message}`);
    }
  }

  return { sent, failed };
}

module.exports = { sendToTokens };
