const matchingService = require('./matchingService');
const jobseekerModel = require('../models/jobseekerModel');
const jobModel = require('../models/jobModel');

const aiService = {
  /**
   * Generates AI-assisted career advisory and CV feedback
   * @param {string} userId
   */
  async generateCareerAdvice(userId) {
    const profile = jobseekerModel.getFullProfile(userId);
    if (!profile) throw new Error('Data profil pencari kerja tidak ditemukan.');

    const skillsCount = profile.skills?.length || 0;
    const expCount = profile.experiences?.length || 0;
    const eduCount = profile.educations?.length || 0;

    const suggestions = [];

    if (skillsCount < 5) {
      suggestions.push('Tambahkan minimal 5 keahlian teknis spesifik untuk mendongkrak skor algoritma pencocokan hingga +30%.');
    } else {
      suggestions.push('Katalog keterampilan Anda sudah cukup solid. Pertimbangkan sertifikasi resmi untuk memvalidasi kompetensi utama.');
    }

    if (expCount === 0) {
      suggestions.push('Lengkapi portofolio proyek mandiri, magang, atau organisasi pada riwayat pengalaman.');
    }

    if (!profile.bio || profile.bio.length < 50) {
      suggestions.push('Tingkatkan deskripsi ringkasan profesional Anda dengan menonjolkan pencapaian utama terukur.');
    }

    return {
      cvHealthScore: Math.min(100, (skillsCount * 10) + (expCount * 20) + (eduCount * 20) + 20),
      statusKarir: profile.statusKarir,
      suggestions,
      analyzedAt: new Date().toISOString()
    };
  },

  /**
   * Generates tailored interview preparation questions based on candidate profile and target job
   * @param {string} candidateId
   * @param {string} jobId
   */
  async generateInterviewPrep(candidateId, jobId) {
    const candidate = jobseekerModel.getFullProfile(candidateId);
    const job = jobModel.findById(jobId);

    if (!job) throw new Error('Lowongan pekerjaan tidak ditemukan.');

    const questions = [
      `Bagaimana pengalaman Anda yang relevan dengan tanggung jawab utama sebagai ${job.title}?`,
      `Ceritakan studi kasus di mana Anda berhasil menerapkan teknologi ${(job.requiredSkills || []).slice(0, 3).join(', ')} dalam pemecahan masalah nyata.`,
      `Apa motivasi Anda ingin bergabung bersama ${job.companyName} dan bagaimana Anda menyikapi budaya kerja ${job.workplaceType}?`,
      `Jelaskan bagaimana pendekatan Anda saat menghadapi tenggat waktu ketat atau perubahan spesifikasi fitur aplikasi.`
    ];

    return {
      jobTitle: job.title,
      companyName: job.companyName,
      questions,
      tips: [
        'Gunakan metode STAR (Situation, Task, Action, Result) saat menjawab.',
        'Sampaikan metrik pencapaian kuantitatif daripada sekadar daftar tugas harian.',
        'Tunjukkan antusiasme dan pemahaman mengenai produk yang dikembangkan perusahaan.'
      ]
    };
  }
};

module.exports = aiService;
