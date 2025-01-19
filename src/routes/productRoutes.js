const express = require('express');
const router = express.Router();

module.exports = function(db) {
    router.get('/', (req, res) => {
        const query = `
            SELECT 
                p.id, 
                p.name,
                pc.name as category,
                ut.name as unit,
                p.category as categoryId,
                p.unit as unitId
            FROM products p
            LEFT JOIN productCategories pc ON p.category = pc.id
            LEFT JOIN unitTypes ut ON p.unit = ut.id
            ORDER BY p.name ASC`;

        db.all(query, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    router.post('/', (req, res) => {
        const { name, categoryId, unitId } = req.body;

        if (!name || !categoryId || !unitId) {
            return res.status(400).json({ error: 'Name, category ID, and unit type ID are required' });
        }

        db.run(
            'INSERT INTO products (name, category, unit) VALUES (?, ?, ?)',
            [name, categoryId, unitId],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID });
            }
        );
    });

    // Update product
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const { name, categoryId, unitId } = req.body;

        // Log the request details for debugging
        console.log('Update product request:', {
            id,
            name,
            categoryId,
            unitId,
            params: req.params,
            body: req.body
        });

        // Validate input
        if (!id || !name || !categoryId || !unitId) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                received: { id, name, categoryId, unitId }
            });
        }

        // First check if product exists
        db.get('SELECT id FROM products WHERE id = ?', [id], (err, row) => {
            if (err) {
                console.error('Error checking product existence:', err);
                return res.status(500).json({ error: err.message });
            }

            if (!row) {
                return res.status(404).json({ 
                    error: 'Product not found',
                    productId: id
                });
            }

            // Product exists, proceed with update
            db.run(
                'UPDATE products SET name = ?, category = ?, unit = ? WHERE id = ?',
                [name, categoryId, unitId, id],
                function (err) {
                    if (err) {
                        console.error('Error updating product:', err);
                        return res.status(500).json({ error: err.message });
                    }
                    
                    if (this.changes === 0) {
                        return res.status(404).json({ 
                            error: 'Product not found or no changes made',
                            productId: id
                        });
                    }

                    console.log('Product updated successfully:', {
                        id,
                        changes: this.changes
                    });

                    res.json({ 
                        success: true,
                        message: 'Product updated successfully'
                    });
                }
            );
        });
    });

    // Delete product
    router.delete('/:id', (req, res) => {
        const { id } = req.params;

        // Start a transaction to handle both the product deletion and related production logs
        db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // First delete related production logs
            db.run('DELETE FROM productionLogs WHERE productId = ?', [id], (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }

                // Then delete the product
                db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }

                    if (this.changes === 0) {
                        db.run('ROLLBACK');
                        return res.status(404).json({ error: 'Product not found' });
                    }

                    // Commit the transaction if both operations succeed
                    db.run('COMMIT', (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: err.message });
                        }
                        res.json({ success: true });
                    });
                });
            });
        });
    });

    return router;
}; 