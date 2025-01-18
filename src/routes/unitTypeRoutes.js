const express = require('express');
const router = express.Router();

const UNIT_TYPES = ['KG', 'Pcs', 'Box', 'Bottle'];

module.exports = function() {
    router.get('/', (req, res) => {
        res.json(UNIT_TYPES);
    });

    return router;
}; 