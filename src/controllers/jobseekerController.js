const path = require('path');
const fs = require('fs');
const jobseekerService = require('../services/jobseekerService');
const authService = require('../services/authService');
const responseHandler = require('../utils/responseHandler');

const ALLOWED_CAREER_STATUSES = new Set([
  'Mencari Kerja',
  'Bekerja',
  'Wirausaha',
  'Melanjutkan Pendidikan',
  'Tidak Aktif'
]);

const stripSensitiveFields = (user) => {
  if (!user || typeof user !== 'object') return user;
  const { password, resetToken, resetTokenExpiry, ...safe } = user;
  return safe;
};

const isOwnerOrPrivileged = (user, targetId) => {
  if (!user || !targetId) return false;
  if (user.role === 'admin' || user.role === 'Perusahaan') return true;
  return user.id === targetId;
};

const isOwnerOrAdmin = (user, targetId) => {
  if (!user || !targetId) return false;
  if (user.role === 'admin') return true;
  return user.id === targetId;
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

const jobseekerController = {
  async getAllJobseekers(req, res, next) {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'Perusahaan')) {
        return responseHandler.forbidden(
          res,
          'Akses ditolak. Hanya Admin atau Perusahaan yang dapat melihat daftar pencari kerja.'
        );
      }

      const filters = {
        search: typeof req.query.search === 'string' ? req.query.search.trim() : undefined,
        statusKarir: typeof req.query.statusKarir === 'string' ? req.query.statusKarir.trim() : undefined
      };

      const list = (await jobseekerService.getAllJobseekers(filters)) || [];
      const safeList = Array.isArray(list) ? list.map(stripSensitiveFields) : [];

      return responseHandler.success(res, 'Data pencari kerja berhasil diambil.', safeList);
    } catch (err) {
      next(err);
    }
  },

  async getJobseekerById(req, res, next) {
    try {
      const targetId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!targetId) {
        return responseHandler.badRequest(res, 'ID pencari kerja tidak valid.');
      }

      if (!isOwnerOrPrivileged(req.user, targetId)) {
        return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk melihat data pencari kerja ini.');
      }

      const user = await jobseekerService.getJobseekerById(targetId);
      if (!user) {
        return responseHandler.notFound(res, 'Data pencari kerja tidak ditemukan.');
      }

      return responseHandler.success(res, 'Detail pencari kerja berhasil diambil.', stripSensitiveFields(user));
    } catch (err) {
      if (err.statusCode === 404 || err.message?.includes('tidak ditemukan')) {
        return responseHandler.notFound(res, err.message);
      }
      next(err);
    }
  },

  async getFullProfile(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const targetId =
        typeof req.params.id === 'string' && req.params.id.trim() ? req.params.id.trim() : req.user.id;

      if (!isOwnerOrPrivileged(req.user, targetId)) {
        return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk mengakses profil lengkap ini.');
      }

      const full = await jobseekerService.getFullProfile(targetId);
      if (!full) {
        return responseHandler.notFound(res, 'Profil pencari kerja tidak ditemukan.');
      }

      const safeFull = full.user
        ? { ...full, user: stripSensitiveFields(full.user) }
        : stripSensitiveFields(full);

      return responseHandler.success(res, 'Profil lengkap pencari kerja berhasil diambil.', safeFull);
    } catch (err) {
      if (err.statusCode === 404 || err.message?.includes('tidak ditemukan')) {
        return responseHandler.notFound(res, err.message);
      }
      next(err);
    }
  },

  async updateCareerStatus(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const targetId =
        typeof req.params.id === 'string' && req.params.id.trim() ? req.params.id.trim() : req.user.id;

      if (!isOwnerOrAdmin(req.user, targetId)) {
        return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk mengubah status karir pengguna ini.');
      }

      const statusKarir = typeof req.body.statusKarir === 'string' ? req.body.statusKarir.trim() : '';
      if (!statusKarir || !ALLOWED_CAREER_STATUSES.has(statusKarir)) {
        return responseHandler.badRequest(
          res,
          `Status karir tidak valid. Pilihan yang diizinkan: ${Array.from(ALLOWED_CAREER_STATUSES).join(', ')}.`
        );
      }

      const updated = await jobseekerService.updateCareerStatus(targetId, statusKarir);
      if (!updated) {
        return responseHandler.notFound(res, 'Data pencari kerja tidak ditemukan.');
      }

      return responseHandler.success(
        res,
        `Status karir berhasil diubah menjadi ${statusKarir}.`,
        stripSensitiveFields(updated)
      );
    } catch (err) {
      if (err.statusCode === 404 || err.message?.includes('tidak ditemukan')) {
        return responseHandler.notFound(res, err.message);
      }
      if (isOperationalError(err)) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  },

  async getCareerStats(req, res, next) {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'Perusahaan')) {
        return responseHandler.forbidden(res, 'Akses ditolak. Hanya Admin atau Perusahaan yang dapat melihat statistik karir.');
      }

      const stats = await jobseekerService.getCareerMonitoringStats();
      return responseHandler.success(res, 'Statistik pemantauan karir berhasil diambil.', stats);
    } catch (err) {
      next(err);
    }
  },

  async uploadCV(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'PencariKerja') {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return responseHandler.forbidden(res, 'Hanya Pencari Kerja yang dapat mengunggah CV.');
      }

      if (!req.file || !req.file.filename) {
        return responseHandler.badRequest(res, 'Berkas CV / resume tidak ditemukan.');
      }

      const safeFilename = path.basename(req.file.filename);
      const cvUrl = `/uploads/cv/${safeFilename}`;

      if (typeof jobseekerService.updateCV === 'function') {
        await jobseekerService.updateCV(req.user.id, cvUrl);
      } else if (typeof authService.updateProfile === 'function') {
        await authService.updateProfile(req.user.id, { cvUrl });
      }

      return responseHandler.success(res, 'CV berhasil diunggah.', {
        cvUrl,
        filename: path.basename(req.file.originalname || safeFilename)
      });
    } catch (err) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (_) {
          // Abaikan error pembersihan file
        }
      }
      next(err);
    }
  }
};

module.exports = jobseekerController;