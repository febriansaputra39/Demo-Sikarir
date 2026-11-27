const { dbService } = require('../config/database');

const normalizeSkillLevel = (rawLevel, fallback = 3) => {
  if (rawLevel === undefined || rawLevel === null || rawLevel === '') {
    return fallback;
  }
  const parsed = Number.parseInt(rawLevel, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(5, Math.max(1, parsed));
};

const skillModel = {
  findByUserId: (userId) => {
    if (!userId || typeof userId !== 'string') return [];
    const list = dbService.filter('skills', (s) => s.userId === userId.trim());
    return list.sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0));
  },

  findById: (id) => {
    if (!id || typeof id !== 'string') return null;
    return dbService.findById('skills', id.trim());
  },

  create: (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Data keahlian tidak valid.');
    }

    if (typeof data.userId !== 'string' || !data.userId.trim()) {
      throw new Error('userId wajib disertakan pada data keahlian.');
    }

    const name = typeof data.name === 'string' ? data.name.trim() : '';
    if (!name) {
      throw new Error('Nama keahlian wajib diisi.');
    }

    return dbService.insert('skills', {
      userId: data.userId.trim(),
      name,
      category: typeof data.category === 'string' && data.category.trim() ? data.category.trim() : 'Teknis',
      level: normalizeSkillLevel(data.level, 3),
      verified: data.verified === true
    });
  },

  update: (id, updates) => {
    if (!id || typeof id !== 'string' || !updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return null;
    }

    const {
      id: _ignoredId,
      userId: _ignoredUserId,
      createdAt: _ignoredCreatedAt,
      ...safeUpdates
    } = updates;

    if (safeUpdates.name !== undefined) {
      if (typeof safeUpdates.name !== 'string' || !safeUpdates.name.trim()) {
        throw new Error('Nama keahlian tidak boleh kosong.');
      }
      safeUpdates.name = safeUpdates.name.trim();
    }

    if (safeUpdates.category !== undefined && typeof safeUpdates.category === 'string') {
      safeUpdates.category = safeUpdates.category.trim();
    }

    if (safeUpdates.level !== undefined) {
      safeUpdates.level = normalizeSkillLevel(safeUpdates.level, 3);
    }

    if (safeUpdates.verified !== undefined) {
      safeUpdates.verified = Boolean(safeUpdates.verified);
    }

    return dbService.update('skills', id.trim(), safeUpdates);
  },

  delete: (id) => {
    if (!id || typeof id !== 'string') return false;
    return dbService.delete('skills', id.trim());
  }
};

module.exports = skillModel;