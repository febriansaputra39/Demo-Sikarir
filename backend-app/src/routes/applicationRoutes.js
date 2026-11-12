const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Get all applications (Admin)
router.get('/', authMiddleware, applicationController.getAllApplications);

// Get my submitted applications (Jobseeker)
router.get('/my-applications', authMiddleware, roleMiddleware('PencariKerja'), applicationController.getMyApplications);

// Get received applications (Employer or Admin)
router.get('/company', authMiddleware, roleMiddleware(['Perusahaan', 'admin']), applicationController.getCompanyApplications);

// Submit application (Jobseeker)
router.post('/apply', authMiddleware, roleMiddleware('PencariKerja'), applicationController.applyJob);

// Update status (e.g., Interview, Accepted, Rejected)
router.patch('/:id/status', authMiddleware, applicationController.updateStatus);

// Withdraw application (Jobseeker)
router.patch('/:id/withdraw', authMiddleware, roleMiddleware('PencariKerja'), applicationController.withdrawApplication);

module.exports = router;
