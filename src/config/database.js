const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class Database {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.db = this.initialize();
    }

    initialize() {
        console.log('Database module - Opening database at:', this.dbPath);

        if (!fs.existsSync(this.dbPath)) {
            const error = new Error(`Database file not found at: ${this.dbPath}`);
            console.error(error);
            throw error;
        }

        try {
            const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    throw err;
                }
                console.log('Successfully opened database');
            });

            db.getCurrentISTDateTime = function () {
                return "datetime('now', '+5 hours', '+30 minutes')";
            };

            this.testConnection(db);
            return db;
        } catch (err) {
            console.error('Failed to initialize database:', err);
            throw err;
        }
    }

    testConnection(db) {
        db.get("SELECT 1", (err) => {
            if (err) {
                console.error('Database test query failed:', err);
                throw err;
            }
            console.log('Database test query successful');
        });
    }

    getInstance() {
        return this.db;
    }
}

module.exports = Database; 