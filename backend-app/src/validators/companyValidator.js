const companyValidator = {
  validateProfileUpdate: (data) => {
    const errors = [];
    if (data.name !== undefined && data.name.trim().length < 2) {
      errors.push('Nama perusahaan minimal 2 karakter.');
    }
    if (data.website && !/^https?:\/\/.+/.test(data.website)) {
      errors.push('Format URL website perusahaan harus diawali http:// atau https://.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateVerification: (data) => {
    const errors = [];
    if (typeof data.verified !== 'boolean') {
      errors.push('Status verified harus bernilai boolean (true/false).');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

module.exports = companyValidator;
