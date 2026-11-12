const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const jobValidator = require('../validators/jobValidator');

// Statistics
router.get('/stats', jobController.getJobStats);

// List and get
router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJobById);

// Create job (Employer or Admin)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['Perusahaan', 'admin']),
  validate(jobValidator.validateCreateJob),
  jobController.createJob
);

// Update job
router.put('/:id', authMiddleware, jobController.updateJob);

// Delete job
router.delete('/:id', authMiddleware, jobController.deleteJob);

// Admin verification approval/rejection
router.patch(
  '/:id/verify',
  authMiddleware,
  roleMiddleware('admin'),
  validate(jobValidator.validateVerification),
  jobController.verifyJob
);

// Toggle active/inactive
router.patch(
  '/:id/toggle-active',
  authMiddleware,
  jobController.toggleActive
);

module.exports = router;
