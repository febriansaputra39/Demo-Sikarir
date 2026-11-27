const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const jobValidator = require('../validators/jobValidator');

const optionalAuth =
  typeof authMiddleware.optionalAuth === 'function' ? authMiddleware.optionalAuth : (req, res, next) => next();

// Statistics
router.get('/stats', optionalAuth, jobController.getJobStats);

// List and get
router.get('/', optionalAuth, jobController.getAllJobs);
router.get('/:id', optionalAuth, jobController.getJobById);

// Create job (Employer or Admin)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['Perusahaan', 'admin']),
  validate(jobValidator.validateCreateJob),
  jobController.createJob
);

// Update job (Employer owner or Admin)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['Perusahaan', 'admin']),
  ...(typeof jobValidator.validateUpdateJob === 'function'
    ? [validate(jobValidator.validateUpdateJob)]
    : []),
  jobController.updateJob
);

// Delete job (Employer owner or Admin)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['Perusahaan', 'admin']),
  jobController.deleteJob
);

// Admin verification approval/rejection
router.patch(
  '/:id/verify',
  authMiddleware,
  roleMiddleware('admin'),
  validate(jobValidator.validateVerification),
  jobController.verifyJob
);

// Toggle active/inactive (Employer owner or Admin)
router.patch(
  '/:id/toggle-active',
  authMiddleware,
  roleMiddleware(['Perusahaan', 'admin']),
  jobController.toggleActive
);

module.exports = router;