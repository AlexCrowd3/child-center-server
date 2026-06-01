const { google } = require('googleapis');
const db = require('../database/db');;

async function restoreDatabaseFromSheets() {

    const auth = new google.auth.GoogleAuth({
        keyFile: 'google-credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.BACKUP_SHEET_ID,
        range: 'Backup!A1:Z10000',
    });

    const rows = response.data.values;

    // логика восстановления (парсинг JSON строк или таблиц)
    // тут уже зависит от структуры хранения

    console.log('Restored rows:', rows.length);
}

module.exports = { restoreDatabaseFromSheets };