const { verifyToken } = require('../utils/generateToken');
const { dbService } = require('../config/database');
const responseHandler = require('../utils/responseHandler');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return responseHandler.unauthorized(res, 'Header Authorization tidak ditemukan. Silakan login terlebih dahulu.');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return responseHandler.unauthorized(res, 'Format token tidak valid. Gunakan format Bearer <token>.');
    }

    const token = parts[1];

    // Check for demo token format (e.g., jwt_token_usr_pk_1_xxx or token_pk_mock)
    if (token.startsWith('jwt_token_') || token.startsWith('token_')) {
      const users = dbService.get('users');
      let matchedUser = null;

      if (token.includes('usr_admin_1') || token.includes('admin')) {
        matchedUser = users.find(u => u.role === 'admin');
      } else if (token.includes('usr_pt_1') || token.includes('pt') || token.includes('Perusahaan')) {
        matchedUser = users.find(u => u.role === 'Perusahaan');
      } else if (token.includes('usr_pk_1') || token.includes('pk') || token.includes('PencariKerja')) {
        matchedUser = users.find(u => u.role === 'PencariKerja');
      } else {
        // Try to match by ID pattern
        matchedUser = users.find(u => token.includes(u.id));
      }

      if (matchedUser) {
        req.user = matchedUser;
        return next();
      }
    }

    // Standard JWT verification
    try {
      const decoded = verifyToken(token);
      const user = dbService.findById('users', decoded.id);

      if (!user) {
        return responseHandler.unauthorized(res, 'Sesi pengguna tidak valid atau akun telah dihapus.');
      }

      req.user = user;
      return next();
    } catch (jwtErr) {
      return responseHandler.unauthorized(res, 'Token kadaluarsa atau tidak valid: ' + jwtErr.message);
    }
  } catch (err) {
    return responseHandler.error(res, 'Terjadi kesalahan saat verifikasi autentikasi.', 500, err.message);
  }
}

module.exports = authMiddleware;
