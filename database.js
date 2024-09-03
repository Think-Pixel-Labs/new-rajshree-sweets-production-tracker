const sqlite3 = require('better-sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const csv = require('csvtojson');
const moment = require('moment-timezone');

// Set the default timezone for the application
moment.tz.setDefault('Asia/Kolkata');

const dbPath = './production.db';

// Check if the database file exists
const dbExists = fs.existsSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the production database.');
});

// Only create tables and insert data if the database file didn't exist
if (!dbExists) {
    console.log('Creating tables and inserting initial data...');
    db.serialize(() => {
        const tables = [
            `CREATE TABLE IF NOT EXISTS manufacturingUnits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                categoryId INTEGER REFERENCES categories(id),
                unitId INTEGER REFERENCES units(id)
            )`,
            `CREATE TABLE IF NOT EXISTS units (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS productionLog (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                productId INTEGER,
                manufacturedByUnitId INTEGER,
                quantityManufactured REAL,
                createdAt TIMESTAMP DEFAULT (datetime('now', 'localtime')),
                updatedAt TIMESTAMP DEFAULT (datetime('now', 'localtime')),
                updationReason TEXT,
                FOREIGN KEY (productId) REFERENCES products(id),
                FOREIGN KEY (manufacturedByUnitId) REFERENCES manufacturingUnits(id)
            )`,
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL
            )`
        ];

        tables.forEach(table => db.run(table));

        const dataDir = path.join(__dirname, 'public', 'data');
        const csvFiles = [
            { file: 'ManufacturingUnits.csv', table: 'manufacturingUnits', columns: ['id', 'name'] },
            { file: 'Categories.csv', table: 'categories', columns: ['id', 'name'] },
            { file: 'Units.csv', table: 'units', columns: ['id', 'name'] },
            { file: 'Products.csv', table: 'products', columns: ['name', 'categoryId', 'unitId'] },
            { file: 'Users.csv', table: 'users', columns: ['username', 'password', 'role'] }
        ];

        csvFiles.forEach(({ file, table, columns }) => {
            csv()
                .fromFile(path.join(dataDir, file))
                .then((data) => {
                    const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
                    data.forEach((row) => stmt.run(columns.map(col => row[col])));
                    stmt.finalize();
                    console.log(`Data inserted into ${table}`);
                })
                .catch(err => console.error(`Error inserting data into ${table}:`, err));
        });
    });
} else {
    console.log('Database file already exists. Skipping table creation and data insertion.');
}

// Add this function to ensure all date operations use IST
db.getIST = () => {
    return new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
};

// Update the getISTDateTime function
db.getISTDateTime = () => moment().format('YYYY-MM-DD HH:mm:ss');

module.exports = db;