const applicationModel = require('../models/applicationModel');
const jobModel = require('../models/jobModel');

let matchingService = null;
try {
  matchingService = require('./matchingService');
} catch (_) {
  matchingService = null;
}

const ALLOWED_APPLICATION_STATUSES = new Set([
  'Terkirim',
  'Ditinjau',
  'Wawancara',
  'Diterima',
  'Ditolak',
  'Ditarik'
]);

const NON_WITHDRAWABLE_STATUSES = new Set(['Diterima', 'Ditolak', 'Ditarik']);

const createHttpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const applicationService = {
  async applyJob(payload, applicantUser) {
    if (!payload || typeof payload !== 'object' || !payload.jobId || typeof payload.jobId !== 'string') {
      throw createHttpError('ID lowongan pekerjaan wajib disertakan.', 400);
    }

    const cleanJobId = payload.jobId.trim();
    const job = jobModel.findById(cleanJobId);
    if (!job) {
      throw createHttpError('Lowongan pekerjaan tidak ditemukan.', 404);
    }

    if (!job.isActive || job.statusVerifikasi !== 'Disetujui') {
      throw createHttpError('Lowongan pekerjaan ini sudah ditutup atau belum tersedia untuk dilamar.', 400);
    }

    if (job.deadline && !Number.isNaN(Date.parse(job.deadline)) && new Date(job.deadline) < new Date()) {
      throw createHttpError('Batas waktu pendaftaran untuk lowongan ini telah berakhir.', 400);
    }

    const applicantId = applicantUser?.id || payload.applicantId;
    if (!applicantId || typeof applicantId !== 'string') {
      throw createHttpError('Identitas pelamar tidak valid.', 400);
    }

    // Cek duplikasi lamaran (kecuali lamaran sebelumnya berstatus 'Ditarik')
    const existing = applicationModel.findOne(
      (a) => a.jobId === job.id && a.applicantId === applicantId && a.status !== 'Ditarik'
    );

    if (existing) {
      throw createHttpError('Anda sudah pernah mengajukan lamaran untuk lowongan ini.', 409);
    }

    // Hitung skor kecocokan secara tepercaya di sisi server jika matchingService tersedia
    let computedMatchScore = null;
    if (matchingService && typeof matchingService.calculateCandidateJobMatch === 'function') {
      try {
        const matchResult = await matchingService.calculateCandidateJobMatch(applicantId, job.id);
        if (matchResult && typeof matchResult.score === 'number') {
          computedMatchScore = matchResult.score;
        }
      } catch (_) {
        computedMatchScore = null;
      }
    }

    const fallbackScore = Number(payload.matchScore);
    const finalMatchScore =
      computedMatchScore !== null
        ? computedMatchScore
        : !Number.isNaN(fallbackScore)
          ? Math.min(100, Math.max(0, Math.round(fallbackScore)))
          : 0;

    const resumeUrl =
      (typeof payload.resumeUrl === 'string' && payload.resumeUrl.trim()) ||
      (typeof applicantUser?.cvUrl === 'string' && applicantUser.cvUrl.trim()) ||
      '';

    const newApp = applicationModel.create({
      jobId: job.id,
      jobTitle: job.title,
      companyId: job.companyId,
      companyName: job.companyName,
      applicantId,
      applicantName: applicantUser?.name || payload.applicantName || '',
      applicantEmail: applicantUser?.email || payload.applicantEmail || '',
      applicantPhone: applicantUser?.phone || payload.applicantPhone || '',
      matchScore: finalMatchScore,
      coverLetter: typeof payload.coverLetter === 'string' ? payload.coverLetter.trim() : '',
      resumeUrl
    });

    // Tambah jumlah pelamar pada lowongan
    jobModel.incrementApplicantCount(job.id);

    return newApp;
  },

  async getMyApplications(applicantId) {
    if (!applicantId || typeof applicantId !== 'string') {
      throw createHttpError('ID pelamar tidak valid.', 400);
    }
    return applicationModel.findAll({ applicantId: applicantId.trim() });
  },

  async getCompanyApplications(companyId, jobId = null) {
    if (!companyId || typeof companyId !== 'string') {
      throw createHttpError('ID perusahaan tidak valid.', 400);
    }
    return applicationModel.findAll({
      companyId: companyId.trim(),
      ...(jobId ? { jobId } : {})
    });
  },

  async getAllApplications(filters = {}) {
    return applicationModel.findAll(filters);
  },

  async updateStatus(applicationId, newStatus, note = '', interviewDate = null, actorUser = null) {
    if (!applicationId || typeof applicationId !== 'string') {
      throw createHttpError('ID lamaran tidak valid.', 400);
    }

    const cleanStatus = typeof newStatus === 'string' ? newStatus.trim() : '';
    if (!ALLOWED_APPLICATION_STATUSES.has(cleanStatus) || cleanStatus === 'Ditarik') {
      throw createHttpError(`Status lamaran "${cleanStatus}" tidak valid.`, 400);
    }

    const app = applicationModel.findById(applicationId.trim());
    if (!app) {
      throw createHttpError('Lamaran tidak ditemukan.', 404);
    }

    // Verifikasi kepemilikan lowongan apabila actorUser diteruskan dari controller
    if (actorUser && actorUser.role !== 'admin') {
      const job = jobModel.findById(app.jobId);
      const ownerCompanyId = app.companyId || job?.companyId;
      if (!ownerCompanyId || ownerCompanyId !== actorUser.id) {
        throw createHttpError('Anda tidak memiliki wewenang untuk mengubah status lamaran ini.', 403);
      }
    }

    if (interviewDate) {
      const parsedInterview = new Date(interviewDate);
      if (Number.isNaN(parsedInterview.getTime())) {
        throw createHttpError('Format jadwal wawancara tidak valid.', 400);
      }
    }

    try {
      const updated = applicationModel.updateStatus(
        applicationId.trim(),
        cleanStatus,
        note,
        interviewDate
      );
      if (!updated) {
        throw createHttpError('Lamaran tidak ditemukan.', 404);
      }
      return updated;
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 400;
      }
      throw err;
    }
  },

  async withdrawApplication(applicationId, applicantId) {
    if (!applicationId || typeof applicationId !== 'string') {
      throw createHttpError('ID lamaran tidak valid.', 400);
    }

    const app = applicationModel.findById(applicationId.trim());
    if (!app) {
      throw createHttpError('Lamaran tidak ditemukan.', 404);
    }

    if (app.applicantId !== applicantId) {
      throw createHttpError('Anda tidak memiliki wewenang untuk membatalkan lamaran ini.', 403);
    }

    if (NON_WITHDRAWABLE_STATUSES.has(app.status)) {
      throw createHttpError(`Lamaran dengan status "${app.status}" tidak dapat dibatalkan lagi.`, 400);
    }

    return applicationModel.updateStatus(
      applicationId.trim(),
      'Ditarik',
      'Lamaran ditarik/dibatalkan oleh pencari kerja.'
    );
  }
};

module.exports = applicationService;