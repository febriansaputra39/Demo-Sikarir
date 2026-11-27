const reportService = require('../services/reportService');
const responseHandler = require('../utils/responseHandler');

const PERIOD_REGEX = /^[a-zA-Z0-9_-]{1,32}$/;

const parseValidPeriod = (rawPeriod) => {
  if (rawPeriod === undefined || rawPeriod === null || rawPeriod === '') {
    return '2026-Q1';
  }
  if (typeof rawPeriod !== 'string') {
    return null;
  }
  const trimmed = rawPeriod.trim();
  return PERIOD_REGEX.test(trimmed) ? trimmed : null;
};

const reportController = {
  async getSummary(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'admin') {
        return responseHandler.forbidden(
          res,
          'Akses ditolak. Hanya Admin yang dapat mengakses laporan komprehensif penyerapan tenaga kerja.'
        );
      }

      const period = parseValidPeriod(req.query.period);
      if (!period) {
        return responseHandler.badRequest(
          res,
          'Format parameter period tidak valid. Gunakan huruf, angka, tanda hubung (-), atau garis bawah (_).'
        );
      }

      const summary = await reportService.getSummaryReport(period);
      return responseHandler.success(
        res,
        'Laporan komprehensif penyerapan tenaga kerja berhasil dimuat.',
        summary
      );
    } catch (err) {
      next(err);
    }
  },

  async exportCSV(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return responseHandler.unauthorized(res, 'Autentikasi diperlukan.');
      }

      if (req.user.role !== 'admin') {
        return responseHandler.forbidden(
          res,
          'Akses ditolak. Hanya Admin yang dapat mengekspor laporan CSV.'
        );
      }

      const period = parseValidPeriod(req.query.period);
      if (!period) {
        return responseHandler.badRequest(
          res,
          'Format parameter period tidak valid. Gunakan huruf, angka, tanda hubung (-), atau garis bawah (_).'
        );
      }

      const csv = await reportService.generateCSV(period);
      if (typeof csv !== 'string') {
        throw new Error('Gagal menghasilkan konten CSV laporan.');
      }

      const safeFilename = `Laporan-Penyerapan-Karir-${period}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.attachment(safeFilename);

      // Tambahkan UTF-8 BOM (\uFEFF) agar kolom CSV terbaca rapi saat dibuka di Microsoft Excel
      return res.send(`\uFEFF${csv}`);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = reportController;