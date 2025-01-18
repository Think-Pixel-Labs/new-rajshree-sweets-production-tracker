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
    exportDetailedCategorySummary 
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

// Make functions globally available
window.clearProductSearch = clearProductSearch;
window.editLog = editLog;
window.deleteLog = deleteLog;
window.closeEditDialog = closeEditDialog;
window.exportProductionLogs = exportProductionLogs;
window.exportCategorySummary = exportCategorySummary;
window.exportDetailedCategorySummary = exportDetailedCategorySummary;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.closeEditProductDialog = closeEditProductDialog;
window.refreshProducts = fetchProducts;

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
            loadProductTable()
        ]);

        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);

        setupEventListeners();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Failed to initialize application. Please refresh the page.');
    }
});