const express = require('express');
const router = express.Router();

// Error handling middleware
const handleErrors = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
};

module.exports = function(db) {
    if (!db) {
        throw new Error('Database instance is required');
    }

    // Get all manufacturing units
    router.get('/', handleErrors(async (req, res) => {
        const query = 'SELECT * FROM manufacturingUnits ORDER BY name';
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        });
    }));

    // Add new manufacturing unit
    router.post('/', handleErrors(async (req, res) => {
        const { name, type } = req.body;
        
        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });
        }

        const query = 'INSERT INTO manufacturingUnits (name, type) VALUES (?, ?)';
        db.run(query, [name, type], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, name, type });
        });
    }));

    return router;
}; 