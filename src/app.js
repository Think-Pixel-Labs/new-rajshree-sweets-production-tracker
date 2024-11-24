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
        const { productId, quantityManufactured, manufacturedByUnitId } = req.body;
        db.run('INSERT INTO productionLog (productId, quantityManufactured, manufacturedByUnitId) VALUES (?, ?, ?)',
            [productId, quantityManufactured, manufacturedByUnitId], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID });
            });
    });

    serverApp.get('/api/production', (req, res) => {
        const { startDate, endDate } = req.query;
        let query = 'SELECT * FROM productionLog';
        let params = [];

        if (startDate && endDate) {
            query += ' WHERE date(createdAt) BETWEEN ? AND ?';
            params = [startDate, endDate];
        }

        query += ' ORDER BY createdAt DESC';

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
        const { quantityManufactured, updationReason } = req.body;
        db.run('UPDATE productionLog SET quantityManufactured = ?, updationReason = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [quantityManufactured, updationReason, id], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    });

    serverApp.get('/api/products', (req, res) => {
        db.all('SELECT p.id, p.name, p.categoryId, u.name as unit FROM products p JOIN units u ON p.unitId = u.id', (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    serverApp.get('/api/manufacturing-units', (req, res) => {
        db.all('SELECT * FROM manufacturingUnits', (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
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