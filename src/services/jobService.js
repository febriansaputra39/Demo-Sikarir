const jobModel = require('../models/jobModel');
const userModel = require('../models/userModel');

const ALLOWED_VERIFICATION_STATUSES = new Set(['Menunggu', 'Disetujui', 'Ditolak']);

const createHttpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const assertJobOwnership = (job, currentUser, actionLabel = 'mengelola') => {
  if (!currentUser) return;
  if (currentUser.role === 'admin') return;

  if (currentUser.role !== 'Perusahaan' || job.companyId !== currentUser.id) {
    throw createHttpError(`Anda tidak memiliki hak untuk ${actionLabel} lowongan ini.`, 403);
  }
};

const jobService = {
  async getAllJobs(filters = {}, currentUser = null) {
    const safeFilters = filters && typeof filters === 'object' ? { ...filters } : {};

    // Publik & PencariKerja hanya boleh melihat lowongan yang aktif & disetujui
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isOwnCompanyQuery =
      currentUser &&
      currentUser.role === 'Perusahaan' &&
      safeFilters.companyId &&
      safeFilters.companyId === currentUser.id;

    if (!isAdmin && !isOwnCompanyQuery) {
      safeFilters.statusVerifikasi = 'Disetujui';
      safeFilters.isActive = true;
    }

    return jobModel.findAll(safeFilters);
  },

  async getJobById(id, currentUser = null) {
    if (!id || typeof id !== 'string' || !id.trim()) {
      throw createHttpError('ID lowongan pekerjaan tidak valid.', 400);
    }

    const job = jobModel.findById(id.trim());
    if (!job) {
      throw createHttpError('Lowongan pekerjaan tidak ditemukan.', 404);
    }

    const isAdmin = currentUser && currentUser.role === 'admin';
    const isOwner = currentUser && currentUser.role === 'Perusahaan' && job.companyId === currentUser.id;

    if (!isAdmin && !isOwner && (!job.isActive || job.statusVerifikasi !== 'Disetujui')) {
      throw createHttpError('Lowongan pekerjaan tidak ditemukan atau belum tersedia.', 404);
    }

    return job;
  },

  async createJob(actorUser, jobData) {
    if (!jobData || typeof jobData !== 'object' || Array.isArray(jobData)) {
      throw createHttpError('Data lowongan pekerjaan tidak valid.', 400);
    }

    if (!actorUser || (actorUser.role !== 'Perusahaan' && actorUser.role !== 'admin')) {
      throw createHttpError('Hanya perusahaan terautentikasi atau admin yang dapat membuat lowongan.', 403);
    }

    let targetCompany = null;

    if (actorUser.role === 'Perusahaan') {
      targetCompany = userModel.findById(actorUser.id) || actorUser;
    } else if (actorUser.role === 'admin') {
      const targetCompanyId = typeof jobData.companyId === 'string' ? jobData.companyId.trim() : '';
      if (!targetCompanyId) {
        throw createHttpError('Admin wajib menyertakan companyId perusahaan yang valid.', 400);
      }
      targetCompany = userModel.findById(targetCompanyId);
      if (!targetCompany || targetCompany.role !== 'Perusahaan') {
        throw createHttpError('Perusahaan tujuan tidak ditemukan.', 404);
      }
    }

    const {
      id: _ignoredId,
      companyId: _ignoredCompanyId,
      companyName: _ignoredCompanyName,
      companyLogo: _ignoredCompanyLogo,
      statusVerifikasi: _ignoredStatus,
      verificationNote: _ignoredNote,
      verifiedAt: _ignoredVerifiedAt,
      isActive: _ignoredIsActive,
      applicantCount: _ignoredApplicantCount,
      createdAt: _ignoredCreatedAt,
      ...safeJobPayload
    } = jobData;

    try {
      const newJob = jobModel.create({
        ...safeJobPayload,
        companyId: targetCompany.id,
        companyName: targetCompany.name,
        companyLogo: targetCompany.avatar || '',
        statusVerifikasi: 'Menunggu',
        isActive: true,
        applicantCount: 0
      });

      return newJob;
    } catch (err) {
      if (!err.statusCode) err.statusCode = 400;
      throw err;
    }
  },

  async updateJob(id, updates, currentUser = null) {
    if (!id || typeof id !== 'string' || !id.trim()) {
      throw createHttpError('ID lowongan pekerjaan tidak valid.', 400);
    }
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw createHttpError('Data pembaruan lowongan tidak valid.', 400);
    }

    const cleanId = id.trim();
    const job = jobModel.findById(cleanId);
    if (!job) {
      throw createHttpError('Lowongan pekerjaan tidak ditemukan.', 404);
    }

    assertJobOwnership(job, currentUser, 'mengubah');

    const {
      id: _ignoredId,
      companyId: _ignoredCompanyId,
      companyName: _ignoredCompanyName,
      companyLogo: _ignoredCompanyLogo,
      applicantCount: _ignoredApplicantCount,
      statusVerifikasi: _ignoredStatus,
      verificationNote: _ignoredNote,
      verifiedAt: _ignoredVerifiedAt,
      createdAt: _ignoredCreatedAt,
      ...safeUpdates
    } = updates;

    try {
      const updated = jobModel.update(cleanId, safeUpdates);
      if (!updated) {
        throw createHttpError('Lowongan pekerjaan tidak ditemukan.', 404);
      }
      return updated;
    } catch (err) {
      if (!err.statusCode) err.statusCode = 400;
      throw err;
    }
  },

  async deleteJob(id, currentUser = null) {
    if (!id || typeof id !== 'string' || !id.trim()) {
      throw createHttpError('ID lowongan pekerjaan tidak valid.', 400);
    }

    const cleanId = id.trim();
    const job = jobModel.findById(cleanId);
    if (!job) {
      throw createHttpError('Lowongan tidak ditemukan.', 404);
    }

    assertJobOwnership(job, currentUser, 'menghapus');

    const deleted = jobModel.delete(cleanId);
    if (!deleted) {
      throw createHttpError('Lowongan tidak ditemukan.', 404);
    }
    return deleted;
  },

  async verifyJob(id, status, note = '') {
    if (!id || typeof id !== 'string' || !id.trim()) {
      throw createHttpError('ID lowongan pekerjaan tidak valid.', 400);
    }

    const cleanStatus = typeof status === 'string' ? status.trim() : '';
    if (!ALLOWED_VERIFICATION_STATUSES.has(cleanStatus)) {
      throw createHttpError(`Status verifikasi "${cleanStatus}" tidak valid.`, 400);
    }

    const cleanId = id.trim();
    const job = jobModel.findById(cleanId);
    if (!job) {
      throw createHttpError('Lowongan pekerjaan tidak ditemukan.', 404);
    }

    try {
      return jobModel.verify(cleanId, cleanStatus, typeof note === 'string' ? note.trim() : '');
    } catch (err) {
      if (!err.statusCode) err.statusCode = 400;
      throw err;
    }
  },

  async toggleJobActive(id, currentUser = null) {
    if (!id || typeof id !== 'string' || !id.trim()) {
      throw createHttpError('ID lowongan pekerjaan tidak valid.', 400);
    }

    const cleanId = id.trim();
    const job = jobModel.findById(cleanId);
    if (!job) {
      throw createHttpError('Lowongan pekerjaan tidak ditemukan.', 404);
    }

    assertJobOwnership(job, currentUser, 'mengubah status');

    if (!job.isActive && job.statusVerifikasi !== 'Disetujui') {
      throw createHttpError(
        `Lowongan dengan status verifikasi "${job.statusVerifikasi}" tidak dapat diaktifkan sebelum disetujui admin.`,
        400
      );
    }

    const updated = jobModel.toggleActive(cleanId);
    if (!updated) {
      throw createHttpError('Gagal mengubah status aktif lowongan.', 404);
    }
    return updated;
  },

  async getJobStats() {
    const jobs = jobModel.findAll();
    return {
      total: jobs.length,
      active: jobs.filter((j) => j.isActive && j.statusVerifikasi === 'Disetujui').length,
      pending: jobs.filter((j) => j.statusVerifikasi === 'Menunggu').length,
      rejected: jobs.filter((j) => j.statusVerifikasi === 'Ditolak').length
    };
  }
};

module.exports = jobService;