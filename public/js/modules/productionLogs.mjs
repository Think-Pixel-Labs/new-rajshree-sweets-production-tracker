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

export function editLog(id, currentQuantity, currentManufacturingUnit, currentLogType) {
    currentEditId = id;
    const editDialog = document.getElementById('editDialog');
    const editQuantity = document.getElementById('editQuantity');
    const editManufacturingUnit = document.getElementById('editManufacturingUnit');
    const editLogType = document.getElementById('editLogType');
    const editReason = document.getElementById('editReason');

    editQuantity.value = currentQuantity;
    editManufacturingUnit.value = currentManufacturingUnit;
    editLogType.value = currentLogType;
    editReason.value = '';
    editDialog.style.display = 'block';
}

export function closeEditDialog() {
    document.getElementById('editDialog').style.display = 'none';
}

export async function handleEditSubmit(event) {
    event.preventDefault();
    const quantity = document.getElementById('editQuantity').value;
    const manufacturingUnitId = document.getElementById('editManufacturingUnit').value;
    const logTypeId = document.getElementById('editLogType').value;
    const reason = document.getElementById('editReason').value;

    try {
        const response = await fetch(`/api/production/${currentEditId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                quantity, 
                manufacturingUnitId, 
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

function updateProductionTable(data) {
    const tbody = document.getElementById('productionData');
    tbody.innerHTML = '';
    data.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = item.id;
        row.insertCell(1).textContent = formatDateTimeIndian(item.createdAt);
        row.insertCell(2).textContent = item.productName;
        row.insertCell(3).textContent = item.quantity;
        row.insertCell(4).textContent = item.unit;
        row.insertCell(5).textContent = item.category;
        row.insertCell(6).textContent = item.manufacturingUnit || '-';
        row.insertCell(7).textContent = item.logType || '-';
        row.insertCell(8).textContent = item.updationReason || '-';
        row.insertCell(9).textContent = item.updatedAt ? formatDateTimeIndian(item.updatedAt) : '-';
        
        const actionsCell = createActionsCell(item);
        row.appendChild(actionsCell);
    });
}

function createActionsCell(item) {
    const actionsCell = document.createElement('td');
    actionsCell.className = 'actions-cell';

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'action-button edit-button';
    editButton.onclick = () => editLog(item.id, item.quantity, item.manufacturingUnit, item.logType);
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'action-button delete-button';
    deleteButton.onclick = () => deleteLog(item.id);
    actionsCell.appendChild(deleteButton);

    return actionsCell;
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