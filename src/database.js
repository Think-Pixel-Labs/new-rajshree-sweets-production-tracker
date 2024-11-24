const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const db = new sqlite3.Database(path.join(__dirname, '..', 'data', 'production.db'));

function getCurrentISTDateTime() {
    return `datetime('now', '+5 hours', '+30 minutes')`;
}

function initializeDatabase() {
    db.serialize(() => {
        // Create products table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            unitType TEXT CHECK(unitType IN ('KG', 'Box', 'Pcs', 'Bottle')) NOT NULL
        )`);

        // Create production log table
        db.run(`CREATE TABLE IF NOT EXISTS productionLog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            productId INTEGER NOT NULL,
            quantity REAL NOT NULL,
            createdAt DATETIME DEFAULT (${getCurrentISTDateTime()}),
            updatedAt DATETIME DEFAULT (${getCurrentISTDateTime()}),
            updationReason TEXT,
            FOREIGN KEY (productId) REFERENCES products(id)
        )`);

        // Insert some sample products
        const sampleProducts = [
            ['Product 1', 'Category 1', 'KG'],
            ['Product 2', 'Category 1', 'Box'],
            ['Product 3', 'Category 2', 'Pcs'],
            ['Product 4', 'Category 2', 'Bottle']
        ];

        const insertProduct = db.prepare('INSERT INTO products (name, category, unitType) VALUES (?, ?, ?)');
        sampleProducts.forEach(product => {
            insertProduct.run(product, (err) => {
                if (err) console.error('Error inserting sample product:', err);
            });
        });
        insertProduct.finalize();
    });
}

db.getCurrentISTDateTime = getCurrentISTDateTime;

initializeDatabase();
module.exports = db;