const sqlite3 = require('sqlite3').verbose();

module.exports = function (dbPath) {
    console.log('Attempting to open database at:', dbPath);

    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err);
            console.error('Database path was:', dbPath);
        } else {
            console.log('Successfully opened database at:', dbPath);
        }
    });

    // ... rest of your database code ...

    return db;
};