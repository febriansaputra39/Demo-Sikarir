const express = require('express');
const router = express.Router();
const jobseekerController = require('../controllers/jobseekerController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const jobseekerValidator = require('../validators/jobseekerValidator');

const optionalAuth =
  typeof authMiddleware.optionalAuth === 'function' ? authMiddleware.optionalAuth : (req, res, next) => next();

// Career monitoring stats (public aggregate or authenticated dashboard)
router.get('/stats', optionalAuth, jobseekerController.getCareerStats);

// Get current authenticated jobseeker full CV profile (must stay above '/:id')
router.get(
  '/profile',
  authMiddleware,
  roleMiddleware(['PencariKerja', 'admin']),
  jobseekerController.getFullProfile
);

// List all jobseekers (authenticated users: Admin, Perusahaan, or PencariKerja with controller filtering)
router.get('/', authMiddleware, jobseekerController.getAllJobseekers);

// Get specific jobseeker full CV profile & summary
router.get('/:id/full-profile', authMiddleware, jobseekerController.getFullProfile);
router.get('/:id', authMiddleware, jobseekerController.getJobseekerById);

// Update career status (Admin or the Jobseeker themselves)
router.patch(
  '/:id/status',
  authMiddleware,
  roleMiddleware(['PencariKerja', 'admin']),
  validate(jobseekerValidator.validateCareerStatus),
  jobseekerController.updateCareerStatus
);

// Upload CV document (Jobseeker only)
router.post(
  '/upload-cv',
  authMiddleware,
  roleMiddleware('PencariKerja'),
  upload.single('cv'),
  jobseekerController.uploadCV
);

module.exports = router;