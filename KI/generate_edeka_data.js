const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = path.join(__dirname, '..', 'App', 'db', 'company_1.db');

const db = new sqlite3.Database(DB_PATH);

const users = [1, 2];
const categories = ['Salary', 'Groceries', 'Leisure', 'Transport', 'Rent', 'Insurance', 'Subscriptions'];
const partners = {
    'Salary': ['EDEKA Zentrale', 'EDEKA Nord', 'EDEKA Südwest'],
    'Groceries': ['REWE', 'ALDI', 'Lidl', 'Kaufland', 'Denns Bio'],
    'Leisure': ['Netflix', 'Spotify', 'Cinema', 'Restaurant "Zum Anker"', 'Gym Membership'],
    'Transport': ['Shell', 'Aral', 'Deutsche Bahn', 'Public Transport', 'Uber'],
    'Rent': ['Immobilien GmbH', 'Wohnen & Co'],
    'Insurance': ['Allianz', 'Techniker Krank Krankenkasse', 'AXA'],
    'Subscriptions': ['Apple', 'Amazon Prime', 'Adobe Creative Cloud']
};

function getRandomDate(monthsBack) {
    const now = new Date();
    const start = new Date();
    start.setMonth(now.getMonth() - monthsBack);
    const date = new Date(start.getTime() + Math.random() * (now.getTime() - start.getTime()));
    return date.toISOString();
}

db.serialize(() => {
    // Note: We use a counter added to a large base to ensure unique integer IDs
    let idCounter = Math.floor(Date.now());
    const stmt = db.prepare("INSERT INTO transactions (id, name, kategorie, wert, timestamp, sender, empfaenger, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

    users.forEach(userId => {
        // Monthly Salary for 6 months back
        for (let m = 0; m < 6; m++) {
            const date = new Date();
            date.setMonth(date.getMonth() - m);
            date.setDate(1); 
            const timestamp = date.toISOString();
            stmt.run(idCounter++, 'Monthly Salary', 'Salary', 3500.00, timestamp, 'EDEKA Zentrale', 'Employee', userId);
            
            // Rent
            date.setDate(3);
            stmt.run(idCounter++, 'Apartment Rent', 'Rent', -1200.00, date.toISOString(), 'Employee', 'Immobilien GmbH', userId);
            
            // Regular Subscriptions
            stmt.run(idCounter++, 'Netflix', 'Subscriptions', -17.99, getRandomDate(m), 'Employee', 'Netflix', userId);
            stmt.run(idCounter++, 'Spotify', 'Subscriptions', -10.99, getRandomDate(m), 'Employee', 'Spotify', userId);
        }

        // Random transactions
        for (let i = 0; i < 100; i++) {
            const cat = categories[Math.floor(Math.random() * categories.length)];
            if (cat === 'Salary' || cat === 'Rent') continue;

            const name = partners[cat][Math.floor(Math.random() * partners[cat].length)];
            const value = -(Math.random() * 150 + 5).toFixed(2);
            const timestamp = getRandomDate(6);
            
            stmt.run(idCounter++, name, cat, value, timestamp, 'Employee', name, userId);
        }
    });

    stmt.finalize();
    console.log("Diverse test data for Edeka generated successfully.");
});

db.close();
