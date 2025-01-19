import { fetchProductionData } from './productionLogs.mjs';
import { showToast } from './toast.mjs';

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
        showToast('Failed to fetch products: ' + error.message, 'error');
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
        option.textContent = `[${product.id}] ${product.name} (${product.category})`;
        productSelect.appendChild(option);
    });
}

export function filterProducts(searchText) {
    const productSelect = document.getElementById('productSelect');
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    // Clear previous suggestions
    suggestionsContainer.innerHTML = '';
    
    if (!searchText.trim()) {
        suggestionsContainer.classList.remove('active');
        updateProductSelect(); // Show all products in the select
        return;
    }

    const searchLower = searchText.toLowerCase();
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        (product.category && product.category.toLowerCase().includes(searchLower)) ||
        (product.unit && product.unit.toLowerCase().includes(searchLower)) ||
        (product.manufacturing_unit_name && product.manufacturing_unit_name.toLowerCase().includes(searchLower))
    );

    if (filteredProducts.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'suggestion-item';
        noResults.textContent = 'No matching products found';
        suggestionsContainer.appendChild(noResults);
    } else {
        filteredProducts.forEach(product => {
            const suggestion = document.createElement('div');
            suggestion.className = 'suggestion-item';

            // Create main product name with highlighting
            const nameText = product.name;
            const nameHtml = nameText.replace(
                new RegExp(searchText, 'gi'),
                match => `<span class="highlight">${match}</span>`
            );

            // Create details line
            const details = document.createElement('span');
            details.className = 'details';
            details.textContent = `Category: ${product.category || 'No Category'} | Unit: ${product.unit || 'No Unit'} | Manufacturing Unit: ${product.manufacturing_unit_name || 'No Manufacturing Unit'}`;

            suggestion.innerHTML = nameHtml;
            suggestion.appendChild(details);

            // Add click handler
            suggestion.addEventListener('click', () => {
                productSelect.value = product.id;
                productSelect.dispatchEvent(new Event('change'));
                suggestionsContainer.classList.remove('active');
                document.getElementById('productSearch').value = product.name;
            });

            suggestionsContainer.appendChild(suggestion);
        });
    }

    suggestionsContainer.classList.add('active');
}

// Add click outside handler to close suggestions
document.addEventListener('click', (event) => {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    const searchInput = document.getElementById('productSearch');
    
    if (!event.target.closest('.search-controls')) {
        suggestionsContainer.classList.remove('active');
    }
});

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
        showToast('Please fill in all required fields', 'error');
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

        showToast('Production log added successfully', 'success');
        // Clear form
        event.target.reset();
        // Clear product search
        const searchInput = document.getElementById('productSearch');
        searchInput.value = '';
        // Reset and repopulate the dropdown with all products
        updateProductSelect();
        document.getElementById('unitTypeDisplay').textContent = '';
        // Reset log type to default (PRODUCTION)
        const logTypeSelect = document.getElementById('logType');
        if (logTypeSelect) {
            const defaultOption = Array.from(logTypeSelect.options).find(option => 
                option.textContent.trim().toUpperCase() === 'PRODUCTION'
            );
            if (defaultOption) {
                logTypeSelect.value = defaultOption.value;
            }
        }

        // Refresh production logs
        if (typeof window.fetchProductionData === 'function') {
            await window.fetchProductionData();
        } else {
            console.error('fetchProductionData is not available on window object');
        }
    } catch (error) {
        console.error('Error adding production log:', error);
        showToast(error.message, 'error');
    }
}

export function clearProductSearch() {
    const searchInput = document.getElementById('productSearch');
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (searchInput) {
        searchInput.value = '';
        suggestionsContainer.classList.remove('active');
        updateProductSelect(); // Reset to show all products
        searchInput.focus();
    }
} 