const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const db = new sqlite3.Database(path.join(__dirname, '..', 'data', 'production.db'));

// Function to get current IST datetime
function getCurrentISTDateTime() {
    return `datetime('now', '+5 hours', '+30 minutes')`;
}

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
            name TEXT NOT NULL UNIQUE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )`);

        // Modified production log table to use IST timestamps
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
            createdAt DATETIME DEFAULT (${getCurrentISTDateTime()}),
            updatedAt DATETIME DEFAULT (${getCurrentISTDateTime()})
        )`);
    });
}

// Add this function to the exports
db.getCurrentISTDateTime = getCurrentISTDateTime;

initializeDatabase();
module.exports = db;