// HomeShelf - Inventory Dashboard
// Renders item list, search, filter, sort, swipe-to-delete

/**
 * Render the inventory page
 */
async function renderInventory(searchQuery = '', sortBy = 'expiryDate') {
  const container = document.getElementById('page-content');
  let items = await getAllItems();
  const totalCount = items.length;

  // Compute stats
  const expiredCount = items.filter(i => getExpiryStatus(i.expiryDate) === 'expired').length;
  const expiringCount = items.filter(i => getExpiryStatus(i.expiryDate) === 'expiring-soon').length;

  // Apply search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.categoryName.toLowerCase().includes(q) ||
      (i.notes && i.notes.toLowerCase().includes(q))
    );
  }

  // Apply sort
  items = sortItems(items, sortBy);

  // Build HTML
  let html = '';

  // Header
  html += `
    <header class="app-header">
      <h1><span class="logo-icon">🏠</span> HomeShelf</h1>
      <p class="header-subtitle">Your grocery inventory at a glance</p>
    </header>
  `;

  // Stats row
  html += `
    <div class="stats-row">
      <div class="stat-card info">
        <div class="stat-value">${totalCount}</div>
        <div class="stat-label">Total Items</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">${expiringCount}</div>
        <div class="stat-label">Expiring Soon</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-value">${expiredCount}</div>
        <div class="stat-label">Expired</div>
      </div>
    </div>
  `;

  // Search bar
  html += `
    <div class="search-container">
      <span class="search-icon">🔍</span>
      <input type="text" class="search-bar" 
             id="search-input"
             placeholder="Search items, categories..." 
             value="${escapeHtml(searchQuery)}"
             autocomplete="off">
    </div>
  `;

  // Sort chips
  html += `
    <div class="filter-bar">
      <button class="filter-chip ${sortBy === 'expiryDate' ? 'active' : ''}" data-sort="expiryDate">
        ⏰ Expiry Date
      </button>
      <button class="filter-chip ${sortBy === 'category' ? 'active' : ''}" data-sort="category">
        📂 Category
      </button>
      <button class="filter-chip ${sortBy === 'name' ? 'active' : ''}" data-sort="name">
        🔤 A–Z
      </button>
      <button class="filter-chip ${sortBy === 'price' ? 'active' : ''}" data-sort="price">
        💰 Price
      </button>
    </div>
  `;

  // Empty state or items list
  if (items.length === 0 && !searchQuery) {
    html += renderEmptyShelf();
  } else if (items.length === 0 && searchQuery) {
    html += `
      <div class="empty-state">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="90" r="50" fill="none" stroke="var(--text-tertiary)" stroke-width="2" opacity="0.4"/>
          <line x1="137" y1="127" x2="165" y2="155" stroke="var(--text-tertiary)" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
          <text x="100" y="95" text-anchor="middle" fill="var(--text-tertiary)" font-size="28" opacity="0.5">?</text>
        </svg>
        <h3>No results found</h3>
        <p>Try a different search term or clear your search</p>
      </div>
    `;
  } else {
    html += `
      <div class="section-header">
        <h2>Your Items</h2>
        <span class="item-count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
      </div>
    `;
    html += '<div class="items-list">';
    items.forEach((item) => {
      html += renderItemCard(item);
    });
    html += '</div>';
  }

  container.innerHTML = html;

  // Bind events
  bindInventoryEvents(searchQuery, sortBy);
}

/**
 * Render a single item card
 */
function renderItemCard(item) {
  const status = getExpiryStatus(item.expiryDate);
  const daysLeft = getDaysUntilExpiry(item.expiryDate);

  let expiryText = '';
  if (status === 'expired') {
    expiryText = 'Expired';
  } else if (status === 'expiring-soon') {
    expiryText = daysLeft === 0 ? 'Today!' : `${daysLeft}d left`;
  } else {
    expiryText = daysLeft !== null ? `${daysLeft}d left` : 'No expiry';
  }

  return `
    <div class="swipe-container" data-item-id="${item.id}">
      <div class="swipe-delete-bg">🗑️</div>
      <div class="item-card" data-item-id="${item.id}">
        <div class="category-emoji">${item.categoryIcon}</div>
        <div class="item-info">
          <div class="item-name">${escapeHtml(item.name)}</div>
          <div class="item-meta">
            <span>${item.categoryName}</span>
            <span>•</span>
            <span>₹${item.price.toFixed(2)}</span>
          </div>
        </div>
        <div class="item-right">
          <span class="expiry-badge ${status}">${expiryText}</span>
          <span class="item-qty">×${item.quantity}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the empty shelf illustration
 */
function renderEmptyShelf() {
  return `
    <div class="empty-state">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Fridge body -->
        <rect x="50" y="20" width="100" height="160" rx="8" fill="none" stroke="var(--text-tertiary)" stroke-width="2" opacity="0.5"/>
        <!-- Fridge divider -->
        <line x1="50" y1="90" x2="150" y2="90" stroke="var(--text-tertiary)" stroke-width="1.5" opacity="0.3"/>
        <!-- Handle top -->
        <line x1="140" y1="45" x2="140" y2="75" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
        <!-- Handle bottom -->
        <line x1="140" y1="105" x2="140" y2="135" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
        <!-- Sparkle 1 -->
        <text x="30" y="45" fill="var(--accent)" font-size="16" opacity="0.5">✨</text>
        <!-- Sparkle 2 -->
        <text x="160" y="65" fill="var(--accent)" font-size="12" opacity="0.4">✨</text>
        <!-- Snowflake -->
        <text x="95" y="55" text-anchor="middle" fill="var(--text-tertiary)" font-size="20" opacity="0.25">❄️</text>
        <!-- Sad face in fridge -->
        <circle cx="85" cy="130" r="2" fill="var(--text-tertiary)" opacity="0.3"/>
        <circle cx="115" cy="130" r="2" fill="var(--text-tertiary)" opacity="0.3"/>
        <path d="M88 145 Q100 140 112 145" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5" opacity="0.3"/>
      </svg>
      <h3>Your shelf is empty</h3>
      <p>Start by adding your first grocery item to track your inventory</p>
      <button class="btn-primary" id="empty-add-btn">+ Add First Item</button>
    </div>
  `;
}

/**
 * Sort items by the given criteria
 */
function sortItems(items, sortBy) {
  switch (sortBy) {
    case 'expiryDate':
      return items.sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      });
    case 'category':
      return items.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
    case 'name':
      return items.sort((a, b) => a.name.localeCompare(b.name));
    case 'price':
      return items.sort((a, b) => b.price - a.price);
    default:
      return items;
  }
}

/**
 * Bind event listeners for inventory page
 */
function bindInventoryEvents(currentQuery, currentSort) {
  // Search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderInventory(e.target.value, currentSort);
      }, 250);
    });
    // Focus search if there was a query
    if (currentQuery) {
      searchInput.focus();
      searchInput.setSelectionRange(currentQuery.length, currentQuery.length);
    }
  }

  // Sort chips
  document.querySelectorAll('.filter-chip[data-sort]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const sort = chip.dataset.sort;
      renderInventory(currentQuery, sort);
    });
  });

  // Item card clicks (edit)
  document.querySelectorAll('.item-card[data-item-id]').forEach((card) => {
    card.addEventListener('click', (e) => {
      // Prevent click if swiping
      if (card.closest('.swipe-container')?.classList.contains('swiping')) return;
      const id = parseInt(card.dataset.itemId);
      renderAddEditPage(id);
      setActiveTab('add');
    });
  });

  // Swipe to delete
  document.querySelectorAll('.swipe-container[data-item-id]').forEach((container) => {
    setupSwipeToDelete(container);
  });

  // Empty state add button
  const emptyAddBtn = document.getElementById('empty-add-btn');
  if (emptyAddBtn) {
    emptyAddBtn.addEventListener('click', () => {
      navigateTo('add');
    });
  }
}

/**
 * Setup swipe-to-delete gesture on an item
 */
function setupSwipeToDelete(container) {
  let startX = 0;
  let currentX = 0;
  let isSwiping = false;
  const card = container.querySelector('.item-card');
  const threshold = -80;

  container.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isSwiping = false;
    card.style.transition = 'none';
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    currentX = e.touches[0].clientX;
    const diffX = currentX - startX;

    if (diffX < -10) {
      isSwiping = true;
      container.classList.add('swiping');
      const translateX = Math.max(diffX, -120);
      card.style.transform = `translateX(${translateX}px)`;
    }
  }, { passive: true });

  container.addEventListener('touchend', () => {
    card.style.transition = 'transform 0.3s ease';
    const diffX = currentX - startX;

    if (diffX < threshold) {
      // Show delete confirmation
      const itemId = parseInt(container.dataset.itemId);
      showDeleteConfirmation(itemId);
    }

    card.style.transform = 'translateX(0)';
    setTimeout(() => {
      container.classList.remove('swiping');
    }, 300);
  });

  // Mouse events for desktop
  container.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    isSwiping = false;
    card.style.transition = 'none';

    const onMouseMove = (e) => {
      currentX = e.clientX;
      const diffX = currentX - startX;
      if (diffX < -10) {
        isSwiping = true;
        container.classList.add('swiping');
        const translateX = Math.max(diffX, -120);
        card.style.transform = `translateX(${translateX}px)`;
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      card.style.transition = 'transform 0.3s ease';
      const diffX = currentX - startX;

      if (diffX < threshold) {
        const itemId = parseInt(container.dataset.itemId);
        showDeleteConfirmation(itemId);
      }

      card.style.transform = 'translateX(0)';
      setTimeout(() => {
        container.classList.remove('swiping');
      }, 300);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

/**
 * Show delete confirmation modal
 */
function showDeleteConfirmation(itemId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'delete-modal';
  overlay.innerHTML = `
    <div class="modal-content">
      <h3>🗑️ Delete Item?</h3>
      <p>This action cannot be undone. The item will be permanently removed from your inventory.</p>
      <div class="modal-actions">
        <button class="btn-secondary" id="confirm-delete" style="border-color: var(--color-expired); color: var(--color-expired);">
          Yes, Delete
        </button>
        <button class="btn-secondary" id="cancel-delete">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  document.getElementById('confirm-delete').addEventListener('click', async () => {
    await deleteItem(itemId);
    overlay.remove();
    showToast('Item deleted successfully', 'success');
    renderInventory();
    updateLowStockBadge();
  });

  document.getElementById('cancel-delete').addEventListener('click', () => {
    overlay.remove();
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
