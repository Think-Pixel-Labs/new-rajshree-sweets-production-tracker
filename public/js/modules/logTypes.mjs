let logTypes = [];

export async function fetchLogTypes() {
    try {
        const response = await fetch('/api/log-types');
        if (!response.ok) throw new Error('Failed to fetch log types');
        logTypes = await response.json();
        updateLogTypeSelects();
    } catch (error) {
        console.error('Error fetching log types:', error);
        throw error;
    }
}

function updateLogTypeSelects() {
    // Update add form select
    const addSelect = document.getElementById('logType');
    if (addSelect) {
        const currentValue = addSelect.value;
        addSelect.innerHTML = '<option value="">Select Log Type</option>';
        logTypes.forEach(logType => {
            const option = document.createElement('option');
            option.value = logType.id;
            option.textContent = logType.type;
            if (logType.id === currentValue) {
                option.selected = true;
            }
            addSelect.appendChild(option);
        });
    }

    // Update edit form select
    const editSelect = document.getElementById('editLogType');
    if (editSelect) {
        const currentValue = editSelect.value;
        editSelect.innerHTML = '<option value="">Select Log Type</option>';
        logTypes.forEach(logType => {
            const option = document.createElement('option');
            option.value = logType.id;
            option.textContent = logType.type;
            if (logType.id === currentValue) {
                option.selected = true;
            }
            editSelect.appendChild(option);
        });
    }
} 