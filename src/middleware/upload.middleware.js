const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

function createStorage(subfolder) {
  const dest = path.join(__dirname, '../../uploads', subfolder);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename:    (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
}

const allowedMime      = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const allowedImageMime = ['image/jpeg', 'image/png', 'image/webp'];
const allowedBulkMime  = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
  'application/csv',
  'text/plain',
];

function fileFilter(req, file, cb) {
  if (allowedMime.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only images (JPEG/PNG/WebP) and PDF files are allowed'), false);
}

function imageOnlyFilter(req, file, cb) {
  if (allowedImageMime.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files (JPEG/PNG/WebP) are allowed'), false);
}

function bulkFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.csv', '.xls', '.xlsx'].includes(ext)) return cb(null, true);
  if (allowedBulkMime.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only CSV or Excel (.xls / .xlsx) files are allowed for bulk upload'), false);
}

const maxSize      = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5 MB
const maxImageSize = 2 * 1024 * 1024; // 2 MB for profile photos
const maxBulkSize  = 10 * 1024 * 1024; // 10 MB for bulk CSV/Excel

const uploadPolicy       = multer({ storage: createStorage('policies'),          fileFilter,           limits: { fileSize: maxSize } });
const uploadKyc          = multer({ storage: createStorage('kyc'),               fileFilter,           limits: { fileSize: maxSize } });
const uploadPayment      = multer({ storage: createStorage('payments'),          fileFilter,           limits: { fileSize: maxSize } });
const uploadPaymentProof = multer({ storage: createStorage('commission_proofs'), fileFilter,           limits: { fileSize: maxSize } });
const uploadProfilePhoto = multer({ storage: createStorage('profiles'),          fileFilter: imageOnlyFilter, limits: { fileSize: maxImageSize } });
const uploadBulk         = multer({ storage: createStorage('bulk'),              fileFilter: bulkFileFilter,  limits: { fileSize: maxBulkSize } });

module.exports = { uploadPolicy, uploadKyc, uploadPayment, uploadPaymentProof, uploadProfilePhoto, uploadBulk };
