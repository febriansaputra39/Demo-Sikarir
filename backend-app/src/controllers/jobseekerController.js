const jobseekerService = require('../services/jobseekerService');
const responseHandler = require('../utils/responseHandler');

const jobseekerController = {
  async getAllJobseekers(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        statusKarir: req.query.statusKarir
      };
      const list = await jobseekerService.getAllJobseekers(filters);
      const safeList = list.map(u => {
        const { password, ...safe } = u;
        return safe;
      });
      return responseHandler.success(res, 'Data pencari kerja berhasil diambil.', safeList);
    } catch (err) {
      next(err);
    }
  },

  async getJobseekerById(req, res, next) {
    try {
      const user = await jobseekerService.getJobseekerById(req.params.id);
      const { password, ...safe } = user;
      return responseHandler.success(res, 'Detail pencari kerja berhasil diambil.', safe);
    } catch (err) {
      next(err);
    }
  },

  async getFullProfile(req, res, next) {
    try {
      const targetId = req.params.id || req.user.id;
      const full = await jobseekerService.getFullProfile(targetId);
      return responseHandler.success(res, 'Profil lengkap pencari kerja berhasil diambil.', full);
    } catch (err) {
      next(err);
    }
  },

  async updateCareerStatus(req, res, next) {
    try {
      const targetId = req.params.id || req.user.id;
      const { statusKarir } = req.body;
      const updated = await jobseekerService.updateCareerStatus(targetId, statusKarir);
      return responseHandler.success(res, `Status karir berhasil diubah menjadi ${statusKarir}.`, updated);
    } catch (err) {
      next(err);
    }
  },

  async getCareerStats(req, res, next) {
    try {
      const stats = await jobseekerService.getCareerMonitoringStats();
      return responseHandler.success(res, 'Statistik pemantauan karir berhasil diambil.', stats);
    } catch (err) {
      next(err);
    }
  },

  async uploadCV(req, res, next) {
    try {
      if (!req.file) {
        return responseHandler.badRequest(res, 'Berkas CV / resume tidak ditemukan.');
      }
      const cvUrl = `/uploads/cv/${req.file.filename}`;
      await jobseekerService.updateCareerStatus(req.user.id, { cvUrl });
      return responseHandler.success(res, 'CV berhasil diunggah.', { cvUrl, filename: req.file.originalname });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = jobseekerController;
