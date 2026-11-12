const matchingService = require('../services/matchingService');
const aiService = require('../services/aiService');
const responseHandler = require('../utils/responseHandler');

const matchingController = {
  async getRecommendationsForCandidate(req, res, next) {
    try {
      const candidateId = req.params.candidateId || req.user.id;
      const recommendations = await matchingService.getRecommendationsForCandidate(candidateId);
      return responseHandler.success(res, 'Rekomendasi lowongan berbasis AI berhasil diambil.', recommendations);
    } catch (err) {
      next(err);
    }
  },

  async getRecommendationsForJob(req, res, next) {
    try {
      const jobId = req.params.jobId;
      const recommendations = await matchingService.getRecommendationsForJob(jobId);
      return responseHandler.success(res, 'Rekomendasi kandidat pelamar berhasil diambil.', recommendations);
    } catch (err) {
      next(err);
    }
  },

  async calculateMatch(req, res, next) {
    try {
      const { candidate, job, weights } = req.body;
      const result = matchingService.calculateMatch(candidate, job, weights);
      return responseHandler.success(res, 'Kalkulasi skor kecocokan berhasil.', result);
    } catch (err) {
      next(err);
    }
  },

  async getAIFeedback(req, res, next) {
    try {
      const userId = req.user.id;
      const advice = await aiService.generateCareerAdvice(userId);
      return responseHandler.success(res, 'Saran peningkatan karir AI berhasil disusun.', advice);
    } catch (err) {
      next(err);
    }
  },

  async getInterviewPrep(req, res, next) {
    try {
      const { jobId } = req.params;
      const candidateId = req.user.id;
      const prep = await aiService.generateInterviewPrep(candidateId, jobId);
      return responseHandler.success(res, 'Simulasi pertanyaan wawancara AI berhasil disiapkan.', prep);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = matchingController;
