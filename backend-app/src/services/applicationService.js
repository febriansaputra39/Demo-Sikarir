const applicationModel = require('../models/applicationModel');
const jobModel = require('../models/jobModel');

const applicationService = {
  async applyJob(payload, applicantUser) {
    const job = jobModel.findById(payload.jobId);
    if (!job) {
      throw new Error('Lowongan pekerjaan tidak ditemukan.');
    }

    const applicantId = applicantUser ? applicantUser.id : payload.applicantId;

    // Check duplicate
    const existing = applicationModel.findOne(
      a => a.jobId === payload.jobId && a.applicantId === applicantId
    );

    if (existing) {
      throw new Error('Anda sudah pernah mengajukan lamaran untuk lowongan ini.');
    }

    const newApp = applicationModel.create({
      jobId: job.id,
      jobTitle: job.title,
      companyId: job.companyId,
      companyName: job.companyName,
      applicantId: applicantId,
      applicantName: applicantUser ? applicantUser.name : payload.applicantName,
      applicantEmail: applicantUser ? applicantUser.email : payload.applicantEmail,
      applicantPhone: applicantUser ? (applicantUser.phone || payload.applicantPhone) : payload.applicantPhone,
      matchScore: payload.matchScore || 85,
      coverLetter: payload.coverLetter || '',
      resumeUrl: payload.resumeUrl || ''
    });

    // Increment applicant count on job
    jobModel.incrementApplicantCount(job.id);

    return newApp;
  },

  async getMyApplications(applicantId) {
    return applicationModel.findAll({ applicantId });
  },

  async getCompanyApplications(companyId, jobId = null) {
    return applicationModel.findAll({ companyId, jobId });
  },

  async getAllApplications(filters = {}) {
    return applicationModel.findAll(filters);
  },

  async updateStatus(applicationId, newStatus, note = '', interviewDate = null) {
    const updated = applicationModel.updateStatus(applicationId, newStatus, note, interviewDate);
    if (!updated) {
      throw new Error('Lamaran tidak ditemukan.');
    }
    return updated;
  },

  async withdrawApplication(applicationId, applicantId) {
    const app = applicationModel.findById(applicationId);
    if (!app) {
      throw new Error('Lamaran tidak ditemukan.');
    }

    if (app.applicantId !== applicantId) {
      throw new Error('Anda tidak memiliki wewenang untuk membatalkan lamaran ini.');
    }

    return applicationModel.updateStatus(applicationId, 'Ditolak', 'Lamaran dibatalkan oleh pencari kerja.');
  }
};

module.exports = applicationService;
