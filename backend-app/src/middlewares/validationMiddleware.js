const responseHandler = require('../utils/responseHandler');

/**
 * Higher-order middleware to run a validator function
 * @param {Function} validatorFn - Function returning { isValid: boolean, errors: string[] }
 */
function validate(validatorFn) {
  return (req, res, next) => {
    const result = validatorFn(req.body);
    if (!result.isValid) {
      return responseHandler.badRequest(res, 'Validasi data gagal.', result.errors);
    }
    next();
  };
}

module.exports = {
  validate
};
