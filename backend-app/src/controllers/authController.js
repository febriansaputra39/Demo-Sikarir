const authService = require('../services/authService');
const responseHandler = require('../utils/responseHandler');

const authController = {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return responseHandler.created(res, 'Pendaftaran akun berhasil.', result);
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password, role } = req.body;
      const result = await authService.login(email, password, role);
      return responseHandler.success(res, 'Login berhasil.', result);
    } catch (err) {
      return responseHandler.badRequest(res, err.message);
    }
  },

  async loginDemo(req, res, next) {
    try {
      const { role } = req.body;
      const result = await authService.loginDemo(role || 'PencariKerja');
      return responseHandler.success(res, `Login demo sebagai ${role} berhasil.`, result);
    } catch (err) {
      next(err);
    }
  },

  async getProfile(req, res, next) {
    try {
      const profile = await authService.getProfile(req.user.id);
      return responseHandler.success(res, 'Data profil berhasil diambil.', profile);
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const updated = await authService.updateProfile(req.user.id, req.body);
      return responseHandler.success(res, 'Profil berhasil diperbarui.', updated);
    } catch (err) {
      next(err);
    }
  },

  async requestPasswordReset(req, res, next) {
    try {
      const result = await authService.requestPasswordReset(req.body.email);
      return responseHandler.success(res, result.message, result);
    } catch (err) {
      return responseHandler.badRequest(res, err.message);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { email, newPassword } = req.body;
      const result = await authService.resetPassword(email, newPassword);
      return responseHandler.success(res, result.message, result);
    } catch (err) {
      return responseHandler.badRequest(res, err.message);
    }
  }
};

module.exports = authController;
