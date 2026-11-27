const logger = require('../utils/logger');
const responseHandler = require('../utils/responseHandler');
const { NODE_ENV } = require('../config/environment');

const isDevelopment = NODE_ENV === 'development';

function resolveErrorDetails(err) {
  // 1. Error parsing JSON pada request body (express.json)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return {
      statusCode: 400,
      message: 'Format JSON pada request body tidak valid.'
    };
  }

  // 2. Payload terlalu besar (body-parser / express.json)
  if (err.type === 'entity.too.large') {
    return {
      statusCode: 413,
      message: 'Ukuran data yang dikirim melebihi batas maksimal server.'
    };
  }

  // 3. Error unggah berkas (Multer)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return {
        statusCode: 400,
        message: 'Ukuran berkas melebihi batas maksimal yang diizinkan.'
      };
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return {
        statusCode: 400,
        message: 'Field unggahan berkas tidak sesuai dengan ketentuan.'
      };
    }
    return {
      statusCode: 400,
      message: `Gagal mengunggah berkas: ${err.message}`
    };
  }

  // 4. Error JWT jika lolos ke global error handler
  if (err.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      message: 'Sesi token telah kadaluarsa. Silakan login kembali.'
    };
  }
  if (err.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      message: 'Token autentikasi tidak valid.'
    };
  }

  // 5. Status code kustom dari controller/service/CORS
  const rawStatus = Number(err.statusCode || err.status);
  const statusCode = Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus <= 599 ? rawStatus : 500;

  // Di production, sembunyikan pesan error mentah untuk error 5xx agar path/detail internal tidak bocor
  const message =
    statusCode >= 500 && !isDevelopment
      ? 'Terjadi kesalahan internal pada server.'
      : err.message || 'Terjadi kesalahan pada server.';

  return { statusCode, message };
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const safeMethod = typeof req?.method === 'string' ? req.method : 'UNKNOWN';
  const safeUrl = typeof req?.originalUrl === 'string' ? req.originalUrl.slice(0, 256) : '';

  logger.error(`Unhandled Error on ${safeMethod} ${safeUrl}:`, err);

  const { statusCode, message } = resolveErrorDetails(err || {});
  const stackTrace = isDevelopment && err?.stack ? err.stack : null;

  return responseHandler.error(res, message, statusCode, stackTrace);
}

function notFoundHandler(req, res, next) {
  const safeMethod = typeof req?.method === 'string' ? req.method : 'UNKNOWN';
  const safeUrl =
    typeof req?.originalUrl === 'string'
      ? req.originalUrl.replace(/[\r\n\x00-\x1F\x7F]/g, '').slice(0, 200)
      : '';

  return responseHandler.notFound(
    res,
    `Endpoint ${safeMethod} ${safeUrl} tidak ditemukan pada server API.`
  );
}

module.exports = {
  errorHandler,
  notFoundHandler
};