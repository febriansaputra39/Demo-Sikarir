const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const authValidator = require('../validators/authValidator');
const responseHandler = require('../utils/responseHandler');
const { NODE_ENV } = require('../config/environment');

// Rate limiter ringan berbasis IP untuk mencegah brute-force & spam pada endpoint autentikasi
const createAuthRateLimiter = ({ windowMs = 15 * 60 * 1000, maxAttempts = 15, message }) => {
    const hits = new Map();

    return (req, res, next) => {
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';
        const now = Date.now();
        const record = hits.get(ip);

        if (!record || now > record.resetAt) {
            hits.set(ip, { count: 1, resetAt: now + windowMs });
            return next();
        }

        record.count += 1;
        if (record.count > maxAttempts) {
            return responseHandler.error(
                res,
                message || 'Terlalu banyak percobaan autentikasi. Silakan coba lagi beberapa saat lagi.',
                429
            );
        }

        return next();
    };
};

const loginLimiter = createAuthRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxAttempts: 15,
    message: 'Terlalu banyak percobaan login. Silakan tunggu 15 menit sebelum mencoba kembali.'
});

const registerLimiter = createAuthRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxAttempts: 10,
    message: 'Terlalu banyak percobaan pendaftaran dari perangkat ini. Silakan coba lagi nanti.'
});

const resetLimiter = createAuthRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxAttempts: 8,
    message: 'Terlalu banyak permintaan reset kata sandi. Silakan tunggu beberapa saat.'
});

// Public routes
router.post(
    '/register',
    registerLimiter,
    validate(authValidator.validateRegister),
    authController.register
);

router.post(
    '/login',
    loginLimiter,
    validate(authValidator.validateLogin),
    authController.login
);

// Nonaktifkan endpoint login-demo secara otomatis di lingkungan production
if (NODE_ENV !== 'production' && typeof authController.loginDemo === 'function') {
    router.post('/login-demo', loginLimiter, authController.loginDemo);
}

router.post(
    '/forgot-password',
    resetLimiter,
    ...(typeof authValidator.validateForgotPassword === 'function'
        ? [validate(authValidator.validateForgotPassword)]
        : []),
    authController.requestPasswordReset
);

router.post(
    '/reset-password',
    resetLimiter,
    validate(authValidator.validateResetPassword),
    authController.resetPassword
);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);

router.put(
    '/profile',
    authMiddleware,
    ...(typeof authValidator.validateUpdateProfile === 'function'
        ? [validate(authValidator.validateUpdateProfile)]
        : []),
    authController.updateProfile
);

module.exports = router;