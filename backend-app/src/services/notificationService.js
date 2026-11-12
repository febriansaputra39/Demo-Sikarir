const { dbService } = require('../config/database');

const notificationService = {
  getUserNotifications(userId) {
    return dbService.filter('notifications', n => n.userId === userId || n.userId === 'all');
  },

  createNotification(userId, title, message, type = 'info') {
    return dbService.insert('notifications', {
      userId,
      title,
      message,
      type, // 'info' | 'success' | 'warning' | 'alert'
      isRead: false,
      createdAt: new Date().toISOString()
    });
  },

  markAsRead(notificationId) {
    return dbService.update('notifications', notificationId, { isRead: true });
  },

  markAllAsRead(userId) {
    const list = dbService.filter('notifications', n => n.userId === userId);
    list.forEach(item => {
      dbService.update('notifications', item.id, { isRead: true });
    });
    return true;
  }
};

module.exports = notificationService;
