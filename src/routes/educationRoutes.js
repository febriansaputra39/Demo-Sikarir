const express = require('express');
const router = express.Router();
const educationController = require('../controllers/educationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const jobseekerValidator = require('../validators/jobseekerValidator');

router.use(authMiddleware);

router.get('/', educationController.getEducations);

router.post(
    '/',
    roleMiddleware('PencariKerja', 'admin'),
    validate(jobseekerValidator.validateEducation),
    educationController.addEducation
);

router.put(
    '/:id',
    roleMiddleware('PencariKerja', 'admin'),
    ...(typeof jobseekerValidator.validateEducationUpdate === 'function'
        ? [validate(jobseekerValidator.validateEducationUpdate)]
        : []),
    educationController.updateEducation
);

router.delete(
    '/:id',
    roleMiddleware('PencariKerja', 'admin'),
    educationController.deleteEducation
);

module.exports = router;