const authService = require('../services/authService');
const responseHandler = require('../utils/responseHandler');
const { NODE_ENV } = require('../config/environment');

const isProduction = NODE_ENV === 'production';

const ALLOWED_REGISTER_ROLES = new Set(['PencariKerja', 'Perusahaan']);
const ALLOWED_DEMO_ROLES = new Set(['PencariKerja', 'Perusahaan', 'admin']);

const ALLOWED_REGISTER_FIELDS = [
  'name',
  'email',
  'password',
  'role',
  'phone',
  'location',
  'headline',
  'industry',
  'website',
  'description'
];

const ALLOWED_PROFILE_UPDATE_FIELDS = [
  'name',
  'phone',
  'avatar',
  'headline',
  'statusKarir',
  'location',
  'bio',
  'targetGaji',
  'industry',
  'website',
  'description'
];

const sanitizeFields = (body = {}, allowedList = []) => {
  const clean = {};
  for (const field of allowedList) {
    if (body[field] !== undefined) {
      clean[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    }
  }
  return clean;
};

const isOperationalError = (err) => {
  return (
    err &&
    typeof err.message === 'string' &&
    !err.stack?.includes('TypeError') &&
    !err.stack?.includes('ReferenceError') &&
    !err.stack?.includes('SyntaxError')
  );
};

const authController = {
  async register(req, res, next) {
    try {
      const payload = sanitizeFields(req.body, ALLOWED_REGISTER_FIELDS);

      if (!payload.name || !payload.email || !payload.password) {
        return responseHandler.badRequest(res, 'Nama, email, dan kata sandi wajib diisi.');
      }

      payload.email = payload.email.toLowerCase();

      if (payload.password.length < 8) {
        return responseHandler.badRequest(res, 'Kata sandi minimal terdiri dari 8 karakter.');
      }

      const selectedRole = payload.role || 'PencariKerja';
      if (!ALLOWED_REGISTER_ROLES.has(selectedRole)) {
        return responseHandler.forbidden(
          res,
          'Peran tidak valid. Pendaftaran mandiri hanya diizinkan untuk PencariKerja atau Perusahaan.'
        );
      }
      payload.role = selectedRole;

      const result = await authService.register(payload);
      return responseHandler.created(res, 'Pendaftaran akun berhasil.', result);
    } catch (err) {
      if (isOperationalError(err)) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const password = typeof req.body.password === 'string' ? req.body.password : '';
      const role = typeof req.body.role === 'string' ? req.body.role.trim() : undefined;

      if (!email || !password) {
        return responseHandler.badRequest(res, 'Email dan kata sandi wajib diisi.');
      }

      const result = await authService.login(email, password, role);
      return responseHandler.success(res, 'Login berhasil.', result);
    } catch (err) {
      if (isOperationalError(err)) {
        return responseHandler.unauthorized(res, err.message);
      }
      next(err);
    }
  },

  async loginDemo(req, res, next) {
    try {
      if (isProduction) {
        return responseHandler.forbidden(res, 'Fitur login demo dinonaktifkan di lingkungan production.');
      }

      const requestedRole = typeof req.body.role === 'string' ? req.body.role.trim() : 'PencariKerja';
      if (!ALLOWED_DEMO_ROLES.has(requestedRole)) {
        return responseHandler.badRequest(res, 'Peran demo tidak valid.');
      }

      const result = await authService.loginDemo(requestedRole);
      return responseHandler.success(res, `Login demo sebagai ${requestedRole} berhasil.`, result);
    } catch (err) {
      if (isOperationalError(err)) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  },

  async getProfile(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const profile = await authService.getProfile(req.user.id);
      if (!profile) {
        return responseHandler.notFound(res, 'Profil pengguna tidak ditemukan.');
      }

      return responseHandler.success(res, 'Data profil berhasil diambil.', profile);
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const payload = sanitizeFields(req.body, ALLOWED_PROFILE_UPDATE_FIELDS);
      if (Object.keys(payload).length === 0) {
        return responseHandler.badRequest(res, 'Tidak ada data profil valid yang dikirim untuk diperbarui.');
      }

      if (payload.targetGaji !== undefined) {
        const gaji = Number(payload.targetGaji);
        if (Number.isNaN(gaji) || gaji < 0) {
          return responseHandler.badRequest(res, 'Target gaji harus berupa angka positif.');
        }
        payload.targetGaji = gaji;
      }

      const updated = await authService.updateProfile(req.user.id, payload);
      if (!updated) {
        return responseHandler.notFound(res, 'Profil pengguna tidak ditemukan.');
      }

      return responseHandler.success(res, 'Profil berhasil diperbarui.', updated);
    } catch (err) {
      if (isOperationalError(err)) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  },

  async requestPasswordReset(req, res, next) {
    try {
      const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      if (!email) {
        return responseHandler.badRequest(res, 'Alamat email wajib diisi.');
      }

      const result = await authService.requestPasswordReset(email);

      // Jangan bocorkan resetToken mentah di response HTTP pada environment production
      const safeResponse = { ...result };
      if (isProduction && safeResponse.resetToken) {
        delete safeResponse.resetToken;
      }

      return responseHandler.success(
        res,
        safeResponse.message || 'Jika email terdaftar, instruksi reset kata sandi telah dikirim.',
        safeResponse
      );
    } catch (err) {
      if (isOperationalError(err)) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
      const resetToken = typeof req.body.resetToken === 'string' ? req.body.resetToken.trim() : '';

      if (!email || !newPassword || !resetToken) {
        return responseHandler.badRequest(res, 'Email, token reset, dan kata sandi baru wajib diisi.');
      }

      if (newPassword.length < 8) {
        return responseHandler.badRequest(res, 'Kata sandi baru minimal terdiri dari 8 karakter.');
      }

      const result = await authService.resetPassword(email, newPassword, resetToken);
      return responseHandler.success(res, result.message || 'Kata sandi berhasil diperbarui.');
    } catch (err) {
      if (isOperationalError(err)) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  }
};

module.exports = authController;