const matchingService = require('./matchingService');
const jobseekerModel = require('../models/jobseekerModel');
const jobModel = require('../models/jobModel');

const createHttpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const aiService = {
  /**
   * Menghasilkan rekomendasi pengembangan karir dan analisis kesehatan CV berbasis profil & pencocokan lowongan.
   * @param {string} userId
   */
  async generateCareerAdvice(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw createHttpError('ID pengguna wajib disertakan.', 400);
    }

    const profile = jobseekerModel.getFullProfile(userId.trim());
    if (!profile) {
      throw createHttpError('Data profil pencari kerja tidak ditemukan.', 404);
    }

    const skills = Array.isArray(profile.skills) ? profile.skills : [];
    const experiences = Array.isArray(profile.experiences) ? profile.experiences : [];
    const educations = Array.isArray(profile.educations) ? profile.educations : [];
    const activities = Array.isArray(profile.activities) ? profile.activities : [];

    const skillsCount = skills.length;
    const expCount = experiences.length;
    const eduCount = educations.length;
    const verifiedSkillsCount = skills.filter((s) => Boolean(s.verified)).length;

    const suggestions = [];

    if (skillsCount < 5) {
      suggestions.push(
        `Tambahkan minimal ${5 - skillsCount} keahlian teknis spesifik lagi (saat ini ${skillsCount}/5) untuk mendongkrak skor algoritma pencocokan.`
      );
    } else if (verifiedSkillsCount < Math.ceil(skillsCount / 2)) {
      suggestions.push(
        'Katalog keterampilan Anda sudah solid. Lengkapi sertifikat atau portofolio pendukung agar keahlian utama Anda terverifikasi.'
      );
    } else {
      suggestions.push(
        'Katalog keterampilan Anda sudah sangat kuat dan terverifikasi. Pertahankan relevansinya dengan tren industri terbaru.'
      );
    }

    if (eduCount === 0) {
      suggestions.push('Tambahkan riwayat pendidikan formal terakhir Anda untuk melengkapi kelayakan administratif lowongan.');
    }

    if (expCount === 0) {
      suggestions.push(
        'Lengkapi portofolio proyek mandiri, kerja praktik/magang, atau pengalaman organisasi pada bagian riwayat pengalaman.'
      );
    }

    if (activities.length === 0) {
      suggestions.push(
        'Cantumkan pelatihan, sertifikasi, atau seminar yang pernah diikuti untuk memperkuat nilai tambah di mata rekruter.'
      );
    }

    if (typeof profile.bio !== 'string' || profile.bio.trim().length < 50) {
      suggestions.push(
        'Perkaya ringkasan profesional (bio) minimal 50 karakter dengan menonjolkan keahlian inti dan pencapaian yang terukur.'
      );
    }

    if (!profile.cvUrl) {
      suggestions.push('Unggah berkas CV terbaru dalam format PDF agar siap melamar lowongan secara instan.');
    }

    // Evaluasi kesiapan pasar menggunakan matchingService terhadap lowongan aktif
    let marketAlignment = null;
    if (typeof matchingService?.recommendJobsForCandidate === 'function') {
      try {
        const topMatches = await matchingService.recommendJobsForCandidate(profile.id, 3);
        if (Array.isArray(topMatches) && topMatches.length > 0) {
          const avgScore = Math.round(
            topMatches.reduce((acc, item) => acc + (Number(item.matchScore ?? item.score) || 0), 0) / topMatches.length
          );
          marketAlignment = {
            averageTopMatchScore: avgScore,
            topRecommendedJobs: topMatches.map((m) => ({
              jobId: m.job?.id || m.jobId,
              title: m.job?.title || m.title,
              companyName: m.job?.companyName || m.companyName,
              score: Number(m.matchScore ?? m.score) || 0
            }))
          };

          if (avgScore < 60) {
            suggestions.push(
              `Rata-rata kecocokan Anda dengan lowongan aktif saat ini adalah ${avgScore}%. Sesuaikan kata kunci keahlian dengan kebutuhan lowongan target.`
            );
          }
        }
      } catch (_) {
        // Abaikan kegagalan opsional evaluasi pasar agar saran utama tetap dikembalikan
      }
    }

    const rawScore =
      (Math.min(skillsCount, 5) * 6) +
      (Math.min(expCount, 2) * 15) +
      (Math.min(eduCount, 1) * 15) +
      (Math.min(activities.length, 2) * 5) +
      (typeof profile.bio === 'string' && profile.bio.trim().length >= 50 ? 10 : 0) +
      (profile.cvUrl ? 5 : 0);

    return {
      cvHealthScore: Math.min(100, Math.max(0, rawScore)),
      statusKarir: profile.statusKarir || 'Mencari Kerja',
      profileSummary: {
        skillsCount,
        verifiedSkillsCount,
        experiencesCount: expCount,
        educationsCount: eduCount,
        activitiesCount: activities.length,
        hasCv: Boolean(profile.cvUrl)
      },
      marketAlignment,
      suggestions,
      analyzedAt: new Date().toISOString()
    };
  },

  /**
   * Menghasilkan panduan dan daftar pertanyaan persiapan wawancara yang disesuaikan dengan profil kandidat & lowongan target.
   * @param {string} candidateId
   * @param {string} jobId
   */
  async generateInterviewPrep(candidateId, jobId) {
    if (!candidateId || typeof candidateId !== 'string' || !candidateId.trim()) {
      throw createHttpError('ID kandidat wajib disertakan.', 400);
    }
    if (!jobId || typeof jobId !== 'string' || !jobId.trim()) {
      throw createHttpError('ID lowongan pekerjaan wajib disertakan.', 400);
    }

    const candidate = jobseekerModel.getFullProfile(candidateId.trim());
    if (!candidate) {
      throw createHttpError('Data profil kandidat tidak ditemukan.', 404);
    }

    const job = jobModel.findById(jobId.trim());
    if (!job) {
      throw createHttpError('Lowongan pekerjaan tidak ditemukan.', 404);
    }

    const requiredSkills = Array.isArray(job.requiredSkills)
      ? job.requiredSkills.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim())
      : [];

    const candidateSkillNames = new Set(
      (Array.isArray(candidate.skills) ? candidate.skills : [])
        .map((s) => (typeof s.name === 'string' ? s.name.trim().toLowerCase() : ''))
        .filter(Boolean)
    );

    const matchedSkills = requiredSkills.filter((s) => candidateSkillNames.has(s.toLowerCase()));
    const missingSkills = requiredSkills.filter((s) => !candidateSkillNames.has(s.toLowerCase()));

    const latestExperience = Array.isArray(candidate.experiences) && candidate.experiences.length > 0
      ? candidate.experiences[0]
      : null;

    const jobTitle = job.title || 'posisi yang dilamar';
    const companyName = job.companyName || 'perusahaan ini';
    const workplaceLabel = typeof job.workplaceType === 'string' && job.workplaceType.trim()
      ? job.workplaceType.trim()
      : 'kolaboratif';

    const questions = [];

    if (latestExperience && latestExperience.position) {
      questions.push(
        `Pengalaman Anda sebagai ${latestExperience.position}${latestExperience.company ? ` di ${latestExperience.company}` : ''} cukup menarik—bagaimana hal tersebut mempersiapkan Anda untuk peran ${jobTitle}?`
      );
    } else {
      questions.push(
        `Bagaimana latar belakang pendidikan, proyek, atau pengalaman Anda mendukung tanggung jawab utama sebagai ${jobTitle}?`
      );
    }

    if (matchedSkills.length > 0) {
      questions.push(
        `Anda memiliki keahlian pada ${matchedSkills.slice(0, 3).join(', ')}. Ceritakan studi kasus nyata saat Anda menerapkannya untuk menyelesaikan masalah teknis atau operasional.`
      );
    } else if (requiredSkills.length > 0) {
      questions.push(
        `Posisi ini membutuhkan penguasaan ${requiredSkills.slice(0, 3).join(', ')}. Ceritakan pengalaman Anda mempelajari atau mengadaptasi kompetensi serupa dalam proyek sebelumnya.`
      );
    } else {
      questions.push(
        `Kompetensi utama apa yang paling Anda kuasai dan bagaimana Anda memastikan kualitas hasil kerja Anda pada posisi ${jobTitle}?`
      );
    }

    if (missingSkills.length > 0) {
      questions.push(
        `Untuk kebutuhan ${missingSkills.slice(0, 2).join(' dan ')} yang belum tercantum di profil Anda, bagaimana strategi Anda beradaptasi dengan cepat pada minggu-minggu awal bekerja?`
      );
    }

    questions.push(
      `Apa motivasi Anda ingin bergabung bersama ${companyName} dan bagaimana Anda menyesuaikan ritme kerja dalam lingkungan ${workplaceLabel}?`
    );

    questions.push(
      'Jelaskan pendekatan Anda dalam menyusun prioritas ketika menghadapi tenggat waktu ketat atau perubahan kebutuhan mendadak.'
    );

    const tips = [
      'Gunakan metode STAR (Situation, Task, Action, Result) saat menjelaskan studi kasus pengalaman.',
      'Sampaikan hasil dan dampak kuantitatif (angka/persentase/efisiensi) daripada sekadar daftar tugas harian.',
      `Pelajari profil, layanan utama, dan kebutuhan industri ${companyName} sebelum sesi wawancara dimulai.`
    ];

    if (missingSkills.length > 0) {
      tips.push(
        `Siapkan contoh pembelajaran mandiri terkait ${missingSkills.slice(0, 3).join(', ')} untuk menunjukkan kemauan belajar yang cepat.`
      );
    }

    return {
      jobId: job.id,
      jobTitle,
      companyName,
      matchedSkills,
      skillGaps: missingSkills,
      questions,
      tips,
      generatedAt: new Date().toISOString()
    };
  }
};

module.exports = aiService;