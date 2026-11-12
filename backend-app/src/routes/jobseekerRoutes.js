const express = require('express');
const router = express.Router();
const jobseekerController = require('../controllers/jobseekerController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const jobseekerValidator = require('../validators/jobseekerValidator');

// Career monitoring stats
router.get('/stats', jobseekerController.getCareerStats);

// List all jobseekers
router.get('/', jobseekerController.getAllJobseekers);

// Get current or specific jobseeker full CV profile
router.get('/profile', authMiddleware, jobseekerController.getFullProfile);
router.get('/:id/full-profile', jobseekerController.getFullProfile);
router.get('/:id', jobseekerController.getJobseekerById);

// Update career status (Admin or the Jobseeker themselves)
router.patch(
  '/:id/status',
  authMiddleware,
  validate(jobseekerValidator.validateCareerStatus),
  jobseekerController.updateCareerStatus
);

// Upload CV document
router.post(
  '/upload-cv',
  authMiddleware,
  roleMiddleware('PencariKerja'),
  upload.single('cv'),
  jobseekerController.uploadCV
);

module.exports = router;
