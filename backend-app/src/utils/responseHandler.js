/**
 * Standardized API Response Helper
 */

const responseHandler = {
  success: (res, message = 'Operasi berhasil', data = null, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  },

  created: (res, message = 'Data berhasil dibuat', data = null) => {
    return res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  },

  error: (res, message = 'Terjadi kesalahan sistem', statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  },

  badRequest: (res, message = 'Permintaan tidak valid', errors = null) => {
    return res.status(400).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  },

  unauthorized: (res, message = 'Akses ditolak: Autentikasi diperlukan') => {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  },

  forbidden: (res, message = 'Akses ditolak: Hak akses tidak mencukupi') => {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  },

  notFound: (res, message = 'Data atau resource tidak ditemukan') => {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = responseHandler;
