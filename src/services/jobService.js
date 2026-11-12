/**
 * Job Service
 * Handles job postings CRUD, multi-criteria filtering, admin verification, and bookmarks.
 */

import { api } from './api';

const BOOKMARKS_KEY = 'sikarir_bookmarks';

export const jobService = {
  /**
   * Get all jobs with optional filters
   * @param {object} filters
   */
  async getAllJobs(filters = {}) {
    await new Promise(resolve => setTimeout(resolve, 150));
    let jobs = api.getCollection('jobs');

    if (filters.search) {
      const q = filters.search.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        (j.requiredSkills && j.requiredSkills.some(s => s.toLowerCase().includes(q))) ||
        (j.location && j.location.toLowerCase().includes(q))
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

  /**
   * Get job by unique ID
   * @param {string} id
   */
  async getJobById(id) {
    const jobs = api.getCollection('jobs');
    const job = jobs.find(j => j.id === id);
    if (!job) throw new Error('Lowongan tidak ditemukan');
    return job;
  },

  /**
   * Create new job posting
   * @param {object} jobData
   */
  async createJob(jobData) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const newJob = api.addItem('jobs', {
      ...jobData,
      statusVerifikasi: 'Menunggu', // Must be verified by admin
      isActive: true,
      applicantCount: 0,
      createdAt: new Date().toISOString()
    });
    return newJob;
  },

  /**
   * Update existing job
   * @param {string} id
   * @param {object} updates
   */
  async updateJob(id, updates) {
    await new Promise(resolve => setTimeout(resolve, 150));
    return api.updateItem('jobs', id, updates);
  },

  /**
   * Delete job
   * @param {string} id
   */
  async deleteJob(id) {
    return api.deleteItem('jobs', id);
  },

  /**
   * Admin verification (Approve / Reject)
   * @param {string} id
   * @param {'Disetujui' | 'Ditolak'} status
   * @param {string} note
   */
  async verifyJob(id, status, note = '') {
    return api.updateItem('jobs', id, {
      statusVerifikasi: status,
      verificationNote: note,
      verifiedAt: new Date().toISOString()
    });
  },

  /**
   * Toggle job status (Active / Non-Active)
   * @param {string} id
   */
  async toggleJobActive(id) {
    const job = await this.getJobById(id);
    return api.updateItem('jobs', id, { isActive: !job.isActive });
  },

  /**
   * Bookmark or unbookmark a job
   * @param {string} jobId
   * @param {string} userId
   */
  toggleBookmark(jobId, userId) {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    const bookmarks = raw ? JSON.parse(raw) : [];
    const index = bookmarks.findIndex(b => b.jobId === jobId && b.userId === userId);

    if (index !== -1) {
      bookmarks.splice(index, 1);
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      return false; // unbookmarked
    } else {
      bookmarks.push({ jobId, userId, savedAt: new Date().toISOString() });
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      return true; // bookmarked
    }
  },

  /**
   * Check if job is bookmarked by user
   * @param {string} jobId
   * @param {string} userId
   */
  isBookmarked(jobId, userId) {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    const bookmarks = raw ? JSON.parse(raw) : [];
    return bookmarks.some(b => b.jobId === jobId && b.userId === userId);
  },

  /**
   * Get summary stats of jobs
   */
  async getJobStats() {
    const jobs = api.getCollection('jobs');
    return {
      total: jobs.length,
      active: jobs.filter(j => j.isActive && j.statusVerifikasi === 'Disetujui').length,
      pending: jobs.filter(j => j.statusVerifikasi === 'Menunggu').length,
      rejected: jobs.filter(j => j.statusVerifikasi === 'Ditolak').length
    };
  }
};

export default jobService;
