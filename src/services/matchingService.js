const userModel = require('../models/userModel');
const jobModel = require('../models/jobModel');
const educationModel = require('../models/educationModel');
const skillModel = require('../models/skillModel');
const experienceModel = require('../models/experienceModel');
const matchingModel = require('../models/matchingModel');

const DEFAULT_WEIGHTS = {
  skills: 0.50,
  experience: 0.20,
  education: 0.15,
  location: 0.15
};

const EDUCATION_RANKS = {
  'SD': 0,
  'SMP': 0,
  'SMA': 1,
  'SMK': 1,
  'SMA / SMK': 1,
  'D1': 2,
  'D2': 2,
  'D3': 2,
  'D4': 3,
  'S1': 3,
  'S1 / D4': 3,
  'S2': 4,
  'S3': 5
};

const createHttpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const sanitizeCandidate = (candidate) => {
  if (!candidate || typeof candidate !== 'object') return null;
  const { password, resetToken, resetTokenExpiry, ...safeCandidate } = candidate;
  return safeCandidate;
};

const normalizeWeights = (customWeights = {}) => {
  if (!customWeights || typeof customWeights !== 'object' || Array.isArray(customWeights)) {
    return { ...DEFAULT_WEIGHTS };
  }

  const raw = {
    skills: Math.max(0, Number(customWeights.skills ?? DEFAULT_WEIGHTS.skills) || 0),
    experience: Math.max(0, Number(customWeights.experience ?? DEFAULT_WEIGHTS.experience) || 0),
    education: Math.max(0, Number(customWeights.education ?? DEFAULT_WEIGHTS.education) || 0),
    location: Math.max(0, Number(customWeights.location ?? DEFAULT_WEIGHTS.location) || 0)
  };

  const sum = raw.skills + raw.experience + raw.education + raw.location;
  if (sum <= 0) {
    return { ...DEFAULT_WEIGHTS };
  }

  return {
    skills: raw.skills / sum,
    experience: raw.experience / sum,
    education: raw.education / sum,
    location: raw.location / sum
  };
};

const isSkillMatched = (candSkill, reqSkill) => {
  if (!candSkill || !reqSkill) return false;
  if (candSkill === reqSkill) return true;

  // Hindari pencocokan substring semu pada kata sangat pendek (mis. "c" cocok dengan "react")
  if (candSkill.length < 3 || reqSkill.length < 3) {
    return false;
  }

  const candTokens = candSkill.split(/[\s/+-.,()]+/).filter(Boolean);
  const reqTokens = reqSkill.split(/[\s/+-.,()]+/).filter(Boolean);

  if (candTokens.includes(reqSkill) || reqTokens.includes(candSkill)) {
    return true;
  }

  return candSkill.includes(reqSkill) || reqSkill.includes(candSkill);
};

const resolveHighestEducation = (educations = []) => {
  if (!Array.isArray(educations) || educations.length === 0) {
    return { degree: 'S1', rank: 3 };
  }

  let bestDegree = 'SMA / SMK';
  let bestRank = 0;

  educations.forEach((edu) => {
    const degreeLabel = typeof edu?.degree === 'string' ? edu.degree.trim() : '';
    const rank = EDUCATION_RANKS[degreeLabel] !== undefined ? EDUCATION_RANKS[degreeLabel] : 1;
    if (rank >= bestRank) {
      bestRank = rank;
      bestDegree = degreeLabel || bestDegree;
    }
  });

  return { degree: bestDegree, rank: bestRank };
};

const calculateTotalExperienceYears = (experiences = []) => {
  if (!Array.isArray(experiences) || experiences.length === 0) return 0;

  let totalMonths = 0;
  experiences.forEach((exp) => {
    if (exp?.startDate) {
      const start = new Date(exp.startDate);
      const end = exp.isCurrent || !exp.endDate ? new Date() : new Date(exp.endDate);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end >= start) {
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += Math.max(1, months);
        return;
      }
    }
    // Fallback estimasi 18 bulan per pengalaman jika tanggal tidak lengkap
    totalMonths += 18;
  });

  return Math.round((totalMonths / 12) * 10) / 10;
};

const buildEnrichedCandidate = (candidate) => {
  const safeUser = sanitizeCandidate(candidate);
  const candidateSkills = skillModel.findByUserId(safeUser.id);
  const candidateExperiences = experienceModel.findByUserId(safeUser.id);
  const candidateEducations = educationModel.findByUserId(safeUser.id);
  const highestEdu = resolveHighestEducation(candidateEducations);

  return {
    ...safeUser,
    skills: candidateSkills,
    experiences: candidateExperiences,
    educations: candidateEducations,
    educationLevel: highestEdu.degree
  };
};

const matchingService = {
  calculateMatch(candidate, job, customWeights = {}) {
    if (!candidate || !job) {
      return { score: 0, matchedSkills: [], missingSkills: [], grade: 'Tidak Cocok', breakdown: {} };
    }

    const weights = normalizeWeights(customWeights);

    // 1. Skill Matching Score
    const candidateSkills = (Array.isArray(candidate.skills) ? candidate.skills : [])
      .map((s) => (typeof s === 'string' ? s : s?.name || '').trim().toLowerCase())
      .filter(Boolean);

    const rawRequiredSkills = Array.isArray(job.requiredSkills)
      ? job.requiredSkills.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim())
      : [];

    const matchedSkills = [];
    const missingSkills = [];

    rawRequiredSkills.forEach((reqSkillOriginal) => {
      const reqSkillLower = reqSkillOriginal.toLowerCase();
      const isMatch = candidateSkills.some((candSkill) => isSkillMatched(candSkill, reqSkillLower));
      if (isMatch) {
        matchedSkills.push(reqSkillOriginal);
      } else {
        missingSkills.push(reqSkillOriginal);
      }
    });

    const skillsScore =
      rawRequiredSkills.length > 0 ? (matchedSkills.length / rawRequiredSkills.length) * 100 : 80;

    // 2. Education Matching Score
    const candidateEduRank = EDUCATION_RANKS[candidate.educationLevel || 'S1'] ?? 3;
    const requiredEduRank = EDUCATION_RANKS[job.educationLevel || 'S1'] ?? 3;
    let educationScore = 100;
    if (candidateEduRank < requiredEduRank) {
      educationScore = Math.max(40, 100 - (requiredEduRank - candidateEduRank) * 25);
    }

    // 3. Experience Matching Score
    let experienceScore = 85;
    const totalExpYears = calculateTotalExperienceYears(candidate.experiences || []);
    const expLevel = typeof job.experienceLevel === 'string' ? job.experienceLevel : '';

    if (expLevel) {
      if (expLevel.includes('Fresh Graduate')) {
        experienceScore = 100;
      } else if (expLevel.includes('1-3')) {
        experienceScore = totalExpYears >= 1 ? 95 : 70;
      } else if (expLevel.includes('3-5')) {
        experienceScore = totalExpYears >= 3 ? 95 : totalExpYears >= 1.5 ? 75 : 60;
      } else if (expLevel.includes('3+') || expLevel.includes('5+')) {
        const minReq = expLevel.includes('5+') ? 5 : 3;
        experienceScore = totalExpYears >= minReq ? 95 : 65;
      }
    }

    // 4. Location / Remote Matching Score
    let locationScore = 70;
    if (job.workplaceType === 'Remote') {
      locationScore = 100;
    } else if (typeof candidate.location === 'string' && typeof job.location === 'string') {
      const candLoc = candidate.location.trim().toLowerCase();
      const jobLoc = job.location.trim().toLowerCase();
      if (candLoc && jobLoc && (candLoc.includes(jobLoc) || jobLoc.includes(candLoc))) {
        locationScore = 100;
      } else {
        locationScore = 75;
      }
    }

    // Kalkulasi Skor Akhir Terbobot (0 - 100)
    const rawFinal =
      skillsScore * weights.skills +
      educationScore * weights.education +
      experienceScore * weights.experience +
      locationScore * weights.location;

    const finalScore = Math.min(100, Math.max(0, Math.round(rawFinal)));

    let grade = 'Perlu Peningkatan';
    if (finalScore >= 85) grade = 'Sangat Cocok';
    else if (finalScore >= 70) grade = 'Cukup Cocok';

    return {
      score: finalScore,
      matchedSkills,
      missingSkills,
      grade,
      breakdown: {
        skillsScore: Math.round(skillsScore),
        educationScore: Math.round(educationScore),
        experienceScore: Math.round(experienceScore),
        locationScore: Math.round(locationScore)
      }
    };
  },

  async calculateCandidateJobMatch(candidateId, jobId, customWeights = {}) {
    if (!candidateId || typeof candidateId !== 'string') {
      throw createHttpError('ID kandidat wajib disertakan.', 400);
    }
    if (!jobId || typeof jobId !== 'string') {
      throw createHttpError('ID lowongan pekerjaan wajib disertakan.', 400);
    }

    const candidate = userModel.findById(candidateId.trim());
    if (!candidate || candidate.role !== 'PencariKerja') {
      throw createHttpError('Kandidat tidak ditemukan.', 404);
    }

    const job = jobModel.findById(jobId.trim());
    if (!job) {
      throw createHttpError('Lowongan pekerjaan tidak ditemukan.', 404);
    }

    const enrichedCandidate = buildEnrichedCandidate(candidate);
    const result = this.calculateMatch(enrichedCandidate, job, customWeights);

    try {
      matchingModel.logMatch({
        userId: candidate.id,
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.companyName,
        score: result.score,
        grade: result.grade
      });
    } catch (_) {
      // Abaikan kegagalan pencatatan log agar respons utama tetap dikembalikan
    }

    return result;
  },

  async getRecommendationsForCandidate(candidateId, limit = null) {
    if (!candidateId || typeof candidateId !== 'string' || !candidateId.trim()) {
      throw createHttpError('ID kandidat wajib disertakan.', 400);
    }

    const candidate = userModel.findById(candidateId.trim());
    if (!candidate || candidate.role !== 'PencariKerja') {
      throw createHttpError('Kandidat tidak ditemukan.', 404);
    }

    const enrichedCandidate = buildEnrichedCandidate(candidate);
    const jobs = jobModel.findAll({ isActive: true, statusVerifikasi: 'Disetujui' });

    const scoredJobs = jobs
      .map((job) => {
        const matchResult = this.calculateMatch(enrichedCandidate, job);
        return {
          ...job,
          matchScore: matchResult.score,
          matchGrade: matchResult.grade,
          matchedSkills: matchResult.matchedSkills,
          missingSkills: matchResult.missingSkills,
          breakdown: matchResult.breakdown
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    if (Number.isInteger(limit) && limit > 0) {
      return scoredJobs.slice(0, limit);
    }
    return scoredJobs;
  },

  // Alias untuk kompatibilitas pemanggilan dari aiService
  async recommendJobsForCandidate(candidateId, limit = 5) {
    return this.getRecommendationsForCandidate(candidateId, limit);
  },

  async getRecommendationsForJob(jobId, actorUser = null) {
    if (!jobId || typeof jobId !== 'string' || !jobId.trim()) {
      throw createHttpError('ID lowongan pekerjaan wajib disertakan.', 400);
    }

    const job = jobModel.findById(jobId.trim());
    if (!job) {
      throw createHttpError('Lowongan pekerjaan tidak ditemukan.', 404);
    }

    if (actorUser && actorUser.role !== 'admin' && job.companyId !== actorUser.id) {
      throw createHttpError('Anda tidak memiliki wewenang untuk melihat rekomendasi kandidat pada lowongan ini.', 403);
    }

    const candidates = userModel.findAll((u) => u.role === 'PencariKerja');

    const scoredCandidates = candidates.map((candidate) => {
      const enriched = buildEnrichedCandidate(candidate);
      const matchResult = this.calculateMatch(enriched, job);

      return {
        ...enriched,
        matchScore: matchResult.score,
        matchGrade: matchResult.grade,
        matchedSkills: matchResult.matchedSkills,
        missingSkills: matchResult.missingSkills,
        breakdown: matchResult.breakdown
      };
    });

    return scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);
  }
};

module.exports = matchingService;