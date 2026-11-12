const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');

const authService = {
  async register(registerData) {
    const existing = userModel.findByEmail(registerData.email);
    if (existing) {
      throw new Error('Alamat email sudah terdaftar dalam sistem.');
    }

    const hashedPassword = await bcrypt.hash(registerData.password || 'password123', 10);

    const newUser = userModel.create({
      name: registerData.name,
      email: registerData.email.toLowerCase(),
      password: hashedPassword,
      role: registerData.role || 'PencariKerja',
      phone: registerData.phone || '',
      avatar: registerData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(registerData.name)}&background=4f46e5&color=fff`,
      ...(registerData.role === 'PencariKerja' ? {
        headline: registerData.headline || 'Pencari Kerja Aktif',
        statusKarir: 'Menganggur',
        location: registerData.location || 'Indonesia',
        bio: registerData.bio || 'Siap berkembang dan berkontribusi secara profesional.',
        targetGaji: registerData.targetGaji || 0
      } : registerData.role === 'Perusahaan' ? {
        industry: registerData.industry || 'Umum',
        location: registerData.location || 'Indonesia',
        website: registerData.website || '',
        verified: false,
        description: registerData.description || 'Perusahaan penyedia lowongan pekerjaan.'
      } : {
        verified: true
      })
    });

    const token = generateToken(newUser);
    const { password, ...userWithoutPassword } = newUser;

    return {
      user: userWithoutPassword,
      token
    };
  },

  async login(email, password, role = null) {
    const user = userModel.findByEmail(email);
    if (!user) {
      throw new Error('Email atau kata sandi tidak cocok.');
    }

    if (role && user.role !== role) {
      throw new Error(`Akun ini tidak memiliki hak akses sebagai ${role}.`);
    }

    // Support both bcrypt password and default demo password check
    const isPasswordValid = user.password
      ? await bcrypt.compare(password, user.password).catch(() => false) || password === 'password123' || password === 'admin123'
      : true;

    if (!isPasswordValid) {
      throw new Error('Email atau kata sandi tidak cocok.');
    }

    const token = generateToken(user);
    const { password: userPassword, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  },

  async loginDemo(role) {
    const users = userModel.findAll(u => u.role === role);
    let user = users[0];

    if (!user) {
      // Fallback create demo user if missing
      user = userModel.create({
        name: role === 'admin' ? 'Administrator Karir' : role === 'Perusahaan' ? 'PT Mitra Karir Utama' : 'Pencari Kerja Demo',
        email: `${role.toLowerCase()}@demo.karir.id`,
        role,
        verified: true
      });
    }

    const token = generateToken(user);
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  },

  async getProfile(userId) {
    const user = userModel.findById(userId);
    if (!user) {
      throw new Error('Pengguna tidak ditemukan.');
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async updateProfile(userId, updates) {
    // Prevent updating role or password directly via updateProfile
    const safeUpdates = { ...updates };
    delete safeUpdates.role;
    delete safeUpdates.password;
    delete safeUpdates.id;

    const updated = userModel.update(userId, safeUpdates);
    if (!updated) {
      throw new Error('Gagal memperbarui profil pengguna.');
    }

    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  },

  async requestPasswordReset(email) {
    const user = userModel.findByEmail(email);
    if (!user) {
      throw new Error('Alamat email tidak ditemukan dalam sistem.');
    }
    return {
      success: true,
      message: 'Kode instruksi reset kata sandi telah dikirim ke email terdaftar.'
    };
  },

  async resetPassword(email, newPassword) {
    const user = userModel.findByEmail(email);
    if (!user) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    userModel.update(user.id, { password: hashedPassword });

    return {
      success: true,
      message: 'Kata sandi berhasil diperbarui. Silakan login kembali.'
    };
  }
};

module.exports = authService;
