const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const DB_PATH = path.join(__dirname, '..', 'App', 'db', 'system.db');

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    // 1. Companies Table (The global directory)
    db.run(`CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        domain TEXT UNIQUE NOT NULL
    )`);

    // 2. Global User Index (To know which DB to open during login)
    db.run(`CREATE TABLE IF NOT EXISTS user_index (
        email TEXT PRIMARY KEY,
        company_id INTEGER NOT NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id)
    )`);

    console.log("System directory initialized. Data is now company-isolated.");
});

db.close();
