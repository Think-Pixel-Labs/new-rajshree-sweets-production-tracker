const { app, BrowserWindow, globalShortcut, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const express = require('express');
const serverApp = express();
const db = require('./database');
const fastcsv = require('fast-csv');
const fs = require('fs');

let mainWindow;

function checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify();
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: { nodeIntegration: true, contextIsolation: false },
        title: "Production Tracker",
        fullscreen: true
    });

    serverApp.use(express.static('public'));
    serverApp.use(express.json());

    serverApp.post('/api/production', (req, res) => {
        const {
            productId,
            productName,
            category,
            quantityManufactured,
            unitType
        } = req.body;

        db.run(
            `INSERT INTO productionLog (
                productId,
                productName,
                category,
                quantityManufactured,
                unitType,
                createdAt,
                updatedAt
            ) VALUES (?, ?, ?, ?, ?, ${db.getCurrentISTDateTime()}, ${db.getCurrentISTDateTime()})`,
            [
                productId,
                productName,
                category,
                quantityManufactured,
                unitType
            ],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID });
            }
        );
    });

    serverApp.get('/api/production', (req, res) => {
        const { startDate, endDate } = req.query;
        let query = `
            SELECT 
                pl.*,
                p.name as productName,
                p.unitType
            FROM productionLog pl
            LEFT JOIN products p ON pl.productId = p.id
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
                return res.status(500).json({ error: 'An error occurred while processing your request' });
            }
            res.json(rows);
        });
    });

    serverApp.put('/api/production/:id', (req, res) => {
        const { id } = req.params;
        const {
            quantityManufactured,
            unitType,
            updationReason
        } = req.body;

        db.run(
            `UPDATE productionLog 
             SET quantityManufactured = ?, 
                 unitType = ?, 
                 updationReason = ?, 
                 updatedAt = ${db.getCurrentISTDateTime()}
             WHERE id = ?`,
            [quantityManufactured, unitType, updationReason, id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            }
        );
    });

    serverApp.get('/api/products', (req, res) => {
        const query = `
            SELECT 
                id, 
                name,
                category,
                unitType
            FROM products 
            ORDER BY name ASC`;

        db.all(query, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    serverApp.post('/api/export-production-logs', async (req, res) => {
        const { startDate, endDate } = req.body;

        const query = `
            SELECT 
                pl.*,
                p.name as productName
            FROM productionLog pl
            LEFT JOIN products p ON pl.productId = p.id
            WHERE date(pl.createdAt) BETWEEN ? AND ?
            ORDER BY datetime(pl.createdAt) DESC
        `;

        db.all(query, [startDate, endDate], async (err, rows) => {
            if (err) {
                console.error('Production log retrieval error:', err);
                return res.status(500).json({ error: 'An error occurred while processing your request' });
            }

            try {
                // Format the data for CSV with separate quantity and unit columns
                const csvData = rows.map(row => ({
                    'ID': row.id,
                    'Date': new Date(row.createdAt).toLocaleString(),
                    'Product': row.productName,
                    'Quantity': row.quantityManufactured,
                    'Unit Type': row.unitType || '',  // Separate column for unit type
                    'Category': row.category,
                    'Update Reason': row.updationReason || '',
                    'Last Updated': row.updatedAt ? new Date(row.updatedAt).toLocaleString() : ''
                }));

                // Show save dialog
                const result = await dialog.showSaveDialog(mainWindow, {
                    title: 'Save Production Logs',
                    defaultPath: `production_logs_${startDate}_to_${endDate}.csv`,
                    filters: [
                        { name: 'CSV Files', extensions: ['csv'] }
                    ]
                });

                if (!result.canceled && result.filePath) {
                    // Write to CSV file
                    const ws = fs.createWriteStream(result.filePath);
                    fastcsv
                        .write(csvData, { headers: true })
                        .pipe(ws)
                        .on('finish', () => {
                            res.json({ success: true, path: result.filePath });
                        })
                        .on('error', (error) => {
                            console.error('CSV write error:', error);
                            res.status(500).json({ error: 'Failed to write CSV file' });
                        });
                } else {
                    res.json({ success: false, message: 'Export cancelled' });
                }
            } catch (error) {
                console.error('Export error:', error);
                res.status(500).json({ error: 'Failed to export data' });
            }
        });
    });

    serverApp.delete('/api/production/:id', (req, res) => {
        const { id } = req.params;

        db.run('DELETE FROM productionLog WHERE id = ?', [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });

    serverApp.post('/api/export-category-summary', async (req, res) => {
        const { date } = req.body;

        const query = `
            SELECT 
                pl.category,
                SUM(pl.quantityManufactured) as totalQuantity,
                pl.unitType,
                date(pl.createdAt) as productionDate,
                GROUP_CONCAT(pl.id) as logIds
            FROM productionLog pl
            WHERE date(pl.createdAt) = ?
            GROUP BY pl.category, pl.unitType
            ORDER BY pl.category
        `;

        db.all(query, [date], async (err, rows) => {
            if (err) {
                console.error('Category summary retrieval error:', err);
                return res.status(500).json({ error: 'An error occurred while processing your request' });
            }

            try {
                const csvData = rows.map(row => ({
                    'Date': new Date(row.productionDate).toLocaleDateString(),
                    'Category': row.category,
                    'Total Quantity': row.totalQuantity,
                    'Unit': row.unitType,
                    'Log IDs': row.logIds
                }));

                const result = await dialog.showSaveDialog(mainWindow, {
                    title: 'Save Category Summary',
                    defaultPath: `category_summary_${date}.csv`,
                    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
                });

                if (!result.canceled && result.filePath) {
                    const ws = fs.createWriteStream(result.filePath);
                    fastcsv
                        .write(csvData, { headers: true })
                        .pipe(ws)
                        .on('finish', () => {
                            res.json({ success: true, path: result.filePath });
                        })
                        .on('error', (error) => {
                            console.error('CSV write error:', error);
                            res.status(500).json({ error: 'Failed to write CSV file' });
                        });
                } else {
                    res.json({ success: false, message: 'Export cancelled' });
                }
            } catch (error) {
                console.error('Export error:', error);
                res.status(500).json({ error: 'Failed to export data' });
            }
        });
    });

    serverApp.post('/api/export-manufacturing-summary', async (req, res) => {
        const { date } = req.body;

        const query = `
            SELECT 
                pl.manufacturingUnitName,
                SUM(pl.quantityManufactured) as totalQuantity,
                pl.unitName,
                date(pl.createdAt) as productionDate,
                GROUP_CONCAT(pl.id) as logIds
            FROM productionLog pl
            WHERE date(pl.createdAt) = ?
            GROUP BY pl.manufacturingUnitName, pl.unitName
            ORDER BY pl.manufacturingUnitName
        `;

        db.all(query, [date], async (err, rows) => {
            if (err) {
                console.error('Manufacturing summary retrieval error:', err);
                return res.status(500).json({ error: 'An error occurred while processing your request' });
            }

            try {
                const csvData = rows.map(row => ({
                    'Date': new Date(row.productionDate).toLocaleDateString(),
                    'Manufacturing Unit': row.manufacturingUnitName,
                    'Total Quantity': row.totalQuantity,
                    'Unit': row.unitName,
                    'Log IDs': row.logIds
                }));

                const result = await dialog.showSaveDialog(mainWindow, {
                    title: 'Save Manufacturing Summary',
                    defaultPath: `manufacturing_summary_${date}.csv`,
                    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
                });

                if (!result.canceled && result.filePath) {
                    const ws = fs.createWriteStream(result.filePath);
                    fastcsv
                        .write(csvData, { headers: true })
                        .pipe(ws)
                        .on('finish', () => {
                            res.json({ success: true, path: result.filePath });
                        })
                        .on('error', (error) => {
                            console.error('CSV write error:', error);
                            res.status(500).json({ error: 'Failed to write CSV file' });
                        });
                } else {
                    res.json({ success: false, message: 'Export cancelled' });
                }
            } catch (error) {
                console.error('Export error:', error);
                res.status(500).json({ error: 'Failed to export data' });
            }
        });
    });

    setTimeout(() => {
        const server = serverApp.listen(0, () => {
            const port = server.address().port;
            mainWindow.loadURL(`http://localhost:${port}`);
        });
    }, 1000);

    mainWindow.on('closed', () => mainWindow = null);
    checkForUpdates();

    mainWindow.webContents.on('ipc-message', async (event, channel, ...args) => {
        if (channel === 'export-production-logs') {
            const { startDate, endDate } = args[0];
            // Handle the export request
        }
    });
}

app.on('ready', () => {
    createWindow();
    globalShortcut.register('F11', () => {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
    });
});

autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });
app.on('will-quit', () => { globalShortcut.unregister('F11'); });