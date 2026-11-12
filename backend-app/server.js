const app = require('./src/app');
const { PORT, NODE_ENV } = require('./src/config/environment');
const { initDatabase } = require('./src/config/database');
const logger = require('./src/utils/logger');

// Initialize database
initDatabase();

const server = app.listen(PORT, () => {
  logger.info(`=======================================================`);
  logger.info(`🚀 Server KarirKu Backend berjalan aktif!`);
  logger.info(`🌐 Mode: ${NODE_ENV}`);
  logger.info(`📡 URL: http://localhost:${PORT}`);
  logger.info(`🔍 Health Check: http://localhost:${PORT}/api/health`);
  logger.info(`=======================================================`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Menerima sinyal SIGTERM. Menutup server dengan aman...');
  server.close(() => {
    logger.info('Server ditutup.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('Menerima sinyal SIGINT. Menutup server...');
  server.close(() => {
    logger.info('Server ditutup.');
    process.exit(0);
  });
});

module.exports = server;
