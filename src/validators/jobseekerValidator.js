const VALID_CAREER_STATUSES = [
  'Mencari Kerja',
  'Menganggur',
  'Magang',
  'Bekerja',
  'Wirausaha',
  'Pelatihan',
  'Melanjutkan Pendidikan',
  'Tidak Aktif'
];

const VALID_SKILL_LEVELS = ['Pemula', 'Menengah', 'Mahir', 'Ahli'];
const VALID_ACTIVITY_TYPES = [
  'Pelatihan',
  'Sertifikasi',
  'Seminar',
  'Workshop',
  'Organisasi',
  'Kompetisi',
  'Sukarelawan',
  'Lainnya'
];

const isNonEmptyObject = (data) =>
  Boolean(data) && typeof data === 'object' && !Array.isArray(data);

const isValidDateString = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false;
  return !Number.isNaN(Date.parse(value.trim()));
};

const validateRequiredString = (value, fieldLabel, maxLen, errors) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${fieldLabel} wajib diisi.`);
    return;
  }
  if (value.trim().length > maxLen) {
    errors.push(`${fieldLabel} maksimal ${maxLen} karakter.`);
  }
};

const validateOptionalString = (value, fieldLabel, maxLen, errors) => {
  if (value === undefined || value === null || value === '') return;
  if (typeof value !== 'string') {
    errors.push(`${fieldLabel} harus berupa teks.`);
    return;
  }
  if (value.trim().length > maxLen) {
    errors.push(`${fieldLabel} maksimal ${maxLen} karakter.`);
  }
};

const jobseekerValidator = {
  validateCareerStatus: (data) => {
    const errors = [];
    if (!isNonEmptyObject(data)) {
      return { isValid: false, errors: ['Payload status karir tidak valid.'] };
    }

    if (typeof data.statusKarir !== 'string' || !VALID_CAREER_STATUSES.includes(data.statusKarir)) {
      errors.push(`Status karir harus salah satu dari: ${VALID_CAREER_STATUSES.join(', ')}.`);
    }

    validateOptionalString(data.note, 'Catatan perubahan status', 500, errors);

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateEducation: (data) => {
    const errors = [];
    if (!isNonEmptyObject(data)) {
      return { isValid: false, errors: ['Payload data pendidikan tidak valid.'] };
    }

    validateRequiredString(data.institution, 'Nama institusi pendidikan', 150, errors);
    validateRequiredString(data.degree, 'Jenjang pendidikan (misal: S1, D3, SMA/SMK)', 50, errors);
    validateOptionalString(data.major, 'Jurusan / program studi', 120, errors);
    validateOptionalString(data.description, 'Deskripsi pendidikan', 1000, errors);

    if (data.startYear !== undefined && data.startYear !== null && data.startYear !== '') {
      const startYear = Number(data.startYear);
      if (!Number.isInteger(startYear) || startYear < 1950 || startYear > 2100) {
        errors.push('Tahun mulai pendidikan tidak valid.');
      }
    }

    if (data.endYear !== undefined && data.endYear !== null && data.endYear !== '') {
      const endYear = Number(data.endYear);
      if (!Number.isInteger(endYear) || endYear < 1950 || endYear > 2100) {
        errors.push('Tahun lulus pendidikan tidak valid.');
      } else if (
        data.startYear !== undefined &&
        data.startYear !== null &&
        data.startYear !== '' &&
        !Number.isNaN(Number(data.startYear)) &&
        endYear < Number(data.startYear)
      ) {
        errors.push('Tahun lulus tidak boleh lebih kecil dari tahun mulai.');
      }
    }

    if (data.gpa !== undefined && data.gpa !== null && data.gpa !== '') {
      const gpa = Number(data.gpa);
      if (Number.isNaN(gpa) || gpa < 0 || gpa > 100) {
        errors.push('Nilai / IPK pendidikan tidak valid.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateEducationUpdate: (data) => {
    const errors = [];
    if (!isNonEmptyObject(data)) {
      return { isValid: false, errors: ['Payload pembaruan pendidikan tidak valid.'] };
    }

    if (data.institution !== undefined) {
      validateRequiredString(data.institution, 'Nama institusi pendidikan', 150, errors);
    }
    if (data.degree !== undefined) {
      validateRequiredString(data.degree, 'Jenjang pendidikan', 50, errors);
    }
    validateOptionalString(data.major, 'Jurusan / program studi', 120, errors);
    validateOptionalString(data.description, 'Deskripsi pendidikan', 1000, errors);

    if (data.startYear !== undefined && data.startYear !== null && data.startYear !== '') {
      const startYear = Number(data.startYear);
      if (!Number.isInteger(startYear) || startYear < 1950 || startYear > 2100) {
        errors.push('Tahun mulai pendidikan tidak valid.');
      }
    }

    if (data.endYear !== undefined && data.endYear !== null && data.endYear !== '') {
      const endYear = Number(data.endYear);
      if (!Number.isInteger(endYear) || endYear < 1950 || endYear > 2100) {
        errors.push('Tahun lulus pendidikan tidak valid.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateExperience: (data) => {
    const errors = [];
    if (!isNonEmptyObject(data)) {
      return { isValid: false, errors: ['Payload data pengalaman kerja tidak valid.'] };
    }

    validateRequiredString(data.company, 'Nama instansi / perusahaan', 150, errors);
    validateRequiredString(data.position, 'Posisi / jabatan pekerjaan', 120, errors);
    validateOptionalString(data.location, 'Lokasi kerja', 120, errors);
    validateOptionalString(data.description, 'Deskripsi pekerjaan', 2000, errors);

    if (data.startDate !== undefined && data.startDate !== null && data.startDate !== '') {
      if (!isValidDateString(data.startDate)) {
        errors.push('Format tanggal mulai kerja tidak valid.');
      }
    }

    if (data.endDate !== undefined && data.endDate !== null && data.endDate !== '') {
      if (!isValidDateString(data.endDate)) {
        errors.push('Format tanggal selesai kerja tidak valid.');
      } else if (
        isValidDateString(data.startDate) &&
        new Date(data.endDate) < new Date(data.startDate)
      ) {
        errors.push('Tanggal selesai kerja tidak boleh lebih awal dari tanggal mulai.');
      }
    }

    if (data.isCurrent !== undefined && typeof data.isCurrent !== 'boolean') {
      errors.push('Status masih bekerja (isCurrent) harus bernilai boolean.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateExperienceUpdate: (data) => {
    const errors = [];
    if (!isNonEmptyObject(data)) {
      return { isValid: false, errors: ['Payload pembaruan pengalaman kerja tidak valid.'] };
    }

    if (data.company !== undefined) {
      validateRequiredString(data.company, 'Nama instansi / perusahaan', 150, errors);
    }
    if (data.position !== undefined) {
      validateRequiredString(data.position, 'Posisi / jabatan pekerjaan', 120, errors);
    }
    validateOptionalString(data.location, 'Lokasi kerja', 120, errors);
    validateOptionalString(data.description, 'Deskripsi pekerjaan', 2000, errors);

    if (data.startDate !== undefined && data.startDate !== null && data.startDate !== '') {
      if (!isValidDateString(data.startDate)) {
        errors.push('Format tanggal mulai kerja tidak valid.');
      }
    }

    if (data.endDate !== undefined && data.endDate !== null && data.endDate !== '') {
      if (!isValidDateString(data.endDate)) {
        errors.push('Format tanggal selesai kerja tidak valid.');
      }
    }

    if (data.isCurrent !== undefined && typeof data.isCurrent !== 'boolean') {
      errors.push('Status masih bekerja (isCurrent) harus bernilai boolean.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateSkill: (data) => {
    const errors = [];
    if (!isNonEmptyObject(data)) {
      return { isValid: false, errors: ['Payload data keahlian tidak valid.'] };
    }

    validateRequiredString(data.name, 'Nama keahlian / skill', 80, errors);
    validateOptionalString(data.category, 'Kategori keahlian', 80, errors);

    if (data.level !== undefined && data.level !== null && data.level !== '') {
      if (typeof data.level !== 'string' || !VALID_SKILL_LEVELS.includes(data.level.trim())) {
        errors.push(`Tingkat keahlian harus salah satu dari: ${VALID_SKILL_LEVELS.join(', ')}.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateSkillUpdate: (data) => {
    const errors = [];
    if (!isNonEmptyObject(data)) {
      return { isValid: false, errors: ['Payload pembaruan keahlian tidak valid.'] };
    }

    if (data.name !== undefined) {
      validateRequiredString(data.name, 'Nama keahlian / skill', 80, errors);
    }
    validateOptionalString(data.category, 'Kategori keahlian', 80, errors);

    if (data.level !== undefined && data.level !== null && data.level !== '') {
      if (typeof data.level !== 'string' || !VALID_SKILL_LEVELS.includes(data.level.trim())) {
        errors.push(`Tingkat keahlian harus salah satu dari: ${VALID_SKILL_LEVELS.join(', ')}.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateActivity: (data) => {
    const errors = [];
    if (!isNonEmptyObject(data)) {
      return { isValid: false, errors: ['Payload data aktivitas karir tidak valid.'] };
    }

    validateRequiredString(data.title, 'Judul aktivitas karir / sertifikasi', 150, errors);
    validateOptionalString(data.organizer, 'Penyelenggara aktivitas', 150, errors);
    validateOptionalString(data.credentialId, 'Nomor kredensial / sertifikat', 100, errors);
    validateOptionalString(data.description, 'Deskripsi aktivitas', 1500, errors);

    if (data.type !== undefined && data.type !== null && data.type !== '') {
      if (typeof data.type !== 'string' || !VALID_ACTIVITY_TYPES.includes(data.type.trim())) {
        errors.push(`Jenis aktivitas harus salah satu dari: ${VALID_ACTIVITY_TYPES.join(', ')}.`);
      }
    }

    if (data.date !== undefined && data.date !== null && data.date !== '') {
      if (!isValidDateString(data.date)) {
        errors.push('Format tanggal aktivitas tidak valid.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateActivityUpdate: (data) => {
    const errors = [];
    if (!isNonEmptyObject(data)) {
      return { isValid: false, errors: ['Payload pembaruan aktivitas karir tidak valid.'] };
    }

    if (data.title !== undefined) {
      validateRequiredString(data.title, 'Judul aktivitas karir / sertifikasi', 150, errors);
    }
    validateOptionalString(data.organizer, 'Penyelenggara aktivitas', 150, errors);
    validateOptionalString(data.credentialId, 'Nomor kredensial / sertifikat', 100, errors);
    validateOptionalString(data.description, 'Deskripsi aktivitas', 1500, errors);

    if (data.type !== undefined && data.type !== null && data.type !== '') {
      if (typeof data.type !== 'string' || !VALID_ACTIVITY_TYPES.includes(data.type.trim())) {
        errors.push(`Jenis aktivitas harus salah satu dari: ${VALID_ACTIVITY_TYPES.join(', ')}.`);
      }
    }

    if (data.date !== undefined && data.date !== null && data.date !== '') {
      if (!isValidDateString(data.date)) {
        errors.push('Format tanggal aktivitas tidak valid.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

module.exports = jobseekerValidator;