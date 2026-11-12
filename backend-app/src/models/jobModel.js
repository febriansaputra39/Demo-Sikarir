const { dbService } = require('../config/database');

const jobModel = {
  findAll: (filters = {}) => {
    let jobs = dbService.get('jobs');

    if (filters.search) {
      const q = filters.search.toLowerCase();
      jobs = jobs.filter(j =>
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.companyName && j.companyName.toLowerCase().includes(q)) ||
        (j.location && j.location.toLowerCase().includes(q)) ||
        (j.requiredSkills && j.requiredSkills.some(s => s.toLowerCase().includes(q)))
      );
    }

    if (filters.category && filters.category !== 'Semua') {
      jobs = jobs.filter(j => j.category === filters.category);
    }

    if (filters.jobType && filters.jobType !== 'Semua') {
      jobs = jobs.filter(j => j.jobType === filters.jobType);
    }

    if (filters.statusVerifikasi && filters.statusVerifikasi !== 'Semua') {
      jobs = jobs.filter(j => j.statusVerifikasi === filters.statusVerifikasi);
    }

    if (filters.onlyActive) {
      jobs = jobs.filter(j => j.isActive && j.statusVerifikasi === 'Disetujui');
    }

    if (filters.companyId) {
      jobs = jobs.filter(j => j.companyId === filters.companyId);
    }

    return jobs;
  },

  findById: (id) => {
    return dbService.findById('jobs', id);
  },

  create: (jobData) => {
    return dbService.insert('jobs', {
      ...jobData,
      statusVerifikasi: jobData.statusVerifikasi || 'Menunggu',
      isActive: jobData.isActive !== undefined ? jobData.isActive : true,
      applicantCount: jobData.applicantCount || 0
    });
  },

  update: (id, updates) => {
    return dbService.update('jobs', id, updates);
  },

  delete: (id) => {
    return dbService.delete('jobs', id);
  },

  verify: (id, status, note = '') => {
    return dbService.update('jobs', id, {
      statusVerifikasi: status,
      verificationNote: note,
      verifiedAt: new Date().toISOString()
    });
  },

  toggleActive: (id) => {
    const job = dbService.findById('jobs', id);
    if (!job) return null;
    return dbService.update('jobs', id, { isActive: !job.isActive });
  },

  incrementApplicantCount: (id) => {
    const job = dbService.findById('jobs', id);
    if (!job) return null;
    return dbService.update('jobs', id, { applicantCount: (job.applicantCount || 0) + 1 });
  }
};

module.exports = jobModel;
