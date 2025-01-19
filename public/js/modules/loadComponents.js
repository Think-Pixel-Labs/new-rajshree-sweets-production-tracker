export async function loadComponents() {
    const components = {
        'production-log': document.getElementById('production-log'),
        'view-logs': document.getElementById('view-logs'),
        'product-management': document.getElementById('product-management'),
        'reports': document.getElementById('reports')
    };

    for (const [id, element] of Object.entries(components)) {
        if (element) {
            try {
                const response = await fetch(`/components/${id}.html`);
                const html = await response.text();
                element.innerHTML = html;
            } catch (error) {
                console.error(`Failed to load ${id} component:`, error);
            }
        }
    }
} 