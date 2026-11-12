const applicationService = require('../services/applicationService');
const responseHandler = require('../utils/responseHandler');

const applicationController = {
  async applyJob(req, res, next) {
    try {
      const newApp = await applicationService.applyJob(req.body, req.user);
      return responseHandler.created(res, 'Lamaran pekerjaan berhasil diajukan.', newApp);
    } catch (err) {
      return responseHandler.badRequest(res, err.message);
    }
  },

  async getMyApplications(req, res, next) {
    try {
      const applicantId = req.user.id;
      const apps = await applicationService.getMyApplications(applicantId);
      return responseHandler.success(res, 'Daftar lamaran saya berhasil diambil.', apps);
    } catch (err) {
      next(err);
    }
  },

  async getCompanyApplications(req, res, next) {
    try {
      const companyId = req.user.role === 'Perusahaan' ? req.user.id : req.query.companyId;
      const jobId = req.query.jobId;
      const apps = await applicationService.getCompanyApplications(companyId, jobId);
      return responseHandler.success(res, 'Daftar lamaran masuk berhasil diambil.', apps);
    } catch (err) {
      next(err);
    }
  },

  async getAllApplications(req, res, next) {
    try {
      const filters = {
        jobId: req.query.jobId,
        status: req.query.status,
        companyId: req.query.companyId,
        applicantId: req.query.applicantId
      };
      const apps = await applicationService.getAllApplications(filters);
      return responseHandler.success(res, 'Seluruh data lamaran berhasil diambil.', apps);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status, note, interviewDate } = req.body;
      const updated = await applicationService.updateStatus(req.params.id, status, note, interviewDate);
      return responseHandler.success(res, `Status lamaran berhasil diperbarui menjadi ${status}.`, updated);
    } catch (err) {
      next(err);
    }
  },

  async withdrawApplication(req, res, next) {
    try {
      const updated = await applicationService.withdrawApplication(req.params.id, req.user.id);
      return responseHandler.success(res, 'Lamaran berhasil ditarik.', updated);
    } catch (err) {
      return responseHandler.badRequest(res, err.message);
    }
  }
};

module.exports = applicationController;
