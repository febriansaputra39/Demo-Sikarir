const jobService = require('../services/jobService');
const responseHandler = require('../utils/responseHandler');

const jobController = {
  async getAllJobs(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        category: req.query.category,
        jobType: req.query.jobType,
        statusVerifikasi: req.query.statusVerifikasi,
        onlyActive: req.query.onlyActive === 'true',
        companyId: req.query.companyId
      };
      const jobs = await jobService.getAllJobs(filters);
      return responseHandler.success(res, 'Daftar lowongan pekerjaan berhasil diambil.', jobs);
    } catch (err) {
      next(err);
    }
  },

  async getJobById(req, res, next) {
    try {
      const job = await jobService.getJobById(req.params.id);
      return responseHandler.success(res, 'Detail lowongan pekerjaan berhasil diambil.', job);
    } catch (err) {
      next(err);
    }
  },

  async createJob(req, res, next) {
    try {
      const newJob = await jobService.createJob(req.user, req.body);
      return responseHandler.created(res, 'Lowongan pekerjaan berhasil dibuat dan menunggu verifikasi admin.', newJob);
    } catch (err) {
      next(err);
    }
  },

  async updateJob(req, res, next) {
    try {
      const updated = await jobService.updateJob(req.params.id, req.body, req.user);
      return responseHandler.success(res, 'Lowongan pekerjaan berhasil diperbarui.', updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteJob(req, res, next) {
    try {
      await jobService.deleteJob(req.params.id, req.user);
      return responseHandler.success(res, 'Lowongan pekerjaan berhasil dihapus.');
    } catch (err) {
      next(err);
    }
  },

  async verifyJob(req, res, next) {
    try {
      const { status, note } = req.body;
      const updated = await jobService.verifyJob(req.params.id, status, note);
      return responseHandler.success(res, `Lowongan berhasil ${status.toLowerCase()}.`, updated);
    } catch (err) {
      next(err);
    }
  },

  async toggleActive(req, res, next) {
    try {
      const updated = await jobService.toggleJobActive(req.params.id, req.user);
      return responseHandler.success(res, `Status tayang lowongan berhasil diubah: ${updated.isActive ? 'Aktif' : 'Non-Aktif'}.`, updated);
    } catch (err) {
      next(err);
    }
  },

  async getJobStats(req, res, next) {
    try {
      const stats = await jobService.getJobStats();
      return responseHandler.success(res, 'Statistik lowongan berhasil diambil.', stats);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = jobController;
