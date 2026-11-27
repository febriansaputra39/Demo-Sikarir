const matchingService = require('../services/matchingService');
const aiService = require('../services/aiService');
const jobService = require('../services/jobService');
const responseHandler = require('../utils/responseHandler');

const stripSensitiveCandidateData = (item) => {
  if (!item || typeof item !== 'object') return item;
  const cleaned = { ...item };
  if (cleaned.password) delete cleaned.password;
  if (cleaned.resetToken) delete cleaned.resetToken;
  if (cleaned.resetTokenExpiry) delete cleaned.resetTokenExpiry;
  if (cleaned.candidate && typeof cleaned.candidate === 'object') {
    const { password, resetToken, resetTokenExpiry, ...safeCandidate } = cleaned.candidate;
    cleaned.candidate = safeCandidate;
  }
  return cleaned;
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

const matchingController = {
  async getRecommendationsForCandidate(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const candidateId =
        typeof req.params.candidateId === 'string' && req.params.candidateId.trim()
          ? req.params.candidateId.trim()
          : req.user.id;

      const isAllowed =
        req.user.role === 'admin' ||
        req.user.role === 'Perusahaan' ||
        req.user.id === candidateId;

      if (!isAllowed) {
        return responseHandler.forbidden(
          res,
          'Anda tidak memiliki izin untuk melihat rekomendasi lowongan kandidat ini.'
        );
      }

      const recommendations = await matchingService.getRecommendationsForCandidate(candidateId);
      return responseHandler.success(
        res,
        'Rekomendasi lowongan berbasis AI berhasil diambil.',
        recommendations
      );
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

  async getRecommendationsForJob(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'Perusahaan' && req.user.role !== 'admin') {
        return responseHandler.forbidden(
          res,
          'Akses ditolak. Hanya Perusahaan atau Admin yang dapat melihat rekomendasi kandidat.'
        );
      }

      const jobId = typeof req.params.jobId === 'string' ? req.params.jobId.trim() : '';
      if (!jobId) {
        return responseHandler.badRequest(res, 'ID lowongan (jobId) tidak valid.');
      }

      // Pastikan perusahaan hanya melihat rekomendasi kandidat untuk lowongan miliknya sendiri
      if (req.user.role === 'Perusahaan' && typeof jobService.getJobById === 'function') {
        const job = await jobService.getJobById(jobId);
        if (!job) {
          return responseHandler.notFound(res, 'Lowongan pekerjaan tidak ditemukan.');
        }
        if (job.companyId !== req.user.id) {
          return responseHandler.forbidden(
            res,
            'Anda tidak memiliki izin untuk melihat kandidat pada lowongan perusahaan lain.'
          );
        }
      }

      const recommendations = await matchingService.getRecommendationsForJob(jobId);
      const safeRecommendations = Array.isArray(recommendations)
        ? recommendations.map(stripSensitiveCandidateData)
        : recommendations;

      return responseHandler.success(
        res,
        'Rekomendasi kandidat pelamar berhasil diambil.',
        safeRecommendations
      );
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

  async calculateMatch(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      const { candidate, job, weights } = req.body || {};

      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
        return responseHandler.badRequest(res, 'Data kandidat (candidate) wajib berupa objek yang valid.');
      }

      if (!job || typeof job !== 'object' || Array.isArray(job)) {
        return responseHandler.badRequest(res, 'Data lowongan (job) wajib berupa objek yang valid.');
      }

      if (weights !== undefined) {
        if (!weights || typeof weights !== 'object' || Array.isArray(weights)) {
          return responseHandler.badRequest(res, 'Parameter bobot (weights) harus berupa objek.');
        }
        for (const [key, val] of Object.entries(weights)) {
          if (typeof val !== 'number' || Number.isNaN(val) || val < 0) {
            return responseHandler.badRequest(res, `Nilai bobot untuk "${key}" harus berupa angka positif.`);
          }
        }
      }

      const result = await matchingService.calculateMatch(candidate, job, weights);
      return responseHandler.success(res, 'Kalkulasi skor kecocokan berhasil.', result);
    } catch (err) {
      if (isOperationalError(err)) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  },

  async getAIFeedback(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'PencariKerja' && req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Fitur saran karir AI hanya tersedia untuk Pencari Kerja.');
      }

      const advice = await aiService.generateCareerAdvice(req.user.id);
      return responseHandler.success(res, 'Saran peningkatan karir AI berhasil disusun.', advice);
    } catch (err) {
      if (isOperationalError(err)) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  },

  async getInterviewPrep(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'PencariKerja' && req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Fitur persiapan wawancara AI hanya tersedia untuk Pencari Kerja.');
      }

      const jobId = typeof req.params.jobId === 'string' ? req.params.jobId.trim() : '';
      if (!jobId) {
        return responseHandler.badRequest(res, 'ID lowongan (jobId) wajib disertakan.');
      }

      const prep = await aiService.generateInterviewPrep(req.user.id, jobId);
      return responseHandler.success(res, 'Simulasi pertanyaan wawancara AI berhasil disiapkan.', prep);
    } catch (err) {
      if (err.statusCode === 404 || err.message?.includes('tidak ditemukan')) {
        return responseHandler.notFound(res, err.message);
      }
      if (isOperationalError(err)) {
        return responseHandler.badRequest(res, err.message);
      }
      next(err);
    }
  }
};

module.exports = matchingController;