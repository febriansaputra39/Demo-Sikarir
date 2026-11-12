const jobseekerService = require('../services/jobseekerService');
const responseHandler = require('../utils/responseHandler');

const experienceController = {
  async getExperiences(req, res, next) {
    try {
      const userId = req.query.userId || req.user.id;
      const experiences = await jobseekerService.getExperiences(userId);
      return responseHandler.success(res, 'Daftar pengalaman kerja berhasil diambil.', experiences);
    } catch (err) {
      next(err);
    }
  },

  async addExperience(req, res, next) {
    try {
      const userId = req.user ? req.user.id : req.body.userId;
      const newExp = await jobseekerService.addExperience(userId, req.body);
      return responseHandler.created(res, 'Pengalaman kerja berhasil ditambahkan.', newExp);
    } catch (err) {
      next(err);
    }
  },

  async updateExperience(req, res, next) {
    try {
      const updated = await jobseekerService.updateExperience(req.params.id, req.body);
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
      const deleted = await jobseekerService.deleteExperience(req.params.id);
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
