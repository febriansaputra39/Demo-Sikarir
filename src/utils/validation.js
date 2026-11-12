/**
 * Comprehensive Validation Utilities for Forms and Input Verification
 */

/**
 * Validate email address format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Validate Indonesian phone number (08xx, +628xx, 628xx, 10-14 digits)
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  const regex = /^(\+62|62|0)8[1-9][0-9]{7,11}$/;
  return regex.test(cleaned);
}

/**
 * Check password strength and return validity with feedback
 * @param {string} password
 * @returns {{ isValid: boolean, score: number, message: string }}
 */
export function checkPasswordStrength(password) {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      score: 1,
      message: 'Password minimal harus 6 karakter'
    };
  }

  let score = 1;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (password.length >= 8) score++;
  if (hasUpper && hasLower) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  let message = 'Lemah';
  if (score >= 4) message = 'Sangat Kuat';
  else if (score >= 3) message = 'Kuat';
  else if (score >= 2) message = 'Sedang';

  return {
    isValid: password.length >= 6,
    score,
    message
  };
}

/**
 * Validate standard URL
 * @param {string} url
 * @returns {boolean}
 */
export function isValidURL(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate Indonesian NIK (16 digits)
 * @param {string} nik
 * @returns {boolean}
 */
export function isValidNIK(nik) {
  if (!nik) return false;
  const cleaned = String(nik).trim();
  return /^\d{16}$/.test(cleaned);
}

/**
 * Validate Job Posting data
 * @param {object} jobData
 * @returns {{ isValid: boolean, errors: object }}
 */
export function validateJobForm(jobData) {
  const errors = {};

  if (!jobData.title || jobData.title.trim().length < 3) {
    errors.title = 'Judul lowongan minimal 3 karakter';
  }

  if (!jobData.category) {
    errors.category = 'Pilih kategori bidang lowongan';
  }

  if (!jobData.location || jobData.location.trim().length < 2) {
    errors.location = 'Lokasi penempatan wajib diisi';
  }

  if (!jobData.jobType) {
    errors.jobType = 'Pilih tipe pekerjaan (Full Time, Part Time, dll)';
  }

  if (jobData.salaryMin && jobData.salaryMax && Number(jobData.salaryMin) > Number(jobData.salaryMax)) {
    errors.salaryMax = 'Gaji maksimal tidak boleh lebih rendah dari gaji minimal';
  }

  if (!jobData.description || jobData.description.trim().length < 20) {
    errors.description = 'Deskripsi pekerjaan minimal 20 karakter agar jelas bagi pelamar';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate user registration form
 * @param {object} formData
 * @returns {{ isValid: boolean, errors: object }}
 */
export function validateRegisterForm(formData) {
  const errors = {};

  if (!formData.name || formData.name.trim().length < 2) {
    errors.name = 'Nama lengkap wajib diisi minimal 2 karakter';
  }

  if (!formData.email || !isValidEmail(formData.email)) {
    errors.email = 'Format email tidak valid';
  }

  if (!formData.password || formData.password.length < 6) {
    errors.password = 'Password minimal 6 karakter';
  }

  if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password tidak cocok';
  }

  if (!formData.role) {
    errors.role = 'Pilih peran akun (Pencari Kerja atau Perusahaan)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export default {
  isValidEmail,
  isValidPhone,
  checkPasswordStrength,
  isValidURL,
  isValidNIK,
  validateJobForm,
  validateRegisterForm
};
