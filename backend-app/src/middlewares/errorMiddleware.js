const logger = require('../utils/logger');
const responseHandler = require('../utils/responseHandler');

function errorHandler(err, req, res, next) {
  logger.error(`Unhandled Error on ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan internal pada server.';

  return responseHandler.error(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
}

function notFoundHandler(req, res, next) {
  return responseHandler.notFound(res, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan pada server API.`);
}

module.exports = {
  errorHandler,
  notFoundHandler
};
