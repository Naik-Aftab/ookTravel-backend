const { v4: uuidv4 }      = require('uuid');
const paymentService      = require('../services/payment.service');
const paymentRepo         = require('../repositories/payment.repository');
const policyService       = require('../services/policy.service');
const logger              = require('../utils/logger');
const { successResponse } = require('../utils/response');

function validateRequestPayload(payload) {
  if (!payload || typeof payload !== 'object') return 'requestPayload is required for non-bulk orders';
  if (!payload.agent_id) return 'requestPayload.agent_id is required';
  if (!['individual', 'bulk'].includes(payload.plan_type)) return 'requestPayload.plan_type must be individual or bulk';
  if (!payload.travel_date || !payload.return_date) return 'requestPayload.travel_date and return_date are required';
  return null;
}

async function createOrder(req, res, next) {
  try {
    const { customerId, customerPhone, customerEmail, customerName, requestType, requestPayload } = req.body;
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0 || !customerId || !customerPhone) {
      return res.status(400).json({ success: false, message: 'A positive amount, customerId and customerPhone are required' });
    }

    // Bulk requests carry a file upload that can't be replayed from a stored JSON payload, so
    // they're intentionally excluded from webhook-based reconciliation (see payment.repository.js).
    let payloadToStore = null;
    if (requestType !== 'bulk') {
      const validationError = validateRequestPayload(requestPayload);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }
      payloadToStore = requestPayload;
    }

    const orderId = `ookt_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const order = await paymentService.createOrder({
      orderId, amount, customerId, customerPhone, customerEmail, customerName,
    });

    if (payloadToStore) {
      await paymentRepo.createPendingOrder({
        orderId,
        agentId: payloadToStore.agent_id,
        amount,
        // Bake in the authoritative amount/reference so a client can't submit a request tied to a
        // payment it never made — these two fields are never trusted from the request body itself.
        requestPayload: { ...payloadToStore, payment_amount: amount, payment_reference: orderId },
      });
    }

    successResponse(res, {
      order_id:           order.order_id,
      payment_session_id: order.payment_session_id,
    }, 'Order created successfully');
  } catch (e) { next(e); }
}

async function verifyOrder(req, res, next) {
  try {
    const order = await paymentService.fetchOrder(req.params.orderId);
    successResponse(res, {
      order_id:     order.order_id,
      order_status: order.order_status,
      order_amount: order.order_amount,
    });
  } catch (e) { next(e); }
}

// Creates the policy request from the payload stored at create-order time, once — safe to call
// more than once (from both the app's own flow and the webhook) for the same order.
async function fulfillPaidOrder(orderId) {
  const pending = await paymentRepo.findByOrderId(orderId);
  if (!pending) return null;
  if (pending.policy_request_id) return pending.policy_request_id;

  const claimed = await paymentRepo.claimForFulfillment(orderId);
  if (!claimed) {
    // Lost the race to the other caller — read back whatever it produced.
    const refreshed = await paymentRepo.findByOrderId(orderId);
    return refreshed?.policy_request_id ?? null;
  }

  const payload = JSON.parse(pending.request_payload);
  const result = await policyService.createRequest(payload, null);
  await paymentRepo.markPolicyRequestId(orderId, result.id);
  return result.id;
}

// POST /api/app/payment/complete-order/:orderId — called by the app right after the Cashfree SDK
// reports payment success. Re-checks the order with Cashfree itself (never trusts the client's
// say-so) before creating the policy request from the payload captured at create-order time.
async function completeOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const order = await paymentService.fetchOrder(orderId);

    if (order.order_status !== 'PAID') {
      return res.status(409).json({ success: false, message: `Order is not paid (status: ${order.order_status})` });
    }

    const requestId = await fulfillPaidOrder(orderId);
    if (requestId == null) {
      return res.status(404).json({ success: false, message: 'No pending request found for this order' });
    }

    successResponse(res, { request_id: requestId }, 'Policy request submitted');
  } catch (e) { next(e); }
}

// POST /api/app/payment/webhook — server-to-server notification from Cashfree.
// Requires req.rawBody (raw request bytes) captured by the express.json verify hook in server.js.
// Acts as the fallback path if the app never calls complete-order (killed, dropped network, etc).
async function webhook(req, res) {
  let event;
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp  = req.headers['x-webhook-timestamp'];
    event = paymentService.verifyWebhookSignature(signature, req.rawBody?.toString() ?? '', timestamp);
  } catch (err) {
    // Signature genuinely invalid/missing — reject so it's not mistaken for a trusted event.
    logger.error(`Cashfree webhook signature verification failed: ${err.message}`);
    return res.sendStatus(400);
  }

  // Signature is valid past this point. Any failure below is our own processing bug, not a
  // security issue — always ack with 200 so Cashfree doesn't retry-storm an event we already saw.
  try {
    const { order, payment } = event.object?.data ?? {};
    logger.info(`Cashfree webhook — type: ${event.type} | order: ${order?.order_id} | status: ${payment?.payment_status}`);

    if (payment?.payment_status === 'SUCCESS' && order?.order_id) {
      const requestId = await fulfillPaidOrder(order.order_id);
      if (requestId) logger.info(`Cashfree webhook fulfilled order ${order.order_id} -> policy request ${requestId}`);
    }
  } catch (err) {
    logger.error(`Cashfree webhook processing error: ${err.message}`);
  }

  res.sendStatus(200);
}

module.exports = { createOrder, verifyOrder, completeOrder, webhook };
