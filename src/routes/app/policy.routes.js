const router                 = require('express').Router();
const ctrl                   = require('../../controllers/app.policy.controller');
const bulkCtrl               = require('../../controllers/app.bulk.controller');
const { validate }           = require('../../middleware/validate.middleware');
const { createRequestRules } = require('../../validators/app.policy.validator');
const { uploadBulk }         = require('../../middleware/upload.middleware');

router.get( '/requests', ctrl.getAgentRequests);
router.post('/requests', createRequestRules, validate, ctrl.createRequest);
router.post('/bulk',     uploadBulk.single('file'),    bulkCtrl.submitBulkUpload);

module.exports = router;
