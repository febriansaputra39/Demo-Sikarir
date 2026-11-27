const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const jobseekerValidator = require('../validators/jobseekerValidator');

router.use(authMiddleware);

router.get('/', skillController.getSkills);

router.post(
    '/',
    roleMiddleware('PencariKerja', 'admin'),
    validate(jobseekerValidator.validateSkill),
    skillController.addSkill
);

router.put(
    '/:id',
    roleMiddleware('PencariKerja', 'admin'),
    ...(typeof jobseekerValidator.validateSkillUpdate === 'function'
        ? [validate(jobseekerValidator.validateSkillUpdate)]
        : []),
    skillController.updateSkill
);

router.delete(
    '/:id',
    roleMiddleware('PencariKerja', 'admin'),
    skillController.deleteSkill
);

module.exports = router;