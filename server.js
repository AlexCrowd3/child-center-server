require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const { initDatabase } = require('./database/init-db');
const db = require('./database/db');

const { authMiddleware } = require('./middleware/auth');
const adminAuth = require('./middleware/adminAuth');

const { processFinishedLessons } = require('./services/lessonService');
const { processTeacherPayouts } = require('./services/payoutService');
const { clearOldPayouts } = require('./services/cleanupService');
const { calculateMonthlyKPI } = require('./services/kpiService');

const {
    createSystemNotification,
    clearExpiredNotifications
} = require('./services/notificationService');

const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());
app.use('/storage', express.static('storage'));

// ======================
// ROUTES
// ======================
const authRoutes = require('./api/auth');
const clientRoutes = require('./api/client');
const teacherRoutes = require('./api/teacher');
const adminRoutes = require('./api/admin');
const paymentRoutes = require('./api/payments');

app.use('/api/auth', authRoutes);
app.use('/api/client', authMiddleware, clientRoutes);
app.use('/api/teacher', authMiddleware, teacherRoutes);
app.use('/api/admin', adminAuth, adminRoutes);
app.use('/api/payments', paymentRoutes);

// ======================
// BACKUP
// ======================
function runBackup() {
    try {
        const dbPath = path.join(__dirname, 'database', 'dev.sqlite');
        const backupDir = path.join(__dirname, 'storage', 'backups');

        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const fileName = `backup-${timestamp}.sqlite`;

        fs.copyFileSync(dbPath, path.join(backupDir, fileName));
        console.log(`✅ Backup created: ${fileName}`);
    } catch (err) {
        console.error('❌ Backup error:', err);
    }
}

// ======================
// CRON JOBS
// ======================
function initCronJobs() {
    cron.schedule('0 8 * * *', async () => {
        try {
            const lessonsToday = await db.all(`
                SELECT * FROM group_schedules
                WHERE date(date) = date('now')
            `);

            for (const lesson of lessonsToday) {
                const bookings = await db.all(`
                    SELECT * FROM group_bookings
                    WHERE schedule_id = ?
                `, [lesson.id]);

                for (const booking of bookings) {
                    await createSystemNotification(
                        booking.user_id,
                        'Сегодня занятие',
                        `Сегодня занятие в ${lesson.start_time}`
                    );
                }
            }
        } catch (err) {
            console.error('Cron error (lessons today):', err);
        }
    });
    cron.schedule('0 9 * * *', async () => {
        try {
            const subs = await db.all(`
                SELECT * FROM user_subscriptions
                WHERE lessons_left = 1
            `);

            for (const sub of subs) {
                await createSystemNotification(
                    sub.user_id,
                    'Заканчиваются занятия',
                    'У вас осталось 1 занятие'
                );
            }
        } catch (err) {
            console.error('Cron error (lessons left):', err);
        }
    });

    cron.schedule('0 10 * * *', async () => {
        try {
            const subs = await db.all(`
                SELECT * FROM user_subscriptions
                WHERE date(end_date) = date('now', '+3 days')
            `);

            for (const sub of subs) {
                await createSystemNotification(
                    sub.user_id,
                    'Подписка заканчивается',
                    'Ваша подписка заканчивается через 3 дня'
                );
            }
        } catch (err) {
            console.error('Cron error (subscription ending):', err);
        }
    });

    cron.schedule('30 2 * * *', async () => {
        console.log('🧹 Clearing expired notifications...');
        await clearExpiredNotifications();
    });

    cron.schedule('0 3 * * *', () => {
        console.log('💾 Running backup...');
        runBackup();
    });

    cron.schedule('*/5 * * * *', async () => {
        await processFinishedLessons();
    });

    cron.schedule('0 1 * * *', async () => {
        await processTeacherPayouts();
    });

    cron.schedule('0 2 * * *', async () => {
        await clearOldPayouts();
    });

    cron.schedule('30 1 1 * *', async () => {
        await calculateMonthlyKPI();
    });

    console.log('⏱ Cron jobs initialized');
}

// ======================
// START SERVER
// ======================
async function start() {
    try {
        console.log('🔄 Initializing database...');
        await initDatabase();

        app.listen(PORT, () => {
            console.log(`🚀 Server started on port ${PORT}`);
        });

        initCronJobs();

    } catch (error) {
        console.error('❌ Server start error:', error);
    }
}

start();