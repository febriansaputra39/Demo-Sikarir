const { dbService } = require('../config/database');

const matchingModel = {
  findHistory: (userId) => {
    return dbService.filter('matchings', m => m.userId === userId);
  },

  logMatch: (matchData) => {
    return dbService.insert('matchings', {
      ...matchData,
      matchedAt: new Date().toISOString()
    });
  }
};

module.exports = matchingModel;
