const router           = require('express').Router();
const ctrl             = require('../controllers/rm.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');
const { validate }     = require('../middleware/validate.middleware');
const { updateRmRules, rmIdRule } = require('../validators/rm.validator');

router.use(authenticate, authorize('admin'));

router.get('/',                          ctrl.getAll);
router.get('/:id',         rmIdRule, validate, ctrl.getOne);
router.post('/:id/approve',rmIdRule, validate, ctrl.approve);
router.post('/:id/suspend',rmIdRule, validate, ctrl.suspend);
router.post('/:id/activate',rmIdRule, validate, ctrl.activate);
router.put('/:id',         rmIdRule, updateRmRules, validate, ctrl.update);
router.post('/:id/reset-password', rmIdRule, validate, ctrl.resetPassword);
router.delete('/:id',      rmIdRule, validate, ctrl.remove);

module.exports = router;
