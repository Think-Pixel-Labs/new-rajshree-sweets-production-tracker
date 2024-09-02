const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./production.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the production database.');
});

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
const csv = require('csvtojson');

// Read and insert data from ManufacturingUnits.csv
csv()
    .fromFile('./public/data/ManufacturingUnits.csv')
    .then((manufacturingUnits) => {
        manufacturingUnits.forEach((unit) => {
            db.run(`INSERT INTO manufacturingUnits (id, name) VALUES (?, ?)`, [unit.id, unit.name]);
        });
    });

// Read and insert data from Categories.csv
csv()
    .fromFile('./public/data/Categories.csv')
    .then((categories) => {
        categories.forEach((category) => {
            db.run(`INSERT INTO categories (id, name) VALUES (?, ?)`, [category.id, category.name]);
        });
    });

// Read and insert data from Units.csv
csv()
    .fromFile('./public/data/Units.csv')
    .then((units) => {
        units.forEach((unit) => {
            db.run(`INSERT INTO units (id, name) VALUES (?, ?)`, [unit.id, unit.name]);
        });
    });

// Read and insert data from Products.csv
csv()
    .fromFile('./public/data/Products.csv')
    .then((products) => {
        products.forEach((product) => {
            db.run(`INSERT INTO products (name, categoryId, unitId) VALUES (?, ?, ?)`, [product.name, product.categoryId, product.unitId]);
        });
    });

// Read and insert data from Users.csv
csv()
    .fromFile('./public/data/Users.csv')
    .then((users) => {
        users.forEach((user) => {
            db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, [user.username, user.password, user.role]);
        });
    });

module.exports = db;