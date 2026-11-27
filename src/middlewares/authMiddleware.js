const { verifyToken } = require('../utils/generateToken');
const { dbService } = require('../config/database');
const responseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

const extractBearerToken = (authHeader) => {
  if (!authHeader || typeof authHeader !== 'string') return null;

  const trimmed = authHeader.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return { error: 'Format token tidak valid. Gunakan format Bearer <token>.' };
  }

  const token = parts[1];
  if (!token || token === 'null' || token === 'undefined' || token.length > 2048) {
    return { error: 'Token autentikasi tidak valid.' };
  }

  return { token };
};

const resolveAuthenticatedUser = (token) => {
  const decoded = verifyToken(token);

  if (!decoded || typeof decoded !== 'object' || typeof decoded.id !== 'string' || !decoded.id.trim()) {
    return { error: 'Token tidak memiliki payload yang valid.' };
  }

  const user = dbService.findById('users', decoded.id.trim());
  if (!user) {
    return { error: 'Sesi pengguna tidak valid atau akun telah dihapus.' };
  }

  // Tolak token jika akun dinonaktifkan secara eksplisit
  if (user.isActive === false || user.suspended === true) {
    return { error: 'Akun Anda sedang dinonaktifkan. Hubungi administrator.' };
  }

  // Tolak token jika peran di database sudah berubah sejak token diterbitkan
  if (decoded.role && user.role && decoded.role !== user.role) {
    return { error: 'Hak akses akun telah berubah. Silakan login kembali.' };
  }

  // Tolak token lama jika kata sandi diubah setelah token diterbitkan (iat dalam detik)
  if (user.passwordChangedAt && decoded.iat) {
    const changedTimestamp = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
    if (!Number.isNaN(changedTimestamp) && decoded.iat < changedTimestamp) {
      return { error: 'Kata sandi telah diubah. Silakan login kembali.' };
    }
  }

  const { password, resetToken, resetTokenExpiry, ...safeUser } = user;
  return { user: safeUser };
};

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return responseHandler.unauthorized(
        res,
        'Header Authorization tidak ditemukan. Silakan login terlebih dahulu.'
      );
    }

    const extracted = extractBearerToken(authHeader);
    if (extracted.error) {
      return responseHandler.unauthorized(res, extracted.error);
    }

    try {
      const resolved = resolveAuthenticatedUser(extracted.token);
      if (resolved.error) {
        return responseHandler.unauthorized(res, resolved.error);
      }

      req.user = resolved.user;
      return next();
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return responseHandler.unauthorized(res, 'Token telah kadaluarsa. Silakan login kembali.');
      }
      if (jwtErr.name === 'JsonWebTokenError' || jwtErr.name === 'NotBeforeError') {
        return responseHandler.unauthorized(res, 'Token tidak valid atau telah dimanipulasi.');
      }
      return responseHandler.unauthorized(res, 'Gagal memverifikasi token autentikasi.');
    }
  } catch (err) {
    logger.error('Auth middleware error:', err);
    return responseHandler.error(res, 'Terjadi kesalahan saat verifikasi autentikasi.', 500);
  }
}

function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    const extracted = extractBearerToken(authHeader);
    if (!extracted || extracted.error) {
      return next();
    }

    const resolved = resolveAuthenticatedUser(extracted.token);
    if (resolved && resolved.user) {
      req.user = resolved.user;
    }
    return next();
  } catch (_) {
    // Abaikan error token pada endpoint publik yang bersifat opsional
    return next();
  }
}

authMiddleware.optionalAuth = optionalAuthMiddleware;

module.exports = authMiddleware;