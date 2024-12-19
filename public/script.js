let products = [];

async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        products = await response.json();
        const productSelect = document.getElementById('productSelect');
        productSelect.innerHTML = '<option value="">Select a product</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${product.category})`;
            productSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        alert('Failed to fetch products. Please try refreshing.');
    }
}

function filterProducts(searchText) {
    const productSelect = document.getElementById('productSelect');
    productSelect.innerHTML = '<option value="">Select a product</option>';

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchText.toLowerCase()) ||
        product.category.toLowerCase().includes(searchText.toLowerCase())
    );

    filteredProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (${product.category})`;
        productSelect.appendChild(option);
    });
}

document.getElementById('productSelect').addEventListener('change', function () {
    const selectedProduct = products.find(p => p.id == this.value);
    if (selectedProduct) {
        document.getElementById('unitTypeDisplay').textContent = selectedProduct.unitType;
    } else {
        document.getElementById('unitTypeDisplay').textContent = '';
    }
});

document.getElementById('productionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const productId = document.getElementById('productSelect').value;
    const quantity = document.getElementById('quantity').value;

    const response = await fetch('/api/production', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            productId,
            quantity
        }),
    });

    if (response.ok) {
        fetchProductionData();
        document.getElementById('productionForm').reset();
    } else {
        alert('Failed to add production log');
    }
});

function formatDateTimeIndian(dateString) {
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

async function fetchProductionData() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    let url = '/api/production';
    if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await fetch(url);
    const data = await response.json();
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

        const actionsCell = row.insertCell(8);
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
    });
}

let currentEditId = null;

function editLog(id, currentQuantity) {
    currentEditId = id;
    const editDialog = document.getElementById('editDialog');
    const editQuantity = document.getElementById('editQuantity');
    const editReason = document.getElementById('editReason');

    editQuantity.value = currentQuantity;
    editReason.value = '';
    editDialog.style.display = 'block';
}

function closeEditDialog() {
    document.getElementById('editDialog').style.display = 'none';
}

document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const quantity = document.getElementById('editQuantity').value;
    const reason = document.getElementById('editReason').value;

    await updateLog(currentEditId, quantity, reason);
    closeEditDialog();
});

async function updateLog(id, quantity, reason) {
    const response = await fetch(`/api/production/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            quantity: quantity,
            updationReason: reason
        }),
    });

    if (response.ok) {
        fetchProductionData();
    } else {
        alert('Failed to update log');
    }
}

document.getElementById('filterButton').addEventListener('click', fetchProductionData);

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];  // Format: YYYY-MM-DD

    // Set default dates for range
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = today;

    // Set default date for summary exports
    document.getElementById('summaryDate').value = today;
}

document.addEventListener('DOMContentLoaded', () => {
    setDefaultDates();
    fetchProducts();
    fetchProductionData();

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    document.getElementById('productSearch').addEventListener('input', (e) => {
        filterProducts(e.target.value);
    });
});

async function exportProductionLogs() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        alert("Please select both start and end dates before exporting");
        return;
    }

    try {
        const response = await fetch('/api/export-production-logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ startDate, endDate })
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        const result = await response.json();

        if (result.success) {
            alert('Production logs exported successfully!');
        } else {
            alert(result.message || 'Export cancelled');
        }
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export production logs. Please try again.');
    }
}

async function deleteLog(id) {
    if (!confirm('Are you sure you want to delete this production log?')) {
        return;
    }

    try {
        const response = await fetch(`/api/production/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Delete failed');
        }

        const result = await response.json();

        if (result.success) {
            fetchProductionData(); // Refresh the table
        } else {
            alert('Failed to delete the log');
        }
    } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete the production log. Please try again.');
    }
}

async function exportCategorySummary() {
    const summaryDate = document.getElementById('summaryDate').value;
    if (!summaryDate) {
        alert('Please select a date for the summary');
        return;
    }

    try {
        const response = await fetch('/api/export-category-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date: summaryDate })
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        const result = await response.json();
        if (result.success) {
            alert('Category summary exported successfully!');
        } else {
            alert(result.message || 'Export failed');
        }
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export category summary. Please try again.');
    }
}

async function exportDetailedCategorySummary() {
    const summaryDate = document.getElementById('summaryDate').value;
    if (!summaryDate) {
        alert('Please select a date for the detailed summary');
        return;
    }

    try {
        const response = await fetch('/api/export-detailed-category-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date: summaryDate })
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        const result = await response.json();
        if (result.success) {
            alert('Detailed category summary exported successfully!');
        } else {
            alert(result.message || 'Export failed');
        }
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export detailed category summary. Please try again.');
    }
}

async function refreshProducts() {
    const refreshButton = document.querySelector('.refresh-button');
    refreshButton.style.transform = 'rotate(360deg)';
    refreshButton.style.transition = 'transform 0.5s';

    await fetchProducts();

    setTimeout(() => {
        refreshButton.style.transform = 'rotate(0deg)';
        refreshButton.style.transition = 'none';
    }, 500);
}

function clearProductSearch() {
    const searchInput = document.getElementById('productSearch');
    searchInput.value = '';
    filterProducts('');
    searchInput.focus();
}

function refreshPage() {
    const refreshButton = document.querySelector('.refresh-button');
    refreshButton.style.transform = 'rotate(360deg)';
    refreshButton.style.transition = 'transform 0.5s';

    setTimeout(() => {
        window.location.reload();
    }, 500);
}

function clearProductSearch() {
    const searchInput = document.getElementById('productSearch');
    searchInput.value = '';
    filterProducts('');
    searchInput.focus();
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Add new product management functions
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const unitType = document.getElementById('productUnitType').value;

    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category, unitType })
        });

        if (response.ok) {
            document.getElementById('productForm').reset();
            await fetchProducts();
            await loadProductTable();
        } else {
            alert('Failed to add product');
        }
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Failed to add product');
    }
});

async function loadProductTable() {
    const response = await fetch('/api/products');
    const products = await response.json();
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = product.name;
        row.insertCell(1).textContent = product.category;
        row.insertCell(2).textContent = product.unitType;

        const actionsCell = row.insertCell(3);
        actionsCell.className = 'actions-cell';

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'action-button edit-button';
        editButton.onclick = () => editProduct(product);
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'action-button delete-button';
        deleteButton.onclick = () => deleteProduct(product.id);
        actionsCell.appendChild(deleteButton);
    });
}

let currentEditProductId = null;

function editProduct(product) {
    currentEditProductId = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductCategory').value = product.category;
    document.getElementById('editProductUnitType').value = product.unitType;
    document.getElementById('editProductDialog').style.display = 'block';
}

function closeEditProductDialog() {
    document.getElementById('editProductDialog').style.display = 'none';
}

document.getElementById('editProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('editProductName').value;
    const category = document.getElementById('editProductCategory').value;
    const unitType = document.getElementById('editProductUnitType').value;

    try {
        const response = await fetch(`/api/products/${currentEditProductId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category, unitType })
        });

        if (response.ok) {
            closeEditProductDialog();
            await fetchProducts();
            await loadProductTable();
        } else {
            alert('Failed to update product');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Failed to update product');
    }
});

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product? This will affect all related production logs.')) {
        return;
    }

    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await fetchProducts();
            await loadProductTable();
        } else {
            alert('Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
    }
}

// Modify the existing DOMContentLoaded event
document.addEventListener('DOMContentLoaded', async () => {
    setDefaultDates();
    await fetchProducts();
    await loadProductTable();
    await fetchProductionData();

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    document.getElementById('productSearch').addEventListener('input', (e) => {
        filterProducts(e.target.value);
    });
});