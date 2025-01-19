import { showToast } from './toast.mjs';

let categories = [];
let unitTypes = [];
let manufacturingUnits = [];

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

async function fetchManufacturingUnits() {
    try {
        const response = await fetch('/api/manufacturing-units');
        if (!response.ok) throw new Error('Failed to fetch manufacturing units');
        manufacturingUnits = await response.json();
    } catch (error) {
        console.error('Error fetching manufacturing units:', error);
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
        option.value = category.id;
        option.textContent = `[${category.id}] ${category.name}`;
        if (category.id === currentValue) {
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
        option.value = unit.id;
        option.textContent = `[${unit.id}] ${unit.name}`;
        if (unit.id === currentValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    return select;
}

function createManufacturingUnitSelect(currentValue = '') {
    const select = document.createElement('select');
    select.required = true;

    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Select Manufacturing Unit';
    select.appendChild(emptyOption);

    manufacturingUnits.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit.id;
        option.textContent = `[${unit.id}] ${unit.name}`;
        if (unit.id === currentValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    return select;
}

export async function initializeSelects() {
    await Promise.all([fetchCategories(), fetchUnitTypes(), fetchManufacturingUnits()]);

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

    // Initialize manufacturing unit selects
    const addManufacturingUnitContainer = document.getElementById('productManufacturingUnit').parentElement;
    const addManufacturingUnitSelect = createManufacturingUnitSelect();
    addManufacturingUnitSelect.id = 'productManufacturingUnit';
    addManufacturingUnitContainer.replaceChild(addManufacturingUnitSelect, document.getElementById('productManufacturingUnit'));

    const editManufacturingUnitContainer = document.getElementById('editProductManufacturingUnit').parentElement;
    const editManufacturingUnitSelect = createManufacturingUnitSelect();
    editManufacturingUnitSelect.id = 'editProductManufacturingUnit';
    editManufacturingUnitContainer.replaceChild(editManufacturingUnitSelect, document.getElementById('editProductManufacturingUnit'));
}

export async function loadProductTable() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();
        
        // Validate products data
        if (!Array.isArray(products)) {
            throw new Error('Invalid products data received');
        }
        
        console.log('Products loaded:', products); // Debug log
        updateProductTable(products);
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products: ' + error.message);
    }
}

function updateProductTable(products) {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    products.forEach(product => {
        // Enhanced product data validation
        if (!product) {
            console.error('Product object is null or undefined');
            return;
        }

        // Ensure product.id exists and is not undefined/null
        if (product.id === undefined || product.id === null) {
            console.error('Product is missing ID:', product);
            return;
        }

        console.log('Processing product:', product); // Debug log

        const row = tbody.insertRow();
        row.insertCell(0).textContent = product.id || '';
        row.insertCell(1).textContent = product.name || '';
        row.insertCell(2).textContent = `[${product.category_id}] ${product.category || ''}`;
        row.insertCell(3).textContent = `[${product.unit_id}] ${product.unit || ''}`;
        row.insertCell(4).textContent = `[${product.manufacturing_unit_id}] ${product.manufacturing_unit_name || ''}`;

        const actionsCell = row.insertCell(5);
        actionsCell.className = 'actions-cell';

        // Store the product ID in the row's data attribute
        row.dataset.productId = product.id.toString(); // Ensure ID is stored as string

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'action-button edit-button';
        editButton.onclick = () => {
            const productData = {
                id: product.id,
                name: product.name,
                category_id: product.category_id,
                unit_id: product.unit_id,
                manufacturing_unit_id: product.manufacturing_unit_id,
                category: product.category,
                unit: product.unit,
                manufacturing_unit_name: product.manufacturing_unit_name
            };
            console.log('Edit button clicked with data:', productData);
            editProduct(productData);
        };
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'action-button delete-button';
        deleteButton.onclick = () => {
            const productId = product.id;
            console.log('Delete button clicked for product:', { id: productId, product });
            deleteProduct(productId);
        };
        actionsCell.appendChild(deleteButton);
    });
}

export async function handleProductFormSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('productName').value;
    const categoryId = document.getElementById('productCategory').value;
    const unitId = document.getElementById('productUnitType').value;
    const manufacturingUnitId = document.getElementById('productManufacturingUnit').value;

    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, categoryId, unitId, manufacturingUnitId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add product');
        }

        showToast('Product added successfully', 'success');
        event.target.reset();
        await loadProductTable();
        // Refresh the products in the production log dropdown
        await window.refreshProducts();
    } catch (error) {
        console.error('Error adding product:', error);
        showToast(error.message, 'error');
    }
}

export async function editProduct(product) {
    console.log('Editing product:', product); // Debug log
    const dialog = document.getElementById('editProductDialog');
    
    if (!product || !product.id) {
        console.error('Invalid product data:', product);
        alert('Cannot edit product: Invalid product data');
        return;
    }

    document.getElementById('editProductName').value = product.name;
    
    // Update category select with current value
    const editCategoryContainer = document.getElementById('editProductCategory').parentElement;
    const editCategorySelect = createCategorySelect(product.category_id);
    editCategorySelect.id = 'editProductCategory';
    editCategoryContainer.replaceChild(editCategorySelect, document.getElementById('editProductCategory'));
    
    // Update unit type select with current value
    const editUnitTypeContainer = document.getElementById('editProductUnitType').parentElement;
    const editUnitSelect = createUnitTypeSelect(product.unit_id);
    editUnitSelect.id = 'editProductUnitType';
    editUnitTypeContainer.replaceChild(editUnitSelect, document.getElementById('editProductUnitType'));

    // Update manufacturing unit select with current value
    const editManufacturingUnitContainer = document.getElementById('editProductManufacturingUnit').parentElement;
    const editManufacturingUnitSelect = createManufacturingUnitSelect(product.manufacturing_unit_id);
    editManufacturingUnitSelect.id = 'editProductManufacturingUnit';
    editManufacturingUnitContainer.replaceChild(editManufacturingUnitSelect, document.getElementById('editProductManufacturingUnit'));
    
    // Set the product ID and show the dialog
    dialog.dataset.productId = product.id.toString();
    dialog.style.display = 'block';
}

export function closeEditProductDialog() {
    const dialog = document.getElementById('editProductDialog');
    dialog.style.display = 'none';
    dialog.dataset.productId = ''; // Clear the product ID
}

export async function handleEditProductSubmit(event) {
    event.preventDefault();
    const dialog = document.getElementById('editProductDialog');
    const productId = parseInt(dialog.dataset.productId);
    
    if (!productId || isNaN(productId)) {
        showToast('Cannot update product: Invalid product ID', 'error');
        return;
    }

    const name = document.getElementById('editProductName').value;
    const categoryId = parseInt(document.getElementById('editProductCategory').value);
    const unitId = parseInt(document.getElementById('editProductUnitType').value);
    const manufacturingUnitId = parseInt(document.getElementById('editProductManufacturingUnit').value);

    if (!name || !categoryId || !unitId || !manufacturingUnitId) {
        showToast('All fields are required', 'error');
        return;
    }

    try {
        console.log('Updating product:', { productId, name, categoryId, unitId, manufacturingUnitId }); // Debug log
        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, categoryId, unitId, manufacturingUnitId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update product');
        }

        showToast('Product updated successfully', 'success');
        closeEditProductDialog();
        await loadProductTable();
        await window.refreshProducts();
    } catch (error) {
        console.error('Error updating product:', error);
        showToast(error.message, 'error');
    }
}

export async function deleteProduct(id) {
    // Enhanced validation for product ID
    if (id === undefined || id === null) {
        console.error('Product ID is missing');
        showToast('Cannot delete product: Missing product ID', 'error');
        return;
    }
    
    const productId = parseInt(id);
    if (isNaN(productId)) {
        console.error('Invalid product ID format:', id);
        showToast('Cannot delete product: Invalid product ID format', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this product? This will also delete related production logs.')) {
        return;
    }

    try {
        console.log('Deleting product with ID:', productId);
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete product');
        }

        showToast('Product deleted successfully', 'success');
        await loadProductTable();
        await window.refreshProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast(error.message, 'error');
    }
} 