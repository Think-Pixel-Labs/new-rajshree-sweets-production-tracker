const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const express = require('express');
const serverApp = express();
const db = require('./database');
const jwt = require('jsonwebtoken');

let mainWindow;

// Secret key for JWT
const JWT_SECRET = 'kosag79-8dw@*(ugjklasdn#^gaskkf';

// Middleware for authorization
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
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Set up Express server
    serverApp.use(express.static('public'));
    serverApp.use(express.json());

    // API endpoint for login
    serverApp.post('/api/login', (req, res) => {
        const { username, password } = req.body;
        db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (row) {
                const token = jwt.sign({ id: row.id, role: row.role }, JWT_SECRET, { expiresIn: '1h' });
                res.json({ success: true, token, role: row.role });
            } else {
                res.json({ success: false, message: 'Invalid username or password' });
            }
        });
    });

    // API endpoint to create production log
    serverApp.post('/api/production', authMiddleware, (req, res) => {
        const { productId, quantityManufactured, manufacturedByUnitId } = req.body;
        db.run('INSERT INTO productionLog (productId, quantityManufactured, manufacturedByUnitId) VALUES (?, ?, ?)',
            [productId, quantityManufactured, manufacturedByUnitId], function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ id: this.lastID });
            });
    });

    // API endpoint to get production logs
    serverApp.get('/api/production', authMiddleware, (req, res) => {
        db.all('SELECT * FROM productionLog ORDER BY createdAt DESC', (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
    });

    // API endpoint to update production log
    serverApp.put('/api/production/:id', authMiddleware, (req, res) => {
        const { id } = req.params;
        const { quantityManufactured, updationReason } = req.body;

        // Get the initial quantity and update the log
        db.get('SELECT quantityManufactured FROM productionLog WHERE id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (!row) {
                res.status(404).json({ error: 'Production log not found' });
                return;
            }

            const initialQuantity = row.quantityManufactured;
            const updatedReason = `Initial Quantity: ${initialQuantity}. ${updationReason}`;

            db.run('UPDATE productionLog SET quantityManufactured = ?, updationReason = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
                [quantityManufactured, updatedReason, id], function (err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json({ success: true });
                });
        });
    });

    // API endpoint to get all products
    serverApp.get('/api/products', authMiddleware, (req, res) => {
        db.all('SELECT * FROM products', (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
    });

    // API endpoint to get all manufacturing units
    serverApp.get('/api/manufacturing-units', authMiddleware, (req, res) => {
        db.all('SELECT * FROM manufacturingUnits', (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
    });

    // Start the server
    const server = serverApp.listen(0, () => {
        const port = server.address().port;
        mainWindow.loadURL(`http://localhost:${port}`);
    });

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});

// Add this after the createWindow function
app.on('ready', () => {
    createWindow();

    // Register a 'F11' shortcut listener.
    const ret = globalShortcut.register('F11', () => {
        if (mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(false);
        } else {
            mainWindow.setFullScreen(true);
        }
    });

    if (!ret) {
        console.log('F11 registration failed');
    }
});

// Unregister the shortcut when the app is about to quit
app.on('will-quit', () => {
    globalShortcut.unregister('F11');
});