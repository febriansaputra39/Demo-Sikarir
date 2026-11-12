const { dbService } = require('../config/database');

const educationModel = {
  findByUserId: (userId) => {
    return dbService.filter('educations', e => e.userId === userId);
  },

  findById: (id) => {
    return dbService.findById('educations', id);
  },

  create: (data) => {
    return dbService.insert('educations', data);
  },

  update: (id, updates) => {
    return dbService.update('educations', id, updates);
  },

  delete: (id) => {
    return dbService.delete('educations', id);
  }
};

module.exports = educationModel;
