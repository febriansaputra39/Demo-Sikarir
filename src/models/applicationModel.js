const { dbService } = require('../config/database');

const TERMINAL_STATUSES = new Set(['Ditarik']);

const applicationModel = {
  findAll: (filters = {}) => {
    const safeFilters = filters && typeof filters === 'object' && !Array.isArray(filters) ? filters : {};
    let applications = dbService.get('applications');

    if (typeof safeFilters.applicantId === 'string' && safeFilters.applicantId.trim()) {
      const targetApplicant = safeFilters.applicantId.trim();
      applications = applications.filter((a) => a.applicantId === targetApplicant);
    }

    if (typeof safeFilters.companyId === 'string' && safeFilters.companyId.trim()) {
      const targetCompany = safeFilters.companyId.trim();
      const companyJobIds = new Set(
        dbService
          .get('jobs')
          .filter((j) => j.companyId === targetCompany)
          .map((j) => j.id)
      );

      applications = applications.filter(
        (a) => a.companyId === targetCompany || companyJobIds.has(a.jobId)
      );
    }

    if (typeof safeFilters.jobId === 'string' && safeFilters.jobId.trim() && safeFilters.jobId !== 'Semua') {
      const targetJob = safeFilters.jobId.trim();
      applications = applications.filter((a) => a.jobId === targetJob);
    }

    if (typeof safeFilters.status === 'string' && safeFilters.status.trim() && safeFilters.status !== 'Semua') {
      const targetStatus = safeFilters.status.trim();
      applications = applications.filter((a) => a.status === targetStatus);
    }

    return applications.sort(
      (a, b) => new Date(b.appliedAt || b.createdAt || 0) - new Date(a.appliedAt || a.createdAt || 0)
    );
  },

  findById: (id) => {
    if (!id || typeof id !== 'string') return null;
    return dbService.findById('applications', id.trim());
  },

  findOne: (predicate) => {
    if (typeof predicate !== 'function') return null;
    return dbService.find('applications', predicate);
  },

  create: (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Data lamaran tidak valid.');
    }

    const initialStatus = typeof data.status === 'string' && data.status.trim() ? data.status.trim() : 'Terkirim';
    const appliedAt = data.appliedAt || new Date().toISOString();

    const timeline = Array.isArray(data.timeline) && data.timeline.length > 0
      ? [...data.timeline]
      : [
        {
          status: initialStatus,
          timestamp: appliedAt,
          note: 'Lamaran berhasil dikirimkan ke tim rekrutmen.'
        }
      ];

    return dbService.insert('applications', {
      ...data,
      status: initialStatus,
      appliedAt,
      timeline
    });
  },

  updateStatus: (id, newStatus, note = '', interviewDate = null) => {
    if (!id || typeof id !== 'string' || !newStatus || typeof newStatus !== 'string') {
      return null;
    }

    const cleanId = id.trim();
    const cleanStatus = newStatus.trim();
    const app = dbService.findById('applications', cleanId);
    if (!app) return null;

    if (TERMINAL_STATUSES.has(app.status) && cleanStatus !== app.status) {
      throw new Error(`Status lamaran yang sudah "${app.status}" tidak dapat diubah lagi.`);
    }

    const cleanNote = typeof note === 'string' ? note.trim() : '';
    const timeline = Array.isArray(app.timeline) ? [...app.timeline] : [];

    timeline.push({
      status: cleanStatus,
      timestamp: new Date().toISOString(),
      note: cleanNote || `Status diperbarui menjadi ${cleanStatus}`
    });

    const updates = {
      status: cleanStatus,
      timeline,
      ...(interviewDate ? { interviewDate } : {})
    };

    return dbService.update('applications', cleanId, updates);
  },

  delete: (id) => {
    if (!id || typeof id !== 'string') return false;
    return dbService.delete('applications', id.trim());
  }
};

module.exports = applicationModel;