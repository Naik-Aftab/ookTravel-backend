const router           = require('express').Router();
const ctrl             = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

router.get('/admin/stats',  authenticate, authorize('admin'), ctrl.adminStats);
router.get('/admin/charts', authenticate, authorize('admin'), ctrl.charts);
router.get('/admin/audit',  authenticate, authorize('admin'), ctrl.auditLogs);
router.get('/rm/stats',     authenticate, authorize('rm'),    ctrl.rmStats);

module.exports = router;
