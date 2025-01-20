const { app, BrowserWindow, globalShortcut, dialog } = require('electron');
const path = require('path');
const express = require('express');
const Database = require('./config/database');
const setupServer = require('./server');
const fs = require('fs');

let mainWindow;
let db;

function getDatabasePath() {
    if (app.isPackaged) {
        const userDataPath = path.join(app.getPath('userData'), 'data');
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, { recursive: true });
        }
        const dbPath = path.join(userDataPath, 'production.db');
        
        // If database doesn't exist in user data, copy from resources
        if (!fs.existsSync(dbPath)) {
            const resourceDbPath = path.join(process.resourcesPath, 'production.db');
            if (fs.existsSync(resourceDbPath)) {
                fs.copyFileSync(resourceDbPath, dbPath);
            }
        }
        
        console.log('Production DB Path:', dbPath);
        return dbPath;
    }
    const devPath = path.join(__dirname, '..', 'public', 'data', 'production.db');
    console.log('Development DB Path:', devPath);
    return devPath;
}

function getPublicPath() {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'public');
    }
    return path.join(__dirname, '..', 'public');
}

function getIconPath() {
    const iconName = process.platform === 'darwin' ? 'logo.icns' : 'logo.ico';
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'public', 'assets', iconName);
    }
    return path.join(__dirname, '..', 'public', 'assets', iconName);
}

function getExportsPath() {
    return path.join(app.getPath('userData'), 'exports');
}

function createWindow() {
    // Create exports directory if it doesn't exist
    const exportsDir = getExportsPath();
    if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
    }

    const dbPath = getDatabasePath();
    console.log('Attempting to open database at:', dbPath);

    try {
        const database = new Database(dbPath);
        db = database.getInstance();
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
        webPreferences: { 
            nodeIntegration: true, 
            contextIsolation: false,
            webSecurity: true
        },
        title: "Production Tracker",
        icon: getIconPath(),
        show: false,
        center: true
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    const server = setupServer(db, mainWindow, getPublicPath());

    server.listen(0, 'localhost', () => {
        const port = server.address().port;
        console.log(`Server running on port ${port}`);
        mainWindow.loadURL(`http://localhost:${port}`);
    }).on('error', (err) => {
        console.error('Failed to start server:', err);
        dialog.showErrorBox(
            'Server Error',
            `Failed to start server: ${err.message}`
        );
        app.quit();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        server.close();
    });
}

app.on('ready', () => {
    createWindow();
    globalShortcut.register('F11', () => {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
    });
    globalShortcut.register('F12', () => {
        mainWindow.webContents.openDevTools();
    });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });
app.on('will-quit', () => { globalShortcut.unregister('F11'); });

if (require('electron-squirrel-startup')) app.quit();