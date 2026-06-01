const db = require('../database/db');;

async function calculateMonthlyKPI() {

    const revenueGroup = await db.get(`
        SELECT SUM(price_per_lesson) as total
        FROM user_subscriptions
        WHERE strftime('%m', created_at) = strftime('%m','now')
    `);

    const payouts = await db.get(`
        SELECT SUM(amount) as total
        FROM teacher_payouts
        WHERE status = 'paid'
        AND strftime('%m', paid_at) = strftime('%m','now')
    `);

    const completedGroup = await db.get(`
        SELECT COUNT(*) as total
        FROM group_schedules
        WHERE status = 'completed'
        AND strftime('%m', date) = strftime('%m','now')
    `);

    const completedIndividual = await db.get(`
        SELECT COUNT(*) as total
        FROM individual_schedules
        WHERE status = 'completed'
        AND strftime('%m', date) = strftime('%m','now')
    `);

    const lessonsTotal =
        (completedGroup.total || 0) +
        (completedIndividual.total || 0);

    const avgPerDay = lessonsTotal / new Date().getDate();

    await db.run(`
        INSERT INTO kpi_snapshots
        (month, revenue, teacher_payouts, lessons_completed, avg_per_day)
        VALUES (?, ?, ?, ?, ?)
    `, [
        new Date().toISOString().slice(0, 7),
        revenueGroup.total || 0,
        payouts.total || 0,
        lessonsTotal,
        avgPerDay
    ]);
}

module.exports = { calculateMonthlyKPI };