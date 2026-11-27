const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userModel = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');
const logger = require('../utils/logger');
const { NODE_ENV } = require('../config/environment');

const BCRYPT_ROUNDS = 12;
const ALLOWED_REGISTER_ROLES = ['PencariKerja', 'Perusahaan'];

// Hash dummy untuk menyamakan waktu eksekusi bcrypt saat email tidak ditemukan (anti timing-attack)
const DUMMY_BCRYPT_HASH = '$2a$12$CwTycUXWue0Thq9StjUM0uJ8h/6b.n0P9R1f/9R9d6l2S3wH1u2W2';

// Penyimpanan sementara token reset password (gunakan Redis di produksi berskala besar)
const resetTokens = new Map();
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 menit

const createHttpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const hashResetToken = (rawToken) => {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
};

const cleanupExpiredResetTokens = () => {
  const now = Date.now();
  for (const [tokenHash, data] of resetTokens.entries()) {
    if (data.expiresAt <= now) {
      resetTokens.delete(tokenHash);
    }
  }
};

const authService = {
  async register(registerData) {
    if (!registerData || typeof registerData !== 'object') {
      throw createHttpError('Data pendaftaran tidak valid.', 400);
    }

    if (typeof registerData.password !== 'string' || registerData.password.length < 8) {
      throw createHttpError('Kata sandi wajib diisi minimal 8 karakter.', 400);
    }

    // Cegah pendaftaran mandiri sebagai admin
    if (!registerData.role || !ALLOWED_REGISTER_ROLES.includes(registerData.role)) {
      throw createHttpError('Peran akun hanya boleh PencariKerja atau Perusahaan.', 400);
    }

    const cleanName = typeof registerData.name === 'string' ? registerData.name.trim() : '';
    if (!cleanName) {
      throw createHttpError('Nama lengkap atau nama perusahaan wajib diisi.', 400);
    }

    const email = typeof registerData.email === 'string' ? registerData.email.toLowerCase().trim() : '';
    if (!email) {
      throw createHttpError('Email wajib diisi.', 400);
    }

    const existing = userModel.findByEmail(email);
    if (existing) {
      throw createHttpError('Alamat email sudah terdaftar dalam sistem.', 409);
    }

    const hashedPassword = await bcrypt.hash(registerData.password, BCRYPT_ROUNDS);

    const newUser = userModel.create({
      name: cleanName,
      email,
      password: hashedPassword,
      role: registerData.role,
      phone: typeof registerData.phone === 'string' ? registerData.phone.trim() : '',
      avatar:
        (typeof registerData.avatar === 'string' && registerData.avatar.trim()) ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=4f46e5&color=fff`,
      ...(registerData.role === 'PencariKerja'
        ? {
          headline:
            typeof registerData.headline === 'string' && registerData.headline.trim()
              ? registerData.headline.trim()
              : 'Pencari Kerja Aktif',
          statusKarir: 'Mencari Kerja',
          location:
            typeof registerData.location === 'string' && registerData.location.trim()
              ? registerData.location.trim()
              : 'Indonesia',
          bio:
            typeof registerData.bio === 'string' && registerData.bio.trim()
              ? registerData.bio.trim()
              : 'Siap berkembang dan berkontribusi secara profesional.',
          targetGaji: Math.max(0, Number(registerData.targetGaji) || 0)
        }
        : {
          industry:
            typeof registerData.industry === 'string' && registerData.industry.trim()
              ? registerData.industry.trim()
              : 'Umum',
          location:
            typeof registerData.location === 'string' && registerData.location.trim()
              ? registerData.location.trim()
              : 'Indonesia',
          website: typeof registerData.website === 'string' ? registerData.website.trim() : '',
          verified: false,
          description:
            typeof registerData.description === 'string' && registerData.description.trim()
              ? registerData.description.trim()
              : 'Perusahaan penyedia lowongan pekerjaan.'
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
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      throw createHttpError('Email dan kata sandi wajib diisi.', 400);
    }

    const user = userModel.findByEmail(email.trim());

    if (!user || (role && user.role !== role) || !user.password) {
      // Jalankan perbandingan bcrypt dummy agar waktu respons konstan (mencegah user enumeration)
      await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
      throw createHttpError('Email atau kata sandi tidak cocok.', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createHttpError('Email atau kata sandi tidak cocok.', 401);
    }

    const token = generateToken(user);
    const { password: _userPassword, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  },

  async loginDemo(role) {
    if (NODE_ENV === 'production') {
      throw createHttpError('Login demo tidak tersedia dalam mode produksi.', 403);
    }

    const validDemoRoles = ['PencariKerja', 'Perusahaan', 'admin'];
    if (!validDemoRoles.includes(role)) {
      throw createHttpError('Role demo tidak valid.', 400);
    }

    const users = userModel.findAll((u) => u.role === role);
    const user = users[0];

    if (!user) {
      throw createHttpError('Akun demo tidak ditemukan untuk role ini.', 404);
    }

    const token = generateToken(user);
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  },

  async getProfile(userId) {
    if (!userId || typeof userId !== 'string') {
      throw createHttpError('ID pengguna tidak valid.', 400);
    }

    const user = userModel.findById(userId.trim());
    if (!user) {
      throw createHttpError('Pengguna tidak ditemukan.', 404);
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async updateProfile(userId, updates) {
    if (!userId || typeof userId !== 'string') {
      throw createHttpError('ID pengguna tidak valid.', 400);
    }
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw createHttpError('Data pembaruan profil tidak valid.', 400);
    }

    // Cegah perubahan properti sensitif melalui pembaruan profil standar
    const {
      role: _ignoredRole,
      password: _ignoredPassword,
      id: _ignoredId,
      email: _ignoredEmail,
      verified: _ignoredVerified,
      createdAt: _ignoredCreatedAt,
      ...safeUpdates
    } = updates;

    const updated = userModel.update(userId.trim(), safeUpdates);
    if (!updated) {
      throw createHttpError('Pengguna tidak ditemukan atau gagal memperbarui profil.', 404);
    }

    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  },

  async requestPasswordReset(email) {
    const genericResponse = {
      success: true,
      message: 'Jika email terdaftar, instruksi reset kata sandi telah dikirim.'
    };

    if (typeof email !== 'string' || !email.trim()) {
      return genericResponse;
    }

    cleanupExpiredResetTokens();

    const user = userModel.findByEmail(email.trim());
    if (!user) {
      return genericResponse;
    }

    // Batalkan token reset lama milik user yang sama jika masih aktif
    for (const [existingHash, data] of resetTokens.entries()) {
      if (data.userId === user.id) {
        resetTokens.delete(existingHash);
      }
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(rawResetToken);

    resetTokens.set(tokenHash, {
      userId: user.id,
      email: user.email,
      expiresAt: Date.now() + RESET_TOKEN_EXPIRY_MS
    });

    if (NODE_ENV !== 'production') {
      logger.info(`[DEV] Password reset token generated for ${user.email}`);
      return {
        ...genericResponse,
        resetToken: rawResetToken
      };
    }

    logger.info(`Password reset requested for user ID: ${user.id}`);
    return genericResponse;
  },

  async resetPassword(email, newPassword, resetToken) {
    if (typeof email !== 'string' || !email.trim()) {
      throw createHttpError('Email wajib diisi.', 400);
    }

    if (typeof resetToken !== 'string' || !resetToken.trim()) {
      throw createHttpError('Token reset password diperlukan.', 400);
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      throw createHttpError('Kata sandi baru minimal 8 karakter.', 400);
    }

    cleanupExpiredResetTokens();

    const tokenHash = hashResetToken(resetToken.trim());
    const tokenData = resetTokens.get(tokenHash);
    if (!tokenData) {
      throw createHttpError('Token reset tidak valid atau sudah digunakan.', 400);
    }

    if (tokenData.expiresAt <= Date.now()) {
      resetTokens.delete(tokenHash);
      throw createHttpError('Token reset telah kadaluarsa. Silakan minta ulang.', 400);
    }

    if (tokenData.email.toLowerCase() !== email.trim().toLowerCase()) {
      throw createHttpError('Token reset tidak cocok dengan email yang diberikan.', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const updatedUser = userModel.update(tokenData.userId, { password: hashedPassword });
    if (!updatedUser) {
      throw createHttpError('Akun pengguna tidak ditemukan.', 404);
    }

    // Hanguskan token segera setelah digunakan
    resetTokens.delete(tokenHash);

    return {
      success: true,
      message: 'Kata sandi berhasil diperbarui. Silakan login kembali.'
    };
  }
};

module.exports = authService;