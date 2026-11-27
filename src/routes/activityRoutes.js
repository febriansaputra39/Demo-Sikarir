const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const jobseekerValidator = require('../validators/jobseekerValidator');

router.use(authMiddleware);

router.get('/', activityController.getActivities);

router.post(
    '/',
    roleMiddleware('PencariKerja', 'admin'),
    validate(jobseekerValidator.validateActivity),
    activityController.addActivity
);

router.put(
    '/:id',
    roleMiddleware('PencariKerja', 'admin'),
    ...(typeof jobseekerValidator.validateActivityUpdate === 'function'
        ? [validate(jobseekerValidator.validateActivityUpdate)]
        : []),
    activityController.updateActivity
);

router.delete(
    '/:id',
    roleMiddleware('PencariKerja', 'admin'),
    activityController.deleteActivity
);

module.exports = router;