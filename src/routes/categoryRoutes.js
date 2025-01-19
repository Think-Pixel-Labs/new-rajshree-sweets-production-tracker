const express = require('express');
const router = express.Router();

module.exports = function(db) {
    // Get all categories
    router.get('/', (req, res) => {
        const query = `SELECT id, name FROM productCategories ORDER BY name`;
        db.all(query, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    // Add new category
    router.post('/', (req, res) => {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const query = `INSERT INTO productCategories (name) VALUES (?)`;

        db.run(query, [name], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                success: true, 
                id: this.lastID,
                name: name
            });
        });
    });

    return router;
}; 