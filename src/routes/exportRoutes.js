const express = require('express');
const router = express.Router();
const path = require('path');
const { exportToCSV } = require('../utils/csvExporter');
const { app: electronApp, dialog } = require('electron');
const fs = require('fs').promises;

module.exports = function(db, mainWindow) {
    // Add debug route to verify router is working
    router.get('/test', (req, res) => {
        res.json({ message: 'Export routes are working' });
    });

    // Export production logs
    router.post('/production-logs', async (req, res) => {
        const { startDate, endDate } = req.body;
        
        try {
            const query = `
                SELECT 
                    p.name as productName,
                    pl.quantity,
                    p.unitType,
                    p.category,
                    pl.createdAt,
                    pl.updatedAt,
                    pl.updationReason
                FROM productionLog pl
                JOIN products p ON pl.productId = p.id
                WHERE DATE(pl.createdAt) BETWEEN DATE(?) AND DATE(?)
                ORDER BY pl.createdAt DESC
            `;

            db.all(query, [startDate, endDate], async (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: err.message });
                }

                if (!rows || rows.length === 0) {
                    return res.status(404).json({ error: 'No data found for the selected date range' });
                }

                try {
                    const defaultPath = path.join(electronApp.getPath('downloads'), 
                        `production_logs_${startDate}_to_${endDate}.csv`);
                    
                    const { filePath } = await dialog.showSaveDialog(mainWindow, {
                        defaultPath: defaultPath,
                        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
                    });

                    if (!filePath) {
                        return res.status(400).json({ error: 'Export cancelled by user' });
                    }

                    await exportToCSV(rows, filePath);
                    res.json({ success: true, filename: path.basename(filePath) });
                } catch (error) {
                    console.error('File save error:', error);
                    res.status(500).json({ error: 'Failed to save file' });
                }
            });
        } catch (error) {
            console.error('Export error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Export category summary
    router.post('/category-summary', async (req, res) => {
        console.log('Category summary export request received:', req.body);
        const { date } = req.body;
        
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }
        
        try {
            const query = `
                SELECT 
                    p.category,
                    SUM(pl.quantity) as totalQuantity,
                    p.unitType,
                    COUNT(DISTINCT p.id) as uniqueProducts,
                    COUNT(pl.id) as totalEntries
                FROM productionLog pl
                JOIN products p ON pl.productId = p.id
                WHERE DATE(pl.createdAt) = DATE(?)
                GROUP BY p.category, p.unitType
                ORDER BY p.category
            `;

            db.all(query, [date], async (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: err.message });
                }

                if (!rows || rows.length === 0) {
                    return res.status(404).json({ error: 'No data found for the selected date' });
                }

                try {
                    const defaultPath = path.join(electronApp.getPath('downloads'), `category_summary_${date}.csv`);
                    
                    const { filePath } = await dialog.showSaveDialog(mainWindow, {
                        defaultPath: defaultPath,
                        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
                    });

                    if (!filePath) {
                        return res.status(400).json({ error: 'Export cancelled by user' });
                    }

                    await exportToCSV(rows, filePath);
                    res.json({ success: true, filename: path.basename(filePath) });
                } catch (error) {
                    console.error('File save error:', error);
                    res.status(500).json({ error: 'Failed to save file' });
                }
            });
        } catch (error) {
            console.error('Export error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Export detailed category summary
    router.post('/detailed-category-summary', async (req, res) => {
        const { date } = req.body;
        
        try {
            const query = `
                SELECT 
                    p.category,
                    p.name as productName,
                    SUM(pl.quantity) as totalQuantity,
                    p.unitType,
                    COUNT(pl.id) as entries
                FROM productionLog pl
                JOIN products p ON pl.productId = p.id
                WHERE DATE(pl.createdAt) = DATE(?)
                GROUP BY p.category, p.id
                ORDER BY p.category, p.name
            `;

            db.all(query, [date], async (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: err.message });
                }

                if (!rows || rows.length === 0) {
                    return res.status(404).json({ error: 'No data found for the selected date' });
                }

                try {
                    const defaultPath = path.join(electronApp.getPath('downloads'), 
                        `detailed_category_summary_${date}.csv`);
                    
                    const { filePath } = await dialog.showSaveDialog(mainWindow, {
                        defaultPath: defaultPath,
                        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
                    });

                    if (!filePath) {
                        return res.status(400).json({ error: 'Export cancelled by user' });
                    }

                    await exportToCSV(rows, filePath);
                    res.json({ success: true, filename: path.basename(filePath) });
                } catch (error) {
                    console.error('File save error:', error);
                    res.status(500).json({ error: 'Failed to save file' });
                }
            });
        } catch (error) {
            console.error('Export error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}; 