const router = require('express').Router();

router.use('/auth',    require('./auth.routes'));
router.use('/profile', require('./profile.routes'));
router.use('/bank',    require('./bank.routes'));
router.use('/bajaj',   require('./bajaj.routes'));

// Future agent app modules will be added here:
// router.use('/policies',    require('./policies.routes'));
// router.use('/commissions', require('./commissions.routes'));

module.exports = router;
