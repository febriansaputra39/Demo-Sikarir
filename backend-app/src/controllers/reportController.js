const reportService = require('../services/reportService');
const responseHandler = require('../utils/responseHandler');

const reportController = {
  getSummary(req, res, next) {
    try {
      const period = req.query.period || '2026-Q1';
      const summary = reportService.getSummaryReport(period);
      return responseHandler.success(res, 'Laporan komprehensif penyerapan tenaga kerja berhasil dimuat.', summary);
    } catch (err) {
      next(err);
    }
  },

  exportCSV(req, res, next) {
    try {
      const period = req.query.period || '2026-Q1';
      const csv = reportService.generateCSV(period);
      res.header('Content-Type', 'text/csv');
      res.attachment(`Laporan-Penyerapan-Karir-${period}.csv`);
      return res.send(csv);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = reportController;
