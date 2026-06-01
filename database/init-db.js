const db = require('./connection');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
    console.log('🔄 Initializing database...');

    const sql = fs.readFileSync(
        path.join(__dirname, 'init.sql'),
        'utf8'
    );

    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(Boolean);

    for (const statement of statements) {
        try {
            await db.raw(statement);
        } catch (err) {
            if (!err.message.includes('already exists')) {
                console.error(err.message);
            }
        }
    }

    console.log('✅ Database ready');
}

module.exports = { initDatabase };