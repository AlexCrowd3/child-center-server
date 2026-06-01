const db = require('../database/db');;

/**
 * Создание массового уведомления
 */
async function createMassNotification(title, message, targetRole = 'all') {

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const result = await db.run(`
        INSERT INTO notifications
        (title, message, type, target_role, expires_at)
        VALUES (?, ?, 'mass', ?, ?)
    `, [title, message, targetRole, expiresAt.toISOString()]);

    let users;

    if (targetRole === 'all') {
        users = await db.all(`SELECT id FROM users`);
    } else {
        users = await db.all(`SELECT id FROM users WHERE role = ?`, [targetRole]);
    }

    for (const user of users) {
        await db.run(`
            INSERT INTO user_notifications (user_id, notification_id)
            VALUES (?, ?)
        `, [user.id, result.lastID]);
    }
}

/**
 * Создание системного уведомления одному пользователю
 */
async function createSystemNotification(userId, title, message) {

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const result = await db.run(`
        INSERT INTO notifications
        (title, message, type, target_role, expires_at)
        VALUES (?, ?, 'system', 'all', ?)
    `, [title, message, expiresAt.toISOString()]);

    await db.run(`
        INSERT INTO user_notifications (user_id, notification_id)
        VALUES (?, ?)
    `, [userId, result.lastID]);
}

/**
 * Удаление старых уведомлений (14+ дней)
 */
async function clearExpiredNotifications() {
    await db.run(`
        DELETE FROM user_notifications
        WHERE notification_id IN (
            SELECT id FROM notifications WHERE expires_at < datetime('now')
        )
    `);

    await db.run(`
        DELETE FROM notifications
        WHERE expires_at < datetime('now')
    `);
}

module.exports = {
    createMassNotification,
    createSystemNotification,
    clearExpiredNotifications
};