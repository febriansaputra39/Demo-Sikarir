const cors = require('cors');
const { CLIENT_URL, NODE_ENV } = require('./environment');

const isProduction = NODE_ENV === 'production';

const normalizeOrigin = (url) => {
  if (!url || typeof url !== 'string') return null;
  return url.trim().replace(/\/+$/, '').toLowerCase();
};

const devOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const envOrigins = (CLIENT_URL || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOrigins = new Set([
  ...envOrigins,
  ...(isProduction ? [] : devOrigins)
]);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = normalizeOrigin(origin);

    if (allowedOrigins.has(cleanOrigin)) {
      return callback(null, true);
    }

    if (NODE_ENV === 'development') {
      console.warn(`[CORS][DEV] Origin tidak terdaftar namun diizinkan: ${origin}`);
      return callback(null, true);
    }

    console.warn(`[CORS][BLOCKED] Akses ditolak dari origin: ${origin}`);
    const corsError = new Error('Not allowed by CORS');
    corsError.status = 403;
    return callback(corsError, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204,
  maxAge: 86400
};

module.exports = cors(corsOptions);