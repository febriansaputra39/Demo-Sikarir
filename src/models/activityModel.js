const { dbService } = require('../config/database');

const activityModel = {
  findByUserId: (userId) => {
    if (!userId || typeof userId !== 'string') return [];
    const list = dbService.filter('activities', (a) => a.userId === userId.trim());
    return list.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
  },

  findById: (id) => {
    if (!id || typeof id !== 'string') return null;
    return dbService.findById('activities', id.trim());
  },

  create: (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Data aktivitas tidak valid.');
    }

    const payload = {
      userId: data.userId,
      title: typeof data.title === 'string' ? data.title.trim() : '',
      category: typeof data.category === 'string' ? data.category.trim() : 'Lainnya',
      provider: typeof data.provider === 'string' ? data.provider.trim() : '',
      date: data.date || null,
      description: typeof data.description === 'string' ? data.description.trim() : ''
    };

    return dbService.insert('activities', payload);
  },

  update: (id, updates) => {
    if (!id || typeof id !== 'string' || !updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return null;
    }

    const { id: _ignoredId, userId: _ignoredUserId, createdAt: _ignoredCreatedAt, ...safeUpdates } = updates;
    return dbService.update('activities', id.trim(), safeUpdates);
  },

  delete: (id) => {
    if (!id || typeof id !== 'string') return false;
    return dbService.delete('activities', id.trim());
  }
};

module.exports = activityModel;