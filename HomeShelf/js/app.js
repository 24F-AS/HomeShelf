// HomeShelf - Main App Controller
// Tab navigation, page routing, toast notifications, init

/**
 * Current active tab
 */
let currentTab = 'inventory';

/**
 * Initialize the app
 */
async function initApp() {
  try {
    await openDB();
    setupNavigation();
    await renderInventory();
    await updateLowStockBadge();
  } catch (err) {
    console.error('App init error:', err);
    showToast('Error loading app. Please refresh.', 'error');
  }
}

/**
 * Set up bottom navigation event listeners
 */
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      if (tab) {
        navigateTo(tab);
      }
    });
  });
}

/**
 * Navigate to a tab
 */
function navigateTo(tab) {
  currentTab = tab;
  setActiveTab(tab);

  switch (tab) {
    case 'inventory':
      renderInventory();
      break;
    case 'add':
      renderAddEditPage();
      break;
    case 'lowstock':
      renderLowStock();
      break;
  }
}

/**
 * Set active tab styling in the navbar
 */
function setActiveTab(tab) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.tab === tab);
  });
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icon}</span> ${escapeHtml(message)}`;
  container.appendChild(toast);

  // Auto-remove after 2.5s
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2500);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
