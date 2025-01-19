const express = require('express');
const router = express.Router();

module.exports = function(db) {
    router.get('/', (req, res) => {
        const query = `
            SELECT 
                p.id as id, 
                p.name as name,
                pc.name as category,
                ut.name as unit,
                p.category as category_id,
                p.unit as unit_id,
                p.manufacturingUnit as manufacturing_unit_id,
                mu.name as manufacturing_unit_name
            FROM products p
            LEFT JOIN productCategories pc ON p.category = pc.id
            LEFT JOIN unitTypes ut ON p.unit = ut.id
            LEFT JOIN manufacturingUnits mu ON p.manufacturingUnit = mu.id
            ORDER BY p.name ASC`;

        db.all(query, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            console.log('Products fetched:', rows); // Debug log
            res.json(rows);
        });
    });

    router.post('/', (req, res) => {
        const { name, categoryId, unitId, manufacturingUnitId } = req.body;

        if (!name || !categoryId || !unitId || !manufacturingUnitId) {
            return res.status(400).json({ error: 'Name, category ID, unit type ID, and manufacturing unit ID are required' });
        }

        db.run(
            'INSERT INTO products (name, category, unit, manufacturingUnit) VALUES (?, ?, ?, ?)',
            [name, categoryId, unitId, manufacturingUnitId],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID });
            }
        );
    });

    // Update product
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const { name, categoryId, unitId, manufacturingUnitId } = req.body;

        // Log the request details for debugging
        console.log('Update product request:', {
            id,
            name,
            categoryId,
            unitId,
            manufacturingUnitId,
            params: req.params,
            body: req.body
        });

        // Validate input
        if (!id || !name || !categoryId || !unitId || !manufacturingUnitId) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                received: { id, name, categoryId, unitId, manufacturingUnitId }
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
                'UPDATE products SET name = ?, category = ?, unit = ?, manufacturingUnit = ? WHERE id = ?',
                [name, categoryId, unitId, manufacturingUnitId, id],
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