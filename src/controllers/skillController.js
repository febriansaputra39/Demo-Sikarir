const jobseekerService = require('../services/jobseekerService');
const responseHandler = require('../utils/responseHandler');

const USER_ALLOWED_SKILL_FIELDS = ['name', 'category', 'level'];
const ADMIN_ALLOWED_SKILL_FIELDS = ['name', 'category', 'level', 'verified'];

const sanitizeSkillPayload = (body = {}, isAdmin = false) => {
  const allowedFields = isAdmin ? ADMIN_ALLOWED_SKILL_FIELDS : USER_ALLOWED_SKILL_FIELDS;
  const clean = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      clean[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    }
  }

  if (clean.level !== undefined) {
    clean.level = Number(clean.level);
  }

  if (clean.verified !== undefined) {
    clean.verified = Boolean(clean.verified);
  }

  return clean;
};

const isOwnerOrAdmin = (user, resourceUserId) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.id === resourceUserId;
};

const skillController = {
  async getSkills(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const requestedUserId = typeof req.query.userId === 'string' ? req.query.userId.trim() : null;
      const canViewOthers = req.user.role === 'admin' || req.user.role === 'Perusahaan';
      const targetUserId = requestedUserId && canViewOthers ? requestedUserId : req.user.id;

      const skills = await jobseekerService.getSkills(targetUserId);
      return responseHandler.success(res, 'Daftar keahlian berhasil diambil.', skills);
    } catch (err) {
      next(err);
    }
  },

  async addSkill(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'PencariKerja' && req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Hanya Pencari Kerja yang dapat menambahkan keahlian.');
      }

      const isAdmin = req.user.role === 'admin';
      const payload = sanitizeSkillPayload(req.body, isAdmin);

      if (!payload.name) {
        return responseHandler.badRequest(res, 'Nama keahlian wajib diisi.');
      }

      if (payload.level === undefined) {
        payload.level = 3;
      } else if (!Number.isInteger(payload.level) || payload.level < 1 || payload.level > 5) {
        return responseHandler.badRequest(res, 'Level keahlian harus berupa angka bulat antara 1 hingga 5.');
      }

      if (!isAdmin) {
        payload.verified = false;
      }

      const newSkill = await jobseekerService.addSkill(req.user.id, payload);
      return responseHandler.created(res, 'Keahlian berhasil ditambahkan.', newSkill);
    } catch (err) {
      next(err);
    }
  },

  async updateSkill(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const skillId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!skillId) {
        return responseHandler.badRequest(res, 'ID keahlian tidak valid.');
      }

      const existing = await jobseekerService.getSkillById?.(skillId);
      if (existing) {
        if (!isOwnerOrAdmin(req.user, existing.userId)) {
          return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk mengubah keahlian ini.');
        }
      } else if (typeof jobseekerService.getSkills === 'function') {
        const userSkills = await jobseekerService.getSkills(req.user.id);
        const owned = Array.isArray(userSkills) && userSkills.some((item) => item.id === skillId);
        if (!owned && req.user.role !== 'admin') {
          return responseHandler.forbidden(res, 'Keahlian tidak ditemukan atau akses ditolak.');
        }
      }

      const isAdmin = req.user.role === 'admin';
      const payload = sanitizeSkillPayload(req.body, isAdmin);

      if (Object.keys(payload).length === 0) {
        return responseHandler.badRequest(res, 'Tidak ada data valid yang dikirim untuk diperbarui.');
      }

      if (
        payload.level !== undefined &&
        (!Number.isInteger(payload.level) || payload.level < 1 || payload.level > 5)
      ) {
        return responseHandler.badRequest(res, 'Level keahlian harus berupa angka bulat antara 1 hingga 5.');
      }

      const updated = await jobseekerService.updateSkill(skillId, payload);
      if (!updated) {
        return responseHandler.notFound(res, 'Keahlian tidak ditemukan.');
      }

      return responseHandler.success(res, 'Keahlian berhasil diperbarui.', updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteSkill(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const skillId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!skillId) {
        return responseHandler.badRequest(res, 'ID keahlian tidak valid.');
      }

      const existing = await jobseekerService.getSkillById?.(skillId);
      if (existing) {
        if (!isOwnerOrAdmin(req.user, existing.userId)) {
          return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk menghapus keahlian ini.');
        }
      } else if (typeof jobseekerService.getSkills === 'function') {
        const userSkills = await jobseekerService.getSkills(req.user.id);
        const owned = Array.isArray(userSkills) && userSkills.some((item) => item.id === skillId);
        if (!owned && req.user.role !== 'admin') {
          return responseHandler.forbidden(res, 'Keahlian tidak ditemukan atau akses ditolak.');
        }
      }

      const deleted = await jobseekerService.deleteSkill(skillId);
      if (!deleted) {
        return responseHandler.notFound(res, 'Keahlian tidak ditemukan.');
      }

      return responseHandler.success(res, 'Keahlian berhasil dihapus.');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = skillController;