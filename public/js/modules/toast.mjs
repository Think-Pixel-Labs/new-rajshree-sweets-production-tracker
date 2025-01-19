export function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const toastContent = document.createElement('div');
    toastContent.className = 'toast-content';

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = type === 'success' ? '✓' : '✕';

    const messageElement = document.createElement('p');
    messageElement.className = 'toast-message';
    messageElement.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close';
    closeButton.textContent = '×';
    closeButton.onclick = () => removeToast(toast);

    toastContent.appendChild(icon);
    toastContent.appendChild(messageElement);
    toast.appendChild(toastContent);
    toast.appendChild(closeButton);

    toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            removeToast(toast);
        }
    }, 5000);
}

function removeToast(toast) {
    toast.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => {
        if (toast.parentElement) {
            toast.parentElement.removeChild(toast);
        }
    }, 300);
} 