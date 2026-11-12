const authValidator = {
  validateRegister: (data) => {
    const errors = [];
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
      errors.push('Nama lengkap wajib diisi minimal 2 karakter.');
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Format email tidak valid.');
    }
    if (!data.password || data.password.length < 6) {
      errors.push('Kata sandi wajib diisi minimal 6 karakter.');
    }
    if (!data.role || !['admin', 'PencariKerja', 'Perusahaan'].includes(data.role)) {
      errors.push('Peran akun harus salah satu dari: PencariKerja, Perusahaan, atau admin.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateLogin: (data) => {
    const errors = [];
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Format email tidak valid.');
    }
    if (!data.password) {
      errors.push('Kata sandi wajib diisi.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateResetPassword: (data) => {
    const errors = [];
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Format email tidak valid.');
    }
    if (!data.newPassword || data.newPassword.length < 6) {
      errors.push('Kata sandi baru wajib diisi minimal 6 karakter.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

module.exports = authValidator;
