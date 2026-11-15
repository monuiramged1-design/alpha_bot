const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, '..', 'data', 'cards.json');

function loadDB() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({}), 'utf8');
    }
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return {}; }
}

function saveDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { loadDB, saveDB };
