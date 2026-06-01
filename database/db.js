// database/db.js
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let db;

async function init() {
    db = await open({
        filename: path.join(__dirname, 'dev.sqlite'),
        driver: sqlite3.Database
    });
    return db;
}

function getDb() {
    if (!db) throw new Error('Database not initialized. Call init() first.');
    return db;
}

// обертки для запросов
async function run(sql, params = []) {
    const database = getDb();
    return database.run(sql, params);
}

async function get(sql, params = []) {
    const database = getDb();
    return database.get(sql, params);
}

async function all(sql, params = []) {
    const database = getDb();
    return database.all(sql, params);
}

module.exports = {
    init,
    run,
    get,
    all
};