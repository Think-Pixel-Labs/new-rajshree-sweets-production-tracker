const express = require('express');
const router = express.Router();
const { exportToCsv } = require('../utils/csvExporter');
const { dialog } = require('electron');

// Utility function to handle window focus
const handleWindowFocus = (mainWindow) => {
    mainWindow.setAlwaysOnTop(true);
    mainWindow.focus();
    setTimeout(() => {
        mainWindow.setAlwaysOnTop(false);
    }, 100);
};

// Utility function to handle CSV export dialog
const handleExportDialog = async (mainWindow, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    handleWindowFocus(mainWindow);
    return result;
};

// Error handling middleware
const handleErrors = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
};

module.exports = function(db, mainWindow) {
    if (!db || !mainWindow) {
        throw new Error('Database and mainWindow instances are required');
    }

    // Create production log
    router.post('/', handleErrors(async (req, res) => {
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({ error: 'Product ID and quantity are required' });
        }

        db.run(
            `INSERT INTO productionLog (
                productId,
                quantity,
                createdAt,
                updatedAt
            ) VALUES (?, ?, ${db.getCurrentISTDateTime()}, ${db.getCurrentISTDateTime()})`,
            [productId, quantity],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID });
            }
        );
    }));

    // Get production logs
    router.get('/', handleErrors(async (req, res) => {
        const { startDate, endDate } = req.query;
        let query = `
            SELECT 
                pl.id,
                pl.quantity,
                pl.createdAt,
                pl.updatedAt,
                pl.updationReason,
                p.id as productId,
                p.name as productName,
                p.category,
                p.unitType
            FROM productionLog pl
            JOIN products p ON pl.productId = p.id
        `;
        let params = [];

        if (startDate && endDate) {
            query += ' WHERE date(pl.createdAt) BETWEEN ? AND ?';
            params = [startDate, endDate];
        }

        query += ' ORDER BY datetime(pl.createdAt) DESC';

        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Production log retrieval error:', err);
                throw err;
            }
            res.json(rows);
        });
    }));

    // Update production log
    router.put('/:id', handleErrors(async (req, res) => {
        const { id } = req.params;
        const { quantity, updationReason } = req.body;

        if (!quantity) {
            return res.status(400).json({ error: 'Quantity is required' });
        }

        db.run(
            `UPDATE productionLog 
             SET quantity = ?, 
                 updationReason = ?, 
                 updatedAt = ${db.getCurrentISTDateTime()}
             WHERE id = ?`,
            [quantity, updationReason, id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            }
        );
    }));

    // Delete production log
    router.delete('/:id', handleErrors(async (req, res) => {
        const { id } = req.params;

        db.run('DELETE FROM productionLog WHERE id = ?', [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }));

    // Export production logs
    router.post('/export-production-logs', handleErrors(async (req, res) => {
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const query = `
            SELECT 
                pl.id,
                pl.quantity,
                pl.createdAt,
                pl.updatedAt,
                pl.updationReason,
                p.name as productName,
                p.category,
                p.unitType
            FROM productionLog pl
            JOIN products p ON pl.productId = p.id
            WHERE date(pl.createdAt) BETWEEN ? AND ?
            ORDER BY datetime(pl.createdAt) DESC
        `;

        const rows = await new Promise((resolve, reject) => {
            db.all(query, [startDate, endDate], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const csvData = rows.map(row => ({
            'ID': row.id,
            'Date': new Date(row.createdAt).toLocaleString(),
            'Product': row.productName,
            'Quantity': row.quantity,
            'Unit Type': row.unitType || '',
            'Category': row.category,
            'Update Reason': row.updationReason || '',
            'Last Updated': row.updatedAt ? new Date(row.updatedAt).toLocaleString() : ''
        }));

        const result = await handleExportDialog(mainWindow, {
            title: 'Save Production Logs',
            defaultPath: `production_logs_${startDate}_to_${endDate}.csv`,
            filters: [{ name: 'CSV Files', extensions: ['csv'] }]
        });

        if (!result.canceled && result.filePath) {
            await exportToCsv(csvData, result.filePath);
            handleWindowFocus(mainWindow);
            res.json({ success: true, path: result.filePath });
        } else {
            res.json({ success: false, message: 'Export cancelled' });
        }
    }));

    // Export category summary
    router.post('/export-category-summary', handleErrors(async (req, res) => {
        const { date } = req.body;

        const query = `
            SELECT 
                p.category,
                SUM(pl.quantity) as totalQuantity,
                p.unitType,
                date(pl.createdAt) as productionDate,
                GROUP_CONCAT(pl.id) as logIds
            FROM productionLog pl
            JOIN products p ON pl.productId = p.id
            WHERE date(pl.createdAt) = ?
            GROUP BY p.category, p.unitType
            ORDER BY p.category
        `;

        const rows = await new Promise((resolve, reject) => {
            db.all(query, [date], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const csvData = rows.map(row => ({
            'Date': new Date(row.productionDate).toLocaleDateString(),
            'Category': row.category,
            'Total Quantity': row.totalQuantity,
            'Unit': row.unitType,
            'Log IDs': row.logIds
        }));

        const result = await handleExportDialog(mainWindow, {
            title: 'Save Category Summary',
            defaultPath: `category_summary_${date}.csv`,
            filters: [{ name: 'CSV Files', extensions: ['csv'] }]
        });

        if (!result.canceled && result.filePath) {
            await exportToCsv(csvData, result.filePath);
            handleWindowFocus(mainWindow);
            res.json({ success: true, path: result.filePath });
        } else {
            res.json({ success: false, message: 'Export cancelled' });
        }
    }));

    // Export detailed category summary
    router.post('/export-detailed-category-summary', handleErrors(async (req, res) => {
        const { date } = req.body;

        const query = `
            SELECT 
                p.category,
                p.name as productName,
                SUM(pl.quantity) as totalQuantity,
                p.unitType,
                date(pl.createdAt) as productionDate,
                GROUP_CONCAT(pl.id) as logIds
            FROM productionLog pl
            JOIN products p ON pl.productId = p.id
            WHERE date(pl.createdAt) = ?
            GROUP BY p.category, p.name, p.unitType
            ORDER BY p.category, p.name
        `;

        const rows = await new Promise((resolve, reject) => {
            db.all(query, [date], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const categoryMap = new Map();

        rows.forEach(row => {
            if (!categoryMap.has(row.category)) {
                categoryMap.set(row.category, {
                    date: new Date(row.productionDate).toLocaleDateString(),
                    category: row.category,
                    totalQuantity: 0,
                    products: []
                });
            }

            const category = categoryMap.get(row.category);
            category.products.push({
                productName: row.productName,
                quantity: row.totalQuantity,
                unit: row.unitType
            });

            if (category.products[0].unit === row.unitType) {
                category.totalQuantity += row.totalQuantity;
            }
        });

        const csvData = [];
        for (const categoryData of categoryMap.values()) {
            csvData.push({
                'Date': categoryData.date,
                'Category': categoryData.category,
                'Total Quantity': categoryData.totalQuantity,
                'Unit': categoryData.products[0].unit,
                'Product': '',
                'Product Quantity': ''
            });

            categoryData.products.forEach(product => {
                csvData.push({
                    'Date': '',
                    'Category': '',
                    'Total Quantity': '',
                    'Unit': '',
                    'Product': product.productName,
                    'Product Quantity': `${product.quantity} ${product.unit}`
                });
            });

            csvData.push({
                'Date': '',
                'Category': '',
                'Total Quantity': '',
                'Unit': '',
                'Product': '',
                'Product Quantity': ''
            });
        }

        const result = await handleExportDialog(mainWindow, {
            title: 'Save Detailed Category Summary',
            defaultPath: `detailed_category_summary_${date}.csv`,
            filters: [{ name: 'CSV Files', extensions: ['csv'] }]
        });

        if (!result.canceled && result.filePath) {
            await exportToCsv(csvData, result.filePath);
            handleWindowFocus(mainWindow);
            res.json({ success: true, path: result.filePath });
        } else {
            res.json({ success: false, message: 'Export cancelled' });
        }
    }));

    // Manufacturing summary route (disabled)
    router.post('/export-manufacturing-summary', handleErrors(async (req, res) => {
        res.status(400).json({ error: 'Manufacturing unit tracking has been removed' });
    }));

    return router;
}; 