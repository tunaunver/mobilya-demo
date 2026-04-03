/**
 * StoreLogic - Common logic for AURA Storefront (Vanilla JS)
 */

const StoreLogic = (() => {
  const THEME_KEY = 'aura_theme_settings';

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const getActiveTheme = () => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (!stored) return null;
      const settings = JSON.parse(stored);
      if (settings.themes && settings.activeThemeId) {
        return settings.themes.find(t => t.id === settings.activeThemeId) || settings.themes[0];
      }
      return settings; // legacy flat
    } catch (e) {
      return null;
    }
  };

  const applyThemeToFooter = () => {
    const theme = getActiveTheme();
    if (!theme || !theme.footer) return;
    const f = theme.footer;
    
    if (f.address) document.querySelectorAll('#f-address').forEach(el => el.innerText = f.address);
    if (f.email) document.querySelectorAll('#f-email').forEach(el => el.innerText = f.email);
    if (f.phone) document.querySelectorAll('#f-phone').forEach(el => el.innerText = f.phone);
    if (f.whatsapp) {
      const waNo = f.whatsapp.replace(/\D/g, '');
      const waMsg = encodeURIComponent("Merhaba, bilgi almak istiyorum.");
      document.querySelectorAll('#f-whatsapp-btn').forEach(el => {
        el.href = `https://wa.me/${waNo}?text=${waMsg}`;
      });
    }
    if (f.footerDesc && document.getElementById('f-desc')) {
      document.getElementById('f-desc').innerText = f.footerDesc;
    }
  };

  const applyThemeToProductFeatures = (containerId = 'detail-features') => {
    console.log(`[StoreLogic] Applying features to: ${containerId}`);
    const theme = getActiveTheme();
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[StoreLogic] Container not found: ${containerId}`);
      return;
    }

    // Use theme features if available, otherwise use defaults
    const features = (theme && theme.productFeatures && theme.productFeatures.length > 0) 
      ? theme.productFeatures 
      : [
          { icon: 'ph-ruler', text: 'Özel ölçülerde üretim imkanı mevcuttur.' },
          { icon: 'ph-truck', text: 'Sipariş tarihinden itibaren 14 iş günü içinde teslimat.' },
          { icon: 'ph-shield-check', text: 'Tüm ürünlerimiz 2 yıl AURA garantisi altındadır.' }
        ];

    console.log(`[StoreLogic] Rendering ${features.length} features`);

    container.innerHTML = features.map(f => `
      <div class="flex items-center space-x-4 text-sm text-gray-700">
        <i class="ph ${f.icon} text-xl text-gray-400"></i>
        <span>${f.text}</span>
      </div>
    `).join('');
  };

  const syncHomeLinks = () => {
    const theme = getActiveTheme();
    if (!theme) return;
    
    const isTheme2 = theme.layout === 'theme2' || theme.id === 'theme-premium';
    const homePage = isTheme2 ? 'theme2-index.html' : 'index.html';
    
    // Select all links that point to index.html (with or without ./ prefix)
    document.querySelectorAll('a[href="index.html"], a[href="./index.html"]').forEach(el => {
      el.href = homePage;
    });
  };

  return {
    formatCurrency,
    getActiveTheme,
    applyThemeToFooter,
    applyThemeToProductFeatures,
    syncHomeLinks,
    getProductLink: (product) => {
      if (product.type === 'configurator' && product.visualType === 'wardrobe') {
        return `configurator.html?id=${product.id}`;
      }
      const isConfig = product.type === 'modular' || product.type === 'configurator';
      return isConfig 
        ? `theme2-configurator.html?id=${product.id}` 
        : `theme2-detail.html?id=${product.id}`;
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  StoreLogic.applyThemeToFooter();
  StoreLogic.syncHomeLinks();
});
