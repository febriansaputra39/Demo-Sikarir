const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const rawEnv = (process.env.NODE_ENV || 'development').trim().toLowerCase();
const VALID_ENVS = new Set(['development', 'production', 'test']);
const NODE_ENV = VALID_ENVS.has(rawEnv) ? rawEnv : 'development';
const isProduction = NODE_ENV === 'production';

// Validasi PORT
const parsedPort = Number.parseInt(process.env.PORT, 10);
const PORT = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65535 ? parsedPort : 5000;

// Validasi UPLOAD_MAX_SIZE (default 5MB, maksimal batas wajar 100MB jika salah konfigurasi)
const parsedUploadSize = Number.parseInt(process.env.UPLOAD_MAX_SIZE, 10);
const UPLOAD_MAX_SIZE =
  Number.isInteger(parsedUploadSize) && parsedUploadSize > 0 ? parsedUploadSize : 5 * 1024 * 1024;

// Validasi JWT_SECRET
const rawJwtSecret = (process.env.JWT_SECRET || '').trim();
const WEAK_SECRETS = new Set(['secret', 'jwt_secret', 'changeme', '123456', 'password', 'supersecret']);

if (isProduction) {
  if (!rawJwtSecret || rawJwtSecret.length < 32 || WEAK_SECRETS.has(rawJwtSecret.toLowerCase())) {
    throw new Error(
      '[SECURITY FATAL] JWT_SECRET wajib diisi minimal 32 karakter acak dan tidak boleh menggunakan nilai default saat NODE_ENV=production!'
    );
  }
  if (!process.env.CLIENT_URL || !process.env.CLIENT_URL.trim()) {
    throw new Error('[SECURITY FATAL] CLIENT_URL wajib diisi saat NODE_ENV=production!');
  }
} else if (!rawJwtSecret) {
  console.warn(
    '[SECURITY WARNING] JWT_SECRET tidak ditemukan di .env! Menggunakan secret acak sementara (token akan tidak valid setelah server restart).'
  );
} else if (rawJwtSecret.length < 32) {
  console.warn('[SECURITY WARNING] JWT_SECRET terlalu pendek (disarankan minimal 32 karakter).');
}

const JWT_SECRET = rawJwtSecret || crypto.randomBytes(64).toString('hex');

// Validasi JWT_EXPIRES_IN
const rawExpiresIn = (process.env.JWT_EXPIRES_IN || '').trim();
const JWT_EXPIRES_IN = rawExpiresIn || (isProduction ? '1d' : '7d');

// Resolusi path database yang aman
const DATA_PATH = process.env.DATA_PATH
  ? path.resolve(process.cwd(), process.env.DATA_PATH.trim())
  : path.resolve(__dirname, '../../data/database.json');

const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').trim();

module.exports = Object.freeze({
  NODE_ENV,
  PORT,
  CLIENT_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  UPLOAD_MAX_SIZE,
  DATA_PATH
});