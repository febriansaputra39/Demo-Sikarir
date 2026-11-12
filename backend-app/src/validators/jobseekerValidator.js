const jobseekerValidator = {
  validateCareerStatus: (data) => {
    const errors = [];
    const validStatuses = ['Menganggur', 'Magang', 'Bekerja', 'Pelatihan'];
    if (!data.statusKarir || !validStatuses.includes(data.statusKarir)) {
      errors.push(`Status karir harus salah satu dari: ${validStatuses.join(', ')}.`);
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateEducation: (data) => {
    const errors = [];
    if (!data.institution || data.institution.trim().length === 0) {
      errors.push('Nama institusi pendidikan wajib diisi.');
    }
    if (!data.degree || data.degree.trim().length === 0) {
      errors.push('Jenjang pendidikan (misal: S1, D3, SMA/SMK) wajib diisi.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateExperience: (data) => {
    const errors = [];
    if (!data.company || data.company.trim().length === 0) {
      errors.push('Nama instansi / perusahaan wajib diisi.');
    }
    if (!data.position || data.position.trim().length === 0) {
      errors.push('Posisi / jabatan pekerjaan wajib diisi.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateSkill: (data) => {
    const errors = [];
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Nama keahlian / skill wajib diisi.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateActivity: (data) => {
    const errors = [];
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Judul aktivitas karir / sertifikasi wajib diisi.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

module.exports = jobseekerValidator;
