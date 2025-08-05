const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Sheet1';

async function getProfiles() {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A2:I`, // includes all 9 columns
    });

    return res.data.values.map((row, idx) => ({
        rowIndex: idx + 2,               // for later updates
        status: row[0] || '',
        name: row[1] || '',
        linkedin: row[2] || '',
        designation: row[3] || '',
        email: row[4] || '',
        website: row[5] || '',
        subject: row[6] || '',
        message: row[7] || '',
        message_id: row[8] || '',
    }));
}

async function updateStatus(rowIndex, newStatus) {
    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [[newStatus]],
        },
    });
    return true;
}

module.exports = { getProfiles, updateStatus };
