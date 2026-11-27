const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const responseHandler = require('../utils/responseHandler');

let matchingValidator = {};
try {
    matchingValidator = require('../validators/matchingValidator');
} catch (_) {
    matchingValidator = {};
}

const optionalAuth =
    typeof authMiddleware.optionalAuth === 'function' ? authMiddleware.optionalAuth : (req, res, next) => next();

// Rate limiter ringan untuk mencegah penyalahgunaan kalkulasi ad-hoc & endpoint AI
const createMatchingRateLimiter = ({ windowMs = 60 * 1000, maxRequests = 30 }) => {
    const hits = new Map();

    return (req, res, next) => {
        const key = req.user?.id || req.ip || req.socket?.remoteAddress || 'unknown';
        const now = Date.now();
        const record = hits.get(key);

        if (!record || now > record.resetAt) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        record.count += 1;
        if (record.count > maxRequests) {
            return responseHandler.error(
                res,
                'Terlalu banyak permintaan pencocokan dalam waktu singkat. Silakan coba lagi sebentar lagi.',
                429
            );
        }

        return next();
    };
};

const matchingLimiter = createMatchingRateLimiter({ windowMs: 60 * 1000, maxRequests: 30 });

// Recommend jobs for candidate (current user or by candidateId for owner/Admin)
router.get(
    '/candidate',
    authMiddleware,
    roleMiddleware(['PencariKerja', 'admin']),
    matchingController.getRecommendationsForCandidate
);

router.get(
    '/candidate/:candidateId',
    authMiddleware,
    roleMiddleware(['PencariKerja', 'admin']),
    matchingController.getRecommendationsForCandidate
);

// Recommend candidates for job (Employer owner or Admin only)
router.get(
    '/job/:jobId',
    authMiddleware,
    roleMiddleware(['Perusahaan', 'admin']),
    matchingController.getRecommendationsForJob
);

// Ad-hoc calculation
router.post(
    '/calculate',
    optionalAuth,
    matchingLimiter,
    ...(typeof matchingValidator.validateCalculateMatch === 'function'
        ? [validate(matchingValidator.validateCalculateMatch)]
        : []),
    matchingController.calculateMatch
);

// AI Career Advisory & Feedback (Jobseeker or Admin)
router.get(
    '/ai/feedback',
    authMiddleware,
    roleMiddleware(['PencariKerja', 'admin']),
    matchingLimiter,
    matchingController.getAIFeedback
);

// AI Interview Prep (Jobseeker or Admin)
router.get(
    '/ai/interview-prep/:jobId',
    authMiddleware,
    roleMiddleware(['PencariKerja', 'admin']),
    matchingLimiter,
    matchingController.getInterviewPrep
);

module.exports = router;