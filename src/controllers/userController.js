const path = require('path');
const fs = require('fs');
const userModel = require('../models/userModel');
const responseHandler = require('../utils/responseHandler');

const ALLOWED_ROLES = new Set(['admin', 'PencariKerja', 'Perusahaan']);

const USER_ALLOWED_UPDATE_FIELDS = [
  'name',
  'phone',
  'location',
  'headline',
  'bio',
  'statusKarir',
  'targetGaji',
  'industry',
  'website',
  'description'
];

const ADMIN_ALLOWED_UPDATE_FIELDS = [
  ...USER_ALLOWED_UPDATE_FIELDS,
  'role',
  'verified',
  'email'
];

const stripSensitiveFields = (user) => {
  if (!user || typeof user !== 'object') return user;
  const { password, resetToken, resetTokenExpiry, ...safe } = user;
  return safe;
};

const sanitizeUserUpdatePayload = (body = {}, isAdmin = false) => {
  const allowedFields = isAdmin ? ADMIN_ALLOWED_UPDATE_FIELDS : USER_ALLOWED_UPDATE_FIELDS;
  const clean = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      clean[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    }
  }

  if (clean.email !== undefined) {
    clean.email = clean.email.toLowerCase();
  }

  if (clean.verified !== undefined) {
    clean.verified = Boolean(clean.verified);
  }

  if (clean.targetGaji !== undefined) {
    clean.targetGaji = Number(clean.targetGaji);
  }

  return clean;
};

const userController = {
  async getAllUsers(req, res, next) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Akses ditolak. Hanya Admin yang dapat melihat daftar pengguna.');
      }

      const role = typeof req.query.role === 'string' ? req.query.role.trim() : '';
      const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

      let users = (await userModel.findAll()) || [];

      if (role && role !== 'Semua') {
        users = users.filter((u) => u.role === role);
      }

      if (search) {
        users = users.filter(
          (u) =>
            (u.name && u.name.toLowerCase().includes(search)) ||
            (u.email && u.email.toLowerCase().includes(search))
        );
      }

      const safeUsers = users.map(stripSensitiveFields);
      return responseHandler.success(res, 'Daftar pengguna berhasil diambil.', safeUsers);
    } catch (err) {
      next(err);
    }
  },

  async getUserById(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const targetId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!targetId) {
        return responseHandler.badRequest(res, 'ID pengguna tidak valid.');
      }

      if (req.user.role !== 'admin' && req.user.id !== targetId) {
        return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk melihat detail pengguna ini.');
      }

      const user = await userModel.findById(targetId);
      if (!user) {
        return responseHandler.notFound(res, 'Pengguna tidak ditemukan.');
      }

      return responseHandler.success(res, 'Detail pengguna berhasil diambil.', stripSensitiveFields(user));
    } catch (err) {
      next(err);
    }
  },

  async updateUser(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const targetId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!targetId) {
        return responseHandler.badRequest(res, 'ID pengguna tidak valid.');
      }

      const isAdmin = req.user.role === 'admin';
      if (!isAdmin && req.user.id !== targetId) {
        return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk memperbarui pengguna ini.');
      }

      const payload = sanitizeUserUpdatePayload(req.body, isAdmin);
      if (Object.keys(payload).length === 0) {
        return responseHandler.badRequest(res, 'Tidak ada data valid yang dikirim untuk diperbarui.');
      }

      if (payload.role !== undefined && !ALLOWED_ROLES.has(payload.role)) {
        return responseHandler.badRequest(
          res,
          `Peran (role) tidak valid. Pilihan yang diizinkan: ${Array.from(ALLOWED_ROLES).join(', ')}.`
        );
      }

      if (payload.targetGaji !== undefined && (Number.isNaN(payload.targetGaji) || payload.targetGaji < 0)) {
        return responseHandler.badRequest(res, 'Target gaji harus berupa angka positif.');
      }

      const updated = await userModel.update(targetId, payload);
      if (!updated) {
        return responseHandler.notFound(res, 'Pengguna tidak ditemukan.');
      }

      return responseHandler.success(res, 'Pengguna berhasil diperbarui.', stripSensitiveFields(updated));
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req, res, next) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Akses ditolak. Hanya Admin yang dapat menghapus pengguna.');
      }

      const targetId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!targetId) {
        return responseHandler.badRequest(res, 'ID pengguna tidak valid.');
      }

      if (req.user.id === targetId) {
        return responseHandler.badRequest(res, 'Anda tidak dapat menghapus akun administrator Anda sendiri.');
      }

      const deleted = await userModel.delete(targetId);
      if (!deleted) {
        return responseHandler.notFound(res, 'Pengguna tidak ditemukan.');
      }

      return responseHandler.success(res, 'Pengguna berhasil dihapus.');
    } catch (err) {
      next(err);
    }
  },

  async uploadAvatar(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (!req.file || !req.file.filename) {
        return responseHandler.badRequest(res, 'Berkas avatar tidak ditemukan.');
      }

      const safeFilename = path.basename(req.file.filename);
      const folderName = req.file.destination ? path.basename(req.file.destination) : 'avatar';
      const avatarUrl = `/uploads/${folderName}/${safeFilename}`;

      const updated = await userModel.update(req.user.id, { avatar: avatarUrl });
      if (!updated) {
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return responseHandler.notFound(res, 'Pengguna tidak ditemukan.');
      }

      return responseHandler.success(res, 'Avatar berhasil diperbarui.', { avatarUrl });
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

module.exports = userController;