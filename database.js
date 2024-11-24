const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'production.db'), (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to the SQLite database.');
        createTables();
    }
});

function createTables() {
    // Create tables if they don't exist
    const tables = `
        CREATE TABLE IF NOT EXISTS units (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            categoryId INTEGER,
            unitId INTEGER,
            FOREIGN KEY (categoryId) REFERENCES categories(id),
            FOREIGN KEY (unitId) REFERENCES units(id)
        );

        CREATE TABLE IF NOT EXISTS manufacturingUnits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS productionLog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            productId INTEGER,
            quantityManufactured REAL NOT NULL,
            manufacturedByUnitId INTEGER,
            updationReason TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME,
            FOREIGN KEY (productId) REFERENCES products(id),
            FOREIGN KEY (manufacturedByUnitId) REFERENCES manufacturingUnits(id)
        );
    `;

    db.exec(tables, (err) => {
        if (err) {
            console.error('Error creating tables:', err);
        } else {
            console.log('Database tables created successfully');
        }
    });
}

// Promisify database operations
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID });
            }
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    db,
    run,
    all
};