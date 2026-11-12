const express = require('express');
const router = express.Router();
const experienceController = require('../controllers/experienceController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const jobseekerValidator = require('../validators/jobseekerValidator');

router.get('/', authMiddleware, experienceController.getExperiences);
router.post('/', authMiddleware, validate(jobseekerValidator.validateExperience), experienceController.addExperience);
router.put('/:id', authMiddleware, experienceController.updateExperience);
router.delete('/:id', authMiddleware, experienceController.deleteExperience);

module.exports = router;
