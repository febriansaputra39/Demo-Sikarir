const jobseekerService = require('../services/jobseekerService');
const responseHandler = require('../utils/responseHandler');

const ALLOWED_FIELDS = ['title', 'category', 'provider', 'date', 'description'];

const sanitizeActivityPayload = (body = {}) => {
  const clean = {};
  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      clean[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    }
  }
  return clean;
};

const isOwnerOrAdmin = (user, resourceUserId) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.id === resourceUserId;
};

const activityController = {
  async getActivities(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const requestedUserId = typeof req.query.userId === 'string' ? req.query.userId.trim() : null;
      const canViewOthers = req.user.role === 'admin' || req.user.role === 'Perusahaan';
      const targetUserId = requestedUserId && canViewOthers ? requestedUserId : req.user.id;

      const activities = await jobseekerService.getActivities(targetUserId);
      return responseHandler.success(res, 'Daftar aktivitas karir berhasil diambil.', activities);
    } catch (err) {
      next(err);
    }
  },

  async addActivity(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'PencariKerja' && req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Hanya Pencari Kerja yang dapat menambahkan aktivitas karir.');
      }

      const payload = sanitizeActivityPayload(req.body);
      if (!payload.title || !payload.category) {
        return responseHandler.badRequest(res, 'Judul dan kategori aktivitas wajib diisi.');
      }

      const newAct = await jobseekerService.addActivity(req.user.id, payload);
      return responseHandler.created(res, 'Aktivitas karir berhasil ditambahkan.', newAct);
    } catch (err) {
      next(err);
    }
  },

  async updateActivity(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const activityId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!activityId) {
        return responseHandler.badRequest(res, 'ID aktivitas tidak valid.');
      }

      const existing = await jobseekerService.getActivityById?.(activityId);
      if (existing) {
        if (!isOwnerOrAdmin(req.user, existing.userId)) {
          return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk mengubah aktivitas ini.');
        }
      } else if (typeof jobseekerService.getActivities === 'function') {
        // Fallback pengecekan kepemilikan jika getActivityById belum tersedia di service
        const userActivities = await jobseekerService.getActivities(req.user.id);
        const owned = Array.isArray(userActivities) && userActivities.some((item) => item.id === activityId);
        if (!owned && req.user.role !== 'admin') {
          return responseHandler.forbidden(res, 'Aktivitas tidak ditemukan atau akses ditolak.');
        }
      }

      const payload = sanitizeActivityPayload(req.body);
      if (Object.keys(payload).length === 0) {
        return responseHandler.badRequest(res, 'Tidak ada data valid yang dikirim untuk diperbarui.');
      }

      const updated = await jobseekerService.updateActivity(activityId, payload);
      if (!updated) {
        return responseHandler.notFound(res, 'Aktivitas karir tidak ditemukan.');
      }
      return responseHandler.success(res, 'Aktivitas karir berhasil diperbarui.', updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteActivity(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const activityId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!activityId) {
        return responseHandler.badRequest(res, 'ID aktivitas tidak valid.');
      }

      const existing = await jobseekerService.getActivityById?.(activityId);
      if (existing) {
        if (!isOwnerOrAdmin(req.user, existing.userId)) {
          return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk menghapus aktivitas ini.');
        }
      } else if (typeof jobseekerService.getActivities === 'function') {
        const userActivities = await jobseekerService.getActivities(req.user.id);
        const owned = Array.isArray(userActivities) && userActivities.some((item) => item.id === activityId);
        if (!owned && req.user.role !== 'admin') {
          return responseHandler.forbidden(res, 'Aktivitas tidak ditemukan atau akses ditolak.');
        }
      }

      const deleted = await jobseekerService.deleteActivity(activityId);
      if (!deleted) {
        return responseHandler.notFound(res, 'Aktivitas karir tidak ditemukan.');
      }
      return responseHandler.success(res, 'Aktivitas karir berhasil dihapus.');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = activityController;