const { NODE_ENV } = require('../config/environment');

const logger = {
  info: (message, meta = '') => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO]  [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message, meta = '') => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN]  [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message, meta = '') => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] [${timestamp}] ${message}`, meta ? (meta.stack || JSON.stringify(meta)) : '');
  },
  debug: (message, meta = '') => {
    if (NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.log(`[DEBUG] [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  }
};

module.exports = logger;
