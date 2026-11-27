const jobService = require('../services/jobService');
const responseHandler = require('../utils/responseHandler');

const ALLOWED_VERIFY_STATUSES = new Set(['Disetujui', 'Ditolak', 'Menunggu']);

const ALLOWED_JOB_FIELDS = [
  'title',
  'category',
  'jobType',
  'workplaceType',
  'location',
  'salaryMin',
  'salaryMax',
  'experienceLevel',
  'educationLevel',
  'requiredSkills',
  'description',
  'responsibilities',
  'requirements',
  'deadline',
  'isActive'
];

const sanitizeJobPayload = (body = {}) => {
  const clean = {};
  for (const field of ALLOWED_JOB_FIELDS) {
    if (body[field] !== undefined) {
      clean[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    }
  }

  if (clean.salaryMin !== undefined) {
    clean.salaryMin = Number(clean.salaryMin);
  }
  if (clean.salaryMax !== undefined) {
    clean.salaryMax = Number(clean.salaryMax);
  }
  if (clean.isActive !== undefined) {
    clean.isActive = Boolean(clean.isActive);
  }

  return clean;
};

const validateJobData = (payload, isCreate = false) => {
  if (isCreate && (!payload.title || !payload.category || !payload.description)) {
    return 'Judul lowongan, kategori, dan deskripsi wajib diisi.';
  }

  if (payload.salaryMin !== undefined && (Number.isNaN(payload.salaryMin) || payload.salaryMin < 0)) {
    return 'Gaji minimum tidak valid.';
  }

  if (payload.salaryMax !== undefined && (Number.isNaN(payload.salaryMax) || payload.salaryMax < 0)) {
    return 'Gaji maksimum tidak valid.';
  }

  if (
    payload.salaryMin !== undefined &&
    payload.salaryMax !== undefined &&
    payload.salaryMin > payload.salaryMax
  ) {
    return 'Gaji minimum tidak boleh lebih besar dari gaji maksimum.';
  }

  if (payload.deadline && Number.isNaN(Date.parse(payload.deadline))) {
    return 'Format tanggal batas lamaran (deadline) tidak valid.';
  }

  if (payload.requiredSkills !== undefined && !Array.isArray(payload.requiredSkills)) {
    return 'requiredSkills harus berupa array.';
  }

  return null;
};

const isOperationalError = (err) => {
  return (
    err &&
    typeof err.message === 'string' &&
    !err.stack?.includes('TypeError') &&
    !err.stack?.includes('ReferenceError') &&
    !err.stack?.includes('SyntaxError')
  );
};

const jobController = {
  async getAllJobs(req, res, next) {
    try {
      const requestedCompanyId =
        typeof req.query.companyId === 'string' ? req.query.companyId.trim() : undefined;

      const isAdmin = req.user?.role === 'admin';
      const isOwnCompany =
        req.user?.role === 'Perusahaan' && requestedCompanyId && req.user.id === requestedCompanyId;

      const filters = {
        search: typeof req.query.search === 'string' ? req.query.search.trim() : undefined,
        category: typeof req.query.category === 'string' ? req.query.category.trim() : undefined,
        jobType: typeof req.query.jobType === 'string' ? req.query.jobType.trim() : undefined,
        companyId: requestedCompanyId,
        // Publik & pencari kerja hanya boleh melihat lowongan yang sudah disetujui & aktif
        statusVerifikasi:
          isAdmin || isOwnCompany
            ? typeof req.query.statusVerifikasi === 'string'
              ? req.query.statusVerifikasi.trim()
              : undefined
            : 'Disetujui',
        onlyActive: isAdmin || isOwnCompany ? req.query.onlyActive === 'true' : true
      };

      const jobs = await jobService.getAllJobs(filters);
      return responseHandler.success(res, 'Daftar lowongan pekerjaan berhasil diambil.', jobs);
    } catch (err) {
      next(err);
    }
  },

  async getJobById(req, res, next) {
    try {
      const jobId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!jobId) {
        return responseHandler.badRequest(res, 'ID lowongan tidak valid.');
      }

      const job = await jobService.getJobById(jobId);
      if (!job) {
        return responseHandler.notFound(res, 'Lowongan pekerjaan tidak ditemukan.');
      }

      const isAdmin = req.user?.role === 'admin';
      const isOwner = req.user?.role === 'Perusahaan' && req.user.id === job.companyId;

      if (!isAdmin && !isOwner && (job.statusVerifikasi !== 'Disetujui' || !job.isActive)) {
        return responseHandler.notFound(res, 'Lowongan pekerjaan tidak tersedia atau belum diverifikasi.');
      }

      return responseHandler.success(res, 'Detail lowongan pekerjaan berhasil diambil.', job);
    } catch (err) {
      if (isOperationalError(err)) {
        return responseHandler.notFound(res, err.message);
      }
      next(err);
    }
  },

  async createJob(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'Perusahaan' && req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Hanya Perusahaan atau Admin yang dapat membuat lowongan.');
      }

      const payload = sanitizeJobPayload(req.body);
      const validationError = validateJobData(payload, true);
      if (validationError) {
        return responseHandler.badRequest(res, validationError);
      }

      const newJob = await jobService.createJob(req.user, payload);
      return responseHandler.created(
        res,
        'Lowongan pekerjaan berhasil dibuat dan menunggu verifikasi admin.',
        newJob
      );
    } catch (err) {
      if (isOperationalError(err)) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  },

  async updateJob(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'Perusahaan' && req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk mengubah lowongan.');
      }

      const jobId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!jobId) {
        return responseHandler.badRequest(res, 'ID lowongan tidak valid.');
      }

      const payload = sanitizeJobPayload(req.body);
      if (Object.keys(payload).length === 0) {
        return responseHandler.badRequest(res, 'Tidak ada data valid yang dikirim untuk diperbarui.');
      }

      const validationError = validateJobData(payload, false);
      if (validationError) {
        return responseHandler.badRequest(res, validationError);
      }

      const updated = await jobService.updateJob(jobId, payload, req.user);
      return responseHandler.success(res, 'Lowongan pekerjaan berhasil diperbarui.', updated);
    } catch (err) {
      if (err.statusCode === 403 || err.message?.includes('izin')) {
        return responseHandler.forbidden(res, err.message);
      }
      if (err.statusCode === 404 || err.message?.includes('tidak ditemukan')) {
        return responseHandler.notFound(res, err.message);
      }
      if (isOperationalError(err)) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  },

  async deleteJob(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'Perusahaan' && req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk menghapus lowongan.');
      }

      const jobId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!jobId) {
        return responseHandler.badRequest(res, 'ID lowongan tidak valid.');
      }

      await jobService.deleteJob(jobId, req.user);
      return responseHandler.success(res, 'Lowongan pekerjaan berhasil dihapus.');
    } catch (err) {
      if (err.statusCode === 403 || err.message?.includes('izin')) {
        return responseHandler.forbidden(res, err.message);
      }
      if (err.statusCode === 404 || err.message?.includes('tidak ditemukan')) {
        return responseHandler.notFound(res, err.message);
      }
      if (isOperationalError(err)) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  },

  async verifyJob(req, res, next) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Hanya Admin yang dapat memverifikasi lowongan.');
      }

      const jobId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!jobId) {
        return responseHandler.badRequest(res, 'ID lowongan tidak valid.');
      }

      const status = typeof req.body.status === 'string' ? req.body.status.trim() : '';
      const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';

      if (!status || !ALLOWED_VERIFY_STATUSES.has(status)) {
        return responseHandler.badRequest(
          res,
          `Status verifikasi tidak valid. Pilihan yang diizinkan: ${Array.from(ALLOWED_VERIFY_STATUSES).join(', ')}.`
        );
      }

      const updated = await jobService.verifyJob(jobId, status, note);
      return responseHandler.success(res, `Lowongan berhasil ${status.toLowerCase()}.`, updated);
    } catch (err) {
      if (err.statusCode === 404 || err.message?.includes('tidak ditemukan')) {
        return responseHandler.notFound(res, err.message);
      }
      if (isOperationalError(err)) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  },

  async toggleActive(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'Perusahaan' && req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk mengubah status tayang lowongan.');
      }

      const jobId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!jobId) {
        return responseHandler.badRequest(res, 'ID lowongan tidak valid.');
      }

      const updated = await jobService.toggleJobActive(jobId, req.user);
      return responseHandler.success(
        res,
        `Status tayang lowongan berhasil diubah: ${updated.isActive ? 'Aktif' : 'Non-Aktif'}.`,
        updated
      );
    } catch (err) {
      if (err.statusCode === 403 || err.message?.includes('izin')) {
        return responseHandler.forbidden(res, err.message);
      }
      if (err.statusCode === 404 || err.message?.includes('tidak ditemukan')) {
        return responseHandler.notFound(res, err.message);
      }
      if (isOperationalError(err)) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  },

  async getJobStats(req, res, next) {
    try {
      const stats = await jobService.getJobStats();
      return responseHandler.success(res, 'Statistik lowongan berhasil diambil.', stats);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = jobController;