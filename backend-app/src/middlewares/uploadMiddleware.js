const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { UPLOAD_MAX_SIZE } = require('../config/environment');

// Ensure base upload directories exist
const uploadDirs = ['uploads/cv', 'uploads/documents', 'uploads/company'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '../../', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/documents';
    if (file.fieldname === 'cv' || file.fieldname === 'resume') {
      folder = 'uploads/cv';
    } else if (file.fieldname === 'companyLogo' || file.fieldname === 'logo' || file.fieldname === 'avatar') {
      folder = 'uploads/company';
    }
    cb(null, path.join(__dirname, '../../', folder));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipe berkas ${ext} tidak didukung. Unggah PDF, DOC, DOCX, JPG, PNG, atau WEBP.`));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: UPLOAD_MAX_SIZE },
  fileFilter
});

module.exports = upload;
