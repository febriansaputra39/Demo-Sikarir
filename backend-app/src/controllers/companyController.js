const companyModel = require('../models/companyModel');
const jobModel = require('../models/jobModel');
const applicationModel = require('../models/applicationModel');
const responseHandler = require('../utils/responseHandler');

const companyController = {
  async getAllCompanies(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        verified: req.query.verified !== undefined ? req.query.verified === 'true' : undefined
      };
      const companies = companyModel.findAll(filters);
      const safeCompanies = companies.map(c => {
        const { password, ...safe } = c;
        return safe;
      });
      return responseHandler.success(res, 'Daftar perusahaan berhasil diambil.', safeCompanies);
    } catch (err) {
      next(err);
    }
  },

  async getCompanyById(req, res, next) {
    try {
      const company = companyModel.findById(req.params.id);
      if (!company) {
        return responseHandler.notFound(res, 'Profil perusahaan tidak ditemukan.');
      }
      const { password, ...safeCompany } = company;
      return responseHandler.success(res, 'Detail perusahaan berhasil diambil.', safeCompany);
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const companyId = req.params.id || req.user.id;
      const updated = companyModel.update(companyId, req.body);
      if (!updated) {
        return responseHandler.notFound(res, 'Perusahaan tidak ditemukan.');
      }
      const { password, ...safeCompany } = updated;
      return responseHandler.success(res, 'Profil perusahaan berhasil diperbarui.', safeCompany);
    } catch (err) {
      next(err);
    }
  },

  async verifyCompany(req, res, next) {
    try {
      const { verified } = req.body;
      const updated = companyModel.verify(req.params.id, Boolean(verified));
      if (!updated) {
        return responseHandler.notFound(res, 'Perusahaan tidak ditemukan.');
      }
      return responseHandler.success(
        res,
        `Status verifikasi perusahaan diubah menjadi: ${verified ? 'Terverifikasi' : 'Belum Diverifikasi'}.`,
        updated
      );
    } catch (err) {
      next(err);
    }
  },

  async getDashboardStats(req, res, next) {
    try {
      const companyId = req.params.id || req.user.id;
      const jobs = jobModel.findAll({ companyId });
      const applications = applicationModel.findAll({ companyId });

      const pendingCount = applications.filter(a => a.status === 'Terkirim' || a.status === 'Seleksi Berkas').length;
      const interviewCount = applications.filter(a => a.status === 'Jadwal Wawancara').length;
      const acceptedCount = applications.filter(a => a.status === 'Diterima').length;

      const stats = {
        activeJobs: jobs.filter(j => j.isActive).length,
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
      if (!req.file) {
        return responseHandler.badRequest(res, 'Berkas logo tidak ditemukan.');
      }
      const logoUrl = `/uploads/company/${req.file.filename}`;
      companyModel.update(req.user.id, { avatar: logoUrl });
      return responseHandler.success(res, 'Logo perusahaan berhasil diunggah.', { logoUrl });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = companyController;
