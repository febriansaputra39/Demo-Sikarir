const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/environment');

const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = 'sipakar-bontang-api';
const JWT_AUDIENCE = 'sipakar-bontang-client';

const createAuthError = (message, statusCode = 401) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const assertJwtSecretConfigured = () => {
  if (!JWT_SECRET || typeof JWT_SECRET !== 'string' || !JWT_SECRET.trim()) {
    const err = new Error('Konfigurasi JWT_SECRET belum diatur pada server.');
    err.statusCode = 500;
    throw err;
  }
};

/**
 * Generate JWT token for user authentication
 * @param {object} payload
 * @returns {string} token
 */
function generateToken(payload) {
  assertJwtSecretConfigured();

  if (!payload || typeof payload !== 'object') {
    throw createAuthError('Payload pengguna tidak valid untuk pembuatan token.', 400);
  }

  if (!payload.id || !payload.email || !payload.role) {
    throw createAuthError('Data identitas pengguna (id, email, role) tidak lengkap.', 400);
  }

  return jwt.sign(
    {
      id: String(payload.id).trim(),
      email: String(payload.email).trim().toLowerCase(),
      role: String(payload.role).trim()
    },
    JWT_SECRET,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: JWT_EXPIRES_IN || '1d',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }
  );
}

/**
 * Verify JWT token
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyToken(token) {
  assertJwtSecretConfigured();

  if (!token || typeof token !== 'string') {
    throw createAuthError('Token autentikasi tidak ditemukan atau tidak valid.', 401);
  }

  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  if (!cleanToken) {
    throw createAuthError('Token autentikasi kosong.', 401);
  }

  try {
    const decoded = jwt.verify(cleanToken, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });

    if (!decoded || typeof decoded !== 'object' || !decoded.id || !decoded.role) {
      throw createAuthError('Struktur payload token tidak valid.', 401);
    }

    return decoded;
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }
    if (err.name === 'TokenExpiredError') {
      throw createAuthError('Sesi login telah berakhir. Silakan login kembali.', 401);
    }
    throw createAuthError('Token autentikasi tidak valid.', 401);
  }
}

module.exports = {
  generateToken,
  verifyToken
};