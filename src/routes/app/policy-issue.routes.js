const router = require('express').Router();
const ctrl   = require('../../controllers/app.policy.issue.controller');

// GET /api/app/policy-issue/agent/:agentId
router.get('/agent/:agentId', ctrl.getAgentIssuedPolicies);

module.exports = router;
