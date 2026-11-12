const { dbService } = require('../config/database');

const userModel = {
  findAll: (filterFn = null) => {
    const users = dbService.get('users');
    return filterFn ? users.filter(filterFn) : users;
  },

  findById: (id) => {
    return dbService.findById('users', id);
  },

  findByEmail: (email) => {
    if (!email) return null;
    return dbService.find('users', u => u.email.toLowerCase() === email.toLowerCase());
  },

  create: (userData) => {
    return dbService.insert('users', userData);
  },

  update: (id, updates) => {
    return dbService.update('users', id, updates);
  },

  delete: (id) => {
    return dbService.delete('users', id);
  }
};

module.exports = userModel;
