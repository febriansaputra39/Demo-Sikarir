const { dbService } = require('../config/database');

const ALLOWED_CAREER_STATUSES = new Set([
  'Mencari Kerja',
  'Bekerja',
  'Wirausaha',
  'Melanjutkan Pendidikan',
  'Tidak Aktif'
]);

const stripSensitiveUserFields = (user) => {
  if (!user || typeof user !== 'object') return null;
  const { password, resetToken, resetTokenExpiry, ...safeUser } = user;
  return safeUser;
};

const jobseekerModel = {
  findAll: (filters = {}) => {
    const safeFilters = filters && typeof filters === 'object' && !Array.isArray(filters) ? filters : {};
    let list = dbService.get('users').filter((u) => u.role === 'PencariKerja');

    if (
      typeof safeFilters.statusKarir === 'string' &&
      safeFilters.statusKarir.trim() &&
      safeFilters.statusKarir !== 'Semua'
    ) {
      const targetStatus = safeFilters.statusKarir.trim();
      list = list.filter((u) => u.statusKarir === targetStatus);
    }

    if (typeof safeFilters.search === 'string' && safeFilters.search.trim()) {
      const q = safeFilters.search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          (typeof u.name === 'string' && u.name.toLowerCase().includes(q)) ||
          (typeof u.headline === 'string' && u.headline.toLowerCase().includes(q)) ||
          (typeof u.location === 'string' && u.location.toLowerCase().includes(q))
      );
    }

    return list.map(stripSensitiveUserFields);
  },

  findById: (id) => {
    if (!id || typeof id !== 'string') return null;
    const user = dbService.findById('users', id.trim());
    if (!user || user.role !== 'PencariKerja') return null;
    return stripSensitiveUserFields(user);
  },

  updateCareerStatus: (id, statusKarir) => {
    if (!id || typeof id !== 'string' || typeof statusKarir !== 'string') {
      return null;
    }

    const cleanId = id.trim();
    const cleanStatus = statusKarir.trim();

    if (!ALLOWED_CAREER_STATUSES.has(cleanStatus)) {
      throw new Error(`Status karir "${cleanStatus}" tidak valid.`);
    }

    const existing = dbService.findById('users', cleanId);
    if (!existing || existing.role !== 'PencariKerja') return null;

    const updated = dbService.update('users', cleanId, {
      statusKarir: cleanStatus,
      statusUpdatedAt: new Date().toISOString()
    });

    return stripSensitiveUserFields(updated);
  },

  updateCV: (id, cvUrl) => {
    if (!id || typeof id !== 'string' || typeof cvUrl !== 'string' || !cvUrl.trim()) {
      return null;
    }

    const cleanId = id.trim();
    const existing = dbService.findById('users', cleanId);
    if (!existing || existing.role !== 'PencariKerja') return null;

    const updated = dbService.update('users', cleanId, {
      cvUrl: cvUrl.trim(),
      cvUpdatedAt: new Date().toISOString()
    });

    return stripSensitiveUserFields(updated);
  },

  getFullProfile: (id) => {
    if (!id || typeof id !== 'string') return null;
    const cleanId = id.trim();

    const user = dbService.findById('users', cleanId);
    if (!user || user.role !== 'PencariKerja') return null;

    const educations = dbService
      .filter('educations', (e) => e.userId === cleanId)
      .sort((a, b) => (Number.parseInt(b.endYear || b.startYear, 10) || 0) - (Number.parseInt(a.endYear || a.startYear, 10) || 0));

    const experiences = dbService
      .filter('experiences', (exp) => exp.userId === cleanId)
      .sort((a, b) => {
        if (Boolean(a.isCurrent) !== Boolean(b.isCurrent)) return a.isCurrent ? -1 : 1;
        return new Date(b.endDate || b.startDate || 0) - new Date(a.endDate || a.startDate || 0);
      });

    const skills = dbService
      .filter('skills', (s) => s.userId === cleanId)
      .sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0));

    const activities = dbService
      .filter('activities', (a) => a.userId === cleanId)
      .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

    return {
      ...stripSensitiveUserFields(user),
      educations,
      experiences,
      skills,
      activities
    };
  }
};

module.exports = jobseekerModel;