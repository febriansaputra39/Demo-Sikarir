const applicationService = require('../services/applicationService');
const responseHandler = require('../utils/responseHandler');

const ALLOWED_STATUSES = new Set([
  'Terkirim',
  'Seleksi Berkas',
  'Jadwal Wawancara',
  'Wawancara Selesai',
  'Diterima',
  'Ditolak'
]);

const sanitizeApplyPayload = (body = {}) => {
  const allowed = ['jobId', 'coverLetter', 'resumeUrl', 'portfolioUrl'];
  const clean = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      clean[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
    }
  }
  return clean;
};

const applicationController = {
  async applyJob(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'PencariKerja') {
        return responseHandler.forbidden(res, 'Hanya Pencari Kerja yang dapat mengajukan lamaran.');
      }

      const payload = sanitizeApplyPayload(req.body);
      if (!payload.jobId) {
        return responseHandler.badRequest(res, 'ID lowongan (jobId) wajib disertakan.');
      }

      const newApp = await applicationService.applyJob(payload, req.user);
      return responseHandler.created(res, 'Lamaran pekerjaan berhasil diajukan.', newApp);
    } catch (err) {
      if (err.statusCode === 404) {
        return responseHandler.notFound(res, err.message);
      }
      if (err.statusCode === 400 || err.name === 'ValidationError' || err.isOperational) {
        return responseHandler.badRequest(res, err.message);
      }
      // Tetap tangani pesan validasi bisnis dari service jika belum memakai custom error class
      if (typeof err.message === 'string' && !err.stack?.includes('TypeError') && !err.stack?.includes('ReferenceError')) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  },

  async getMyApplications(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const apps = await applicationService.getMyApplications(req.user.id);
      return responseHandler.success(res, 'Daftar lamaran saya berhasil diambil.', apps);
    } catch (err) {
      next(err);
    }
  },

  async getCompanyApplications(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'Perusahaan' && req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Akses ditolak. Hanya Perusahaan atau Admin yang diizinkan.');
      }

      const companyId =
        req.user.role === 'Perusahaan'
          ? req.user.id
          : typeof req.query.companyId === 'string'
            ? req.query.companyId.trim()
            : undefined;

      if (!companyId) {
        return responseHandler.badRequest(res, 'ID perusahaan diperlukan.');
      }

      const jobId = typeof req.query.jobId === 'string' ? req.query.jobId.trim() : undefined;
      const apps = await applicationService.getCompanyApplications(companyId, jobId);
      return responseHandler.success(res, 'Daftar lamaran masuk berhasil diambil.', apps);
    } catch (err) {
      next(err);
    }
  },

  async getAllApplications(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Hanya Admin yang dapat mengakses seluruh data lamaran.');
      }

      const filters = {
        jobId: typeof req.query.jobId === 'string' ? req.query.jobId.trim() : undefined,
        status: typeof req.query.status === 'string' ? req.query.status.trim() : undefined,
        companyId: typeof req.query.companyId === 'string' ? req.query.companyId.trim() : undefined,
        applicantId: typeof req.query.applicantId === 'string' ? req.query.applicantId.trim() : undefined
      };

      const apps = await applicationService.getAllApplications(filters);
      return responseHandler.success(res, 'Seluruh data lamaran berhasil diambil.', apps);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'Perusahaan' && req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Anda tidak memiliki izin untuk memperbarui status lamaran.');
      }

      const applicationId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!applicationId) {
        return responseHandler.badRequest(res, 'ID lamaran tidak valid.');
      }

      const status = typeof req.body.status === 'string' ? req.body.status.trim() : '';
      const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
      const interviewDate = req.body.interviewDate || null;

      if (!status || !ALLOWED_STATUSES.has(status)) {
        return responseHandler.badRequest(
          res,
          `Status lamaran tidak valid. Pilihan yang diizinkan: ${Array.from(ALLOWED_STATUSES).join(', ')}.`
        );
      }

      if (interviewDate && Number.isNaN(Date.parse(interviewDate))) {
        return responseHandler.badRequest(res, 'Format tanggal wawancara tidak valid.');
      }

      // Verifikasi kepemilikan jika yang mengakses adalah Perusahaan
      if (req.user.role === 'Perusahaan') {
        const companyApps = await applicationService.getCompanyApplications(req.user.id);
        const ownsApplication = Array.isArray(companyApps) && companyApps.some((app) => app.id === applicationId);
        if (!ownsApplication) {
          return responseHandler.forbidden(res, 'Lamaran tidak ditemukan atau bukan milik perusahaan Anda.');
        }
      }

      const updated = await applicationService.updateStatus(applicationId, status, note, interviewDate);
      if (!updated) {
        return responseHandler.notFound(res, 'Data lamaran tidak ditemukan.');
      }

      return responseHandler.success(res, `Status lamaran berhasil diperbarui menjadi ${status}.`, updated);
    } catch (err) {
      next(err);
    }
  },

  async withdrawApplication(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'PencariKerja') {
        return responseHandler.forbidden(res, 'Hanya Pencari Kerja yang dapat menarik lamaran.');
      }

      const applicationId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      if (!applicationId) {
        return responseHandler.badRequest(res, 'ID lamaran tidak valid.');
      }

      const updated = await applicationService.withdrawApplication(applicationId, req.user.id);
      return responseHandler.success(res, 'Lamaran berhasil ditarik.', updated);
    } catch (err) {
      if (typeof err.message === 'string' && !err.stack?.includes('TypeError') && !err.stack?.includes('ReferenceError')) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  }
};

module.exports = applicationController;