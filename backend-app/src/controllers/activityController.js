const jobseekerService = require('../services/jobseekerService');
const responseHandler = require('../utils/responseHandler');

const activityController = {
  async getActivities(req, res, next) {
    try {
      const userId = req.query.userId || req.user.id;
      const activities = await jobseekerService.getActivities(userId);
      return responseHandler.success(res, 'Daftar aktivitas karir berhasil diambil.', activities);
    } catch (err) {
      next(err);
    }
  },

  async addActivity(req, res, next) {
    try {
      const userId = req.user ? req.user.id : req.body.userId;
      const newAct = await jobseekerService.addActivity(userId, req.body);
      return responseHandler.created(res, 'Aktivitas karir berhasil ditambahkan.', newAct);
    } catch (err) {
      next(err);
    }
  },

  async updateActivity(req, res, next) {
    try {
      const updated = await jobseekerService.updateActivity(req.params.id, req.body);
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
      const deleted = await jobseekerService.deleteActivity(req.params.id);
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
