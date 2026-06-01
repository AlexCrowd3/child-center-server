const db = require('../database/db');;

async function processTeacherPayouts() {
    const today = new Date().getDate();

    const teachers = await db.all(`
        SELECT * FROM teachers
        WHERE payout_day_1 = ?
        OR payout_day_2 = ?
    `, [today, today]);

    for (const teacher of teachers) {

        if (teacher.balance <= 0) continue;

        await db.run(`
            INSERT INTO teacher_payouts
            (teacher_id, amount, status)
            VALUES (?, ?, 'pending')
        `, [teacher.id, teacher.balance]);

        await db.run(`
            UPDATE teachers
            SET balance = 0
            WHERE id = ?
        `, [teacher.id]);
    }
}

module.exports = { processTeacherPayouts };