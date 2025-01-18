const fastcsv = require('fast-csv');
const fs = require('fs');

exports.exportToCsv = async function(data, filePath) {
    return new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(filePath);
        fastcsv
            .write(data, { headers: true })
            .pipe(ws)
            .on('finish', () => resolve())
            .on('error', (error) => reject(error));
    });
}; 