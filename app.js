const { app, BrowserWindow, globalShortcut } = require('electron');
const { autoUpdater } = require('electron-updater');
const express = require('express');
const serverApp = express();
const db = require('./database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'kosag79-8dw@*(ugjklasdn#^gaskkf';
let mainWindow;

// Add this function to check for updates
function checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify();
}

const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.user = decoded;
        next();
    });
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    serverApp.use(express.static('public'));
    serverApp.use(express.json());

    serverApp.post('/api/login', (req, res) => {
        const { username, password } = req.body;
        db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (row) {
                const token = jwt.sign({ id: row.id, role: row.role }, JWT_SECRET, { expiresIn: '1h' });
                res.json({ success: true, token, role: row.role });
            } else {
                res.json({ success: false, message: 'Invalid username or password' });
            }
        });
    });

    serverApp.post('/api/production', authMiddleware, (req, res) => {
        const { productId, quantityManufactured, manufacturedByUnitId } = req.body;
        db.run('INSERT INTO productionLog (productId, quantityManufactured, manufacturedByUnitId) VALUES (?, ?, ?)',
            [productId, quantityManufactured, manufacturedByUnitId], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID });
            });
    });

    serverApp.get('/api/production', authMiddleware, (req, res) => {
        const { startDate, endDate } = req.query;
        let query = 'SELECT * FROM productionLog';
        let params = [];

        if (startDate && endDate) {
            query += ' WHERE date(createdAt) BETWEEN ? AND ?';
            params = [startDate, endDate];
        }

        query += ' ORDER BY createdAt DESC';

        console.log('Executing query:', query);
        console.log('Query parameters:', params);

        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Production log retrieval error:', err);
                return res.status(500).json({ error: 'An error occurred while processing your request' });
            }
            console.log('Query results:', rows);
            res.json(rows);
        });
    });

    serverApp.put('/api/production/:id', authMiddleware, (req, res) => {
        const { id } = req.params;
        const { quantityManufactured, updationReason } = req.body;
        db.run('UPDATE productionLog SET quantityManufactured = ?, updationReason = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [quantityManufactured, updationReason, id], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    });

    serverApp.get('/api/products', authMiddleware, (req, res) => {
        db.all('SELECT p.id, p.name, p.categoryId, u.name as unit FROM products p JOIN units u ON p.unitId = u.id', (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    serverApp.get('/api/manufacturing-units', authMiddleware, (req, res) => {
        db.all('SELECT * FROM manufacturingUnits', (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    const server = serverApp.listen(0, () => {
        const port = server.address().port;
        mainWindow.loadURL(`http://localhost:${port}`);
    });

    mainWindow.on('closed', () => mainWindow = null);

    // Check for updates
    checkForUpdates();
}

app.on('ready', () => {
    createWindow();
    globalShortcut.register('F11', () => {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
    });
});

// Add these event listeners for auto-update
autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });
app.on('will-quit', () => { globalShortcut.unregister('F11'); });