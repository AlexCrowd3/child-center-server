const db = require('../database/db');;

async function clearOldPayouts() {
    await db.run(`
        DELETE FROM payouts
        WHERE status = 'paid'
        AND paid_at <= datetime('now', '-10 days')
    `);
}

module.exports = { clearOldPayouts };