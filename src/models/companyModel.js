const { dbService } = require('../config/database');

const companyModel = {
  findAll: (filters = {}) => {
    const safeFilters = filters && typeof filters === 'object' && !Array.isArray(filters) ? filters : {};
    let companies = dbService.get('users').filter((u) => u.role === 'Perusahaan');
    const jobs = dbService.get('jobs');

    if (typeof safeFilters.search === 'string' && safeFilters.search.trim()) {
      const q = safeFilters.search.trim().toLowerCase();
      companies = companies.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.industry && c.industry.toLowerCase().includes(q)) ||
          (c.location && c.location.toLowerCase().includes(q))
      );
    }

    if (safeFilters.verified !== undefined) {
      companies = companies.filter((c) => Boolean(c.verified) === Boolean(safeFilters.verified));
    }

    const activeJobsByCompany = new Map();
    for (const job of jobs) {
      if (job.isActive && job.statusVerifikasi === 'Disetujui' && job.companyId) {
        activeJobsByCompany.set(job.companyId, (activeJobsByCompany.get(job.companyId) || 0) + 1);
      }
    }

    return companies.map((comp) => ({
      ...comp,
      activeJobsCount: activeJobsByCompany.get(comp.id) || 0
    }));
  },

  findById: (id, options = {}) => {
    if (!id || typeof id !== 'string') return null;
    const cleanId = id.trim();

    const user = dbService.findById('users', cleanId);
    if (!user || user.role !== 'Perusahaan') return null;

    const includeUnverified = Boolean(options.includeUnverified);
    const companyJobs = dbService
      .get('jobs')
      .filter(
        (j) =>
          j.companyId === cleanId &&
          (includeUnverified || (j.isActive && j.statusVerifikasi === 'Disetujui'))
      );

    return {
      ...user,
      activeJobsCount: companyJobs.filter((j) => j.isActive && j.statusVerifikasi === 'Disetujui').length,
      jobs: companyJobs
    };
  },

  update: (id, updates) => {
    if (!id || typeof id !== 'string' || !updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return null;
    }

    const cleanId = id.trim();
    const existing = dbService.findById('users', cleanId);
    if (!existing || existing.role !== 'Perusahaan') return null;

    const {
      id: _ignoredId,
      role: _ignoredRole,
      password: _ignoredPassword,
      createdAt: _ignoredCreatedAt,
      ...safeUpdates
    } = updates;

    return dbService.update('users', cleanId, safeUpdates);
  },

  verify: (id, verified = true) => {
    if (!id || typeof id !== 'string') return null;

    const cleanId = id.trim();
    const existing = dbService.findById('users', cleanId);
    if (!existing || existing.role !== 'Perusahaan') return null;

    return dbService.update('users', cleanId, { verified: Boolean(verified) });
  }
};

module.exports = companyModel;