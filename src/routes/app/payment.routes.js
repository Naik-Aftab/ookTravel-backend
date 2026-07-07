const router = require('express').Router();
const ctrl   = require('../../controllers/app.payment.controller');

// POST /api/app/payment/create-order
router.post('/create-order', ctrl.createOrder);

// GET /api/app/payment/verify-order/:orderId
router.get('/verify-order/:orderId', ctrl.verifyOrder);

// POST /api/app/payment/complete-order/:orderId
router.post('/complete-order/:orderId', ctrl.completeOrder);

// POST /api/app/payment/webhook
router.post('/webhook', ctrl.webhook);

// GET /api/app/payment/return — fallback landing page if a payment method
// bounces through order_meta.return_url instead of resolving inside the app's SDK WebView.
router.get('/return', (req, res) => {
  res.send('<html><body>Payment processed. You may return to the app.</body></html>');
});

module.exports = router;
