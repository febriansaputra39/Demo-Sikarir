const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const companyValidator = require('../validators/companyValidator');

const optionalAuth =
  typeof authMiddleware.optionalAuth === 'function' ? authMiddleware.optionalAuth : (req, res, next) => next();

// Public or authenticated list
router.get('/', optionalAuth, companyController.getAllCompanies);
router.get('/:id', optionalAuth, companyController.getCompanyById);

// Company dashboard metrics
router.get(
  '/:id/stats',
  authMiddleware,
  roleMiddleware(['Perusahaan', 'admin']),
  companyController.getDashboardStats
);

// Update company profile
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['Perusahaan', 'admin']),
  validate(companyValidator.validateProfileUpdate),
  companyController.updateProfile
);

// Admin company verification
router.patch(
  '/:id/verify',
  authMiddleware,
  roleMiddleware('admin'),
  validate(companyValidator.validateVerification),
  companyController.verifyCompany
);

// Upload company logo
router.post(
  '/upload-logo',
  authMiddleware,
  roleMiddleware(['Perusahaan', 'admin']),
  upload.single('logo'),
  companyController.uploadLogo
);

module.exports = router;