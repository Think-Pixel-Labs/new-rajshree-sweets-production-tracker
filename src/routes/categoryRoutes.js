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

    // Add new category
    router.post('/', (req, res) => {
        const { category } = req.body;
        
        if (!category) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        // Since categories are stored in the products table, we'll add a dummy product
        // that serves as a category placeholder, using 'KG' as the default unit type
        const query = `
            INSERT INTO products (name, category, unitType) 
            SELECT ?, ?, 'KG'
            WHERE NOT EXISTS (
                SELECT 1 FROM products WHERE category = ?
            )
            LIMIT 1
        `;

        db.run(query, [category, category, category], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });

    return router;
}; 