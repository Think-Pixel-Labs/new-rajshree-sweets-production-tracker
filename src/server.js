const express = require('express');
const path = require('path');
const productionRoutes = require('./routes/productionRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const unitTypeRoutes = require('./routes/unitTypeRoutes');

module.exports = function setupServer(db, mainWindow, publicPath) {
    const app = express();
    const server = require('http').createServer(app);

    // Middleware
    app.use(express.static(publicPath, {
        setHeaders: (res, path) => {
            // Set proper MIME types for JavaScript modules
            if (path.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript');
            }
            if (path.endsWith('.mjs')) {
                res.setHeader('Content-Type', 'application/javascript');
            }
        }
    }));
    app.use(express.json());

    // Set security headers
    app.use((req, res, next) => {
        res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline' 'unsafe-eval'");
        next();
    });

    // Routes
    app.use('/api/production', productionRoutes(db, mainWindow));
    app.use('/api/products', productRoutes(db));
    app.use('/api/categories', categoryRoutes(db));
    app.use('/api/unit-types', unitTypeRoutes());

    // Serve components
    app.get('/components/:name', (req, res) => {
        res.sendFile(path.join(publicPath, 'components', req.params.name));
    });

    // Catch-all route
    app.get('*', (req, res) => {
        res.sendFile(path.join(publicPath, 'index.html'));
    });

    return server;
};