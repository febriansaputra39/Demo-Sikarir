const { dbService } = require('../config/database');

const educationModel = {
  findByUserId: (userId) => {
    if (!userId || typeof userId !== 'string') return [];
    const list = dbService.filter('educations', (e) => e.userId === userId.trim());
    return list.sort((a, b) => {
      const yearA = Number.parseInt(a.endYear || a.startYear, 10) || 0;
      const yearB = Number.parseInt(b.endYear || b.startYear, 10) || 0;
      return yearB - yearA;
    });
  },

  findById: (id) => {
    if (!id || typeof id !== 'string') return null;
    return dbService.findById('educations', id.trim());
  },

  create: (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Data riwayat pendidikan tidak valid.');
    }

    const payload = {
      userId: data.userId,
      institution: typeof data.institution === 'string' ? data.institution.trim() : '',
      degree: typeof data.degree === 'string' ? data.degree.trim() : '',
      major: typeof data.major === 'string' ? data.major.trim() : '',
      gpa: data.gpa !== undefined && data.gpa !== null ? String(data.gpa).trim() : '',
      startYear: data.startYear !== undefined && data.startYear !== null ? String(data.startYear).trim() : '',
      endYear: data.endYear !== undefined && data.endYear !== null ? String(data.endYear).trim() : '',
      description: typeof data.description === 'string' ? data.description.trim() : ''
    };

    return dbService.insert('educations', payload);
  },

  update: (id, updates) => {
    if (!id || typeof id !== 'string' || !updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return null;
    }

    const { id: _ignoredId, userId: _ignoredUserId, createdAt: _ignoredCreatedAt, ...safeUpdates } = updates;
    return dbService.update('educations', id.trim(), safeUpdates);
  },

  delete: (id) => {
    if (!id || typeof id !== 'string') return false;
    return dbService.delete('educations', id.trim());
  }
};

module.exports = educationModel;