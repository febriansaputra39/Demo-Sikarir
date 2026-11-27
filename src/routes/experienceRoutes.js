const express = require('express');
const router = express.Router();
const experienceController = require('../controllers/experienceController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const jobseekerValidator = require('../validators/jobseekerValidator');

router.use(authMiddleware);

router.get('/', experienceController.getExperiences);

router.post(
    '/',
    roleMiddleware('PencariKerja', 'admin'),
    validate(jobseekerValidator.validateExperience),
    experienceController.addExperience
);

router.put(
    '/:id',
    roleMiddleware('PencariKerja', 'admin'),
    ...(typeof jobseekerValidator.validateExperienceUpdate === 'function'
        ? [validate(jobseekerValidator.validateExperienceUpdate)]
        : []),
    experienceController.updateExperience
);

router.delete(
    '/:id',
    roleMiddleware('PencariKerja', 'admin'),
    experienceController.deleteExperience
);

module.exports = router;