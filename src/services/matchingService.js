/**
 * Smart Matching Engine (AI-Assisted Career & Job Recommendation)
 * Uses multi-factor weighted scoring across skills, education, experience, and location.
 */

import { api } from './api';

const DEFAULT_WEIGHTS = {
  skills: 0.50,      // 50%
  experience: 0.20,  // 20%
  education: 0.15,   // 15%
  location: 0.15     // 15%
};

const EDUCATION_RANKS = {
  'SMA / SMK': 1,
  'D3': 2,
  'D4': 3,
  'S1': 3,
  'S1 / D4': 3,
  'S2': 4,
  'S3': 5
};

export const matchingService = {
  /**
   * Calculate match score between a candidate and a job
   * @param {object} candidate
   * @param {object} job
   * @param {object} customWeights
   */
  calculateMatch(candidate, job, customWeights = {}) {
    if (!candidate || !job) {
      return { score: 0, matchedSkills: [], missingSkills: [], grade: 'Tidak Cocok', breakdown: {} };
    }

    const weights = { ...DEFAULT_WEIGHTS, ...customWeights };

    // 1. Skill Matching Score
    const candidateSkills = (candidate.skills || []).map(s => (typeof s === 'string' ? s : s.name).toLowerCase());
    const requiredSkills = (job.requiredSkills || []).map(s => s.toLowerCase());

    const matchedSkills = [];
    const missingSkills = [];

    requiredSkills.forEach(reqSkill => {
      const isMatch = candidateSkills.some(candSkill =>
        candSkill.includes(reqSkill) || reqSkill.includes(candSkill)
      );
      if (isMatch) {
        matchedSkills.push(reqSkill);
      } else {
        missingSkills.push(reqSkill);
      }
    });

    const skillsScore = requiredSkills.length > 0
      ? (matchedSkills.length / requiredSkills.length) * 100
      : 80;

    // 2. Education Matching Score
    const candidateEduRank = EDUCATION_RANKS[candidate.educationLevel || 'S1'] || 3;
    const requiredEduRank = EDUCATION_RANKS[job.educationLevel || 'S1'] || 3;
    let educationScore = 100;
    if (candidateEduRank < requiredEduRank) {
      educationScore = Math.max(50, 100 - (requiredEduRank - candidateEduRank) * 25);
    }

    // 3. Experience Matching Score
    let experienceScore = 85;
    const totalExpYears = (candidate.experiences || []).length * 1.5;
    if (job.experienceLevel) {
      if (job.experienceLevel.includes('Fresh Graduate') && totalExpYears >= 0) {
        experienceScore = 100;
      } else if (job.experienceLevel.includes('1-3') && totalExpYears >= 1) {
        experienceScore = 95;
      } else if (job.experienceLevel.includes('3+') && totalExpYears < 3) {
        experienceScore = 65;
      }
    }

    // 4. Location / Remote Matching Score
    let locationScore = 70;
    if (job.workplaceType === 'Remote') {
      locationScore = 100;
    } else if (candidate.location && job.location) {
      const candLoc = candidate.location.toLowerCase();
      const jobLoc = job.location.toLowerCase();
      if (candLoc.includes(jobLoc) || jobLoc.includes(candLoc)) {
        locationScore = 100;
      } else {
        locationScore = 75;
      }
    }

    // Calculate Final Weighted Total
    const finalScore = Math.round(
      (skillsScore * weights.skills) +
      (educationScore * weights.education) +
      (experienceScore * weights.experience) +
      (locationScore * weights.location)
    );

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

  /**
   * Get top recommended jobs for a candidate
   * @param {string} candidateId
   */
  async getRecommendationsForCandidate(candidateId) {
    await new Promise(resolve => setTimeout(resolve, 200));

    const users = api.getCollection('users');
    const candidate = users.find(u => u.id === candidateId);
    if (!candidate) return [];

    const candidateSkills = api.getCollection('skills').filter(s => s.userId === candidateId);
    const candidateExperiences = api.getCollection('experiences').filter(e => e.userId === candidateId);
    const candidateEducations = api.getCollection('educations').filter(e => e.userId === candidateId);

    const enrichedCandidate = {
      ...candidate,
      skills: candidateSkills,
      experiences: candidateExperiences,
      educationLevel: candidateEducations[0]?.degree || 'S1'
    };

    const jobs = api.getCollection('jobs').filter(j => j.isActive && j.statusVerifikasi === 'Disetujui');

    const scoredJobs = jobs.map(job => {
      const matchResult = this.calculateMatch(enrichedCandidate, job);
      return {
        ...job,
        matchScore: matchResult.score,
        matchGrade: matchResult.grade,
        matchedSkills: matchResult.matchedSkills,
        missingSkills: matchResult.missingSkills,
        breakdown: matchResult.breakdown
      };
    });

    // Sort descending by matchScore
    return scoredJobs.sort((a, b) => b.matchScore - a.matchScore);
  },

  /**
   * Get top recommended candidates for a company's job
   * @param {string} jobId
   */
  async getRecommendationsForJob(jobId) {
    await new Promise(resolve => setTimeout(resolve, 200));

    const jobs = api.getCollection('jobs');
    const job = jobs.find(j => j.id === jobId);
    if (!job) return [];

    const candidates = api.getCollection('users').filter(u => u.role === 'PencariKerja');
    const allSkills = api.getCollection('skills');
    const allExperiences = api.getCollection('experiences');
    const allEducations = api.getCollection('educations');

    const scoredCandidates = candidates.map(candidate => {
      const candidateSkills = allSkills.filter(s => s.userId === candidate.id);
      const candidateExperiences = allExperiences.filter(e => e.userId === candidate.id);
      const candidateEducations = allEducations.filter(e => e.userId === candidate.id);

      const enriched = {
        ...candidate,
        skills: candidateSkills,
        experiences: candidateExperiences,
        educationLevel: candidateEducations[0]?.degree || 'S1'
      };

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

export default matchingService;
