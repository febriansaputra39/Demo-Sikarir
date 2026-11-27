const { NODE_ENV } = require('../config/environment');

const isValidHttpStatus = (code) =>
  Number.isInteger(code) && code >= 100 && code <= 599;

const normalizeErrors = (errors) => {
  if (errors === null || errors === undefined) return null;

  if (errors instanceof Error) {
    return [{ message: errors.message || 'Terjadi kesalahan internal.' }];
  }

  if (Array.isArray(errors)) {
    return errors.map((item) =>
      item instanceof Error ? { message: item.message } : item
    );
  }

  return errors;
};

const sendJson = (res, statusCode, payload) => {
  if (!res || res.headersSent) {
    return null;
  }
  return res.status(statusCode).json({
    ...payload,
    timestamp: new Date().toISOString()
  });
};

const responseHandler = {
  success: (res, message = 'Operasi berhasil', data = null, statusCode = 200) => {
    const validStatus = isValidHttpStatus(statusCode) && statusCode < 400 ? statusCode : 200;
    return sendJson(res, validStatus, {
      success: true,
      message,
      data
    });
  },

  created: (res, message = 'Data berhasil dibuat', data = null) => {
    return sendJson(res, 201, {
      success: true,
      message,
      data
    });
  },

  paginated: (res, message = 'Data berhasil diambil', items = [], pagination = {}) => {
    return sendJson(res, 200, {
      success: true,
      message,
      data: items,
      pagination: {
        page: Number(pagination.page) || 1,
        limit: Number(pagination.limit) || items.length,
        totalItems: Number(pagination.totalItems) ?? items.length,
        totalPages: Number(pagination.totalPages) || 1
      }
    });
  },

  error: (res, message = 'Terjadi kesalahan sistem', statusCode = 500, errors = null) => {
    const validStatus = isValidHttpStatus(statusCode) && statusCode >= 400 ? statusCode : 500;
    const isServerError = validStatus >= 500;

    const safeMessage =
      isServerError && NODE_ENV === 'production'
        ? 'Terjadi kesalahan internal pada server. Silakan coba lagi nanti.'
        : message || 'Terjadi kesalahan sistem';

    const safeErrors =
      isServerError && NODE_ENV === 'production' ? null : normalizeErrors(errors);

    return sendJson(res, validStatus, {
      success: false,
      message: safeMessage,
      errors: safeErrors
    });
  },

  badRequest: (res, message = 'Permintaan tidak valid', errors = null) => {
    return sendJson(res, 400, {
      success: false,
      message,
      errors: normalizeErrors(errors)
    });
  },

  unauthorized: (res, message = 'Akses ditolak: Autentikasi diperlukan', errors = null) => {
    return sendJson(res, 401, {
      success: false,
      message,
      errors: normalizeErrors(errors)
    });
  },

  forbidden: (res, message = 'Akses ditolak: Hak akses tidak mencukupi', errors = null) => {
    return sendJson(res, 403, {
      success: false,
      message,
      errors: normalizeErrors(errors)
    });
  },

  notFound: (res, message = 'Data atau resource tidak ditemukan', errors = null) => {
    return sendJson(res, 404, {
      success: false,
      message,
      errors: normalizeErrors(errors)
    });
  },

  conflict: (res, message = 'Konflik data: Resource sudah ada atau bertentangan', errors = null) => {
    return sendJson(res, 409, {
      success: false,
      message,
      errors: normalizeErrors(errors)
    });
  },

  tooManyRequests: (
    res,
    message = 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat lagi.',
    errors = null
  ) => {
    return sendJson(res, 429, {
      success: false,
      message,
      errors: normalizeErrors(errors)
    });
  }
};

module.exports = responseHandler;