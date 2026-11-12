const { dbService } = require('../config/database');

const companyModel = {
  findAll: (filters = {}) => {
    let companies = dbService.get('users').filter(u => u.role === 'Perusahaan');
    const jobs = dbService.get('jobs');

    if (filters.search) {
      const q = filters.search.toLowerCase();
      companies = companies.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.industry && c.industry.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q))
      );
    }

    if (filters.verified !== undefined) {
      companies = companies.filter(c => Boolean(c.verified) === Boolean(filters.verified));
    }

    return companies.map(comp => {
      const activeJobs = jobs.filter(j => j.companyId === comp.id && j.isActive).length;
      return {
        ...comp,
        activeJobsCount: activeJobs
      };
    });
  },

  findById: (id) => {
    const user = dbService.findById('users', id);
    if (!user || user.role !== 'Perusahaan') return null;

    const jobs = dbService.get('jobs').filter(j => j.companyId === id);
    return {
      ...user,
      activeJobsCount: jobs.filter(j => j.isActive).length,
      jobs
    };
  },

  update: (id, updates) => {
    return dbService.update('users', id, updates);
  },

  verify: (id, verified = true) => {
    return dbService.update('users', id, { verified });
  }
};

module.exports = companyModel;
