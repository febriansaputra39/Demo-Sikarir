const express = require('express');
const path = require('path');
const corsMiddleware = require('./config/cors');
const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');
const { NODE_ENV } = require('./config/environment');
const responseHandler = require('./utils/responseHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const jobseekerRoutes = require('./routes/jobseekerRoutes');
const educationRoutes = require('./routes/educationRoutes');
const skillRoutes = require('./routes/skillRoutes');
const experienceRoutes = require('./routes/experienceRoutes');
const companyRoutes = require('./routes/companyRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const activityRoutes = require('./routes/activityRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Trust first proxy (penting jika berjalan di balik Nginx / Docker / reverse proxy)
app.set('trust proxy', 1);
app.disable('x-powered-by');

const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
  '.doc',
  '.docx'
]);

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const DANGEROUS_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Membersihkan properti berbahaya untuk mencegah Prototype Pollution pada req.body dan req.query.
 */
const sanitizeObjectKeys = (target) => {
  if (!target || typeof target !== 'object') return;
  if (Array.isArray(target)) {
    target.forEach((item) => sanitizeObjectKeys(item));
    return;
  }

  Object.keys(target).forEach((key) => {
    if (DANGEROUS_OBJECT_KEYS.has(key)) {
      delete target[key];
    } else if (target[key] && typeof target[key] === 'object') {
      sanitizeObjectKeys(target[key]);
    }
  });
};

// Global API rate limiter ringan untuk mencegah flood/DoS pada seluruh endpoint /api
const createGlobalApiLimiter = ({ windowMs = 60 * 1000, maxRequests = 180 }) => {
  const hits = new Map();

  return (req, res, next) => {
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const record = hits.get(key);

    if (!record || now > record.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    record.count += 1;
    if (record.count > maxRequests) {
      return responseHandler.tooManyRequests(
        res,
        'Terlalu banyak permintaan ke server. Silakan coba lagi dalam beberapa saat.'
      );
    }

    return next();
  };
};

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  if (NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  res.removeHeader('X-Powered-By');
  next();
});

// Global Middlewares
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' })); // Batasi ukuran JSON body untuk mencegah DoS
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Sanitasi anti Prototype Pollution pada setiap request
app.use((req, res, next) => {
  sanitizeObjectKeys(req.body);
  sanitizeObjectKeys(req.query);
  next();
});

// Serve Static Uploads dengan whitelist ekstensi & proteksi anti-XSS
app.use('/uploads', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return responseHandler.error(res, 'Metode HTTP tidak diizinkan untuk berkas statis.', 405);
  }

  let decodedPath = '';
  try {
    decodedPath = decodeURIComponent(req.path || '');
  } catch (_) {
    return responseHandler.badRequest(res, 'Path berkas tidak valid.');
  }

  if (decodedPath.includes('\0') || decodedPath.includes('..')) {
    return responseHandler.badRequest(res, 'Path berkas tidak valid.');
  }

  const ext = path.extname(decodedPath).toLowerCase();
  if (!ext || !ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
    return responseHandler.notFound(res, 'Berkas tidak ditemukan atau tipe berkas tidak diizinkan.');
  }

  return next();
});

app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    dotfiles: 'deny',
    index: false,
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cache-Control', 'public, max-age=86400');

      // Paksa unduhan (attachment) untuk dokumen CV non-gambar agar tidak dirender aktif di tab browser
      if (!IMAGE_EXTENSIONS.has(ext)) {
        res.setHeader('Content-Disposition', 'attachment');
      }
    }
  })
);

// Rate limiter untuk seluruh rute /api
app.use('/api', createGlobalApiLimiter({ windowMs: 60 * 1000, maxRequests: 180 }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Sistem Pemantauan Karir & Smart Job Matching API'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobseekers', jobseekerRoutes);
app.use('/api/educations', educationRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/reports', reportRoutes);

// Fallback & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;