const express = require('express');
const router = express.Router();
const educationController = require('../controllers/educationController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const jobseekerValidator = require('../validators/jobseekerValidator');

router.get('/', authMiddleware, educationController.getEducations);
router.post('/', authMiddleware, validate(jobseekerValidator.validateEducation), educationController.addEducation);
router.put('/:id', authMiddleware, educationController.updateEducation);
router.delete('/:id', authMiddleware, educationController.deleteEducation);

module.exports = router;
