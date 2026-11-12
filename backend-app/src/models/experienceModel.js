const { dbService } = require('../config/database');

const experienceModel = {
  findByUserId: (userId) => {
    return dbService.filter('experiences', exp => exp.userId === userId);
  },

  findById: (id) => {
    return dbService.findById('experiences', id);
  },

  create: (data) => {
    return dbService.insert('experiences', data);
  },

  update: (id, updates) => {
    return dbService.update('experiences', id, updates);
  },

  delete: (id) => {
    return dbService.delete('experiences', id);
  }
};

module.exports = experienceModel;
