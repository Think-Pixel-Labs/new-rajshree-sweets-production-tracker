import { fetchProductionData } from './productionLogs.mjs';

let products = [];

export async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        products = await response.json();
        updateProductSelect();
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

function updateProductSelect() {
    const productSelect = document.getElementById('productSelect');
    if (!productSelect) return;
    
    productSelect.innerHTML = '<option value="">Select a product</option>';
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (${product.category})`;
        productSelect.appendChild(option);
    });
}

export function filterProducts(searchText) {
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

export function getProduct(id) {
    return products.find(p => p.id == id);
}

export function handleProductSelect(event) {
    const selectedProduct = getProduct(event.target.value);
    const unitTypeDisplay = document.getElementById('unitTypeDisplay');
    if (unitTypeDisplay) {
        unitTypeDisplay.textContent = selectedProduct ? selectedProduct.unitType : '';
    }
}

export async function handleProductSubmit(event) {
    event.preventDefault();
    const productId = document.getElementById('productSelect').value;
    const quantity = document.getElementById('quantity').value;
    const logTypeId = document.getElementById('logType').value;

    if (!productId || !quantity || !logTypeId) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const response = await fetch('/api/production', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                productId, 
                quantity,
                logTypeId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add production log');
        }

        // Clear form
        event.target.reset();
        // Clear product search
        const searchInput = document.getElementById('productSearch');
        searchInput.value = '';
        // Reset and repopulate the dropdown with all products
        updateProductSelect();
        document.getElementById('unitTypeDisplay').textContent = '';

        // Refresh production logs
        if (typeof window.fetchProductionData === 'function') {
            await window.fetchProductionData();
        } else {
            console.error('fetchProductionData is not available on window object');
        }
    } catch (error) {
        console.error('Error adding production log:', error);
        alert(error.message);
    }
}

export function clearProductSearch() {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.value = '';
        filterProducts('');
        searchInput.focus();
    }
} 