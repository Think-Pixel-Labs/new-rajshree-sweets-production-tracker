const sqlite3 = require('sqlite3').verbose();

module.exports = function (dbPath) {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err);
        }
    });

    // ... rest of your database code ...

    return db;
};