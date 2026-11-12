/**
 * Authentication Service
 * Manages user logins, registration, session state, and profile persistence.
 */

import { api } from './api';

const CURRENT_USER_KEY = 'sikarir_current_user';
const TOKEN_KEY = 'sikarir_token';

export const authService = {
  /**
   * Log in user
   * @param {string} email
   * @param {string} password
   * @param {string} role (optional override)
   */
  async login(email, password, role = null) {
    // Artificial latency for authentic async feel
    await new Promise(resolve => setTimeout(resolve, 200));

    const users = api.getCollection('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error('Email tidak terdaftar dalam sistem.');
    }

    if (role && user.role !== role) {
      throw new Error(`Akun ini tidak memiliki hak akses sebagai ${role}.`);
    }

    const token = `jwt_token_${user.id}_${Date.now()}`;
    const userSession = { ...user, token };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSession));
    localStorage.setItem(TOKEN_KEY, token);

    return userSession;
  },

  /**
   * Quick Demo Login for fast evaluation
   * @param {'admin' | 'PencariKerja' | 'Perusahaan'} role
   */
  async loginDemo(role) {
    const users = api.getCollection('users');
    let user = users.find(u => u.role === role);

    if (!user) {
      // Create fallback if not found
      if (role === 'admin') {
        user = {
          id: 'usr_admin_1',
          name: 'Administrator Karir',
          email: 'admin@karir.go.id',
          role: 'admin'
        };
      } else if (role === 'PencariKerja') {
        user = {
          id: 'usr_pk_1',
          name: 'Rizky Pratama, S.Kom',
          email: 'rizky.pratama@gmail.com',
          role: 'PencariKerja'
        };
      } else {
        user = {
          id: 'usr_pt_1',
          name: 'PT Telkom Digital Solusi',
          email: 'hrd@telkomdigital.co.id',
          role: 'Perusahaan'
        };
      }
    }

    const token = `jwt_token_${user.id}_demo`;
    const userSession = { ...user, token };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSession));
    localStorage.setItem(TOKEN_KEY, token);

    return userSession;
  },

  /**
   * Register a new user
   * @param {object} registerData
   */
  async register(registerData) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const users = api.getCollection('users');
    const existing = users.find(u => u.email.toLowerCase() === registerData.email.toLowerCase());

    if (existing) {
      throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau login.');
    }

    const newUser = api.addItem('users', {
      name: registerData.name,
      email: registerData.email,
      role: registerData.role,
      phone: registerData.phone || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(registerData.name)}&background=4f46e5&color=fff`,
      ...(registerData.role === 'PencariKerja' ? {
        headline: registerData.headline || 'Pencari Kerja Aktif',
        statusKarir: 'Menganggur',
        location: registerData.location || 'Indonesia',
        bio: registerData.bio || 'Siap berkembang dan berkontribusi secara profesional.'
      } : {
        industry: registerData.industry || 'Umum',
        location: registerData.location || 'Indonesia',
        website: registerData.website || '',
        verified: false,
        description: registerData.description || 'Perusahaan penyedia lowongan pekerjaan berkualitas.'
      })
    });

    const token = `jwt_token_${newUser.id}_${Date.now()}`;
    const userSession = { ...newUser, token };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSession));
    localStorage.setItem(TOKEN_KEY, token);

    return userSession;
  },

  /**
   * Get current user from active session
   */
  getCurrentUser() {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Update active user profile
   * @param {object} updates
   */
  async updateProfile(updates) {
    const current = this.getCurrentUser();
    if (!current) throw new Error('Tidak ada sesi login aktif.');

    const updated = api.updateItem('users', current.id, updates);
    const updatedSession = { ...current, ...updated };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedSession));
    return updatedSession;
  },

  /**
   * Log out and clear session tokens
   */
  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Request password reset code
   * @param {string} email
   */
  async requestPasswordReset(email) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const users = api.getCollection('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error('Alamat email tidak ditemukan dalam pangkalan data.');
    }

    return {
      success: true,
      message: 'Kode instruksi reset kata sandi telah dikirim ke email Anda.'
    };
  },

  /**
   * Reset password with verification token
   * @param {string} email
   * @param {string} newPassword
   */
  async resetPassword(email, newPassword) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const users = api.getCollection('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    api.updateItem('users', user.id, { password: newPassword });
    return { success: true };
  }
};

export default authService;
