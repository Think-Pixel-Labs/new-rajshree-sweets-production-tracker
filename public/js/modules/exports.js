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
        const response = await fetch('/api/export/category-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date })
        });

        await handleExportResponse(response);
    } catch (error) {
        handleExportError('category summary', error);
    }
}

// ... other export functions ...

function handleExportResponse(response) {
    if (!response.ok) {
        throw new Error('Export failed');
    }
    alert('Export completed successfully!');
}

function handleExportError(type, error) {
    console.error(`Export failed:`, error);
    alert(`Failed to export ${type}. Please try again.`);
} 