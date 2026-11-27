const { dbService } = require('../config/database');

const ALLOWED_ROLES = new Set(['admin', 'PencariKerja', 'Perusahaan']);

const userModel = {
  findAll: (filterFn = null) => {
    const users = dbService.get('users');
    return typeof filterFn === 'function' ? users.filter(filterFn) : users;
  },

  findById: (id) => {
    if (!id || typeof id !== 'string') return null;
    return dbService.findById('users', id.trim());
  },

  findByEmail: (email) => {
    if (!email || typeof email !== 'string') return null;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return null;

    return dbService.find(
      'users',
      (u) => typeof u.email === 'string' && u.email.trim().toLowerCase() === normalizedEmail
    );
  },

  create: (userData) => {
    if (!userData || typeof userData !== 'object' || Array.isArray(userData)) {
      throw new Error('Data pengguna tidak valid.');
    }

    const normalizedEmail = typeof userData.email === 'string' ? userData.email.trim().toLowerCase() : '';
    if (!normalizedEmail) {
      throw new Error('Email pengguna wajib diisi.');
    }

    const existing = userModel.findByEmail(normalizedEmail);
    if (existing) {
      const err = new Error('Email sudah terdaftar.');
      err.statusCode = 409;
      throw err;
    }

    const role = ALLOWED_ROLES.has(userData.role) ? userData.role : 'PencariKerja';
    const { id: _ignoredId, createdAt: _ignoredCreatedAt, ...restData } = userData;

    return dbService.insert('users', {
      ...restData,
      email: normalizedEmail,
      role,
      verified: role === 'Perusahaan' ? Boolean(userData.verified) : true
    });
  },

  update: (id, updates) => {
    if (!id || typeof id !== 'string' || !updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return null;
    }

    const cleanId = id.trim();
    const { id: _ignoredId, createdAt: _ignoredCreatedAt, ...safeUpdates } = updates;

    if (safeUpdates.email !== undefined) {
      if (typeof safeUpdates.email !== 'string' || !safeUpdates.email.trim()) {
        throw new Error('Format email tidak valid.');
      }
      const normalizedEmail = safeUpdates.email.trim().toLowerCase();
      const duplicate = dbService.find(
        'users',
        (u) =>
          u.id !== cleanId &&
          typeof u.email === 'string' &&
          u.email.trim().toLowerCase() === normalizedEmail
      );
      if (duplicate) {
        const err = new Error('Email sudah digunakan oleh akun lain.');
        err.statusCode = 409;
        throw err;
      }
      safeUpdates.email = normalizedEmail;
    }

    if (safeUpdates.role !== undefined && !ALLOWED_ROLES.has(safeUpdates.role)) {
      throw new Error(`Peran (role) "${safeUpdates.role}" tidak valid.`);
    }

    return dbService.update('users', cleanId, safeUpdates);
  },

  delete: (id) => {
    if (!id || typeof id !== 'string') return false;
    return dbService.delete('users', id.trim());
  }
};

module.exports = userModel;