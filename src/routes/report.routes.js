const router            = require('express').Router();
const ctrl               = require('../controllers/report.controller');
const { authenticate }   = require('../middleware/auth.middleware');
const { authorize }      = require('../middleware/role.middleware');

router.get('/performance',     authenticate, authorize('admin'), ctrl.getPerformanceReport);
router.get('/performance/pdf', authenticate, authorize('admin'), ctrl.downloadPerformanceReportPdf);

module.exports = router;
