const jobseekerService = require('../services/jobseekerService');
const responseHandler = require('../utils/responseHandler');

const educationController = {
  async getEducations(req, res, next) {
    try {
      const userId = req.query.userId || req.user.id;
      const educations = await jobseekerService.getEducations(userId);
      return responseHandler.success(res, 'Daftar riwayat pendidikan berhasil diambil.', educations);
    } catch (err) {
      next(err);
    }
  },

  async addEducation(req, res, next) {
    try {
      const userId = req.user ? req.user.id : req.body.userId;
      const newEdu = await jobseekerService.addEducation(userId, req.body);
      return responseHandler.created(res, 'Riwayat pendidikan berhasil ditambahkan.', newEdu);
    } catch (err) {
      next(err);
    }
  },

  async updateEducation(req, res, next) {
    try {
      const updated = await jobseekerService.updateEducation(req.params.id, req.body);
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
      const deleted = await jobseekerService.deleteEducation(req.params.id);
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
