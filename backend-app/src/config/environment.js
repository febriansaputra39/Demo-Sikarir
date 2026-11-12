const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_sikarir_2026_modern_secure',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  UPLOAD_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 5 * 1024 * 1024,
  DATA_PATH: process.env.DATA_PATH || path.join(__dirname, '../../data/database.json')
};
