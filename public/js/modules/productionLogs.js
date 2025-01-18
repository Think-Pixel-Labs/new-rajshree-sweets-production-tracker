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

export function editLog(id, currentQuantity) {
    const editDialog = document.getElementById('editDialog');
    const editQuantity = document.getElementById('editQuantity');
    const editReason = document.getElementById('editReason');

    currentEditId = id;
    editQuantity.value = currentQuantity;
    editReason.value = '';
    editDialog.style.display = 'block';
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
        row.insertCell(4).textContent = item.unitType;
        row.insertCell(5).textContent = item.category;
        row.insertCell(6).textContent = item.updationReason || '-';
        row.insertCell(7).textContent = item.updatedAt ? formatDateTimeIndian(item.updatedAt) : '-';
        
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
    editButton.onclick = () => editLog(item.id, item.quantity);
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