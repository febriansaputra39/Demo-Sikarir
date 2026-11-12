const jobseekerModel = require('../models/jobseekerModel');
const educationModel = require('../models/educationModel');
const experienceModel = require('../models/experienceModel');
const skillModel = require('../models/skillModel');
const activityModel = require('../models/activityModel');

const jobseekerService = {
  async getAllJobseekers(filters = {}) {
    return jobseekerModel.findAll(filters);
  },

  async getJobseekerById(id) {
    const user = jobseekerModel.findById(id);
    if (!user) throw new Error('Data pencari kerja tidak ditemukan.');
    return user;
  },

  async updateCareerStatus(id, statusKarir) {
    const updated = jobseekerModel.updateCareerStatus(id, statusKarir);
    if (!updated) throw new Error('Pencari kerja tidak ditemukan.');
    return updated;
  },

  async getFullProfile(userId) {
    const full = jobseekerModel.getFullProfile(userId);
    if (!full) throw new Error('Profil pencari kerja tidak ditemukan.');
    const { password, ...safeData } = full;
    return safeData;
  },

  // Education CRUD
  async getEducations(userId) {
    return educationModel.findByUserId(userId);
  },

  async addEducation(userId, data) {
    return educationModel.create({ ...data, userId });
  },

  async updateEducation(id, updates) {
    return educationModel.update(id, updates);
  },

  async deleteEducation(id) {
    return educationModel.delete(id);
  },

  // Experience CRUD
  async getExperiences(userId) {
    return experienceModel.findByUserId(userId);
  },

  async addExperience(userId, data) {
    return experienceModel.create({ ...data, userId });
  },

  async updateExperience(id, updates) {
    return experienceModel.update(id, updates);
  },

  async deleteExperience(id) {
    return experienceModel.delete(id);
  },

  // Skills CRUD
  async getSkills(userId) {
    return skillModel.findByUserId(userId);
  },

  async addSkill(userId, data) {
    return skillModel.create({ ...data, userId });
  },

  async updateSkill(id, updates) {
    return skillModel.update(id, updates);
  },

  async deleteSkill(id) {
    return skillModel.delete(id);
  },

  // Activities CRUD
  async getActivities(userId) {
    return activityModel.findByUserId(userId);
  },

  async addActivity(userId, data) {
    return activityModel.create({ ...data, userId });
  },

  async updateActivity(id, updates) {
    return activityModel.update(id, updates);
  },

  async deleteActivity(id) {
    return activityModel.delete(id);
  },

  // Career Monitoring Analytics
  async getCareerMonitoringStats() {
    const all = jobseekerModel.findAll();
    const total = all.length;

    const bekerja = all.filter(u => u.statusKarir === 'Bekerja').length;
    const magang = all.filter(u => u.statusKarir === 'Magang').length;
    const menganggur = all.filter(u => u.statusKarir === 'Menganggur').length;
    const pelatihan = all.filter(u => u.statusKarir === 'Pelatihan').length;

    const absorptionRate = total > 0 ? Math.round(((bekerja + magang) / total) * 100) : 0;

    return {
      totalJobseekers: total,
      bekerjaCount: bekerja,
      magangCount: magang,
      menganggurCount: menganggur,
      pelatihanCount: pelatihan,
      absorptionRate
    };
  }
};

module.exports = jobseekerService;
