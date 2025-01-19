import { initializeTabs } from './js/modules/tabs.mjs';
import { setTheme } from './js/modules/theme.mjs';
import { 
    fetchProducts, 
    filterProducts, 
    getProduct,
    handleProductSelect,
    handleProductSubmit,
    clearProductSearch 
} from './js/modules/products.mjs';
import { 
    fetchProductionData, 
    handleFilterClick,
    editLog,
    deleteLog,
    closeEditDialog,
    handleEditSubmit 
} from './js/modules/productionLogs.mjs';
import { 
    exportProductionLogs,
    exportCategorySummary,
    exportDetailedCategorySummary,
    exportManufacturingUnitSummary,
    exportDetailedManufacturingUnitSummary
} from './js/modules/exports.mjs';
import { 
    loadProductTable, 
    handleProductFormSubmit,
    editProduct,
    closeEditProductDialog,
    handleEditProductSubmit,
    deleteProduct,
    initializeSelects 
} from './js/modules/productManagement.mjs';
import { fetchLogTypes } from './js/modules/logTypes.mjs';
import { fetchManufacturingUnits } from './js/modules/manufacturingUnits.mjs';

// Make functions globally available
window.clearProductSearch = clearProductSearch;
window.editLog = editLog;
window.deleteLog = deleteLog;
window.closeEditDialog = closeEditDialog;
window.exportProductionLogs = exportProductionLogs;
window.exportCategorySummary = exportCategorySummary;
window.exportDetailedCategorySummary = exportDetailedCategorySummary;
window.exportManufacturingUnitSummary = exportManufacturingUnitSummary;
window.exportDetailedManufacturingUnitSummary = exportDetailedManufacturingUnitSummary;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.closeEditProductDialog = closeEditProductDialog;
window.refreshProducts = fetchProducts;
window.fetchProductionData = fetchProductionData;

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = today;
    document.getElementById('summaryDate').value = today;
}

function setupEventListeners() {
    // Theme toggle
    document.querySelector('.theme-toggle').addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });

    // Product search and select
    const productSearch = document.getElementById('productSearch');
    if (productSearch) {
        productSearch.addEventListener('input', (e) => filterProducts(e.target.value));
    }

    const productSelect = document.getElementById('productSelect');
    if (productSelect) {
        productSelect.addEventListener('change', handleProductSelect);
    }

    // Production form
    const productionForm = document.getElementById('productionForm');
    if (productionForm) {
        productionForm.addEventListener('submit', handleProductSubmit);
    }

    // Filter button
    const filterButton = document.getElementById('filterButton');
    if (filterButton) {
        filterButton.addEventListener('click', handleFilterClick);
    }

    // Edit form
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
    }

    // Refresh button
    document.querySelector('.refresh-button').addEventListener('click', () => {
        window.location.reload();
    });

    // Product management form
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductFormSubmit);
    }

    // Product edit form
    const editProductForm = document.getElementById('editProductForm');
    if (editProductForm) {
        editProductForm.addEventListener('submit', handleEditProductSubmit);
    }

    // Category management
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
    }

    // Unit type management
    const unitTypeForm = document.getElementById('unitTypeForm');
    if (unitTypeForm) {
        unitTypeForm.addEventListener('submit', handleUnitTypeSubmit);
    }

    // Load data when tabs are clicked
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.getAttribute('data-tab');
            if (tab === 'category-management') {
                loadCategories();
            } else if (tab === 'unit-type-management') {
                loadUnitTypes();
            }
        });
    });
}

// Category Management
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        const categoryList = document.getElementById('categoryList');
        categoryList.innerHTML = '';
        
        categories.forEach(category => {
            const li = document.createElement('li');
            li.textContent = category.name;
            categoryList.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function handleCategorySubmit(event) {
    event.preventDefault();
    const categoryInput = document.getElementById('newCategory');
    const name = categoryInput.value.trim();
    
    if (!name) return;

    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            categoryInput.value = '';
            await loadCategories();
            // Refresh product management dropdowns
            await initializeSelects();
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'Failed to add category');
        }
    } catch (error) {
        console.error('Error adding category:', error);
        alert('Error adding category: ' + error.message);
    }
}

// Unit Type Management
async function loadUnitTypes() {
    try {
        const response = await fetch('/api/unit-types');
        const unitTypes = await response.json();
        const unitTypeList = document.getElementById('unitTypeList');
        unitTypeList.innerHTML = '';
        
        unitTypes.forEach(unitType => {
            const li = document.createElement('li');
            li.textContent = unitType.name;
            unitTypeList.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading unit types:', error);
    }
}

async function handleUnitTypeSubmit(event) {
    event.preventDefault();
    const unitTypeInput = document.getElementById('newUnitType');
    const name = unitTypeInput.value.trim();
    
    if (!name) return;

    try {
        const response = await fetch('/api/unit-types', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            unitTypeInput.value = '';
            await loadUnitTypes();
            // Refresh product management dropdowns
            await initializeSelects();
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'Failed to add unit type');
        }
    } catch (error) {
        console.error('Error adding unit type:', error);
        alert('Error adding unit type: ' + error.message);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        initializeTabs();
        setDefaultDates();
        await initializeSelects();
        await Promise.all([
            fetchProducts(),
            fetchProductionData(),
            loadProductTable(),
            fetchLogTypes(),
            fetchManufacturingUnits()
        ]);

        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);

        setupEventListeners();
        loadCategories();
        loadUnitTypes();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Failed to initialize application. Please refresh the page.');
    }
});