export async function exportProductionLogs() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        alert("Please select both start and end dates before exporting");
        return;
    }

    try {
        const response = await fetch('/api/export/production-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate, endDate })
        });

        await handleExportResponse(response);
    } catch (error) {
        handleExportError('production logs', error);
    }
}

export async function exportCategorySummary() {
    const date = document.getElementById('summaryDate').value;
    if (!date) {
        alert('Please select a date for the summary');
        return;
    }

    try {
        console.log('Sending export request for date:', date);
        
        const response = await fetch('/api/export/category-summary', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ date })
        });

        console.log('Response status:', response.status);
        await handleExportResponse(response);
    } catch (error) {
        console.error('Export error:', error);
        handleExportError('category summary', error);
    }
}

export async function exportDetailedCategorySummary() {
    const date = document.getElementById('summaryDate').value;
    if (!date) {
        alert('Please select a date for the detailed summary');
        return;
    }

    try {
        const response = await fetch('/api/export/detailed-category-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date })
        });

        await handleExportResponse(response);
    } catch (error) {
        handleExportError('detailed category summary', error);
    }
}

async function handleExportResponse(response) {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid server response');
    }

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Export failed');
    }

    if (data.success) {
        alert('Export completed successfully!');
    } else {
        throw new Error(data.message || 'Export failed');
    }
}

function handleExportError(type, error) {
    console.error(`Export failed:`, error);
    alert(`Failed to export ${type}: ${error.message}`);
} 