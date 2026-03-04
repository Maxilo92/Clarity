const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'App', 'db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const sysPath = path.join(DB_DIR, 'system.db');
const compPath = path.join(DB_DIR, 'company_1.db');

if (fs.existsSync(sysPath)) fs.unlinkSync(sysPath);
if (fs.existsSync(compPath)) fs.unlinkSync(compPath);

const passwordHash = bcrypt.hashSync('password123', 10);

async function run() {
    const sysDb = new sqlite3.Database(sysPath);
    const cDb = new sqlite3.Database(compPath);

    const exec = (db, sql) => new Promise((res, rej) => db.exec(sql, err => err ? rej(err) : res()));
    const run = (db, sql, params = []) => new Promise((res, rej) => db.run(sql, params, err => err ? rej(err) : res()));

    console.log("Setting up system.db...");
    await exec(sysDb, `
        CREATE TABLE companies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, domain TEXT UNIQUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE user_index (email TEXT PRIMARY KEY, company_id INTEGER);
        INSERT INTO companies (id, name, domain) VALUES (1, 'Clarity Demo Inc.', 'clarity-demo.com');
        INSERT INTO user_index (email, company_id) VALUES ('admin@clarity-demo.com', 1);
        INSERT INTO user_index (email, company_id) VALUES ('max@clarity-demo.com', 1);
        INSERT INTO user_index (email, company_id) VALUES ('sarah@clarity-demo.com', 1);
    `);

    console.log("Setting up company_1.db...");
    await exec(cDb, `
        CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'user', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE transactions (id INTEGER PRIMARY KEY, name TEXT, kategorie TEXT, wert REAL, timestamp TEXT, sender TEXT, empfaenger TEXT, user_id INTEGER, beschreibung TEXT);
        CREATE TABLE user_settings (user_id INTEGER PRIMARY KEY, nickname TEXT, theme TEXT DEFAULT 'light', notifications_enabled BOOLEAN DEFAULT 1);
    `);

    const users = [
        [1, 'Admin Alice', 'admin@clarity-demo.com', passwordHash, 'admin'],
        [2, 'Maximilian Mustermann', 'max@clarity-demo.com', passwordHash, 'user'],
        [3, 'Sarah Schmidt', 'sarah@clarity-demo.com', passwordHash, 'user']
    ];

    for (const u of users) {
        await run(cDb, "INSERT INTO users (id, full_name, email, password, role) VALUES (?, ?, ?, ?, ?)", u);
        await run(cDb, "INSERT INTO user_settings (user_id, nickname) VALUES (?, ?)", [u[0], u[1].split(' ')[0]]);
    }

    console.log("Generating transactions...");
    const categories = ['Food', 'Housing', 'Transportation', 'Leisure', 'Shopping', 'Health', 'Income', 'Miscellaneous'];
    const places = {
        'Food': ['EDEKA', 'REWE', 'Aldi', 'Bakery', 'Starbucks'],
        'Housing': ['Rent', 'Electricity', 'Water', 'IKEA'],
        'Transportation': ['DB', 'Gas Station', 'Uber'],
        'Leisure': ['Cinema', 'Netflix', 'Spotify', 'Gym'],
        'Shopping': ['Amazon', 'Zalando', 'H&M'],
        'Health': ['Pharmacy', 'Doctor'],
        'Income': ['Salary', 'Bonus'],
        'Miscellaneous': ['Donation', 'Gift']
    };

    const now = new Date();
    for (let i = 0; i < 150; i++) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const name = places[cat][Math.floor(Math.random() * places[cat].length)];
        let amount = (cat === 'Income') ? (Math.floor(Math.random() * 3000) + 1500) : 
                     (cat === 'Housing') ? -(Math.floor(Math.random() * 800) + 400) : 
                     -(Math.floor(Math.random() * 100) + 5) - Math.random();

        const pastDate = new Date(now.getTime() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
        const uid = Math.floor(Math.random() * 3) + 1;
        const sender = amount > 0 ? name : (uid===1?'Alice':uid===2?'Max':'Sarah');
        const receiver = amount > 0 ? (uid===1?'Alice':uid===2?'Max':'Sarah') : name;
        const tId = Math.floor(Date.now() - (i * 1000000) + Math.random() * 1000);

        await run(cDb, "INSERT INTO transactions (id, name, kategorie, wert, timestamp, sender, empfaenger, user_id, beschreibung) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            [tId, name, cat, parseFloat(amount.toFixed(2)), pastDate.toISOString(), sender, receiver, uid, `Demo ${name}`]);
    }

    await new Promise(res => sysDb.close(res));
    await new Promise(res => cDb.close(res));
    console.log("Demo Setup Finalized Successfully.");
}

run().catch(console.error);
