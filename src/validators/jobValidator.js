const VALID_JOB_TYPES = ['Full Time', 'Part Time', 'Magang', 'Kontrak', 'Freelance'];
const VALID_WORKPLACE_TYPES = ['On-site', 'Remote', 'Hybrid'];
const VALID_VERIFICATION_STATUSES = ['Disetujui', 'Ditolak', 'Menunggu'];

const isNonEmptyObject = (data) =>
  Boolean(data) && typeof data === 'object' && !Array.isArray(data);

const isValidDateString = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false;
  return !Number.isNaN(Date.parse(value.trim()));
};

const validateCommonJobFields = (data, errors, isUpdate = false) => {
  if (!isUpdate || data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim().length < 3) {
      errors.push('Judul lowongan pekerjaan wajib diisi minimal 3 karakter.');
    } else if (data.title.trim().length > 150) {
      errors.push('Judul lowongan pekerjaan maksimal 150 karakter.');
    }
  }

  if (!isUpdate || data.category !== undefined) {
    if (typeof data.category !== 'string' || data.category.trim().length === 0) {
      errors.push('Kategori pekerjaan wajib diisi.');
    } else if (data.category.trim().length > 80) {
      errors.push('Kategori pekerjaan maksimal 80 karakter.');
    }
  }

  if (!isUpdate || data.jobType !== undefined) {
    if (typeof data.jobType !== 'string' || !VALID_JOB_TYPES.includes(data.jobType.trim())) {
      errors.push(`Tipe pekerjaan harus salah satu dari: ${VALID_JOB_TYPES.join(', ')}.`);
    }
  }

  if (!isUpdate || data.description !== undefined) {
    if (typeof data.description !== 'string' || data.description.trim().length < 10) {
      errors.push('Deskripsi pekerjaan wajib diisi minimal 10 karakter.');
    } else if (data.description.trim().length > 10000) {
      errors.push('Deskripsi pekerjaan maksimal 10.000 karakter.');
    }
  }

  if (data.workplaceType !== undefined && data.workplaceType !== null && data.workplaceType !== '') {
    if (
      typeof data.workplaceType !== 'string' ||
      !VALID_WORKPLACE_TYPES.includes(data.workplaceType.trim())
    ) {
      errors.push(`Tipe lokasi kerja harus salah satu dari: ${VALID_WORKPLACE_TYPES.join(', ')}.`);
    }
  }

  if (data.location !== undefined && data.location !== null && data.location !== '') {
    if (typeof data.location !== 'string' || data.location.trim().length > 150) {
      errors.push('Lokasi penempatan maksimal 150 karakter.');
    }
  }

  if (data.educationLevel !== undefined && data.educationLevel !== null && data.educationLevel !== '') {
    if (typeof data.educationLevel !== 'string' || data.educationLevel.trim().length > 50) {
      errors.push('Jenjang pendidikan minimal tidak valid.');
    }
  }

  if (data.experienceLevel !== undefined && data.experienceLevel !== null && data.experienceLevel !== '') {
    if (typeof data.experienceLevel !== 'string' || data.experienceLevel.trim().length > 50) {
      errors.push('Tingkat pengalaman kerja tidak valid.');
    }
  }

  if (data.requiredSkills !== undefined && data.requiredSkills !== null) {
    if (!Array.isArray(data.requiredSkills)) {
      errors.push('Daftar keahlian yang dibutuhkan (requiredSkills) harus berupa array.');
    } else if (data.requiredSkills.length > 30) {
      errors.push('Maksimal 30 keahlian yang dapat dicantumkan pada satu lowongan.');
    } else {
      const hasInvalidSkill = data.requiredSkills.some(
        (skill) => typeof skill !== 'string' || skill.trim().length === 0 || skill.trim().length > 80
      );
      if (hasInvalidSkill) {
        errors.push('Setiap item pada requiredSkills harus berupa teks valid (maksimal 80 karakter).');
      }
    }
  }

  const hasMinSalary = data.salaryMin !== undefined && data.salaryMin !== null && data.salaryMin !== '';
  const hasMaxSalary = data.salaryMax !== undefined && data.salaryMax !== null && data.salaryMax !== '';

  if (hasMinSalary) {
    const minSal = Number(data.salaryMin);
    if (Number.isNaN(minSal) || minSal < 0) {
      errors.push('Gaji minimum harus berupa angka positif.');
    }
  }

  if (hasMaxSalary) {
    const maxSal = Number(data.salaryMax);
    if (Number.isNaN(maxSal) || maxSal < 0) {
      errors.push('Gaji maksimum harus berupa angka positif.');
    }
  }

  if (
    hasMinSalary &&
    hasMaxSalary &&
    !Number.isNaN(Number(data.salaryMin)) &&
    !Number.isNaN(Number(data.salaryMax)) &&
    Number(data.salaryMin) > Number(data.salaryMax)
  ) {
    errors.push('Gaji minimum tidak boleh lebih besar dari gaji maksimum.');
  }

  if (data.deadline !== undefined && data.deadline !== null && data.deadline !== '') {
    if (!isValidDateString(data.deadline)) {
      errors.push('Format batas waktu lamaran (deadline) tidak valid.');
    }
  }
};

const jobValidator = {
  validateCreateJob: (data) => {
    const errors = [];
    if (!isNonEmptyObject(data)) {
      return { isValid: false, errors: ['Payload pembuatan lowongan tidak valid.'] };
    }

    validateCommonJobFields(data, errors, false);

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateUpdateJob: (data) => {
    const errors = [];
    if (!isNonEmptyObject(data)) {
      return { isValid: false, errors: ['Payload pembaruan lowongan tidak valid.'] };
    }

    validateCommonJobFields(data, errors, true);

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateVerification: (data) => {
    const errors = [];
    if (!isNonEmptyObject(data)) {
      return { isValid: false, errors: ['Payload verifikasi lowongan tidak valid.'] };
    }

    if (typeof data.status !== 'string' || !VALID_VERIFICATION_STATUSES.includes(data.status)) {
      errors.push(`Status verifikasi harus salah satu dari: ${VALID_VERIFICATION_STATUSES.join(', ')}.`);
    }

    if (data.note !== undefined && data.note !== null) {
      if (typeof data.note !== 'string' || data.note.trim().length > 500) {
        errors.push('Catatan verifikasi maksimal 500 karakter.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

module.exports = jobValidator;