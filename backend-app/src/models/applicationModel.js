const { dbService } = require('../config/database');

const applicationModel = {
  findAll: (filters = {}) => {
    let applications = dbService.get('applications');

    if (filters.applicantId) {
      applications = applications.filter(a => a.applicantId === filters.applicantId);
    }

    if (filters.companyId) {
      // Find jobs belonging to this company
      const companyJobIds = dbService.get('jobs')
        .filter(j => j.companyId === filters.companyId)
        .map(j => j.id);

      applications = applications.filter(a =>
        a.companyId === filters.companyId || companyJobIds.includes(a.jobId)
      );
    }

    if (filters.jobId && filters.jobId !== 'Semua') {
      applications = applications.filter(a => a.jobId === filters.jobId);
    }

    if (filters.status && filters.status !== 'Semua') {
      applications = applications.filter(a => a.status === filters.status);
    }

    return applications;
  },

  findById: (id) => {
    return dbService.findById('applications', id);
  },

  findOne: (predicate) => {
    return dbService.find('applications', predicate);
  },

  create: (data) => {
    const timeline = data.timeline || [
      {
        status: data.status || 'Terkirim',
        timestamp: new Date().toISOString(),
        note: 'Lamaran berhasil dikirimkan ke tim rekrutmen.'
      }
    ];

    return dbService.insert('applications', {
      ...data,
      status: data.status || 'Terkirim',
      appliedAt: data.appliedAt || new Date().toISOString(),
      timeline
    });
  },

  updateStatus: (id, newStatus, note = '', interviewDate = null) => {
    const app = dbService.findById('applications', id);
    if (!app) return null;

    const timeline = app.timeline || [];
    timeline.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note || `Status diperbarui menjadi ${newStatus}`
    });

    const updates = {
      status: newStatus,
      timeline,
      ...(interviewDate ? { interviewDate } : {})
    };

    return dbService.update('applications', id, updates);
  },

  delete: (id) => {
    return dbService.delete('applications', id);
  }
};

module.exports = applicationModel;
