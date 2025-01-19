let manufacturingUnits = [];

export async function fetchManufacturingUnits() {
    try {
        const response = await fetch('/api/manufacturing-units');
        if (!response.ok) throw new Error('Failed to fetch manufacturing units');
        manufacturingUnits = await response.json();
        updateManufacturingUnitSelects();
    } catch (error) {
        console.error('Error fetching manufacturing units:', error);
        throw error;
    }
}

function updateManufacturingUnitSelects() {
    // Update add form select
    const addSelect = document.getElementById('manufacturingUnit');
    if (addSelect) {
        const currentValue = addSelect.value;
        addSelect.innerHTML = '<option value="">Select Manufacturing Unit</option>';
        manufacturingUnits.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit.id;
            option.textContent = unit.name;
            if (unit.id === currentValue) {
                option.selected = true;
            }
            addSelect.appendChild(option);
        });
    }

    // Update edit form select
    const editSelect = document.getElementById('editManufacturingUnit');
    if (editSelect) {
        const currentValue = editSelect.value;
        editSelect.innerHTML = '<option value="">Select Manufacturing Unit</option>';
        manufacturingUnits.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit.id;
            option.textContent = unit.name;
            if (unit.id === currentValue) {
                option.selected = true;
            }
            editSelect.appendChild(option);
        });
    }
} 