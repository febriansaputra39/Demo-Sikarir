const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const jobseekerValidator = require('../validators/jobseekerValidator');

router.get('/', authMiddleware, activityController.getActivities);
router.post('/', authMiddleware, validate(jobseekerValidator.validateActivity), activityController.addActivity);
router.put('/:id', authMiddleware, activityController.updateActivity);
router.delete('/:id', authMiddleware, activityController.deleteActivity);

module.exports = router;
