const router                 = require('express').Router();
const ctrl                   = require('../../controllers/profile.controller');
const { uploadProfilePhoto } = require('../../middleware/upload.middleware');
const { validate }           = require('../../middleware/validate.middleware');
const { body }               = require('express-validator');

const updateDetailsRules = [
  body('agent_id').isInt({ min: 1 }).withMessage('agent_id is required'),
  body('fullName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phoneNumber').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile number required'),
];

const updatePhotoRules = [
  body('agent_id').isInt({ min: 1 }).withMessage('agent_id is required'),
];

// GET /api/app/profile/rm/:agentId
router.get('/rm/:agentId', ctrl.getAssignedRm);

// PATCH /api/app/profile/details
router.patch('/details', updateDetailsRules, validate, ctrl.updateDetails);

// PATCH /api/app/profile/photo  (multipart/form-data)
router.patch(
  '/photo',
  uploadProfilePhoto.single('profile_pic'),
  (err, req, res, next) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  },
  updatePhotoRules,
  validate,
  ctrl.updateProfilePhoto
);

module.exports = router;
