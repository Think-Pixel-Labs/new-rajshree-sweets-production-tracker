const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const db = new sqlite3.Database(path.join(__dirname, '..', 'data', 'production.db'));
const defaultData = require('../data/defaultData.json');

function initializeDatabase() {
    db.serialize(() => {
        // All tables without any foreign key constraints
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
            name TEXT NOT NULL
        )`);

        // Modified production log table to include all fields independently
        db.run(`CREATE TABLE IF NOT EXISTS productionLog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            productId INTEGER,
            productName TEXT,
            categoryId INTEGER,
            categoryName TEXT,
            quantityManufactured REAL,
            unitId INTEGER,
            unitName TEXT,
            manufacturedByUnitId INTEGER,
            manufacturingUnitName TEXT,
            updationReason TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Rest of the initialization code...
        const insertDefaultData = (tableName, data, columns) => {
            db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
                if (err) {
                    console.error(`Error checking ${tableName}:`, err);
                    return;
                }

                if (row.count === 0) {
                    const placeholders = '(' + columns.map(() => '?').join(',') + ')';
                    const stmt = db.prepare(`INSERT INTO ${tableName} (${columns.join(',')}) VALUES ${placeholders}`);

                    data.forEach(item => {
                        const values = columns.map(col => item[col]);
                        stmt.run(values);
                    });

                    stmt.finalize();
                }
            });
        };

        insertDefaultData('units', defaultData.units, ['name']);
        insertDefaultData('categories', defaultData.categories, ['name']);
        insertDefaultData('manufacturingUnits', defaultData.manufacturingUnits, ['name', 'description']);
        insertDefaultData('products', defaultData.products, ['name']);
    });
}

initializeDatabase();
module.exports = db;