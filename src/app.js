const { app, BrowserWindow, globalShortcut, dialog } = require('electron');
const path = require('path');
const express = require('express');
const serverApp = express();
const fs = require('fs');
const fastcsv = require('fast-csv');

let mainWindow;
let db;

function getDatabasePath() {
    if (app.isPackaged) {
        const dbPath = path.join(process.resourcesPath, 'production.db');
        console.log('Production DB Path:', dbPath);
        return dbPath;
    }
    const devPath = path.join(__dirname, '..', 'data', 'production.db');
    console.log('Development DB Path:', devPath);
    return devPath;
}

function getPublicPath() {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'public');
    }
    return path.join(__dirname, '..', 'public');
}

function createWindow() {
    const dbPath = getDatabasePath();
    console.log('Attempting to open database at:', dbPath);

    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
        console.error('Database file not found at:', dbPath);
        dialog.showErrorBox(
            'Database Error',
            `Database file not found at: ${dbPath}`
        );
        app.quit();
        return;
    }

    try {
        db = require('./database')(dbPath);
    } catch (err) {
        console.error('Failed to initialize database:', err);
        dialog.showErrorBox(
            'Database Error',
            `Failed to initialize database: ${err.message}`
        );
        app.quit();
        return;
    }

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: { nodeIntegration: true, contextIsolation: false },
        title: "Production Tracker",
        icon: path.join(__dirname, '..', 'public', 'logo.ico'),
        show: false,
        center: true
    });

    // Show window when ready to prevent flickering
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    serverApp.use(express.static(getPublicPath()));
    serverApp.use(express.json());

    serverApp.post('/api/production', (req, res) => {
        const { productId, quantity } = req.body;

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
    });

    serverApp.get('/api/production', (req, res) => {
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
                return res.status(500).json({ error: 'An error occurred while processing your request' });
            }
            res.json(rows);
        });
    });

    serverApp.put('/api/production/:id', (req, res) => {
        const { id } = req.params;
        const { quantity, updationReason } = req.body;

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
                    'Quantity': row.quantity,
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
        res.status(400).json({ error: 'Manufacturing unit tracking has been removed' });
    });

    serverApp.post('/api/export-detailed-category-summary', async (req, res) => {
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

        db.all(query, [date], async (err, rows) => {
            if (err) {
                console.error('Detailed category summary retrieval error:', err);
                return res.status(500).json({ error: 'An error occurred while processing your request' });
            }

            try {
                // Process the data to group by category
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

                    // Add to category total if units match
                    if (category.products[0].unit === row.unitType) {
                        category.totalQuantity += row.totalQuantity;
                    }
                });

                // Format for CSV
                const csvData = [];
                for (const categoryData of categoryMap.values()) {
                    // Add category header row
                    csvData.push({
                        'Date': categoryData.date,
                        'Category': categoryData.category,
                        'Total Quantity': categoryData.totalQuantity,
                        'Unit': categoryData.products[0].unit,
                        'Product': '',
                        'Product Quantity': ''
                    });

                    // Add individual product rows
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

                    // Add empty row between categories
                    csvData.push({
                        'Date': '',
                        'Category': '',
                        'Total Quantity': '',
                        'Unit': '',
                        'Product': '',
                        'Product Quantity': ''
                    });
                }

                const result = await dialog.showSaveDialog(mainWindow, {
                    title: 'Save Detailed Category Summary',
                    defaultPath: `detailed_category_summary_${date}.csv`,
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

    serverApp.get('*', (req, res) => {
        res.sendFile(path.join(getPublicPath(), 'index.html'));
    });

    setTimeout(() => {
        const server = serverApp.listen(0, () => {
            const port = server.address().port;
            mainWindow.loadURL(`http://localhost:${port}`);
        });
    }, 1000);

    mainWindow.on('closed', () => mainWindow = null);

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

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });
app.on('will-quit', () => { globalShortcut.unregister('F11'); });

if (require('electron-squirrel-startup')) app.quit();