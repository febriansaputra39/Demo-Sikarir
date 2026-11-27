const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { UPLOAD_MAX_SIZE } = require('../config/environment');

const BASE_UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

const IMAGE_RULES = {
  extensions: new Set(['.jpg', '.jpeg', '.png', '.webp']),
  mimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp'])
};

const DOCUMENT_RULES = {
  extensions: new Set(['.pdf', '.doc', '.docx']),
  mimeTypes: new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ])
};

const GENERAL_RULES = {
  extensions: new Set([...IMAGE_RULES.extensions, ...DOCUMENT_RULES.extensions]),
  mimeTypes: new Set([...IMAGE_RULES.mimeTypes, ...DOCUMENT_RULES.mimeTypes])
};

const IMAGE_FIELDS = new Set(['companyLogo', 'logo', 'avatar']);
const CV_FIELDS = new Set(['cv', 'resume']);

// Pastikan seluruh direktori dasar unggahan tersedia
const uploadDirs = ['cv', 'documents', 'company'];
uploadDirs.forEach((subDir) => {
  const fullPath = path.join(BASE_UPLOAD_DIR, subDir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const getRulesForField = (fieldname) => {
  if (IMAGE_FIELDS.has(fieldname)) return IMAGE_RULES;
  if (CV_FIELDS.has(fieldname)) return DOCUMENT_RULES;
  return GENERAL_RULES;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subFolder = 'documents';
    if (CV_FIELDS.has(file.fieldname)) {
      subFolder = 'cv';
    } else if (IMAGE_FIELDS.has(file.fieldname)) {
      subFolder = 'company';
    }

    const targetDir = path.resolve(BASE_UPLOAD_DIR, subFolder);
    if (!targetDir.startsWith(BASE_UPLOAD_DIR)) {
      return cb(new Error('Direktori tujuan unggahan tidak valid.'));
    }

    return cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const safeField = (file.fieldname || 'file').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30) || 'file';
    const rawExt = path.extname(path.basename(file.originalname || '')).toLowerCase();
    const safeExt = GENERAL_RULES.extensions.has(rawExt) ? rawExt : '';
    const randomHex = crypto.randomBytes(8).toString('hex');

    cb(null, `${safeField}-${Date.now()}-${randomHex}${safeExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(path.basename(file.originalname || '')).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();
  const rules = getRulesForField(file.fieldname);

  if (!ext || !rules.extensions.has(ext)) {
    const allowedList = Array.from(rules.extensions).join(', ').toUpperCase();
    const err = new Error(`Ekstensi berkas ${ext || '(kosong)'} tidak didukung untuk field ${file.fieldname}. Gunakan: ${allowedList}.`);
    err.statusCode = 400;
    return cb(err, false);
  }

  if (!rules.mimeTypes.has(mime)) {
    const err = new Error(`Tipe MIME berkas (${mime}) tidak valid atau tidak sesuai dengan ekstensi ${ext}.`);
    err.statusCode = 400;
    return cb(err, false);
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: UPLOAD_MAX_SIZE,
    files: 5,
    fields: 20
  },
  fileFilter
});

module.exports = upload;