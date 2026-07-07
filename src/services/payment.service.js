const { Cashfree, CFEnvironment } = require('cashfree-pg');
const logger = require('../utils/logger');

const cashfree = new Cashfree(
  process.env.CASHFREE_ENV === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

function thirdPartyError(err, fallbackMessage) {
  const status  = err.response?.status || 502;
  const message = err.response?.data?.message || fallbackMessage;
  return Object.assign(new Error(message), { statusCode: status, details: err.response?.data });
}

async function createOrder({ orderId, amount, customerId, customerPhone, customerEmail, customerName }) {
  try {
    const { data } = await cashfree.PGCreateOrder({
      order_id:       orderId,
      order_amount:   amount,
      order_currency: 'INR',
      customer_details: {
        customer_id:    customerId,
        customer_name:  customerName || 'Customer',
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${process.env.BACKEND_PUBLIC_URL}/api/app/payment/return?order_id={order_id}`,
        notify_url: `${process.env.BACKEND_PUBLIC_URL}/api/app/payment/webhook`,
      },
    });
    return data;
  } catch (err) {
    logger.error(`Cashfree create order failed: ${err.message}`);
    throw thirdPartyError(err, 'Unable to create payment order. Please try again.');
  }
}

async function fetchOrder(orderId) {
  try {
    const { data } = await cashfree.PGFetchOrder(orderId);
    return data;
  } catch (err) {
    logger.error(`Cashfree fetch order failed: ${err.message}`);
    throw thirdPartyError(err, 'Unable to fetch payment status. Please try again.');
  }
}

function verifyWebhookSignature(signature, rawBody, timestamp) {
  return cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
}

module.exports = { createOrder, fetchOrder, verifyWebhookSignature };
