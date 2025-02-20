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
        const { productId, quantity, logTypeId } = req.body;

        if (!productId || !quantity || !logTypeId) {
            return res.status(400).json({ error: 'Product ID, quantity, and log type are required' });
        }

        db.run(
            `INSERT INTO productionLogs (
                productId,
                quantity,
                logType,
                createdAt,
                updatedAt
            ) VALUES (?, ?, ?, ${db.getCurrentISTDateTime()}, ${db.getCurrentISTDateTime()})`,
            [productId, quantity, logTypeId],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID });
            }
        );
    }));

    // Get production logs
    router.get('/', handleErrors(async (req, res) => {
        const { startDate, endDate } = req.query;
        console.log('Fetching production logs with dates:', { startDate, endDate }); // Debug log
        
        let query = `
            SELECT 
                pl.id,
                pl.quantity,
                pl.createdAt,
                pl.updatedAt,
                pl.updationReason,
                p.id as productId,
                p.name as productName,
                pc.name as category,
                ut.name as unit,
                mu.name as manufacturingUnitName,
                lt.type as logTypeName,
                pl.logType as logTypeId
            FROM productionLogs pl
            JOIN products p ON pl.productId = p.id
            LEFT JOIN productCategories pc ON p.category = pc.id
            LEFT JOIN unitTypes ut ON p.unit = ut.id
            LEFT JOIN manufacturingUnits mu ON p.manufacturingUnit = mu.id
            LEFT JOIN productionLogTypes lt ON pl.logType = lt.id
        `;
        let params = [];

        if (startDate && endDate) {
            query += ' WHERE date(pl.createdAt) BETWEEN ? AND ?';
            params = [startDate, endDate];
        }

        query += ' ORDER BY datetime(pl.createdAt) DESC';

        console.log('Executing query:', query); // Debug log
        console.log('With params:', params); // Debug log

        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Production log retrieval error:', err);
                throw err;
            }
            console.log('Retrieved production logs:', rows); // Debug log
            res.json(rows);
        });
    }));

    // Update production log
    router.put('/:id', handleErrors(async (req, res) => {
        const { id } = req.params;
        const { quantity, logTypeId, updationReason } = req.body;

        if (!quantity || !logTypeId) {
            return res.status(400).json({ error: 'Quantity and log type are required' });
        }

        db.run(
            `UPDATE productionLogs 
             SET quantity = ?, 
                 logType = ?,
                 updationReason = ?, 
                 updatedAt = ${db.getCurrentISTDateTime()}
             WHERE id = ?`,
            [quantity, logTypeId, updationReason, id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            }
        );
    }));

    // Delete production log
    router.delete('/:id', handleErrors(async (req, res) => {
        const { id } = req.params;

        db.run('DELETE FROM productionLogs WHERE id = ?', [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }));

    return router;
}; 