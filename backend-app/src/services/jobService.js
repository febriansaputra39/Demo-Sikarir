const jobModel = require('../models/jobModel');
const userModel = require('../models/userModel');

const jobService = {
  async getAllJobs(filters = {}) {
    return jobModel.findAll(filters);
  },

  async getJobById(id) {
    const job = jobModel.findById(id);
    if (!job) throw new Error('Lowongan pekerjaan tidak ditemukan.');
    return job;
  },

  async createJob(companyUser, jobData) {
    // If company user is provided, attach company info
    const companyInfo = companyUser ? {
      companyId: companyUser.id,
      companyName: companyUser.name,
      companyLogo: companyUser.avatar || ''
    } : {};

    const newJob = jobModel.create({
      ...companyInfo,
      ...jobData,
      statusVerifikasi: 'Menunggu',
      isActive: true,
      applicantCount: 0
    });

    return newJob;
  },

  async updateJob(id, updates, currentUser = null) {
    const job = jobModel.findById(id);
    if (!job) throw new Error('Lowongan pekerjaan tidak ditemukan.');

    if (currentUser && currentUser.role !== 'admin' && job.companyId !== currentUser.id) {
      throw new Error('Anda tidak memiliki hak untuk mengubah lowongan ini.');
    }

    return jobModel.update(id, updates);
  },

  async deleteJob(id, currentUser = null) {
    const job = jobModel.findById(id);
    if (!job) throw new Error('Lowongan tidak ditemukan.');

    if (currentUser && currentUser.role !== 'admin' && job.companyId !== currentUser.id) {
      throw new Error('Anda tidak memiliki hak untuk menghapus lowongan ini.');
    }

    return jobModel.delete(id);
  },

  async verifyJob(id, status, note = '') {
    const job = jobModel.findById(id);
    if (!job) throw new Error('Lowongan pekerjaan tidak ditemukan.');

    return jobModel.verify(id, status, note);
  },

  async toggleJobActive(id, currentUser = null) {
    const job = jobModel.findById(id);
    if (!job) throw new Error('Lowongan pekerjaan tidak ditemukan.');

    if (currentUser && currentUser.role !== 'admin' && job.companyId !== currentUser.id) {
      throw new Error('Anda tidak memiliki hak untuk mengubah status lowongan ini.');
    }

    return jobModel.toggleActive(id);
  },

  async getJobStats() {
    const jobs = jobModel.findAll();
    return {
      total: jobs.length,
      active: jobs.filter(j => j.isActive && j.statusVerifikasi === 'Disetujui').length,
      pending: jobs.filter(j => j.statusVerifikasi === 'Menunggu').length,
      rejected: jobs.filter(j => j.statusVerifikasi === 'Ditolak').length
    };
  }
};

module.exports = jobService;
