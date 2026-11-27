const { dbService } = require('../config/database');

const ALLOWED_NOTIFICATION_TYPES = new Set(['info', 'success', 'warning', 'alert']);

const createHttpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const notificationService = {
  getUserNotifications(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw createHttpError('ID pengguna wajib disertakan.', 400);
    }

    const cleanUserId = userId.trim();
    const list = dbService.filter(
      'notifications',
      (n) => n.userId === cleanUserId || n.userId === 'all'
    );

    return list
      .map((item) => {
        if (item.userId === 'all') {
          const readBy = Array.isArray(item.readBy) ? item.readBy : [];
          return {
            ...item,
            isRead: readBy.includes(cleanUserId)
          };
        }
        return item;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  createNotification(userId, title, message, type = 'info') {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw createHttpError('ID penerima notifikasi wajib diisi.', 400);
    }

    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    const cleanMessage = typeof message === 'string' ? message.trim() : '';

    if (!cleanTitle || !cleanMessage) {
      throw createHttpError('Judul dan isi pesan notifikasi wajib diisi.', 400);
    }

    const cleanType =
      typeof type === 'string' && ALLOWED_NOTIFICATION_TYPES.has(type.trim())
        ? type.trim()
        : 'info';

    const cleanUserId = userId.trim();

    return dbService.insert('notifications', {
      userId: cleanUserId,
      title: cleanTitle,
      message: cleanMessage,
      type: cleanType, // 'info' | 'success' | 'warning' | 'alert'
      isRead: false,
      ...(cleanUserId === 'all' ? { readBy: [] } : {}),
      createdAt: new Date().toISOString()
    });
  },

  markAsRead(notificationId, actorOrUserId = null) {
    if (!notificationId || typeof notificationId !== 'string' || !notificationId.trim()) {
      throw createHttpError('ID notifikasi tidak valid.', 400);
    }

    const cleanId = notificationId.trim();
    const notification = dbService.findById('notifications', cleanId);
    if (!notification) {
      throw createHttpError('Notifikasi tidak ditemukan.', 404);
    }

    const isAdmin = typeof actorOrUserId === 'object' && actorOrUserId?.role === 'admin';
    const actorId =
      typeof actorOrUserId === 'object'
        ? actorOrUserId?.id
        : typeof actorOrUserId === 'string'
          ? actorOrUserId.trim()
          : null;

    if (notification.userId === 'all') {
      if (!actorId) {
        throw createHttpError('Identitas pengguna diperlukan untuk menandai notifikasi umum.', 400);
      }
      const readBy = Array.isArray(notification.readBy) ? [...notification.readBy] : [];
      if (!readBy.includes(actorId)) {
        readBy.push(actorId);
      }
      const updated = dbService.update('notifications', cleanId, { readBy });
      return { ...updated, isRead: true };
    }

    if (actorId && !isAdmin && notification.userId !== actorId) {
      throw createHttpError('Anda tidak memiliki wewenang untuk mengubah notifikasi ini.', 403);
    }

    return dbService.update('notifications', cleanId, {
      isRead: true,
      readAt: new Date().toISOString()
    });
  },

  markAllAsRead(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw createHttpError('ID pengguna wajib disertakan.', 400);
    }

    const cleanUserId = userId.trim();
    const list = dbService.filter(
      'notifications',
      (n) => n.userId === cleanUserId || n.userId === 'all'
    );

    let updatedCount = 0;
    const now = new Date().toISOString();

    list.forEach((item) => {
      if (item.userId === 'all') {
        const readBy = Array.isArray(item.readBy) ? [...item.readBy] : [];
        if (!readBy.includes(cleanUserId)) {
          readBy.push(cleanUserId);
          dbService.update('notifications', item.id, { readBy });
          updatedCount += 1;
        }
      } else if (!item.isRead) {
        dbService.update('notifications', item.id, { isRead: true, readAt: now });
        updatedCount += 1;
      }
    });

    return {
      success: true,
      updatedCount
    };
  },

  deleteNotification(notificationId, actorOrUserId = null) {
    if (!notificationId || typeof notificationId !== 'string' || !notificationId.trim()) {
      throw createHttpError('ID notifikasi tidak valid.', 400);
    }

    const cleanId = notificationId.trim();
    const notification = dbService.findById('notifications', cleanId);
    if (!notification) {
      throw createHttpError('Notifikasi tidak ditemukan.', 404);
    }

    const isAdmin = typeof actorOrUserId === 'object' && actorOrUserId?.role === 'admin';
    const actorId =
      typeof actorOrUserId === 'object'
        ? actorOrUserId?.id
        : typeof actorOrUserId === 'string'
          ? actorOrUserId.trim()
          : null;

    if (notification.userId === 'all' && !isAdmin) {
      throw createHttpError('Hanya admin yang dapat menghapus notifikasi pengumuman umum.', 403);
    }

    if (actorId && !isAdmin && notification.userId !== actorId) {
      throw createHttpError('Anda tidak memiliki wewenang untuk menghapus notifikasi ini.', 403);
    }

    return dbService.delete('notifications', cleanId);
  }
};

module.exports = notificationService;