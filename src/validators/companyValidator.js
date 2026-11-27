const isNonEmptyObject = (data) =>
  Boolean(data) && typeof data === 'object' && !Array.isArray(data);

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      Boolean(parsed.hostname) &&
      parsed.hostname.includes('.')
    );
  } catch (_) {
    return false;
  }
};

const companyValidator = {
  validateProfileUpdate: (data) => {
    const errors = [];
    if (!isNonEmptyObject(data)) {
      return { isValid: false, errors: ['Payload pembaruan profil perusahaan tidak valid.'] };
    }

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length < 2) {
        errors.push('Nama perusahaan minimal 2 karakter.');
      } else if (data.name.trim().length > 120) {
        errors.push('Nama perusahaan maksimal 120 karakter.');
      }
    }

    if (data.website !== undefined && data.website !== null && data.website !== '') {
      if (typeof data.website !== 'string') {
        errors.push('Format URL website perusahaan tidak valid.');
      } else {
        const trimmedUrl = data.website.trim();
        if (trimmedUrl.length > 255 || !isValidHttpUrl(trimmedUrl)) {
          errors.push('Format URL website perusahaan harus valid dan diawali http:// atau https://.');
        }
      }
    }

    if (data.industry !== undefined && data.industry !== null && data.industry !== '') {
      if (typeof data.industry !== 'string' || data.industry.trim().length > 100) {
        errors.push('Bidang industri maksimal 100 karakter.');
      }
    }

    if (data.location !== undefined && data.location !== null && data.location !== '') {
      if (typeof data.location !== 'string' || data.location.trim().length > 150) {
        errors.push('Lokasi perusahaan maksimal 150 karakter.');
      }
    }

    if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
      if (typeof data.phone !== 'string' || data.phone.trim().length > 25) {
        errors.push('Nomor telepon perusahaan maksimal 25 karakter.');
      }
    }

    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description !== 'string' || data.description.trim().length > 2000) {
        errors.push('Deskripsi perusahaan maksimal 2000 karakter.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateVerification: (data) => {
    const errors = [];
    if (!isNonEmptyObject(data)) {
      return { isValid: false, errors: ['Payload verifikasi perusahaan tidak valid.'] };
    }

    if (typeof data.verified !== 'boolean') {
      errors.push('Status verified harus bernilai boolean (true/false).');
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

module.exports = companyValidator;