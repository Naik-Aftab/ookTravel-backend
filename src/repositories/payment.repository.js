const { query, queryOne } = require('../config/database');

async function createPendingOrder({ orderId, agentId, amount, requestPayload }) {
  await query(
    `INSERT INTO ooktravel_payment_orders (order_id, agent_id, amount, request_payload)
     VALUES (?, ?, ?, ?)`,
    [orderId, agentId, amount, JSON.stringify(requestPayload)]
  );
}

async function findByOrderId(orderId) {
  return queryOne(`SELECT * FROM ooktravel_payment_orders WHERE order_id = ?`, [orderId]);
}

// Atomically claims the order for fulfillment so the client-triggered complete-order call
// and the async webhook can race safely — only one of them will win this UPDATE.
async function claimForFulfillment(orderId) {
  const result = await query(
    `UPDATE ooktravel_payment_orders SET status = 'fulfilled' WHERE order_id = ? AND status = 'created'`,
    [orderId]
  );
  return result.affectedRows === 1;
}

async function markPolicyRequestId(orderId, policyRequestId) {
  await query(`UPDATE ooktravel_payment_orders SET policy_request_id = ? WHERE order_id = ?`, [policyRequestId, orderId]);
}

module.exports = { createPendingOrder, findByOrderId, claimForFulfillment, markPolicyRequestId };
