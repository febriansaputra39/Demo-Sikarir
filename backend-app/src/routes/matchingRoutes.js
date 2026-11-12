const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingController');
const authMiddleware = require('../middlewares/authMiddleware');

// Recommend jobs for candidate (current user or by candidateId)
router.get('/candidate', authMiddleware, matchingController.getRecommendationsForCandidate);
router.get('/candidate/:candidateId', authMiddleware, matchingController.getRecommendationsForCandidate);

// Recommend candidates for job
router.get('/job/:jobId', authMiddleware, matchingController.getRecommendationsForJob);

// Ad-hoc calculation
router.post('/calculate', matchingController.calculateMatch);

// AI Career Advisory & Feedback
router.get('/ai/feedback', authMiddleware, matchingController.getAIFeedback);

// AI Interview Prep
router.get('/ai/interview-prep/:jobId', authMiddleware, matchingController.getInterviewPrep);

module.exports = router;
