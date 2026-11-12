const { dbService } = require('../config/database');

const activityModel = {
  findByUserId: (userId) => {
    return dbService.filter('activities', a => a.userId === userId);
  },

  findById: (id) => {
    return dbService.findById('activities', id);
  },

  create: (data) => {
    return dbService.insert('activities', data);
  },

  update: (id, updates) => {
    return dbService.update('activities', id, updates);
  },

  delete: (id) => {
    return dbService.delete('activities', id);
  }
};

module.exports = activityModel;
