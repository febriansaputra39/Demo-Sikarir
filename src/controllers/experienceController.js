const jobseekerService = require('../services/jobseekerService');
const responseHandler = require('../utils/responseHandler');

const ALLOWED_EXPERIENCE_FIELDS = [
  'company',
  'position',
  'jobType',
  'startDate',
  'endDate',
  'isCurrent',
  'location',
  'responsibilities'
];

const sanitizeExperiencePayload = (body = {}) => {
  const clean = {};
  for (const field of ALLOWED_EXPERIENCE_FIELDS) {
    if (body[field] !== undefined) {
      clean[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    }
  }

  if (clean.isCurrent !== undefined) {
    clean.isCurrent = Boolean(clean.isCurrent);
    if (clean.isCurrent) {
      clean.endDate = null;
    }
  }

  return clean;
};

const isOwnerOrAdmin = (user, resourceUserId) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.id === resourceUserId;
};

const experienceController = {
  async getExperiences(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const requestedUserId = typeof req.query.userId === 'string' ? req.query.userId.trim() : null;
      const canViewOthers = req.user.role === 'admin' || req.user.role === 'Perusahaan';
      const targetUserId = requestedUserId && canViewOthers ? requestedUserId : req.user.id;

      const experiences = await jobseekerService.getExperiences(targetUserId);
      return responseHandler.success(res, 'Daftar pengalaman kerja berhasil diambil.', experiences);
    } catch (err) {
      next(err);
    }
  },

  async addExperience(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'PencariKerja' && req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Hanya Pencari Kerja yang dapat menambahkan pengalaman kerja.');
      }

      const payload = sanitizeExperiencePayload(req.body);
      if (!payload.company || !payload.position) {
        return responseHandler.badRequest(res, 'Nama perusahaan dan posisi jabatan wajib diisi.');
      }

      if (payload.startDate && Number.isNaN(Date.parse(payload.startDate))) {
        return responseHandler.badRequest(res, 'Format tanggal mulai tidak valid.');
      }

      if (payload.endDate && Number.isNaN(Date.parse(payload.endDate))) {
        return responseHandler.badRequest(res, 'Format tanggal selesai tidak valid.');
      }

      const newExp = await jobseekerService.addExperience(req.user.id, payload);
      return responseHandler.created(res, 'Pengalaman kerja berhasil ditambahkan.', newExp);
    } catch (err) {
      next(err);
    }
  },

  async updateExperience(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const experienceId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!experienceId) {
        return responseHandler.badRequest(res, 'ID pengalaman kerja tidak valid.');
      }

      const existing = await jobseekerService.getExperienceById?.(experienceId);
      if (existing) {
        if (!isOwnerOrAdmin(req.user, existing.userId)) {
          return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk mengubah pengalaman kerja ini.');
        }
      } else if (typeof jobseekerService.getExperiences === 'function') {
        const userExperiences = await jobseekerService.getExperiences(req.user.id);
        const owned = Array.isArray(userExperiences) && userExperiences.some((item) => item.id === experienceId);
        if (!owned && req.user.role !== 'admin') {
          return responseHandler.forbidden(res, 'Pengalaman kerja tidak ditemukan atau akses ditolak.');
        }
      }

      const payload = sanitizeExperiencePayload(req.body);
      if (Object.keys(payload).length === 0) {
        return responseHandler.badRequest(res, 'Tidak ada data valid yang dikirim untuk diperbarui.');
      }

      if (payload.startDate && Number.isNaN(Date.parse(payload.startDate))) {
        return responseHandler.badRequest(res, 'Format tanggal mulai tidak valid.');
      }

      if (payload.endDate && Number.isNaN(Date.parse(payload.endDate))) {
        return responseHandler.badRequest(res, 'Format tanggal selesai tidak valid.');
      }

      const updated = await jobseekerService.updateExperience(experienceId, payload);
      if (!updated) {
        return responseHandler.notFound(res, 'Pengalaman kerja tidak ditemukan.');
      }

      return responseHandler.success(res, 'Pengalaman kerja berhasil diperbarui.', updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteExperience(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const experienceId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!experienceId) {
        return responseHandler.badRequest(res, 'ID pengalaman kerja tidak valid.');
      }

      const existing = await jobseekerService.getExperienceById?.(experienceId);
      if (existing) {
        if (!isOwnerOrAdmin(req.user, existing.userId)) {
          return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk menghapus pengalaman kerja ini.');
        }
      } else if (typeof jobseekerService.getExperiences === 'function') {
        const userExperiences = await jobseekerService.getExperiences(req.user.id);
        const owned = Array.isArray(userExperiences) && userExperiences.some((item) => item.id === experienceId);
        if (!owned && req.user.role !== 'admin') {
          return responseHandler.forbidden(res, 'Pengalaman kerja tidak ditemukan atau akses ditolak.');
        }
      }

      const deleted = await jobseekerService.deleteExperience(experienceId);
      if (!deleted) {
        return responseHandler.notFound(res, 'Pengalaman kerja tidak ditemukan.');
      }

      return responseHandler.success(res, 'Pengalaman kerja berhasil dihapus.');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = experienceController;