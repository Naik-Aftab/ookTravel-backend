const router = require('express').Router();

router.use('/auth',         require('./auth.routes'));
router.use('/profile',      require('./profile.routes'));
router.use('/bank',         require('./bank.routes'));
router.use('/bajaj',        require('./bajaj.routes'));
router.use('/policy',       require('./policy.routes'));
router.use('/policy-issue', require('./policy-issue.routes'));
router.use('/commission',   require('./commission.routes'));
router.use('/payment',      require('./payment.routes'));

module.exports = router;
