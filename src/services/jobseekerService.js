const jobseekerModel = require('../models/jobseekerModel');
const educationModel = require('../models/educationModel');
const experienceModel = require('../models/experienceModel');
const skillModel = require('../models/skillModel');
const activityModel = require('../models/activityModel');

const createHttpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * Helper untuk memverifikasi keberadaan entitas CV dan kepemilikannya (mencegah IDOR).
 * Mendukung pemanggilan baik dengan `actorUser` ({ id, role }) maupun string `userId` langsung.
 */
const assertOwnershipAndGetRecord = (model, id, actorOrUserId, resourceLabel) => {
  if (!id || typeof id !== 'string' || !id.trim()) {
    throw createHttpError(`ID ${resourceLabel} tidak valid.`, 400);
  }

  const record = model.findById(id.trim());
  if (!record) {
    throw createHttpError(`Data ${resourceLabel} tidak ditemukan.`, 404);
  }

  if (actorOrUserId) {
    const isAdmin = typeof actorOrUserId === 'object' && actorOrUserId.role === 'admin';
    const actorId = typeof actorOrUserId === 'object' ? actorOrUserId.id : actorOrUserId;

    if (!isAdmin && actorId && record.userId !== actorId) {
      throw createHttpError(`Anda tidak memiliki wewenang untuk mengubah data ${resourceLabel} ini.`, 403);
    }
  }

  return record;
};

const jobseekerService = {
  async getAllJobseekers(filters = {}) {
    return jobseekerModel.findAll(filters);
  },

  async getJobseekerById(id) {
    if (!id || typeof id !== 'string' || !id.trim()) {
      throw createHttpError('ID pencari kerja tidak valid.', 400);
    }
    const user = jobseekerModel.findById(id.trim());
    if (!user) {
      throw createHttpError('Data pencari kerja tidak ditemukan.', 404);
    }
    return user;
  },

  async updateCareerStatus(id, statusKarir, actorUser = null) {
    if (!id || typeof id !== 'string' || !id.trim()) {
      throw createHttpError('ID pencari kerja tidak valid.', 400);
    }

    const cleanId = id.trim();
    if (actorUser && actorUser.role !== 'admin' && actorUser.id !== cleanId) {
      throw createHttpError('Anda tidak memiliki wewenang untuk memperbarui status karir pengguna lain.', 403);
    }

    try {
      const updated = jobseekerModel.updateCareerStatus(cleanId, statusKarir);
      if (!updated) {
        throw createHttpError('Pencari kerja tidak ditemukan.', 404);
      }
      return updated;
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 400;
      }
      throw err;
    }
  },

  async updateCV(userId, cvUrl) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw createHttpError('ID pengguna tidak valid.', 400);
    }
    if (!cvUrl || typeof cvUrl !== 'string' || !cvUrl.trim()) {
      throw createHttpError('URL dokumen CV tidak valid.', 400);
    }

    const updated = jobseekerModel.updateCV(userId.trim(), cvUrl.trim());
    if (!updated) {
      throw createHttpError('Pencari kerja tidak ditemukan.', 404);
    }
    return updated;
  },

  async getFullProfile(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw createHttpError('ID pengguna tidak valid.', 400);
    }
    const full = jobseekerModel.getFullProfile(userId.trim());
    if (!full) {
      throw createHttpError('Profil pencari kerja tidak ditemukan.', 404);
    }
    const { password, resetToken, resetTokenExpiry, ...safeData } = full;
    return safeData;
  },

  // Education CRUD
  async getEducations(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw createHttpError('ID pengguna tidak valid.', 400);
    }
    return educationModel.findByUserId(userId.trim());
  },

  async addEducation(userId, data) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw createHttpError('ID pengguna tidak valid.', 400);
    }
    try {
      return educationModel.create({ ...data, userId: userId.trim() });
    } catch (err) {
      if (!err.statusCode) err.statusCode = 400;
      throw err;
    }
  },

  async updateEducation(id, updates, actorOrUserId = null) {
    assertOwnershipAndGetRecord(educationModel, id, actorOrUserId, 'pendidikan');
    try {
      const updated = educationModel.update(id.trim(), updates);
      if (!updated) throw createHttpError('Data pendidikan tidak ditemukan.', 404);
      return updated;
    } catch (err) {
      if (!err.statusCode) err.statusCode = 400;
      throw err;
    }
  },

  async deleteEducation(id, actorOrUserId = null) {
    assertOwnershipAndGetRecord(educationModel, id, actorOrUserId, 'pendidikan');
    const deleted = educationModel.delete(id.trim());
    if (!deleted) throw createHttpError('Data pendidikan tidak ditemukan.', 404);
    return deleted;
  },

  // Experience CRUD
  async getExperiences(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw createHttpError('ID pengguna tidak valid.', 400);
    }
    return experienceModel.findByUserId(userId.trim());
  },

  async addExperience(userId, data) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw createHttpError('ID pengguna tidak valid.', 400);
    }
    try {
      return experienceModel.create({ ...data, userId: userId.trim() });
    } catch (err) {
      if (!err.statusCode) err.statusCode = 400;
      throw err;
    }
  },

  async updateExperience(id, updates, actorOrUserId = null) {
    assertOwnershipAndGetRecord(experienceModel, id, actorOrUserId, 'pengalaman kerja');
    try {
      const updated = experienceModel.update(id.trim(), updates);
      if (!updated) throw createHttpError('Data pengalaman kerja tidak ditemukan.', 404);
      return updated;
    } catch (err) {
      if (!err.statusCode) err.statusCode = 400;
      throw err;
    }
  },

  async deleteExperience(id, actorOrUserId = null) {
    assertOwnershipAndGetRecord(experienceModel, id, actorOrUserId, 'pengalaman kerja');
    const deleted = experienceModel.delete(id.trim());
    if (!deleted) throw createHttpError('Data pengalaman kerja tidak ditemukan.', 404);
    return deleted;
  },

  // Skills CRUD
  async getSkills(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw createHttpError('ID pengguna tidak valid.', 400);
    }
    return skillModel.findByUserId(userId.trim());
  },

  async addSkill(userId, data, actorUser = null) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw createHttpError('ID pengguna tidak valid.', 400);
    }

    const isAdmin = actorUser && actorUser.role === 'admin';
    const safeData = {
      ...data,
      userId: userId.trim(),
      verified: isAdmin ? Boolean(data?.verified) : false
    };

    try {
      return skillModel.create(safeData);
    } catch (err) {
      if (!err.statusCode) err.statusCode = 400;
      throw err;
    }
  },

  async updateSkill(id, updates, actorOrUserId = null) {
    assertOwnershipAndGetRecord(skillModel, id, actorOrUserId, 'keahlian');

    const isAdmin = typeof actorOrUserId === 'object' && actorOrUserId?.role === 'admin';
    const safeUpdates = updates && typeof updates === 'object' ? { ...updates } : {};
    if (!isAdmin) {
      delete safeUpdates.verified;
    }

    try {
      const updated = skillModel.update(id.trim(), safeUpdates);
      if (!updated) throw createHttpError('Data keahlian tidak ditemukan.', 404);
      return updated;
    } catch (err) {
      if (!err.statusCode) err.statusCode = 400;
      throw err;
    }
  },

  async deleteSkill(id, actorOrUserId = null) {
    assertOwnershipAndGetRecord(skillModel, id, actorOrUserId, 'keahlian');
    const deleted = skillModel.delete(id.trim());
    if (!deleted) throw createHttpError('Data keahlian tidak ditemukan.', 404);
    return deleted;
  },

  // Activities CRUD
  async getActivities(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw createHttpError('ID pengguna tidak valid.', 400);
    }
    return activityModel.findByUserId(userId.trim());
  },

  async addActivity(userId, data) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw createHttpError('ID pengguna tidak valid.', 400);
    }
    try {
      return activityModel.create({ ...data, userId: userId.trim() });
    } catch (err) {
      if (!err.statusCode) err.statusCode = 400;
      throw err;
    }
  },

  async updateActivity(id, updates, actorOrUserId = null) {
    assertOwnershipAndGetRecord(activityModel, id, actorOrUserId, 'aktivitas');
    try {
      const updated = activityModel.update(id.trim(), updates);
      if (!updated) throw createHttpError('Data aktivitas tidak ditemukan.', 404);
      return updated;
    } catch (err) {
      if (!err.statusCode) err.statusCode = 400;
      throw err;
    }
  },

  async deleteActivity(id, actorOrUserId = null) {
    assertOwnershipAndGetRecord(activityModel, id, actorOrUserId, 'aktivitas');
    const deleted = activityModel.delete(id.trim());
    if (!deleted) throw createHttpError('Data aktivitas tidak ditemukan.', 404);
    return deleted;
  },

  // Career Monitoring Analytics
  async getCareerMonitoringStats() {
    const all = jobseekerModel.findAll();
    const total = all.length;

    const bekerja = all.filter((u) => u.statusKarir === 'Bekerja').length;
    const wirausaha = all.filter((u) => u.statusKarir === 'Wirausaha').length;
    const magang = all.filter((u) => u.statusKarir === 'Magang').length;
    const mencariKerja = all.filter(
      (u) => u.statusKarir === 'Mencari Kerja' || u.statusKarir === 'Menganggur'
    ).length;
    const pelatihan = all.filter(
      (u) => u.statusKarir === 'Pelatihan' || u.statusKarir === 'Melanjutkan Pendidikan'
    ).length;
    const tidakAktif = all.filter((u) => u.statusKarir === 'Tidak Aktif').length;

    const absorbedCount = bekerja + wirausaha + magang;
    const absorptionRate = total > 0 ? Math.round((absorbedCount / total) * 100) : 0;

    return {
      totalJobseekers: total,
      bekerjaCount: bekerja,
      wirausahaCount: wirausaha,
      magangCount: magang,
      mencariKerjaCount: mencariKerja,
      menganggurCount: mencariKerja,
      pelatihanCount: pelatihan,
      tidakAktifCount: tidakAktif,
      absorptionRate
    };
  }
};

module.exports = jobseekerService;