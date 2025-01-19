const express = require('express');
const router = express.Router();

// These are the only allowed unit types due to database constraint
const UNIT_TYPES = ['KG', 'Pcs', 'Box', 'Bottle'];

module.exports = function() {
    router.get('/', (req, res) => {
        res.json(UNIT_TYPES);
    });

    router.post('/', (req, res) => {
        const { unitType } = req.body;
        
        if (!unitType) {
            return res.status(400).json({ error: 'Unit type is required' });
        }

        // Convert to uppercase and check if it already exists
        const newUnitType = unitType.toUpperCase();
        
        // Due to database constraints, we can only allow these specific unit types
        if (!UNIT_TYPES.includes(newUnitType)) {
            return res.status(400).json({ 
                error: 'Invalid unit type. Allowed values are: ' + UNIT_TYPES.join(', ') 
            });
        }

        res.json({ success: true });
    });

    return router;
}; 