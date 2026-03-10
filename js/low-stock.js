// HomeShelf - Low Stock Tab
// Auto-filters items below threshold, provides quick-add action

/**
 * Render the low stock page
 */
async function renderLowStock() {
  const container = document.getElementById('page-content');
  const lowStockItems = await getLowStockItems();

  let html = '';

  // Header
  html += `
    <header class="app-header">
      <h1><span class="logo-icon">⚠️</span> Low Stock</h1>
      <p class="header-subtitle">Items running low on quantity</p>
    </header>
  `;

  if (lowStockItems.length === 0) {
    html += renderAllStockedUp();
  } else {
    html += `
      <div class="section-header">
        <h2>Needs Restocking</h2>
        <span class="item-count">${lowStockItems.length} item${lowStockItems.length !== 1 ? 's' : ''}</span>
      </div>
    `;

    html += '<div class="items-list">';
    lowStockItems.forEach((item) => {
      const status = getExpiryStatus(item.expiryDate);
      const daysLeft = getDaysUntilExpiry(item.expiryDate);

      let expiryText = '';
      if (status === 'expired') expiryText = 'Expired';
      else if (status === 'expiring-soon') expiryText = daysLeft === 0 ? 'Today!' : `${daysLeft}d left`;
      else expiryText = daysLeft !== null ? `${daysLeft}d left` : 'No expiry';

      html += `
        <div class="item-card" data-item-id="${item.id}" style="cursor: default;">
          <div class="category-emoji">${item.categoryIcon}</div>
          <div class="item-info">
            <div class="item-name">${escapeHtml(item.name)}</div>
            <div class="item-meta">
              <span>${item.categoryName}</span>
              <span>•</span>
              <span class="low-stock-indicator">Only ${item.quantity} left</span>
            </div>
          </div>
          <div class="item-right" style="flex-direction: row; gap: 8px; align-items: center;">
            <span class="expiry-badge ${status}">${expiryText}</span>
            <button class="quick-add-btn" data-item-id="${item.id}" data-qty="${item.quantity}" 
                    aria-label="Add 1 to quantity" title="Add +1">+</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  container.innerHTML = html;
  bindLowStockEvents();
}

/**
 * Render the "All stocked up" empty state
 */
function renderAllStockedUp() {
  return `
    <div class="empty-state">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Checkmark circle -->
        <circle cx="100" cy="90" r="50" fill="none" stroke="var(--accent)" stroke-width="2.5" opacity="0.5"/>
        <!-- Checkmark -->
        <polyline points="78,90 93,105 122,76" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
        <!-- Stars -->
        <text x="40" y="55" fill="var(--color-expiring)" font-size="14" opacity="0.5">⭐</text>
        <text x="155" y="70" fill="var(--color-expiring)" font-size="10" opacity="0.4">⭐</text>
        <text x="60" y="150" fill="var(--color-expiring)" font-size="12" opacity="0.3">⭐</text>
        <!-- Grocery bag -->
        <rect x="85" y="145" width="30" height="25" rx="3" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5" opacity="0.3"/>
        <path d="M90 145 Q100 135 110 145" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5" opacity="0.3"/>
      </svg>
      <h3>All stocked up! 🎉</h3>
      <p>Everything looks good. No items are running low right now.</p>
    </div>
  `;
}

/**
 * Bind event listeners for low stock page
 */
function bindLowStockEvents() {
  // Quick add buttons
  document.querySelectorAll('.quick-add-btn[data-item-id]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const itemId = parseInt(btn.dataset.itemId);
      const currentQty = parseInt(btn.dataset.qty);

      // Fetch item and update
      const item = await getItemById(itemId);
      if (item) {
        item.quantity = currentQty + 1;
        await updateItem(item);

        // Animate the button
        btn.textContent = '✓';
        btn.style.background = 'var(--accent)';
        btn.style.color = 'var(--text-inverse)';

        showToast(`Added 1 × ${item.name} (now ${item.quantity})`, 'success');

        // Re-render after brief animation
        setTimeout(() => {
          renderLowStock();
          updateLowStockBadge();
        }, 500);
      }
    });
  });
}

/**
 * Update the low stock badge count in the nav bar
 */
async function updateLowStockBadge() {
  try {
    const lowStockItems = await getLowStockItems();
    const navItem = document.getElementById('nav-lowstock');
    if (!navItem) return;

    // Remove existing badge
    const existingBadge = navItem.querySelector('.nav-badge');
    if (existingBadge) existingBadge.remove();

    // Add badge if items are low
    if (lowStockItems.length > 0) {
      const badge = document.createElement('span');
      badge.className = 'nav-badge';
      badge.textContent = lowStockItems.length;
      navItem.appendChild(badge);
    }
  } catch (err) {
    console.error('Badge update error:', err);
  }
}
