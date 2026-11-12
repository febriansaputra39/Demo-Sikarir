const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const jobseekerValidator = require('../validators/jobseekerValidator');

router.get('/', authMiddleware, skillController.getSkills);
router.post('/', authMiddleware, validate(jobseekerValidator.validateSkill), skillController.addSkill);
router.put('/:id', authMiddleware, skillController.updateSkill);
router.delete('/:id', authMiddleware, skillController.deleteSkill);

module.exports = router;
