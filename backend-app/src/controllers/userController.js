const userModel = require('../models/userModel');
const responseHandler = require('../utils/responseHandler');

const userController = {
  async getAllUsers(req, res, next) {
    try {
      const { role, search } = req.query;
      let users = userModel.findAll();

      if (role && role !== 'Semua') {
        users = users.filter(u => u.role === role);
      }

      if (search) {
        const q = search.toLowerCase();
        users = users.filter(u =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q))
        );
      }

      const safeUsers = users.map(u => {
        const { password, ...safe } = u;
        return safe;
      });

      return responseHandler.success(res, 'Daftar pengguna berhasil diambil.', safeUsers);
    } catch (err) {
      next(err);
    }
  },

  async getUserById(req, res, next) {
    try {
      const user = userModel.findById(req.params.id);
      if (!user) {
        return responseHandler.notFound(res, 'Pengguna tidak ditemukan.');
      }
      const { password, ...safeUser } = user;
      return responseHandler.success(res, 'Detail pengguna berhasil diambil.', safeUser);
    } catch (err) {
      next(err);
    }
  },

  async updateUser(req, res, next) {
    try {
      const updated = userModel.update(req.params.id, req.body);
      if (!updated) {
        return responseHandler.notFound(res, 'Pengguna tidak ditemukan.');
      }
      const { password, ...safeUser } = updated;
      return responseHandler.success(res, 'Pengguna berhasil diperbarui.', safeUser);
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const deleted = userModel.delete(req.params.id);
      if (!deleted) {
        return responseHandler.notFound(res, 'Pengguna tidak ditemukan.');
      }
      return responseHandler.success(res, 'Pengguna berhasil dihapus.');
    } catch (err) {
      next(err);
    }
  },

  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return responseHandler.badRequest(res, 'Berkas avatar tidak ditemukan.');
      }
      const avatarUrl = `/uploads/company/${req.file.filename}`;
      userModel.update(req.user.id, { avatar: avatarUrl });
      return responseHandler.success(res, 'Avatar berhasil diperbarui.', { avatarUrl });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = userController;
