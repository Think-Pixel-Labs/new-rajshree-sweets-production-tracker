let currentEditId = null;

export async function fetchProductionData() {
    try {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        let url = '/api/production';
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch production data');
        const data = await response.json();
        updateProductionTable(data);
    } catch (error) {
        console.error('Error fetching production data:', error);
        throw error;
    }
}

export function handleFilterClick() {
    fetchProductionData().catch(error => {
        console.error('Filter error:', error);
        alert('Failed to filter production logs');
    });
}

export function editLog(id, currentQuantity, currentLogType) {
    console.log('editLog called with:', {
        id,
        currentQuantity,
        currentLogType
    });
    
    const editDialog = document.getElementById('editDialog');
    editDialog.dataset.currentEditId = id;
    
    const editQuantity = document.getElementById('editQuantity');
    const editLogType = document.getElementById('editLogType');
    const editReason = document.getElementById('editReason');

    // Set values
    editQuantity.value = currentQuantity;
    
    // Pre-select log type
    if (editLogType) {
        Array.from(editLogType.options).forEach(option => {
            if (option.value === currentLogType) {
                option.selected = true;
            }
        });
    }

    editReason.value = '';
    editDialog.style.display = 'block';
}

export function closeEditDialog() {
    const editDialog = document.getElementById('editDialog');
    editDialog.style.display = 'none';
    editDialog.dataset.currentEditId = '';
}

export async function handleEditSubmit(event) {
    event.preventDefault();
    const editDialog = document.getElementById('editDialog');
    const currentEditId = editDialog.dataset.currentEditId;
    console.log('handleEditSubmit called, currentEditId:', currentEditId);
    
    const quantity = document.getElementById('editQuantity').value;
    const logTypeId = document.getElementById('editLogType').value;
    const reason = document.getElementById('editReason').value;

    if (!currentEditId) {
        console.error('No currentEditId found!');
        alert('Error: No log selected for editing');
        return;
    }

    try {
        console.log('Sending PUT request to:', `/api/production/${currentEditId}`);
        const response = await fetch(`/api/production/${currentEditId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                quantity, 
                logTypeId, 
                updationReason: reason 
            })
        });

        if (!response.ok) throw new Error('Failed to update log');

        closeEditDialog();
        await fetchProductionData();
    } catch (error) {
        console.error('Update error:', error);
        alert('Failed to update production log');
    }
}

export async function deleteLog(id) {
    if (!confirm('Are you sure you want to delete this production log?')) {
        return;
    }

    try {
        const response = await fetch(`/api/production/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete log');

        await fetchProductionData();
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete production log');
    }
}

function createActionsCell(item) {
    console.log('Creating actions cell for item:', item);
    
    const actionsCell = document.createElement('td');
    actionsCell.className = 'actions-cell';

    if (!item || !item.id) {
        console.error('Invalid item data:', item);
        return actionsCell;
    }

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'action-button edit-button';
    editButton.onclick = () => {
        console.log('Edit button clicked for item:', item);
        editLog(
            item.id, 
            item.quantity,
            item.logType || ''
        );
    };
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'action-button delete-button';
    deleteButton.onclick = () => deleteLog(item.id);
    actionsCell.appendChild(deleteButton);

    return actionsCell;
}

function updateProductionTable(data) {
    console.log('Updating production table with data:', data);
    const tbody = document.getElementById('productionData');
    tbody.innerHTML = '';
    data.forEach(item => {
        console.log('Processing item:', item);
        const row = tbody.insertRow();
        console.log('Item ID:', item.id, 'Full item:', item);
        row.insertCell(0).textContent = item.productionId || item.id || '-';
        row.insertCell(1).textContent = formatDateTimeIndian(item.createdAt);
        row.insertCell(2).textContent = item.productName;
        row.insertCell(3).textContent = item.quantity;
        row.insertCell(4).textContent = item.unit;
        row.insertCell(5).textContent = item.category;
        row.insertCell(6).textContent = item.manufacturingUnitName || '-';
        row.insertCell(7).textContent = item.logTypeName || '-';
        row.insertCell(8).textContent = item.updationReason || '-';
        row.insertCell(9).textContent = item.updatedAt ? formatDateTimeIndian(item.updatedAt) : '-';
        
        // Create actions cell
        const actionsCell = row.insertCell(10);
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'action-button edit-button';
        editButton.onclick = () => {
            console.log('Edit clicked for item:', item);
            editLog(
                item.productionId || item.id,
                item.quantity,
                item.logTypeId
            );
        };
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'action-button delete-button';
        deleteButton.onclick = () => deleteLog(item.productionId || item.id);
        actionsCell.appendChild(deleteButton);
    });
}

export function formatDateTimeIndian(dateString) {
    const date = new Date(dateString);
    const options = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };

    return new Intl.DateTimeFormat('en-IN', options).format(date);
} 