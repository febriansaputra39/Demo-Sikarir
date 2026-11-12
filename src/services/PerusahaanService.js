/**
 * Perusahaan (Company / Employer) Service
 * Manages company profile, verification, candidate recruitment pipeline, and company metrics.
 */

import { api } from './api';

export const PerusahaanService = {
  /**
   * Get all registered companies
   */
  async getAllCompanies() {
    await new Promise(resolve => setTimeout(resolve, 100));
    const users = api.getCollection('users');
    const companies = users.filter(u => u.role === 'Perusahaan');
    const jobs = api.getCollection('jobs');

    return companies.map(comp => {
      const activeJobs = jobs.filter(j => j.companyId === comp.id && j.isActive).length;
      return {
        ...comp,
        activeJobsCount: activeJobs
      };
    });
  },

  /**
   * Get company profile by ID
   * @param {string} companyId
   */
  async getCompanyProfile(companyId) {
    const users = api.getCollection('users');
    const company = users.find(u => u.id === companyId && u.role === 'Perusahaan');
    if (!company) throw new Error('Profil perusahaan tidak ditemukan.');
    return company;
  },

  /**
   * Update company profile information
   * @param {string} companyId
   * @param {object} updates
   */
  async updateCompanyProfile(companyId, updates) {
    return api.updateItem('users', companyId, updates);
  },

  /**
   * Toggle or update company verification status by Admin
   * @param {string} companyId
   * @param {boolean} verified
   */
  async verifyCompany(companyId, verified) {
    return api.updateItem('users', companyId, { verified });
  },

  /**
   * Get company recruitment dashboard statistics
   * @param {string} companyId
   */
  async getDashboardStats(companyId) {
    const jobs = api.getCollection('jobs').filter(j => j.companyId === companyId);
    const applications = api.getCollection('applications');

    const jobIds = jobs.map(j => j.id);
    const receivedApps = applications.filter(a => jobIds.includes(a.jobId) || a.companyId === companyId);

    const interviewCount = receivedApps.filter(a => a.status === 'Jadwal Wawancara').length;
    const acceptedCount = receivedApps.filter(a => a.status === 'Diterima').length;
    const pendingCount = receivedApps.filter(a => a.status === 'Terkirim' || a.status === 'Seleksi Berkas').length;

    return {
      activeJobs: jobs.filter(j => j.isActive).length,
      totalJobs: jobs.length,
      totalApplications: receivedApps.length,
      pendingReview: pendingCount,
      scheduledInterviews: interviewCount,
      acceptedCandidates: acceptedCount
    };
  }
};

export default PerusahaanService;
