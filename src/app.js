const { app, BrowserWindow, globalShortcut } = require('electron');
const { autoUpdater } = require('electron-updater');
const express = require('express');
const serverApp = express();
const db = require('./database');

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
            categoryId,
            categoryName,
            quantityManufactured,
            unitId,
            unitName,
            manufacturedByUnitId,
            manufacturingUnitName
        } = req.body;

        db.run(
            `INSERT INTO productionLog (
                productId,
                productName,
                categoryId,
                categoryName,
                quantityManufactured,
                unitId,
                unitName,
                manufacturedByUnitId,
                manufacturingUnitName
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                productId,
                productName,
                categoryId,
                categoryName,
                quantityManufactured,
                unitId,
                unitName,
                manufacturedByUnitId,
                manufacturingUnitName
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
                p.name as productName
            FROM productionLog pl
            LEFT JOIN products p ON pl.productId = p.id
        `;
        let params = [];

        if (startDate && endDate) {
            query += ' WHERE date(pl.createdAt) BETWEEN ? AND ?';
            params = [startDate, endDate];
        }

        query += ' ORDER BY pl.createdAt DESC';

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
        const { quantityManufactured, unitId, updationReason } = req.body;

        db.run(
            'UPDATE productionLog SET quantityManufactured = ?, unitId = ?, updationReason = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [quantityManufactured, unitId, updationReason, id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            }
        );
    });

    serverApp.get('/api/units', (req, res) => {
        db.all('SELECT * FROM units ORDER BY id', (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    serverApp.get('/api/categories', (req, res) => {
        db.all('SELECT * FROM categories ORDER BY id', (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    serverApp.get('/api/products', (req, res) => {
        const query = `
            SELECT 
                p.id, 
                p.name
            FROM products p 
            ORDER BY p.id`;

        db.all(query, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    serverApp.get('/api/manufacturing-units', (req, res) => {
        db.all('SELECT * FROM manufacturingUnits ORDER BY id', (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    serverApp.post('/api/units', (req, res) => {
        const { name } = req.body;
        db.run('INSERT INTO units (name) VALUES (?)', [name], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, name });
        });
    });

    serverApp.post('/api/categories', (req, res) => {
        const { name } = req.body;
        db.run('INSERT INTO categories (name) VALUES (?)', [name], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, name });
        });
    });

    serverApp.put('/api/units/:id', (req, res) => {
        const { id } = req.params;
        const { name } = req.body;
        db.run('UPDATE units SET name = ? WHERE id = ?', [name, id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, name });
        });
    });

    serverApp.put('/api/categories/:id', (req, res) => {
        const { id } = req.params;
        const { name } = req.body;
        db.run('UPDATE categories SET name = ? WHERE id = ?', [name, id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, name });
        });
    });

    serverApp.get('/api/products/:id', (req, res) => {
        const { id } = req.params;
        const query = `
            SELECT 
                p.id, 
                p.name
            FROM products p 
            WHERE p.id = ?`;

        db.get(query, [id], (err, product) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!product) return res.status(404).json({ error: 'Product not found' });

            // Get all available units
            db.all('SELECT * FROM units ORDER BY id', (err, units) => {
                if (err) return res.status(500).json({ error: err.message });
                product.availableUnits = units;
                res.json(product);
            });
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