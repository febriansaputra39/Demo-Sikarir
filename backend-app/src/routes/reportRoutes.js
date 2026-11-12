const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/summary', authMiddleware, roleMiddleware('admin'), reportController.getSummary);
router.get('/export-csv', authMiddleware, roleMiddleware('admin'), reportController.exportCSV);

module.exports = router;
