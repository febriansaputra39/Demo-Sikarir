const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const authValidator = require('../validators/authValidator');

// Public routes
router.post('/register', validate(authValidator.validateRegister), authController.register);
router.post('/login', validate(authValidator.validateLogin), authController.login);
router.post('/login-demo', authController.loginDemo);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', validate(authValidator.validateResetPassword), authController.resetPassword);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
