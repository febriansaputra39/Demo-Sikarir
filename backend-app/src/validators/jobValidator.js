const jobValidator = {
  validateCreateJob: (data) => {
    const errors = [];
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Judul lowongan pekerjaan wajib diisi.');
    }
    if (!data.category || data.category.trim().length === 0) {
      errors.push('Kategori pekerjaan wajib diisi.');
    }
    if (!data.jobType || data.jobType.trim().length === 0) {
      errors.push('Tipe pekerjaan (Full Time / Part Time / Magang / Kontrak) wajib diisi.');
    }
    if (!data.description || data.description.trim().length < 10) {
      errors.push('Deskripsi pekerjaan wajib diisi minimal 10 karakter.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateVerification: (data) => {
    const errors = [];
    const validStatuses = ['Disetujui', 'Ditolak', 'Menunggu'];
    if (!data.status || !validStatuses.includes(data.status)) {
      errors.push(`Status verifikasi harus salah satu dari: ${validStatuses.join(', ')}.`);
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

module.exports = jobValidator;
