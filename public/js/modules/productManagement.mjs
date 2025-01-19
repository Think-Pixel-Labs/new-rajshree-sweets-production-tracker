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
        option.value = category.id;
        option.textContent = category.name;
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
        option.textContent = unit.name;
        if (unit.id === currentValue) {
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
        row.insertCell(0).textContent = product.name || '';
        row.insertCell(1).textContent = product.category || '';
        row.insertCell(2).textContent = product.unit || '';

        const actionsCell = row.insertCell(3);
        actionsCell.className = 'actions-cell';

        // Store the product ID in the row's data attribute
        row.dataset.productId = product.id.toString(); // Ensure ID is stored as string

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'action-button edit-button';
        editButton.onclick = () => {
            const productData = {
                id: product.id, // Don't parse here, keep original value
                name: product.name,
                category_id: product.category_id,
                unit_id: product.unit_id,
                category: product.category,
                unit: product.unit
            };
            console.log('Edit button clicked with data:', productData);
            editProduct(productData);
        };
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'action-button delete-button';
        deleteButton.onclick = () => {
            const productId = product.id; // Don't parse here, keep original value
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

    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, categoryId, unitId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add product');
        }

        event.target.reset();
        await loadProductTable();
        // Refresh the products in the production log dropdown
        await window.refreshProducts();
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Failed to add product: ' + error.message);
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
        alert('Cannot update product: Invalid product ID');
        return;
    }

    const name = document.getElementById('editProductName').value;
    const categoryId = parseInt(document.getElementById('editProductCategory').value);
    const unitId = parseInt(document.getElementById('editProductUnitType').value);

    if (!name || !categoryId || !unitId) {
        alert('All fields are required');
        return;
    }

    try {
        console.log('Updating product:', { productId, name, categoryId, unitId }); // Debug log
        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, categoryId, unitId })
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
    // Enhanced validation for product ID
    if (id === undefined || id === null) {
        console.error('Product ID is missing');
        alert('Cannot delete product: Missing product ID');
        return;
    }
    
    const productId = parseInt(id);
    if (isNaN(productId)) {
        console.error('Invalid product ID format:', id);
        alert('Cannot delete product: Invalid product ID format');
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

        await loadProductTable();
        await window.refreshProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product: ' + error.message);
    }
} 