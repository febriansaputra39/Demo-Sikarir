const { dbService } = require('../config/database');

const ALLOWED_VERIFY_STATUSES = new Set(['Disetujui', 'Ditolak', 'Menunggu']);

const jobModel = {
  findAll: (filters = {}) => {
    const safeFilters = filters && typeof filters === 'object' && !Array.isArray(filters) ? filters : {};
    let jobs = dbService.get('jobs');

    if (typeof safeFilters.search === 'string' && safeFilters.search.trim()) {
      const q = safeFilters.search.trim().toLowerCase();
      jobs = jobs.filter(
        (j) =>
          (typeof j.title === 'string' && j.title.toLowerCase().includes(q)) ||
          (typeof j.companyName === 'string' && j.companyName.toLowerCase().includes(q)) ||
          (typeof j.location === 'string' && j.location.toLowerCase().includes(q)) ||
          (Array.isArray(j.requiredSkills) &&
            j.requiredSkills.some((s) => typeof s === 'string' && s.toLowerCase().includes(q)))
      );
    }

    if (typeof safeFilters.category === 'string' && safeFilters.category.trim() && safeFilters.category !== 'Semua') {
      const targetCategory = safeFilters.category.trim();
      jobs = jobs.filter((j) => j.category === targetCategory);
    }

    if (typeof safeFilters.jobType === 'string' && safeFilters.jobType.trim() && safeFilters.jobType !== 'Semua') {
      const targetJobType = safeFilters.jobType.trim();
      jobs = jobs.filter((j) => j.jobType === targetJobType);
    }

    if (
      typeof safeFilters.statusVerifikasi === 'string' &&
      safeFilters.statusVerifikasi.trim() &&
      safeFilters.statusVerifikasi !== 'Semua'
    ) {
      const targetStatus = safeFilters.statusVerifikasi.trim();
      jobs = jobs.filter((j) => j.statusVerifikasi === targetStatus);
    }

    if (safeFilters.onlyActive) {
      jobs = jobs.filter((j) => Boolean(j.isActive) && j.statusVerifikasi === 'Disetujui');
    }

    if (typeof safeFilters.companyId === 'string' && safeFilters.companyId.trim()) {
      const targetCompanyId = safeFilters.companyId.trim();
      jobs = jobs.filter((j) => j.companyId === targetCompanyId);
    }

    return jobs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  findById: (id) => {
    if (!id || typeof id !== 'string') return null;
    return dbService.findById('jobs', id.trim());
  },

  create: (jobData) => {
    if (!jobData || typeof jobData !== 'object' || Array.isArray(jobData)) {
      throw new Error('Data lowongan tidak valid.');
    }

    const initialStatus = ALLOWED_VERIFY_STATUSES.has(jobData.statusVerifikasi)
      ? jobData.statusVerifikasi
      : 'Menunggu';

    return dbService.insert('jobs', {
      ...jobData,
      requiredSkills: Array.isArray(jobData.requiredSkills) ? jobData.requiredSkills : [],
      responsibilities: Array.isArray(jobData.responsibilities) ? jobData.responsibilities : [],
      requirements: Array.isArray(jobData.requirements) ? jobData.requirements : [],
      statusVerifikasi: initialStatus,
      isActive: jobData.isActive !== undefined ? Boolean(jobData.isActive) : true,
      applicantCount: Math.max(0, Number.parseInt(jobData.applicantCount, 10) || 0)
    });
  },

  update: (id, updates) => {
    if (!id || typeof id !== 'string' || !updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return null;
    }

    const {
      id: _ignoredId,
      companyId: _ignoredCompanyId,
      applicantCount: _ignoredApplicantCount,
      verifiedAt: _ignoredVerifiedAt,
      createdAt: _ignoredCreatedAt,
      ...safeUpdates
    } = updates;

    if (safeUpdates.isActive !== undefined) {
      safeUpdates.isActive = Boolean(safeUpdates.isActive);
    }

    return dbService.update('jobs', id.trim(), safeUpdates);
  },

  delete: (id) => {
    if (!id || typeof id !== 'string') return false;
    return dbService.delete('jobs', id.trim());
  },

  verify: (id, status, note = '') => {
    if (!id || typeof id !== 'string' || !ALLOWED_VERIFY_STATUSES.has(status)) {
      return null;
    }

    return dbService.update('jobs', id.trim(), {
      statusVerifikasi: status,
      verificationNote: typeof note === 'string' ? note.trim() : '',
      verifiedAt: new Date().toISOString()
    });
  },

  toggleActive: (id) => {
    if (!id || typeof id !== 'string') return null;
    const cleanId = id.trim();
    const job = dbService.findById('jobs', cleanId);
    if (!job) return null;
    return dbService.update('jobs', cleanId, { isActive: !job.isActive });
  },

  incrementApplicantCount: (id) => {
    if (!id || typeof id !== 'string') return null;
    const cleanId = id.trim();
    const job = dbService.findById('jobs', cleanId);
    if (!job) return null;
    const currentCount = Math.max(0, Number.parseInt(job.applicantCount, 10) || 0);
    return dbService.update('jobs', cleanId, { applicantCount: currentCount + 1 });
  }
};

module.exports = jobModel;