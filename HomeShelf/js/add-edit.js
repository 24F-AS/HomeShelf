// HomeShelf - Add/Edit Item Screen
// Intuitive form for adding and editing grocery items

/**
 * Render the add/edit item page
 * @param {number|null} editId - Item ID to edit, or null for new item
 */
async function renderAddEditPage(editId = null) {
  const container = document.getElementById('page-content');
  const categories = await getCategories();
  let item = null;

  if (editId) {
    item = await getItemById(editId);
  }

  const isEdit = !!item;
  const today = new Date().toISOString().split('T')[0];
  const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let html = `
    <div class="form-page">
      <div class="form-header">
        <button class="back-btn" id="form-back-btn" aria-label="Go back">←</button>
        <div>
          <h1 class="page-title">${isEdit ? '✏️ Edit Item' : '➕ Add New Item'}</h1>
        </div>
      </div>

      <form id="item-form" novalidate>
        <!-- Item Name -->
        <div class="form-group">
          <label class="form-label" for="item-name">Item Name *</label>
          <input type="text" class="form-input" id="item-name" 
                 placeholder="e.g., Organic Milk, Avocados..." 
                 value="${isEdit ? escapeHtml(item.name) : ''}"
                 required autocomplete="off">
        </div>

        <!-- Category -->
        <div class="form-group">
          <label class="form-label" for="item-category">Category *</label>
          <select class="form-select" id="item-category" required>
            <option value="" disabled ${!isEdit ? 'selected' : ''}>Select a category</option>
            ${categories.map(c => `
              <option value="${c.id}" ${isEdit && item.categoryId === c.id ? 'selected' : ''}>
                ${CATEGORY_ICONS[c.name] || '📦'} ${c.name}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Price -->
        <div class="form-group">
          <label class="form-label" for="item-price">Price *</label>
          <div class="price-input-wrapper">
            <input type="number" class="form-input" id="item-price" 
                   placeholder="0.00" step="0.01" min="0"
                   value="${isEdit ? item.price.toFixed(2) : ''}" required>
          </div>
        </div>

        <!-- Dates row -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="item-purchase-date">Purchase Date *</label>
            <input type="date" class="form-input" id="item-purchase-date" 
                   value="${isEdit ? item.purchaseDate : today}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="item-expiry-date">Expiry Date</label>
            <input type="date" class="form-input" id="item-expiry-date" 
                   value="${isEdit ? item.expiryDate : weekLater}">
          </div>
        </div>

        <!-- Quantity & Weight Row -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Quantity</label>
            <div class="qty-stepper">
              <button type="button" class="qty-btn" id="qty-minus" aria-label="Decrease quantity">−</button>
              <span class="qty-value" id="qty-value">${isEdit ? item.quantity : 1}</span>
              <button type="button" class="qty-btn" id="qty-plus" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Weight</label>
            <div class="weight-input-combo">
              <input type="number" class="form-input weight-number" id="item-weight"
                     placeholder="0.00" step="0.01" min="0"
                     value="${isEdit && item.weight ? item.weight : ''}">
              <div class="weight-unit-select-wrapper">
                <select class="weight-unit-select" id="item-weight-unit">
                  <option value="kg" ${isEdit && item.weightUnit === 'kg' ? 'selected' : (!isEdit ? 'selected' : '')}>kg</option>
                  <option value="g" ${isEdit && item.weightUnit === 'g' ? 'selected' : ''}>g</option>
                  <option value="lb" ${isEdit && item.weightUnit === 'lb' ? 'selected' : ''}>lb</option>
                  <option value="oz" ${isEdit && item.weightUnit === 'oz' ? 'selected' : ''}>oz</option>
                </select>
                <span class="weight-chevron">▾</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Low Stock Threshold -->
        <div class="form-group">
          <label class="form-label">Low Stock Alert When Below</label>
          <div class="threshold-row">
            <input type="number" class="form-input" id="item-threshold" 
                   min="0" max="100"
                   value="${isEdit ? (item.lowStockThreshold || 2) : 2}">
            <span class="threshold-label">units remaining</span>
          </div>
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label class="form-label" for="item-notes">Notes (optional)</label>
          <textarea class="form-textarea" id="item-notes" 
                    placeholder="Brand, storage instructions, or other details...">${isEdit ? escapeHtml(item.notes) : ''}</textarea>
        </div>

        <!-- Submit -->
        <button type="submit" class="btn-primary" id="submit-btn">
          ${isEdit ? '💾 Update Item' : '✅ Add to Shelf'}
        </button>

        ${isEdit ? `
          <button type="button" class="btn-secondary" id="delete-item-btn" style="margin-top: var(--space-sm);">
            🗑️ Delete This Item
          </button>
        ` : ''}

        <input type="hidden" id="item-id" value="${isEdit ? item.id : ''}">
      </form>
    </div>
  `;

  container.innerHTML = html;
  bindFormEvents(isEdit);
}

/**
 * Bind form event listeners
 */
function bindFormEvents(isEdit) {
  let quantity = parseInt(document.getElementById('qty-value').textContent);

  // Quantity stepper
  document.getElementById('qty-minus').addEventListener('click', () => {
    if (quantity > 0) {
      quantity--;
      document.getElementById('qty-value').textContent = quantity;
      animateElement(document.getElementById('qty-value'));
    }
  });

  document.getElementById('qty-plus').addEventListener('click', () => {
    quantity++;
    document.getElementById('qty-value').textContent = quantity;
    animateElement(document.getElementById('qty-value'));
  });

  // Back button
  document.getElementById('form-back-btn').addEventListener('click', () => {
    navigateTo('inventory');
  });

  // Form submission
  document.getElementById('item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleFormSubmit(isEdit, quantity);
  });

  // Delete button (edit mode)
  const deleteBtn = document.getElementById('delete-item-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const id = parseInt(document.getElementById('item-id').value);
      showDeleteConfirmation(id);
    });
  }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(isEdit, quantity) {
  const name = document.getElementById('item-name').value.trim();
  const categoryId = document.getElementById('item-category').value;
  const price = document.getElementById('item-price').value;
  const purchaseDate = document.getElementById('item-purchase-date').value;
  const expiryDate = document.getElementById('item-expiry-date').value;
  const notes = document.getElementById('item-notes').value.trim();
  const threshold = document.getElementById('item-threshold').value;
  const itemId = document.getElementById('item-id').value;

  // Validation
  if (!name) {
    showToast('Please enter an item name', 'error');
    document.getElementById('item-name').focus();
    return;
  }
  if (!categoryId) {
    showToast('Please select a category', 'error');
    document.getElementById('item-category').focus();
    return;
  }
  if (!price && price !== 0) {
    showToast('Please enter a price', 'error');
    document.getElementById('item-price').focus();
    return;
  }
  if (!purchaseDate) {
    showToast('Please set a purchase date', 'error');
    document.getElementById('item-purchase-date').focus();
    return;
  }

  const weight = document.getElementById('item-weight').value;
  const weightUnit = document.getElementById('item-weight-unit').value;

  const itemData = {
    name,
    categoryId,
    price: price || 0,
    purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
    quantity,
    weight: weight || 0,
    weightUnit: weightUnit || 'kg',
    expiryDate,
    notes,
    lowStockThreshold: threshold || 2
  };

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;

  try {
    if (isEdit && itemId) {
      itemData.id = itemId;
      await updateItem(itemData);
      showToast('Item updated successfully! ✅', 'success');
    } else {
      await addItem(itemData);
      showToast('Item added to your shelf! 🎉', 'success');
    }

    // Success animation on button
    submitBtn.classList.add('success');
    submitBtn.textContent = '✓ Saved!';

    // Navigate back to inventory after brief delay
    setTimeout(() => {
      navigateTo('inventory');
      updateLowStockBadge();
    }, 800);
  } catch (err) {
    showToast('Something went wrong. Please try again.', 'error');
    submitBtn.disabled = false;
    console.error('Save error:', err);
  }
}

/**
 * Quick animation on element (used for quantity changes)
 */
function animateElement(el) {
  el.style.transform = 'scale(1.3)';
  el.style.transition = 'transform 0.15s ease';
  setTimeout(() => {
    el.style.transform = 'scale(1)';
  }, 150);
}
