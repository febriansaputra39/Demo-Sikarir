const jobseekerService = require('../services/jobseekerService');
const responseHandler = require('../utils/responseHandler');

const ALLOWED_EDUCATION_FIELDS = [
  'institution',
  'degree',
  'major',
  'gpa',
  'startYear',
  'endYear',
  'description'
];

const sanitizeEducationPayload = (body = {}) => {
  const clean = {};
  for (const field of ALLOWED_EDUCATION_FIELDS) {
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

const educationController = {
  async getEducations(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const requestedUserId = typeof req.query.userId === 'string' ? req.query.userId.trim() : null;
      const canViewOthers = req.user.role === 'admin' || req.user.role === 'Perusahaan';
      const targetUserId = requestedUserId && canViewOthers ? requestedUserId : req.user.id;

      const educations = await jobseekerService.getEducations(targetUserId);
      return responseHandler.success(res, 'Daftar riwayat pendidikan berhasil diambil.', educations);
    } catch (err) {
      next(err);
    }
  },

  async addEducation(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'PencariKerja' && req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Hanya Pencari Kerja yang dapat menambahkan riwayat pendidikan.');
      }

      const payload = sanitizeEducationPayload(req.body);
      if (!payload.institution || !payload.degree || !payload.major) {
        return responseHandler.badRequest(res, 'Nama institusi, jenjang pendidikan, dan jurusan wajib diisi.');
      }

      const newEdu = await jobseekerService.addEducation(req.user.id, payload);
      return responseHandler.created(res, 'Riwayat pendidikan berhasil ditambahkan.', newEdu);
    } catch (err) {
      next(err);
    }
  },

  async updateEducation(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const educationId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!educationId) {
        return responseHandler.badRequest(res, 'ID riwayat pendidikan tidak valid.');
      }

      const existing = await jobseekerService.getEducationById?.(educationId);
      if (existing) {
        if (!isOwnerOrAdmin(req.user, existing.userId)) {
          return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk mengubah riwayat pendidikan ini.');
        }
      } else if (typeof jobseekerService.getEducations === 'function') {
        const userEducations = await jobseekerService.getEducations(req.user.id);
        const owned = Array.isArray(userEducations) && userEducations.some((item) => item.id === educationId);
        if (!owned && req.user.role !== 'admin') {
          return responseHandler.forbidden(res, 'Riwayat pendidikan tidak ditemukan atau akses ditolak.');
        }
      }

      const payload = sanitizeEducationPayload(req.body);
      if (Object.keys(payload).length === 0) {
        return responseHandler.badRequest(res, 'Tidak ada data valid yang dikirim untuk diperbarui.');
      }

      const updated = await jobseekerService.updateEducation(educationId, payload);
      if (!updated) {
        return responseHandler.notFound(res, 'Riwayat pendidikan tidak ditemukan.');
      }

      return responseHandler.success(res, 'Riwayat pendidikan berhasil diperbarui.', updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteEducation(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const educationId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!educationId) {
        return responseHandler.badRequest(res, 'ID riwayat pendidikan tidak valid.');
      }

      const existing = await jobseekerService.getEducationById?.(educationId);
      if (existing) {
        if (!isOwnerOrAdmin(req.user, existing.userId)) {
          return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk menghapus riwayat pendidikan ini.');
        }
      } else if (typeof jobseekerService.getEducations === 'function') {
        const userEducations = await jobseekerService.getEducations(req.user.id);
        const owned = Array.isArray(userEducations) && userEducations.some((item) => item.id === educationId);
        if (!owned && req.user.role !== 'admin') {
          return responseHandler.forbidden(res, 'Riwayat pendidikan tidak ditemukan atau akses ditolak.');
        }
      }

      const deleted = await jobseekerService.deleteEducation(educationId);
      if (!deleted) {
        return responseHandler.notFound(res, 'Riwayat pendidikan tidak ditemukan.');
      }

      return responseHandler.success(res, 'Riwayat pendidikan berhasil dihapus.');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = educationController;