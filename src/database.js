const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const db = new sqlite3.Database(path.join(__dirname, 'production.db'));

function initializeDatabase() {
    // Create tables if they don't exist
    db.serialize(() => {
        // First create all necessary tables
        db.run(`CREATE TABLE IF NOT EXISTS units (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS manufacturingUnits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            categoryId INTEGER,
            unitId INTEGER,
            FOREIGN KEY (categoryId) REFERENCES categories(id),
            FOREIGN KEY (unitId) REFERENCES units(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS productionLog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            productId INTEGER,
            quantityManufactured REAL,
            manufacturedByUnitId INTEGER,
            updationReason TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (productId) REFERENCES products(id),
            FOREIGN KEY (manufacturedByUnitId) REFERENCES manufacturingUnits(id)
        )`);

        // Check if default data needs to be inserted
        db.get("SELECT COUNT(*) as count FROM units", (err, row) => {
            if (err) {
                console.error('Error checking units:', err);
                return;
            }

            if (row.count === 0) {
                // Insert default units
                const defaultUnits = [
                    ['KG'],
                    ['Pieces'],
                    ['Meters']
                ];

                const stmt = db.prepare("INSERT INTO units (name) VALUES (?)");
                defaultUnits.forEach(unit => stmt.run(unit));
                stmt.finalize();
            }
        });

        db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
            if (err) {
                console.error('Error checking categories:', err);
                return;
            }

            if (row.count === 0) {
                // Insert default categories
                const defaultCategories = [
                    ['Raw Materials'],
                    ['Finished Goods'],
                    ['Work in Progress']
                ];

                const stmt = db.prepare("INSERT INTO categories (name) VALUES (?)");
                defaultCategories.forEach(category => stmt.run(category));
                stmt.finalize();
            }
        });

        db.get("SELECT COUNT(*) as count FROM manufacturingUnits", (err, row) => {
            if (err) {
                console.error('Error checking manufacturing units:', err);
                return;
            }

            if (row.count === 0) {
                // Insert default manufacturing units
                const defaultManufacturingUnits = [
                    ['Unit A', 'Main Production Unit'],
                    ['Unit B', 'Secondary Production Unit'],
                    ['Unit C', 'Assembly Unit']
                ];

                const stmt = db.prepare("INSERT INTO manufacturingUnits (name, description) VALUES (?, ?)");
                defaultManufacturingUnits.forEach(unit => stmt.run(unit));
                stmt.finalize();
            }
        });

        // Add default products after categories and units are created
        db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
            if (err) {
                console.error('Error checking products:', err);
                return;
            }

            if (row.count === 0) {
                // Insert default products
                const defaultProducts = [
                    ['Product 1', 1, 1], // category 1, unit 1
                    ['Product 2', 2, 2], // category 2, unit 2
                    ['Product 3', 3, 1]  // category 3, unit 1
                ];

                const stmt = db.prepare("INSERT INTO products (name, categoryId, unitId) VALUES (?, ?, ?)");
                defaultProducts.forEach(product => stmt.run(product));
                stmt.finalize();
            }
        });
    });
}

// Initialize database when the module is loaded
initializeDatabase();

module.exports = db;