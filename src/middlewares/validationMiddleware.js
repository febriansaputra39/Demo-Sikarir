const responseHandler = require('../utils/responseHandler');

/**
 * Higher-order middleware untuk menjalankan fungsi validasi input.
 * Mendukung validator sinkron maupun asinkron (Promise).
 *
 * @param {Function} validatorFn - Fungsi yang mengembalikan { isValid: boolean, errors?: string[], data?: object }
 * @param {'body'|'query'|'params'} [source='body'] - Sumber data request yang divalidasi
 */
function validate(validatorFn, source = 'body') {
  if (typeof validatorFn !== 'function') {
    throw new Error('[VALIDATOR] Middleware validate() wajib diberikan fungsi validator yang valid.');
  }

  const allowedSources = new Set(['body', 'query', 'params']);
  if (!allowedSources.has(source)) {
    throw new Error(`[VALIDATOR] Sumber validasi tidak valid: "${source}". Gunakan 'body', 'query', atau 'params'.`);
  }

  return async (req, res, next) => {
    try {
      const rawTarget = req[source];

      if (source === 'body' && (rawTarget === null || Array.isArray(rawTarget) || typeof rawTarget !== 'object')) {
        if (rawTarget !== undefined) {
          return responseHandler.badRequest(res, 'Format request body harus berupa objek JSON yang valid.');
        }
      }

      const safeTarget =
        rawTarget && typeof rawTarget === 'object' && !Array.isArray(rawTarget) ? rawTarget : {};

      const result = await validatorFn(safeTarget, req);

      if (!result || typeof result !== 'object') {
        throw new Error('Fungsi validator harus mengembalikan objek { isValid, errors }.');
      }

      if (!result.isValid) {
        const errorList = Array.isArray(result.errors) ? result.errors : ['Input tidak valid.'];
        return responseHandler.badRequest(res, 'Validasi data gagal.', errorList);
      }

      // Terapkan data hasil sanitasi jika disediakan oleh validatorFn
      if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
        req[source] = result.data;
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = {
  validate
};