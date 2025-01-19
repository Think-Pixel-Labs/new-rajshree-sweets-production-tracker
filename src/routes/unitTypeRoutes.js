const express = require('express');
const router = express.Router();

module.exports = function(db) {
    // Get all unit types
    router.get('/', (req, res) => {
        const query = `SELECT id, name FROM unitTypes ORDER BY name`;
        db.all(query, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    // Add new unit type
    router.post('/', (req, res) => {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Unit type name is required' });
        }

        const query = `INSERT INTO unitTypes (name) VALUES (?)`;

        db.run(query, [name.toUpperCase()], function(err) {
            if (err) {
                // Check for unique constraint violation
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Unit type already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                success: true, 
                id: this.lastID,
                name: name.toUpperCase()
            });
        });
    });

    return router;
}; 