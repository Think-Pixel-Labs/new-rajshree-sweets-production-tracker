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
        const query = `SELECT id, name FROM manufacturingUnits ORDER BY name`;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Manufacturing units retrieval error:', err);
                throw err;
            }
            res.json(rows);
        });
    }));

    return router;
}; 