const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const responseHandler = require('../utils/responseHandler');

let reportValidator = {};
try {
    reportValidator = require('../validators/reportValidator');
} catch (_) {
    reportValidator = {};
}

// Rate limiter ringan khusus untuk mencegah penyalahgunaan operasi ekspor laporan CSV
const createReportExportLimiter = ({ windowMs = 60 * 1000, maxRequests = 10 }) => {
    const hits = new Map();

    return (req, res, next) => {
        const key = req.user?.id || req.ip || req.socket?.remoteAddress || 'unknown';
        const now = Date.now();
        const record = hits.get(key);

        if (!record || now > record.resetAt) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        record.count += 1;
        if (record.count > maxRequests) {
            return responseHandler.error(
                res,
                'Terlalu banyak permintaan ekspor laporan dalam waktu singkat. Silakan tunggu sebentar.',
                429
            );
        }

        return next();
    };
};

const exportCsvLimiter = createReportExportLimiter({ windowMs: 60 * 1000, maxRequests: 10 });

// Seluruh endpoint laporan wajib terautentikasi dan hanya dapat diakses oleh Admin
router.use(authMiddleware, roleMiddleware('admin'));

router.get(
    '/summary',
    ...(typeof reportValidator.validateReportQuery === 'function'
        ? [validate(reportValidator.validateReportQuery, 'query')]
        : []),
    reportController.getSummary
);

router.get(
    '/export-csv',
    exportCsvLimiter,
    ...(typeof reportValidator.validateReportQuery === 'function'
        ? [validate(reportValidator.validateReportQuery, 'query')]
        : []),
    reportController.exportCSV
);

module.exports = router;