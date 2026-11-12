/**
 * Application Service
 * Tracks job applications, interview scheduling, ATS stage transitions, and activity logs.
 */

import { api } from './api';

export const applicationService = {
  /**
   * Submit job application
   * @param {object} payload
   */
  async applyJob(payload) {
    await new Promise(resolve => setTimeout(resolve, 250));

    const applications = api.getCollection('applications');
    const alreadyApplied = applications.some(
      a => a.jobId === payload.jobId && a.applicantId === payload.applicantId
    );

    if (alreadyApplied) {
      throw new Error('Anda sudah pernah mengajukan lamaran untuk lowongan ini.');
    }

    const newApp = api.addItem('applications', {
      jobId: payload.jobId,
      jobTitle: payload.jobTitle,
      companyId: payload.companyId,
      companyName: payload.companyName,
      applicantId: payload.applicantId,
      applicantName: payload.applicantName,
      applicantEmail: payload.applicantEmail,
      applicantPhone: payload.applicantPhone || '',
      matchScore: payload.matchScore || 85,
      coverLetter: payload.coverLetter || '',
      status: 'Terkirim', // 'Terkirim' | 'Seleksi Berkas' | 'Jadwal Wawancara' | 'Diterima' | 'Ditolak'
      appliedAt: new Date().toISOString(),
      timeline: [
        {
          status: 'Terkirim',
          timestamp: new Date().toISOString(),
          note: 'Lamaran berhasil dikirimkan ke tim rekrutmen.'
        }
      ]
    });

    // Increment applicant count on job
    const job = api.getCollection('jobs').find(j => j.id === payload.jobId);
    if (job) {
      api.updateItem('jobs', job.id, {
        applicantCount: (job.applicantCount || 0) + 1
      });
    }

    return newApp;
  },

  /**
   * Get applications submitted by job seeker
   * @param {string} applicantId
   */
  async getMyApplications(applicantId) {
    await new Promise(resolve => setTimeout(resolve, 150));
    const all = api.getCollection('applications');
    return all.filter(a => a.applicantId === applicantId);
  },

  /**
   * Get applications received by employer
   * @param {string} companyId (optional)
   * @param {string} jobId (optional)
   */
  async getCompanyApplications(companyId = null, jobId = null) {
    await new Promise(resolve => setTimeout(resolve, 150));
    let all = api.getCollection('applications');

    if (companyId) {
      // Find jobs belonging to this company
      const companyJobIds = api.getCollection('jobs')
        .filter(j => j.companyId === companyId)
        .map(j => j.id);

      all = all.filter(a => companyJobIds.includes(a.jobId) || a.companyId === companyId);
    }

    if (jobId && jobId !== 'Semua') {
      all = all.filter(a => a.jobId === jobId);
    }

    return all;
  },

  /**
   * Update application status with timeline note
   * @param {string} applicationId
   * @param {string} newStatus
   * @param {string} note
   * @param {string} interviewDate (optional)
   */
  async updateStatus(applicationId, newStatus, note = '', interviewDate = null) {
    await new Promise(resolve => setTimeout(resolve, 200));

    const app = api.getCollection('applications').find(a => a.id === applicationId);
    if (!app) throw new Error('Lamaran tidak ditemukan.');

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

    return api.updateItem('applications', applicationId, updates);
  },

  /**
   * Withdraw an application by applicant
   * @param {string} applicationId
   */
  async withdrawApplication(applicationId) {
    return this.updateStatus(applicationId, 'Ditolak', 'Lamaran dibatalkan oleh pencari kerja.');
  }
};

export default applicationService;
