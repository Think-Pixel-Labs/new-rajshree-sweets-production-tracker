let categories = [];
let unitTypes = [];

async function fetchCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        categories = await response.json();
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
}

async function fetchUnitTypes() {
    try {
        const response = await fetch('/api/unit-types');
        if (!response.ok) throw new Error('Failed to fetch unit types');
        unitTypes = await response.json();
    } catch (error) {
        console.error('Error fetching unit types:', error);
        throw error;
    }
}

function createCategorySelect(currentValue = '') {
    const select = document.createElement('select');
    select.required = true;

    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Select Category';
    select.appendChild(emptyOption);

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        if (category === currentValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    return select;
}

function createUnitTypeSelect(currentValue = '') {
    const select = document.createElement('select');
    select.required = true;

    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Select Unit Type';
    select.appendChild(emptyOption);

    unitTypes.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        if (unit === currentValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    return select;
}

export async function initializeSelects() {
    await Promise.all([fetchCategories(), fetchUnitTypes()]);

    // Initialize category selects
    const addCategoryContainer = document.getElementById('productCategory').parentElement;
    const addCategorySelect = createCategorySelect();
    addCategorySelect.id = 'productCategory';
    addCategoryContainer.replaceChild(addCategorySelect, document.getElementById('productCategory'));

    const editCategoryContainer = document.getElementById('editProductCategory').parentElement;
    const editCategorySelect = createCategorySelect();
    editCategorySelect.id = 'editProductCategory';
    editCategoryContainer.replaceChild(editCategorySelect, document.getElementById('editProductCategory'));

    // Initialize unit type selects
    const addUnitTypeContainer = document.getElementById('productUnitType').parentElement;
    const addUnitSelect = createUnitTypeSelect();
    addUnitSelect.id = 'productUnitType';
    addUnitTypeContainer.replaceChild(addUnitSelect, document.getElementById('productUnitType'));

    const editUnitTypeContainer = document.getElementById('editProductUnitType').parentElement;
    const editUnitSelect = createUnitTypeSelect();
    editUnitSelect.id = 'editProductUnitType';
    editUnitTypeContainer.replaceChild(editUnitSelect, document.getElementById('editProductUnitType'));
}

export async function loadProductTable() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();
        updateProductTable(products);
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products');
    }
}

function updateProductTable(products) {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    products.forEach(product => {
        // Log each product for debugging
        console.log('Product in table:', product);

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

export async function handleProductFormSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const unitType = document.getElementById('productUnitType').value;

    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category, unitType })
        });

        if (!response.ok) throw new Error('Failed to add product');

        event.target.reset();
        await loadProductTable();
        // Refresh the products in the production log dropdown
        await window.refreshProducts();
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Failed to add product');
    }
}

export async function editProduct(product) {
    const dialog = document.getElementById('editProductDialog');
    
    // Log the product being edited
    console.log('Editing product:', product);

    document.getElementById('editProductName').value = product.name;
    
    // Update category select with current value
    const editCategoryContainer = document.getElementById('editProductCategory').parentElement;
    const editCategorySelect = createCategorySelect(product.category);
    editCategorySelect.id = 'editProductCategory';
    editCategoryContainer.replaceChild(editCategorySelect, document.getElementById('editProductCategory'));
    
    // Update unit type select with current value
    const editUnitTypeContainer = document.getElementById('editProductUnitType').parentElement;
    const editUnitSelect = createUnitTypeSelect(product.unitType);
    editUnitSelect.id = 'editProductUnitType';
    editUnitTypeContainer.replaceChild(editUnitSelect, document.getElementById('editProductUnitType'));
    
    dialog.style.display = 'block';
    dialog.dataset.productId = product.id; // Make sure this is being set correctly
    
    // Log the dialog dataset after setting
    console.log('Dialog dataset after setting:', dialog.dataset);
}

export function closeEditProductDialog() {
    document.getElementById('editProductDialog').style.display = 'none';
}

export async function handleEditProductSubmit(event) {
    event.preventDefault();
    const dialog = document.getElementById('editProductDialog');
    const productId = dialog.dataset.productId;
    const name = document.getElementById('editProductName').value;
    const category = document.getElementById('editProductCategory').value;
    const unitType = document.getElementById('editProductUnitType').value;

    try {
        // Log the request details for debugging
        console.log('Updating product:', {
            id: productId,
            name,
            category,
            unitType,
            url: `/api/products/${productId}`
        });

        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category, unitType })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update product');
        }

        closeEditProductDialog();
        await loadProductTable();
        await window.refreshProducts();
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Failed to update product: ' + error.message);
    }
}

export async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product? This will also delete related production logs.')) {
        return;
    }

    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete product');

        await loadProductTable();
        await window.refreshProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
    }
} 