const router      = require('express').Router();
const ctrl        = require('../../controllers/bank.controller');
const { uploadKyc } = require('../../middleware/upload.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { body } = require('express-validator');

// Bank passbook / cancelled cheque, Aadhar card, PAN card — all optional, submitted alongside
// the text fields as multipart/form-data.
const bankDocumentFields = uploadKyc.fields([
  { name: 'bank_document',   maxCount: 1 },
  { name: 'aadhar_document', maxCount: 1 },
  { name: 'pan_document',    maxCount: 1 },
]);

function handleUploadError(err, req, res, next) {
  if (err) return res.status(400).json({ success: false, message: err.message });
  next();
}

const bankDetailsRules = [
  body('agent_id').isInt({ min: 1 }).withMessage('agent_id is required'),
  body('account_holder_name').trim().notEmpty().withMessage('Account holder name is required'),
  body('bank_name').trim().notEmpty().withMessage('Bank name is required'),
  body('account_number').trim().notEmpty().withMessage('Account number is required'),
  body('ifsc_code')
    .trim()
    .toUpperCase()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Invalid IFSC code format (e.g. SBIN0001234)'),
  body('aadhar_number')
    .trim()
    .matches(/^\d{12}$/)
    .withMessage('Aadhar card number must be exactly 12 digits'),
  body('pan_card_number')
    .trim()
    .toUpperCase()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Invalid PAN card format (e.g. ABCDE1234F)'),
];

// POST /api/app/bank  — create bank details (multipart/form-data)
router.post('/', bankDocumentFields, handleUploadError, bankDetailsRules, validate, ctrl.saveBankDetails);

// PUT /api/app/bank   — edit bank details (multipart/form-data)
router.put('/', bankDocumentFields, handleUploadError, bankDetailsRules, validate, ctrl.editBankDetails);

module.exports = router;
