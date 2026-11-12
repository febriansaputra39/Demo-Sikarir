const { dbService } = require('../config/database');

const skillModel = {
  findByUserId: (userId) => {
    return dbService.filter('skills', s => s.userId === userId);
  },

  findById: (id) => {
    return dbService.findById('skills', id);
  },

  create: (data) => {
    return dbService.insert('skills', {
      ...data,
      level: data.level || 4,
      verified: data.verified !== undefined ? data.verified : true
    });
  },

  update: (id, updates) => {
    return dbService.update('skills', id, updates);
  },

  delete: (id) => {
    return dbService.delete('skills', id);
  }
};

module.exports = skillModel;
