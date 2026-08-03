const { query } = require('../config/database');

async function upsert(agentId, expoPushToken, platform, deviceInfo) {
  return query(
    `INSERT INTO ooktravel_push_tokens (agent_id, expo_push_token, platform, device_info, is_active)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE agent_id = VALUES(agent_id), platform = VALUES(platform),
       device_info = VALUES(device_info), is_active = 1`,
    [agentId, expoPushToken, platform, deviceInfo || null]
  );
}

async function deactivate(agentId, expoPushToken) {
  return query(
    'UPDATE ooktravel_push_tokens SET is_active = 0 WHERE agent_id = ? AND expo_push_token = ?',
    [agentId, expoPushToken]
  );
}

async function deactivateByToken(expoPushToken) {
  return query('UPDATE ooktravel_push_tokens SET is_active = 0 WHERE expo_push_token = ?', [expoPushToken]);
}

async function findActiveByAgentIds(agentIds) {
  if (!agentIds.length) return [];
  const placeholders = agentIds.map(() => '?').join(',');
  return query(
    `SELECT agent_id, expo_push_token FROM ooktravel_push_tokens WHERE is_active = 1 AND agent_id IN (${placeholders})`,
    agentIds
  );
}

module.exports = { upsert, deactivate, deactivateByToken, findActiveByAgentIds };
