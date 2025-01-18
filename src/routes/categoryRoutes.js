const express = require('express');
const router = express.Router();

module.exports = function(db) {
    // Get all categories
    router.get('/', (req, res) => {
        const query = `SELECT DISTINCT category FROM products ORDER BY category`;
        db.all(query, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            const categories = rows.map(row => row.category).filter(Boolean);
            res.json(categories);
        });
    });

    return router;
}; 