const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/environment');

/**
 * Generate JWT token for user authentication
 * @param {object} payload
 * @returns {string} token
 */
function generateToken(payload) {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify JWT token
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  generateToken,
  verifyToken
};
