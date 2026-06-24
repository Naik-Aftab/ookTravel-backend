const router = require('express').Router();
const ctrl   = require('../../controllers/app.commission.controller');

router.get('/summary', ctrl.getAgentSummary);

module.exports = router;
