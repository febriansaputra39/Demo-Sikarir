const fs = require('fs');
const http = require('http');
const path = require('path');
const app = require('./src/app');
const { PORT, NODE_ENV } = require('./src/config/environment');
const { initDatabase, closeDatabase } = require('./src/config/database');
const logger = require('./src/utils/logger');

const server = http.createServer(app);
const listenPort = Number(PORT) || 5000;
let isShuttingDown = false;

const ensureUploadDirectory = () => {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

const gracefulShutdown = (signal, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Menerima sinyal ${signal}. Menutup server dengan aman...`);

  // Paksa keluar jika koneksi aktif tidak kunjung selesai dalam 10 detik
  const forceExitTimer = setTimeout(() => {
    logger.warn('Waktu penutupan habis. Menghentikan proses server secara paksa.');
    process.exit(exitCode || 1);
  }, 10000);
  forceExitTimer.unref();

  if (server.listening) {
    server.close(async (err) => {
      clearTimeout(forceExitTimer);
      if (err) {
        logger.error('Terjadi kesalahan saat menutup server HTTP:', err);
        process.exit(1);
      }

      try {
        if (typeof closeDatabase === 'function') {
          await closeDatabase();
          logger.info('Koneksi database berhasil ditutup.');
        }
      } catch (dbErr) {
        logger.error('Gagal menutup koneksi database:', dbErr);
      }

      logger.info('Server HTTP berhasil ditutup.');
      process.exit(exitCode);
    });
  } else {
    clearTimeout(forceExitTimer);
    process.exit(exitCode);
  }
};

// Daftarkan error listener sebelum server.listen()
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${listenPort} sudah digunakan oleh proses lain.`);
  } else if (err.code === 'EACCES') {
    logger.error(`Hak akses tidak mencukupi untuk menjalankan server di port ${listenPort}.`);
  } else {
    logger.error('Kesalahan fatal pada server HTTP:', err);
  }
  process.exit(1);
});

const startServer = async () => {
  try {
    ensureUploadDirectory();
    await initDatabase();

    // Pengaturan timeout untuk memitigasi serangan Slowloris
    server.timeout = 30000; // 30 detik
    server.keepAliveTimeout = 65000; // 65 detik
    server.headersTimeout = 66000; // 66 detik (harus lebih besar dari keepAliveTimeout)

    server.listen(listenPort, () => {
      logger.info('=======================================================');
      logger.info('🚀 Server SiPakar Bontang / KarirKu Backend berjalan aktif!');
      logger.info(`🌐 Mode: ${NODE_ENV}`);
      logger.info(`📡 URL: http://localhost:${listenPort}`);
      logger.info(`🔍 Health Check: http://localhost:${listenPort}/api/health`);
      logger.info('=======================================================');
    });
  } catch (initError) {
    logger.error('Gagal menginisialisasi aplikasi saat startup:', initError);
    process.exit(1);
  }
};

// Jalankan server hanya jika file ini dieksekusi langsung (bukan di-import oleh test)
if (require.main === module) {
  startServer();
}

// Tangani sinyal terminasi proses
process.on('SIGTERM', () => gracefulShutdown('SIGTERM', 0));
process.on('SIGINT', () => gracefulShutdown('SIGINT', 0));

// Tangani Unhandled Promise Rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
  if (NODE_ENV === 'production') {
    gracefulShutdown('UNHANDLED_REJECTION', 1);
  }
});

// Tangani Uncaught Exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION', 1);
});

module.exports = { server, startServer };