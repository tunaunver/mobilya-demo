/**
 * ShopCore - Universal Data Layer for Vanilla JS Mobilya Demo
 * Updated to use local MySQL/PHP API instead of localStorage
 */

const ShopCore = (() => {
  const isLiveServer = window.location.port === '5500' || window.location.port === '5501' || window.location.port === '3000';
  // Mevcut dosyanın konumundan proje klasör adını çıkar (local Apache için)
  const pathParts = window.location.pathname.split('/');
  // Eğer admin.html kökteyse folderName'i eldeki workspace adından (mobilya-demo) veya fallback'ten al
  let folderName = pathParts.length > 2 ? pathParts[1] : 'mobilya-demo'; 
  
  // Eğer Live Server'daysak genellikle Apache'de aynı isimli bir klasörde çalışırız
  const API_URL = isLiveServer ? `http://localhost/${folderName}/api` : 'api';
  console.log('[ShopCore] API URL Detection:', { origin: window.location.origin, pathname: window.location.pathname, folderName, finalUrl: API_URL });
  
  const STORE_KEY = 'aura_products';
  const CART_KEY = 'aura_cart';
  const CAT_KEY = 'aura_categories';
  const CACHE_TS_KEY = 'aura_cache_ts';
  const CACHE_TTL_MS = 60 * 1000; // 60 saniye — admin değişikliği sonrası otomatik expire

  let productsCache = [];
  let categoriesCache = [];

  /**
   * Önbellekten veri yükle (TTL = 60sn).
   * TTL dolmadıysa localStorage'dan anında sun, DB'ye gitme.
   * force=true ile TTL'yi atla (admin kaydetme/silme sonrası).
   */
  const loadCache = async (force = false) => {
    // --- TTL Kontrolü ---
    if (!force) {
      const lastTs = parseInt(localStorage.getItem(CACHE_TS_KEY) || '0', 10);
      if (Date.now() - lastTs < CACHE_TTL_MS) {
        // Önbellek hâlâ taze — localStorage'dan yükle, API'ye gitme
        try {
          const lp = localStorage.getItem(STORE_KEY);
          const lc = localStorage.getItem(CAT_KEY);
          if (lp) productsCache = JSON.parse(lp);
          if (lc) categoriesCache = JSON.parse(lc);
          if (productsCache.length > 0) {
            console.log('[ShopCore] Önbellekten yüklendi (TTL aktif)');
            return;
          }
        } catch (e) { /* bozuk veri, API'den devam */ }
      }
    }

    // --- API'den Yükle ---
    try {
      const ts = Date.now();
      // Products ve Categories isteklerini PARALEL gönder (ardışık değil)
      const [pRes, cRes] = await Promise.all([
        fetch(`${API_URL}/products.php?t=${ts}`),
        fetch(`${API_URL}/categories.php?t=${ts}`)
      ]);

      const [pData, cData] = await Promise.all([pRes.json(), cRes.json()]);

      if (Array.isArray(pData)) {
        productsCache = pData.map(p => normalizeProduct(p));
        localStorage.setItem(STORE_KEY, JSON.stringify(productsCache));
      }
      if (Array.isArray(cData)) {
        categoriesCache = cData.map(c => ({
          ...c,
          parentId: c.parent_id || null
        }));
        localStorage.setItem(CAT_KEY, JSON.stringify(categoriesCache));
      }
      // Önbellek zaman damgasını güncelle
      localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
      console.log('[ShopCore] API\'den yüklendi, önbellek güncellendi');
    } catch (e) {
      console.error("[ShopCore] API'ye ulaşılamadı, localStorage'dan yükleniyor", e);
      const lp = localStorage.getItem(STORE_KEY);
      if (lp) productsCache = JSON.parse(lp);
      const lc = localStorage.getItem(CAT_KEY);
      if (lc) categoriesCache = JSON.parse(lc);
    }
  };

  /** Önbelleği geçersiz kıl — admin kaydetme/silme sonrası çağrılır */
  const invalidateCache = () => {
    localStorage.removeItem(CACHE_TS_KEY);
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
    
    // Design: Configurator properties (handles, doors) mapping
    if (p.handles) {
        // If handles array is not empty, it means they are enabled
        const handleList = Array.isArray(p.handles) ? p.handles : [];
        mapped.handlesEnabled = handleList.length > 0;
        if (mapped.handlesEnabled && handleList[0].priceModifier !== undefined) {
             mapped.handlesPrice = parseFloat(handleList[0].priceModifier);
        }
    } else {
        mapped.handlesEnabled = false;
    }

    if (p.door_models) mapped.doorModels = p.door_models;
    // Map visual_type to visualType
    if (p.visual_type) mapped.visualType = p.visual_type;

    return mapped;
  };

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
    fetchProducts: async () => {
      if (!productsCache.length) await loadCache();
      return productsCache;
    },
    fetchCategories: async () => {
      if (!categoriesCache.length) await loadCache();
      return categoriesCache;
    },
    
    // SYNC Methods (Legacy compatibility)
    getProducts: () => productsCache,
    getCategories: () => categoriesCache,
    loadCache: loadCache,
    
    saveProduct: async (product) => {
      // 1. Update Local Cache & Storage first for immediate UI feedback
      const idx = productsCache.findIndex(p => p.id === product.id);
      if (idx !== -1) {
        productsCache[idx] = { ...productsCache[idx], ...product };
      } else {
        productsCache.unshift(product);
      }
      localStorage.setItem(STORE_KEY, JSON.stringify(productsCache));

      try {
        const res = await fetch(`${API_URL}/products.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        
        // Refresh cache from DB to ensure server-side IDs/auto-fields are synced
        invalidateCache();
        await loadCache(true); 
        return result;
      } catch (e) { 
        console.warn("[ShopCore] Product API save failed, but saved to local session.", e);
        // Return a special success object to allow UI to proceed
        return { success: true, localOnly: true, details: e.message }; 
      }
    },

    deleteProduct: async (id) => {
      await fetch(`${API_URL}/products.php?id=${id}`, { method: 'DELETE' });
      invalidateCache();
      await loadCache(true);
    },

    // Theme Settings
    getThemeSettings: async () => {
      try {
        const res = await fetch(`${API_URL}/settings.php`);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        
        // Normalize: map active_theme_id to activeThemeId for frontend
        if (data.active_theme_id) {
          data.activeThemeId = data.active_theme_id;
        }
        
        // Sync with localStorage for storefront (StoreLogic.js)
        localStorage.setItem('aura_theme_settings', JSON.stringify(data));
        
        return data;
      } catch (e) {
        console.warn('[ShopCore] Theme settings fetch failed, returning null for fallback.', e);
        return null;
      }
    },
    saveThemeSettings: async (settings) => {
      // Sync with localStorage immediately
      localStorage.setItem('aura_theme_settings', JSON.stringify(settings));

      try {
        await fetch(`${API_URL}/settings.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });
      } catch (e) {
        console.warn('[ShopCore] Failed to save theme settings to API, but synced with localStorage.', e);
      }
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
      const result = await res.json();
      invalidateCache();
      await loadCache(true);
      return result;
    },

    deleteCategory: async (id) => {
      await fetch(`${API_URL}/categories.php?id=${id}`, { method: 'DELETE' });
      invalidateCache();
      await loadCache(true);
    },

    saveProducts: async (products) => {
      for (const p of products) {
        await fetch(`${API_URL}/products.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        });
      }
      invalidateCache();
      await loadCache(true);
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
    loadCache,
    invalidateCache
  };
})();

