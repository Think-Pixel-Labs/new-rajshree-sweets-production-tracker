const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const csv = require('csvtojson');

const dbPath = './production.db';

// Check if the database file exists
const dbExists = fs.existsSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the production database.');
});

// Only create tables and insert data if the database file didn't exist
if (!dbExists) {
    console.log('Database file not found. Creating tables and inserting initial data...');

    // Create tables
    db.serialize(() => {
        // Create ManufacturingUnits table
        db.run(`CREATE TABLE IF NOT EXISTS manufacturingUnits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )`);

        // Create Products table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            categoryId INTEGER REFERENCES categories(id),
            unitId INTEGER REFERENCES units(id)
        )`);

        // Create Units table
        db.run(`CREATE TABLE IF NOT EXISTS units (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )`);

        // Create Categories table
        db.run(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )`);

        // Create ProductionLog table
        db.run(`CREATE TABLE IF NOT EXISTS productionLog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            productId INTEGER,
            manufacturedByUnitId INTEGER,
            quantityManufactured REAL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updationReason TEXT,
            FOREIGN KEY (productId) REFERENCES products(id),
            FOREIGN KEY (manufacturedByUnitId) REFERENCES manufacturingUnits(id)
        )`);

        // Create users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )`);

        // Populate all the tables with the data from the csv files
        const dataDir = path.join(__dirname, 'public', 'data');

        // Helper function to insert data from CSV
        function insertDataFromCSV(filename, tableName, columns) {
            csv()
                .fromFile(path.join(dataDir, filename))
                .then((data) => {
                    const placeholders = columns.map(() => '?').join(',');
                    const stmt = db.prepare(`INSERT INTO ${tableName} (${columns.join(',')}) VALUES (${placeholders})`);

                    data.forEach((row) => {
                        stmt.run(columns.map(col => row[col]));
                    });

                    stmt.finalize();
                    console.log(`Data inserted into ${tableName}`);
                })
                .catch(err => console.error(`Error inserting data into ${tableName}:`, err));
        }

        // Insert data for each table
        insertDataFromCSV('ManufacturingUnits.csv', 'manufacturingUnits', ['id', 'name']);
        insertDataFromCSV('Categories.csv', 'categories', ['id', 'name']);
        insertDataFromCSV('Units.csv', 'units', ['id', 'name']);
        insertDataFromCSV('Products.csv', 'products', ['name', 'categoryId', 'unitId']);
        insertDataFromCSV('Users.csv', 'users', ['username', 'password', 'role']);
    });
} else {
    console.log('Database file already exists. Skipping table creation and data insertion.');
}

module.exports = db;