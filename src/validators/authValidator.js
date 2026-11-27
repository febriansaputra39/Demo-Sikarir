const authValidator = {
  validateRegister: (data) => {
    const errors = [];
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
      errors.push('Nama lengkap wajib diisi minimal 2 karakter.');
    } else if (data.name.length > 100) {
      errors.push('Nama lengkap maksimal 100 karakter.');
    }
    if (!data.email || typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Format email tidak valid.');
    } else if (data.email.length > 254) {
      errors.push('Email terlalu panjang.');
    }
    if (!data.password || typeof data.password !== 'string' || data.password.length < 8) {
      errors.push('Kata sandi wajib diisi minimal 8 karakter.');
    } else if (data.password.length > 128) {
      errors.push('Kata sandi maksimal 128 karakter.');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      errors.push('Kata sandi harus mengandung huruf besar, huruf kecil, dan angka.');
    }
    if (!data.role || !['PencariKerja', 'Perusahaan'].includes(data.role)) {
      errors.push('Peran akun harus salah satu dari: PencariKerja atau Perusahaan.');
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
    if (data.password && data.password.length > 128) {
      errors.push('Kata sandi terlalu panjang.');
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
    if (!data.newPassword || data.newPassword.length < 8) {
      errors.push('Kata sandi baru wajib diisi minimal 8 karakter.');
    }
    if (data.newPassword && data.newPassword.length > 128) {
      errors.push('Kata sandi baru maksimal 128 karakter.');
    }
    if (data.newPassword && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.newPassword)) {
      errors.push('Kata sandi baru harus mengandung huruf besar, huruf kecil, dan angka.');
    }
    if (!data.resetToken) {
      errors.push('Token reset password wajib disertakan.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

module.exports = authValidator;
