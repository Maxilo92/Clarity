const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = path.join(__dirname, '..', 'App', 'db', 'transactions.db');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    // 1. Create companies table
    db.run(`CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        domain TEXT UNIQUE NOT NULL
    )`);

    // 2. Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        company_id INTEGER,
        FOREIGN KEY (company_id) REFERENCES companies(id)
    )`);

    // 3. Add user_id column to transactions (using a temporary table because SQLite doesn't support ADD COLUMN with FK easily)
    db.run("PRAGMA foreign_keys=off;");
    
    db.run(`CREATE TABLE transactions_new (
        id INTEGER PRIMARY KEY,
        name TEXT,
        kategorie TEXT,
        wert REAL,
        timestamp TEXT,
        sender TEXT,
        empfaenger TEXT,
        user_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`INSERT INTO transactions_new (id, name, kategorie, wert, timestamp, sender, empfaenger)
            SELECT id, name, kategorie, wert, timestamp, sender, empfaenger FROM transactions`);

    db.run("DROP TABLE transactions");
    db.run("ALTER TABLE transactions_new RENAME TO transactions");
    
    db.run("PRAGMA foreign_keys=on;");

    console.log("Database migrated to multi-user system successfully.");
});

db.close();
