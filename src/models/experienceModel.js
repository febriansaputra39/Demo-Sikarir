const { dbService } = require('../config/database');

const experienceModel = {
  findByUserId: (userId) => {
    if (!userId || typeof userId !== 'string') return [];
    const list = dbService.filter('experiences', (exp) => exp.userId === userId.trim());
    return list.sort((a, b) => {
      if (Boolean(a.isCurrent) !== Boolean(b.isCurrent)) {
        return a.isCurrent ? -1 : 1;
      }
      const dateA = new Date(a.endDate || a.startDate || a.createdAt || 0).getTime() || 0;
      const dateB = new Date(b.endDate || b.startDate || b.createdAt || 0).getTime() || 0;
      return dateB - dateA;
    });
  },

  findById: (id) => {
    if (!id || typeof id !== 'string') return null;
    return dbService.findById('experiences', id.trim());
  },

  create: (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Data pengalaman kerja tidak valid.');
    }

    const isCurrent = Boolean(data.isCurrent);
    const payload = {
      userId: data.userId,
      company: typeof data.company === 'string' ? data.company.trim() : '',
      position: typeof data.position === 'string' ? data.position.trim() : '',
      jobType: typeof data.jobType === 'string' ? data.jobType.trim() : 'Full Time',
      startDate: data.startDate || null,
      endDate: isCurrent ? null : data.endDate || null,
      isCurrent,
      location: typeof data.location === 'string' ? data.location.trim() : '',
      responsibilities: typeof data.responsibilities === 'string' ? data.responsibilities.trim() : ''
    };

    return dbService.insert('experiences', payload);
  },

  update: (id, updates) => {
    if (!id || typeof id !== 'string' || !updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return null;
    }

    const { id: _ignoredId, userId: _ignoredUserId, createdAt: _ignoredCreatedAt, ...safeUpdates } = updates;

    if (safeUpdates.isCurrent !== undefined) {
      safeUpdates.isCurrent = Boolean(safeUpdates.isCurrent);
      if (safeUpdates.isCurrent) {
        safeUpdates.endDate = null;
      }
    }

    return dbService.update('experiences', id.trim(), safeUpdates);
  },

  delete: (id) => {
    if (!id || typeof id !== 'string') return false;
    return dbService.delete('experiences', id.trim());
  }
};

module.exports = experienceModel;