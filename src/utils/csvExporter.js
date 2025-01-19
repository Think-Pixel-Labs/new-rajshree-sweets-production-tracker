const fs = require('fs').promises;
const path = require('path');

async function exportToCSV(data, filepath) {
    if (!data || data.length === 0) {
        throw new Error('No data to export');
    }

    try {
        // Ensure the exports directory exists
        const dir = path.dirname(filepath);
        await fs.mkdir(dir, { recursive: true });

        // Get headers from the first row
        const headers = Object.keys(data[0]);
        
        // Create CSV content
        const csvContent = [
            // Headers row
            headers.join(','),
            // Data rows
            ...data.map(row => 
                headers.map(header => {
                    let value = row[header]?.toString() || '';
                    // Escape commas and quotes
                    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                        value = `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        // Write to file
        await fs.writeFile(filepath, csvContent, 'utf-8');
        
        return filepath;
    } catch (error) {
        console.error('CSV Export error:', error);
        throw new Error(`Failed to export CSV: ${error.message}`);
    }
}

module.exports = {
    exportToCSV
}; 