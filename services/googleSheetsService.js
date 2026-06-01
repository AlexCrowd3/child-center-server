const { google } = require('googleapis');

async function getAuth() {
    const auth = new google.auth.GoogleAuth({
        keyFile: 'google-credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return auth.getClient();
}

async function uploadKPIToSheets(kpi) {

    const authClient = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const monthName = new Date().toLocaleString('ru-RU', {
        month: 'long',
        year: 'numeric'
    });

    await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.KPI_SHEET_ID,
        range: `${monthName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[
                new Date().toISOString(),
                kpi.revenue,
                kpi.payouts,
                kpi.lessons,
                kpi.avgPerDay
            ]]
        }
    });
}

async function backupFullDatabaseToSheets(data) {

    const authClient = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.BACKUP_SHEET_ID,
        range: 'Backup!A1',
        valueInputOption: 'RAW',
        requestBody: {
            values: data
        }
    });
}

module.exports = {
    uploadKPIToSheets,
    backupFullDatabaseToSheets
};