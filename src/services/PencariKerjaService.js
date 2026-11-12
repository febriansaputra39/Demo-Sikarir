/**
 * Pencari Kerja (Jobseeker) Service
 * Manages education records, work experiences, technical skills, activities, and career status.
 */

import { api } from './api';

export const PencariKerjaService = {
  // Education CRUD
  async getEducations(userId) {
    const list = api.getCollection('educations');
    return list.filter(item => item.userId === userId);
  },

  async addEducation(userId, data) {
    return api.addItem('educations', { ...data, userId });
  },

  async updateEducation(id, updates) {
    return api.updateItem('educations', id, updates);
  },

  async deleteEducation(id) {
    return api.deleteItem('educations', id);
  },

  // Experience CRUD
  async getExperiences(userId) {
    const list = api.getCollection('experiences');
    return list.filter(item => item.userId === userId);
  },

  async addExperience(userId, data) {
    return api.addItem('experiences', { ...data, userId });
  },

  async updateExperience(id, updates) {
    return api.updateItem('experiences', id, updates);
  },

  async deleteExperience(id) {
    return api.deleteItem('experiences', id);
  },

  // Skills CRUD
  async getSkills(userId) {
    const list = api.getCollection('skills');
    return list.filter(item => item.userId === userId);
  },

  async addSkill(userId, data) {
    return api.addItem('skills', {
      ...data,
      userId,
      level: data.level || 4,
      verified: true
    });
  },

  async updateSkill(id, updates) {
    return api.updateItem('skills', id, updates);
  },

  async deleteSkill(id) {
    return api.deleteItem('skills', id);
  },

  // Activities CRUD
  async getActivities(userId) {
    const list = api.getCollection('activities');
    return list.filter(item => item.userId === userId);
  },

  async addActivity(userId, data) {
    return api.addItem('activities', { ...data, userId });
  },

  async deleteActivity(id) {
    return api.deleteItem('activities', id);
  },

  // Update Career Status
  async updateCareerStatus(userId, statusKarir) {
    return api.updateItem('users', userId, {
      statusKarir,
      statusUpdatedAt: new Date().toISOString()
    });
  },

  // Get Comprehensive CV Data
  async getFullProfile(userId) {
    const users = api.getCollection('users');
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    const [educations, experiences, skills, activities] = await Promise.all([
      this.getEducations(userId),
      this.getExperiences(userId),
      this.getSkills(userId),
      this.getActivities(userId)
    ]);

    return {
      ...user,
      educations,
      experiences,
      skills,
      activities
    };
  }
};

export default PencariKerjaService;
