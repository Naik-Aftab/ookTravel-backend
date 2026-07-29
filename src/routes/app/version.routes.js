const router = require('express').Router();
const ctrl   = require('../../controllers/version.controller');

// GET /api/app/version/check?platform=android&versionCode=7
router.get('/check', ctrl.checkVersion);

module.exports = router;
