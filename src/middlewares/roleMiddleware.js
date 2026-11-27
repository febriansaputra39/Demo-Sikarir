const responseHandler = require('../utils/responseHandler');

/**
 * Middleware untuk membatasi akses endpoint berdasarkan peran (RBAC).
 * Mendukung pemanggilan: roleMiddleware('admin'), roleMiddleware(['admin', 'Perusahaan']),
 * atau roleMiddleware('admin', 'Perusahaan').
 *
 * @param {...(string|string[])} roles
 */
function roleMiddleware(...roles) {
  const flattened = roles
    .flat()
    .filter((r) => typeof r === 'string' && r.trim().length > 0)
    .map((r) => r.trim());

  if (flattened.length === 0) {
    throw new Error('[RBAC] roleMiddleware wajib diberikan minimal satu nama peran (role) yang valid.');
  }

  const allowedRoles = new Set(flattened);

  return (req, res, next) => {
    if (!req.user || typeof req.user !== 'object') {
      return responseHandler.unauthorized(res, 'Autentikasi diperlukan sebelum memeriksa peran akses.');
    }

    const userRole = typeof req.user.role === 'string' ? req.user.role.trim() : '';
    if (!userRole || !allowedRoles.has(userRole)) {
      return responseHandler.forbidden(
        res,
        `Akses ditolak. Endpoint ini hanya dapat diakses oleh peran: ${Array.from(allowedRoles).join(', ')}.`
      );
    }

    return next();
  };
}

module.exports = roleMiddleware;