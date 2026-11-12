const { dbService } = require('../config/database');

const jobseekerModel = {
  findAll: (filters = {}) => {
    let list = dbService.get('users').filter(u => u.role === 'PencariKerja');

    if (filters.statusKarir && filters.statusKarir !== 'Semua') {
      list = list.filter(u => u.statusKarir === filters.statusKarir);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(u =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.headline && u.headline.toLowerCase().includes(q)) ||
        (u.location && u.location.toLowerCase().includes(q))
      );
    }
    return list;
  },

  findById: (id) => {
    const user = dbService.findById('users', id);
    if (!user || user.role !== 'PencariKerja') return null;
    return user;
  },

  updateCareerStatus: (id, statusKarir) => {
    return dbService.update('users', id, {
      statusKarir,
      statusUpdatedAt: new Date().toISOString()
    });
  },

  getFullProfile: (id) => {
    const user = dbService.findById('users', id);
    if (!user) return null;

    const educations = dbService.filter('educations', e => e.userId === id);
    const experiences = dbService.filter('experiences', exp => exp.userId === id);
    const skills = dbService.filter('skills', s => s.userId === id);
    const activities = dbService.filter('activities', a => a.userId === id);

    return {
      ...user,
      educations,
      experiences,
      skills,
      activities
    };
  }
};

module.exports = jobseekerModel;
