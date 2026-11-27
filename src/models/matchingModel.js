const { dbService } = require('../config/database');

const matchingModel = {
  findHistory: (userId, limit = 50) => {
    if (!userId || typeof userId !== 'string') return [];

    const cleanUserId = userId.trim();
    const list = dbService
      .filter('matchings', (m) => m.userId === cleanUserId)
      .sort((a, b) => new Date(b.matchedAt || b.createdAt || 0) - new Date(a.matchedAt || a.createdAt || 0));

    const maxItems = Number.isInteger(limit) && limit > 0 ? limit : 50;
    return list.slice(0, maxItems);
  },

  logMatch: (matchData) => {
    if (!matchData || typeof matchData !== 'object' || Array.isArray(matchData)) {
      throw new Error('Data riwayat pencocokan (matchData) tidak valid.');
    }

    if (typeof matchData.userId !== 'string' || !matchData.userId.trim()) {
      throw new Error('userId wajib disertakan dalam riwayat pencocokan.');
    }

    const {
      id: _ignoredId,
      createdAt: _ignoredCreatedAt,
      matchedAt: _ignoredMatchedAt,
      ...restData
    } = matchData;

    let normalizedScore = Number(restData.score);
    if (Number.isNaN(normalizedScore)) {
      normalizedScore = 0;
    } else {
      normalizedScore = Math.min(100, Math.max(0, Math.round(normalizedScore * 100) / 100));
    }

    return dbService.insert('matchings', {
      ...restData,
      userId: matchData.userId.trim(),
      score: normalizedScore,
      matchedAt: new Date().toISOString()
    });
  }
};

module.exports = matchingModel;