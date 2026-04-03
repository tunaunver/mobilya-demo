/**
 * ShopCore - Universal Data Layer for Vanilla JS Mobilya Demo
 * Updated to use local MySQL/PHP API instead of localStorage
 */

const ShopCore = (() => {
  const isLiveServer = window.location.port === '5500';
  const API_URL = isLiveServer ? 'http://localhost/mobilya-demo/api' : 'api';
  const STORE_KEY = 'aura_products';
  const CART_KEY = 'aura_cart';
  const CAT_KEY = 'aura_categories';
  
  let productsCache = [];
  let categoriesCache = [];

  const loadCache = async () => {
    try {
      const ts = Date.now();
      // Products
      const pRes = await fetch(`${API_URL}/products.php?t=${ts}`);
      const pData = await pRes.json();
      if (Array.isArray(pData)) {
        productsCache = pData.map(p => normalizeProduct(p));
        localStorage.setItem(STORE_KEY, JSON.stringify(productsCache));
      }
      // Categories
      const cRes = await fetch(`${API_URL}/categories.php?t=${ts}`);
      const cData = await cRes.json();
      if (Array.isArray(cData)) {
        categoriesCache = cData.map(c => ({
          ...c,
          parentId: c.parent_id || null
        }));
        localStorage.setItem(CAT_KEY, JSON.stringify(categoriesCache));
      }
    } catch (e) {
      console.error("[ShopCore] Failed to load cache from API", e);
      const lp = localStorage.getItem(STORE_KEY);
      if (lp) productsCache = JSON.parse(lp);
      const lc = localStorage.getItem(CAT_KEY);
      if (lc) categoriesCache = JSON.parse(lc);
    }
  };

  const normalizeProduct = (p) => {
    const mapped = { ...p };
    
    // Field mapping for frontend compatibility (MySQL snake_case to CamelCase)
    if (p.visual_type) mapped.visualType = p.visual_type;
    if (p.door_models) mapped.doorModels = p.door_models;
    if (p.category_id) mapped.category = p.category_id;
    if (p.is_new !== undefined) mapped.isNew = !!p.is_new;
    if (p.pricing_rules) mapped.pricingRules = typeof p.pricing_rules === 'string' ? JSON.parse(p.pricing_rules) : p.pricing_rules;
    
    // Ensure numbers are numbers
    mapped.price = parseFloat(p.price || 0);
    // Configurator compatibility: map 'price' to 'basePrice'
    mapped.basePrice = mapped.price;
    mapped.stock = parseInt(p.stock || 0);

    // Layout Rules Normalization
    mapped.hangerHeight = parseInt(p.hangerHeight || p.hanger_height || 100);
    mapped.shelfHeight = parseInt(p.shelfHeight || p.shelf_height || 30);
    mapped.drawerHeight = parseInt(p.drawerHeight || p.drawer_height || 20);

    // Deep merge pricing rules into top-level for legacy shop-core consumers
    if (mapped.pricingRules) {
        mapped.pricePerCmWidth = parseFloat(mapped.pricingRules.pricePerCmWidth || 0);
        mapped.pricePerCmHeight = parseFloat(mapped.pricingRules.pricePerCmHeight || 0);
        mapped.pricePerCmDepth = parseFloat(mapped.pricingRules.pricePerCmDepth || 0);
        mapped.pricePerPartition = parseFloat(mapped.pricingRules.pricePerPartition || 0);
    }
    
    return mapped;
  };

  // Initial load
  loadCache();

  const notifyCart = () => {
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return {
    // ASYNC Methods
    fetchProducts: async () => { await loadCache(); return productsCache; },
    fetchCategories: async () => { await loadCache(); return categoriesCache; },
    
    // SYNC Methods (Legacy compatibility)
    getProducts: () => productsCache,
    getCategories: () => categoriesCache,
    loadCache: loadCache,
    
    saveProduct: async (product) => {
      try {
        const res = await fetch(`${API_URL}/products.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
        const result = await res.json();
        await loadCache();
        return result;
      } catch (e) { 
        return { error: 'Fetch Error', details: e.message }; 
      }
    },

    deleteProduct: async (id) => {
      await fetch(`${API_URL}/products.php?id=${id}`, { method: 'DELETE' });
      await loadCache();
    },

    // Theme Settings
    getThemeSettings: async () => {
      const res = await fetch(`${API_URL}/settings.php`);
      const data = await res.json();
      
      // Normalize: map active_theme_id to activeThemeId for frontend
      if (data.active_theme_id) {
        data.activeThemeId = data.active_theme_id;
      }
      
      // Sync with localStorage for storefront (StoreLogic.js)
      localStorage.setItem('aura_theme_settings', JSON.stringify(data));
      
      return data;
    },
    saveThemeSettings: async (settings) => {
      // Sync with localStorage immediately
      localStorage.setItem('aura_theme_settings', JSON.stringify(settings));

      await fetch(`${API_URL}/settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
    },

    // Category Methods
    saveCategory: async (category) => {
      if (!category.id) {
        category.id = 'cat_' + Math.random().toString(36).substr(2, 9);
      }
      if (!category.slug && category.name) {
        category.slug = category.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
      }

      // Map frontend parentId to database parent_id
      const payload = { ...category };
      if ('parentId' in payload) {
        payload.parent_id = payload.parentId;
        delete payload.parentId;
      }
      
      const res = await fetch(`${API_URL}/categories.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await loadCache();
      return await res.json();
    },

    deleteCategory: async (id) => {
      await fetch(`${API_URL}/categories.php?id=${id}`, { method: 'DELETE' });
      await loadCache();
    },

    saveProducts: async (products) => {
      for (const p of products) {
        await fetch(`${API_URL}/products.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        });
      }
      await loadCache();
    },

    // Cart Methods (Keep in localStorage)
    getCart: () => {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    },

    addToCart: (item) => {
      const cart = ShopCore.getCart();
      const existing = cart.find(i => i.id === item.id && JSON.stringify(i.config) === JSON.stringify(item.config));
      if (existing) {
        existing.qty += (item.qty || 1);
        existing.totalPrice = existing.qty * (item.price || item.totalPrice / (existing.qty - (item.qty || 1)));
      } else {
        cart.push({ ...item, qty: item.qty || 1, totalPrice: item.totalPrice || item.price });
      }
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      notifyCart();
    },

    removeFromCart: (itemId) => {
      let cart = ShopCore.getCart().filter(i => i.id !== itemId);
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      notifyCart();
    },

    updateCartQty: (itemId, delta) => {
      const cart = ShopCore.getCart();
      const item = cart.find(i => i.id === itemId);
      if (item) {
        item.qty += delta;
        if (item.qty <= 0) return ShopCore.removeFromCart(itemId);
        item.totalPrice = item.qty * (item.totalPrice / (item.qty - delta));
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        notifyCart();
      }
    },

    formatCurrency,
    loadCache
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  ShopCore.loadCache();
});
