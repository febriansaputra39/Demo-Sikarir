const jobseekerService = require('../services/jobseekerService');
const responseHandler = require('../utils/responseHandler');

const skillController = {
  async getSkills(req, res, next) {
    try {
      const userId = req.query.userId || req.user.id;
      const skills = await jobseekerService.getSkills(userId);
      return responseHandler.success(res, 'Daftar keahlian berhasil diambil.', skills);
    } catch (err) {
      next(err);
    }
  },

  async addSkill(req, res, next) {
    try {
      const userId = req.user ? req.user.id : req.body.userId;
      const newSkill = await jobseekerService.addSkill(userId, req.body);
      return responseHandler.created(res, 'Keahlian berhasil ditambahkan.', newSkill);
    } catch (err) {
      next(err);
    }
  },

  async updateSkill(req, res, next) {
    try {
      const updated = await jobseekerService.updateSkill(req.params.id, req.body);
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
      const deleted = await jobseekerService.deleteSkill(req.params.id);
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
