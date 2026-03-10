// HomeShelf - Database Layer (IndexedDB)
// Provides all CRUD operations for the grocery inventory app

const DB_NAME = 'HomeShelfDB';
const DB_VERSION = 1;

const DEFAULT_CATEGORIES = [
  'Dairy',
  'Produce',
  'Meat',
  'Pantry',
  'Frozen',
  'Beverages',
  'Snacks',
  'Bakery',
  'Condiments',
  'Other'
];

const CATEGORY_ICONS = {
  'Dairy': '🥛',
  'Produce': '🥬',
  'Meat': '🥩',
  'Pantry': '🫙',
  'Frozen': '🧊',
  'Beverages': '🥤',
  'Snacks': '🍿',
  'Bakery': '🍞',
  'Condiments': '🧂',
  'Other': '📦'
};

let db = null;

/**
 * Open and initialize the database
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Create categories store
      if (!database.objectStoreNames.contains('categories')) {
        const catStore = database.createObjectStore('categories', {
          keyPath: 'id',
          autoIncrement: true
        });
        catStore.createIndex('name', 'name', { unique: true });

        // Seed default categories
        DEFAULT_CATEGORIES.forEach((name) => {
          catStore.add({ name });
        });
      }

      // Create items store
      if (!database.objectStoreNames.contains('items')) {
        const itemStore = database.createObjectStore('items', {
          keyPath: 'id',
          autoIncrement: true
        });
        itemStore.createIndex('categoryId', 'categoryId', { unique: false });
        itemStore.createIndex('expiryDate', 'expiryDate', { unique: false });
        itemStore.createIndex('name', 'name', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * Get all categories
 */
async function getCategories() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('categories', 'readonly');
    const store = tx.objectStore('categories');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get category by ID
 */
async function getCategoryById(id) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('categories', 'readonly');
    const store = tx.objectStore('categories');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Add a new item
 */
async function addItem(item) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('items', 'readwrite');
    const store = tx.objectStore('items');
    const record = {
      name: item.name,
      categoryId: parseInt(item.categoryId),
      price: parseFloat(item.price) || 0,
      purchaseDate: item.purchaseDate,
      quantity: parseInt(item.quantity) || 1,
      weight: parseFloat(item.weight) || 0,
      weightUnit: item.weightUnit || 'kg',
      expiryDate: item.expiryDate,
      notes: item.notes || '',
      lowStockThreshold: parseInt(item.lowStockThreshold) || 2,
      createdAt: new Date().toISOString()
    };
    const request = store.add(record);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update an existing item
 */
async function updateItem(item) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('items', 'readwrite');
    const store = tx.objectStore('items');
    const record = {
      id: parseInt(item.id),
      name: item.name,
      categoryId: parseInt(item.categoryId),
      price: parseFloat(item.price) || 0,
      purchaseDate: item.purchaseDate,
      quantity: parseInt(item.quantity) || 1,
      weight: parseFloat(item.weight) || 0,
      weightUnit: item.weightUnit || 'kg',
      expiryDate: item.expiryDate,
      notes: item.notes || '',
      lowStockThreshold: parseInt(item.lowStockThreshold) || 2,
      updatedAt: new Date().toISOString()
    };
    const request = store.put(record);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete an item by ID
 */
async function deleteItem(id) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('items', 'readwrite');
    const store = tx.objectStore('items');
    const request = store.delete(parseInt(id));
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all items with category info
 */
async function getAllItems() {
  const database = await openDB();
  const categories = await getCategories();
  const catMap = {};
  categories.forEach((c) => { catMap[c.id] = c.name; });

  return new Promise((resolve, reject) => {
    const tx = database.transaction('items', 'readonly');
    const store = tx.objectStore('items');
    const request = store.getAll();
    request.onsuccess = () => {
      const items = request.result.map((item) => ({
        ...item,
        categoryName: catMap[item.categoryId] || 'Other',
        categoryIcon: CATEGORY_ICONS[catMap[item.categoryId]] || '📦'
      }));
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a single item by ID
 */
async function getItemById(id) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('items', 'readonly');
    const store = tx.objectStore('items');
    const request = store.get(parseInt(id));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get items that are low on stock
 */
async function getLowStockItems() {
  const allItems = await getAllItems();
  return allItems.filter((item) => item.quantity <= item.lowStockThreshold);
}

/**
 * Get expiry status for an item
 * Returns: 'expired', 'expiring-soon', 'fresh'
 */
function getExpiryStatus(expiryDate) {
  if (!expiryDate) return 'fresh';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= 3) return 'expiring-soon';
  return 'fresh';
}

/**
 * Format a date for display
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Get days until expiry
 */
function getDaysUntilExpiry(expiryDate) {
  if (!expiryDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
}
