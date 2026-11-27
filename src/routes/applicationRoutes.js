const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// Get all applications (Admin)
router.get('/', roleMiddleware('admin'), applicationController.getAllApplications);

// Get my submitted applications (Jobseeker) - primary route
router.get('/my-applications', roleMiddleware('PencariKerja'), applicationController.getMyApplications);

// ALIAS: frontend calls /applications/user/:id — map to getMyApplications (ignores :id, uses req.user.id)
router.get('/user/:id', roleMiddleware('PencariKerja'), applicationController.getMyApplications);

// Get received applications (Employer or Admin) - primary route
router.get('/company', roleMiddleware(['Perusahaan', 'admin']), applicationController.getCompanyApplications);

// ALIAS: frontend calls /applications/company/:id — map to getCompanyApplications
router.get('/company/:id', roleMiddleware(['Perusahaan', 'admin']), applicationController.getCompanyApplications);

// Submit application (Jobseeker)
router.post('/apply', roleMiddleware('PencariKerja'), applicationController.applyJob);

// Also support POST /applications directly (frontend uses api.post('/applications', payload))
router.post('/', roleMiddleware('PencariKerja'), applicationController.applyJob);

// Update status (e.g., Interview, Accepted, Rejected)
router.patch('/:id/status', roleMiddleware(['Perusahaan', 'admin']), applicationController.updateStatus);

// Withdraw application (Jobseeker)
router.patch('/:id/withdraw', roleMiddleware('PencariKerja'), applicationController.withdrawApplication);

module.exports = router;
