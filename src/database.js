const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

module.exports = function (dbPath) {
    console.log('Database module - Opening database at:', dbPath);

    if (!fs.existsSync(dbPath)) {
        const error = new Error(`Database file not found at: ${dbPath}`);
        console.error(error);
        throw error;
    }

    try {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                console.error('Database path was:', dbPath);
                throw err;
            }
            console.log('Successfully opened database at:', dbPath);
        });

        db.getCurrentISTDateTime = function () {
            return "datetime('now', '+5 hours', '+30 minutes')";
        };

        // Test database connection
        db.get("SELECT 1", (err) => {
            if (err) {
                console.error('Database test query failed:', err);
                throw err;
            }
            console.log('Database test query successful');
        });

        return db;
    } catch (err) {
        console.error('Failed to initialize database:', err);
        throw err;
    }
};