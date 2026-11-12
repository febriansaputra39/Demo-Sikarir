const responseHandler = require('../utils/responseHandler');

/**
 * Middleware to restrict access by role
 * @param {string|string[]} roles
 */
function roleMiddleware(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return responseHandler.unauthorized(res, 'Autentikasi diperlukan sebelum memeriksa peran akses.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return responseHandler.forbidden(
        res,
        `Akses ditolak. Endpoint ini hanya dapat diakses oleh peran: ${allowedRoles.join(', ')}.`
      );
    }

    next();
  };
}

module.exports = roleMiddleware;
