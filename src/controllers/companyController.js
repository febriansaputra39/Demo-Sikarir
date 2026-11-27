const path = require('path');
const fs = require('fs');
const companyModel = require('../models/companyModel');
const jobModel = require('../models/jobModel');
const applicationModel = require('../models/applicationModel');
const responseHandler = require('../utils/responseHandler');

const ALLOWED_COMPANY_FIELDS = [
  'name',
  'phone',
  'industry',
  'location',
  'website',
  'description',
  'avatar'
];

const stripSensitiveFields = (company) => {
  if (!company || typeof company !== 'object') return company;
  const { password, resetToken, resetTokenExpiry, ...safe } = company;
  return safe;
};

const sanitizeCompanyPayload = (body = {}) => {
  const clean = {};
  for (const field of ALLOWED_COMPANY_FIELDS) {
    if (body[field] !== undefined) {
      clean[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    }
  }
  return clean;
};

const canAccessCompany = (user, targetCompanyId) => {
  if (!user || !targetCompanyId) return false;
  if (user.role === 'admin') return true;
  return user.role === 'Perusahaan' && user.id === targetCompanyId;
};

const companyController = {
  async getAllCompanies(req, res, next) {
    try {
      const filters = {
        search: typeof req.query.search === 'string' ? req.query.search.trim() : undefined,
        verified: req.query.verified !== undefined ? req.query.verified === 'true' : undefined
      };

      const companies = await companyModel.findAll(filters);
      const safeCompanies = Array.isArray(companies) ? companies.map(stripSensitiveFields) : [];

      return responseHandler.success(res, 'Daftar perusahaan berhasil diambil.', safeCompanies);
    } catch (err) {
      next(err);
    }
  },

  async getCompanyById(req, res, next) {
    try {
      const companyId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!companyId) {
        return responseHandler.badRequest(res, 'ID perusahaan tidak valid.');
      }

      const company = await companyModel.findById(companyId);
      if (!company) {
        return responseHandler.notFound(res, 'Profil perusahaan tidak ditemukan.');
      }

      return responseHandler.success(res, 'Detail perusahaan berhasil diambil.', stripSensitiveFields(company));
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const companyId =
        typeof req.params.id === 'string' && req.params.id.trim() ? req.params.id.trim() : req.user.id;

      if (!canAccessCompany(req.user, companyId)) {
        return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk mengubah profil perusahaan ini.');
      }

      const payload = sanitizeCompanyPayload(req.body);
      if (Object.keys(payload).length === 0) {
        return responseHandler.badRequest(res, 'Tidak ada data valid yang dikirim untuk diperbarui.');
      }

      if (payload.website && !/^https?:\/\/.+/i.test(payload.website)) {
        return responseHandler.badRequest(res, 'URL website harus diawali dengan http:// atau https://.');
      }

      const updated = await companyModel.update(companyId, payload);
      if (!updated) {
        return responseHandler.notFound(res, 'Perusahaan tidak ditemukan.');
      }

      return responseHandler.success(res, 'Profil perusahaan berhasil diperbarui.', stripSensitiveFields(updated));
    } catch (err) {
      next(err);
    }
  },

  async verifyCompany(req, res, next) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Hanya Admin yang dapat memverifikasi akun perusahaan.');
      }

      const companyId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!companyId) {
        return responseHandler.badRequest(res, 'ID perusahaan tidak valid.');
      }

      const { verified } = req.body;
      if (typeof verified !== 'boolean') {
        return responseHandler.badRequest(res, 'Status verifikasi (verified) harus berupa boolean (true/false).');
      }

      const updated = await companyModel.verify(companyId, verified);
      if (!updated) {
        return responseHandler.notFound(res, 'Perusahaan tidak ditemukan.');
      }

      return responseHandler.success(
        res,
        `Status verifikasi perusahaan diubah menjadi: ${verified ? 'Terverifikasi' : 'Belum Diverifikasi'}.`,
        stripSensitiveFields(updated)
      );
    } catch (err) {
      next(err);
    }
  },

  async getDashboardStats(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const companyId =
        typeof req.params.id === 'string' && req.params.id.trim() ? req.params.id.trim() : req.user.id;

      if (!canAccessCompany(req.user, companyId)) {
        return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk mengakses statistik perusahaan ini.');
      }

      const jobs = (await jobModel.findAll({ companyId })) || [];
      const applications = (await applicationModel.findAll({ companyId })) || [];

      const pendingCount = applications.filter(
        (a) => a.status === 'Terkirim' || a.status === 'Seleksi Berkas'
      ).length;
      const interviewCount = applications.filter((a) => a.status === 'Jadwal Wawancara').length;
      const acceptedCount = applications.filter((a) => a.status === 'Diterima').length;

      const stats = {
        activeJobs: jobs.filter((j) => j.isActive).length,
        totalJobs: jobs.length,
        totalApplications: applications.length,
        pendingReview: pendingCount,
        scheduledInterviews: interviewCount,
        acceptedCandidates: acceptedCount
      };

      return responseHandler.success(res, 'Statistik dashboard perusahaan berhasil diambil.', stats);
    } catch (err) {
      next(err);
    }
  },

  async uploadLogo(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'Perusahaan') {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return responseHandler.forbidden(res, 'Hanya akun Perusahaan yang dapat mengunggah logo.');
      }

      if (!req.file || !req.file.filename) {
        return responseHandler.badRequest(res, 'Berkas logo tidak ditemukan.');
      }

      const safeFilename = path.basename(req.file.filename);
      const logoUrl = `/uploads/company/${safeFilename}`;

      const updated = await companyModel.update(req.user.id, { avatar: logoUrl });
      if (!updated) {
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return responseHandler.notFound(res, 'Profil perusahaan tidak ditemukan.');
      }

      return responseHandler.success(res, 'Logo perusahaan berhasil diunggah.', { logoUrl });
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

module.exports = companyController;