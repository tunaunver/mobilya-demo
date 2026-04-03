/**
 * js/cart-ui.js
 * Premium Sidebar Shopping Cart UI for AURA
 * Guaranteed Visibility with 999999 Z-Index
 */

window.CartUI = {
    init: () => {
        console.log("[CartUI] Initializing...");
        CartUI.injectLayout();
        CartUI.refresh();
        
        // Listen for internal cart updates
        window.addEventListener('cartUpdated', () => {
            console.log("[CartUI] Event: cartUpdated received");
            CartUI.refresh();
        });

        // Robust event delegation on document.documentElement (beyond body)
        document.documentElement.addEventListener('click', (e) => {
            const toggleElement = e.target.closest('#cart-toggle-btn') || e.target.closest('.cart-toggle-btn');
            if (toggleElement) {
                console.log("[CartUI] UI: Cart toggle button clicked");
                e.preventDefault();
                e.stopPropagation();
                CartUI.toggle(true);
                return false;
            }

            const closeElement = e.target.closest('#close-cart-btn') || e.target.id === 'cart-overlay';
            if (closeElement) {
                console.log("[CartUI] UI: Close triggered");
                CartUI.toggle(false);
            }
        }, true);
    },

    injectLayout: () => {
        if (document.getElementById('cart-sidebar-container')) return;

        const html = `
            <!-- Cart Sidebar Overlay -->
            <div id="cart-overlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-500" 
                 style="z-index: 999998 !important; position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;"></div>

            <!-- Cart Sidebar -->
            <div id="cart-sidebar" class="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white translate-x-full transition-transform duration-500 shadow-2xl flex flex-col" 
                 style="z-index: 999999 !important; position: fixed !important; right: 0 !important; top: 0 !important;">
                
                <div class="p-6 md:p-8 flex justify-between items-center border-b border-gray-100">
                    <div>
                        <h2 class="text-2xl font-serif text-gray-900 uppercase tracking-widest">Alışveriş Sepetim</h2>
                        <p class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mt-1" id="cart-count-label">Yükleniyor...</p>
                    </div>
                    <button id="close-cart-btn" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <i class="ph ph-x text-xl"></i>
                    </button>
                </div>

                <div id="cart-items-list" class="flex-grow overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
                    <!-- Items injected here -->
                </div>

                <div class="p-6 md:p-8 border-t border-gray-100 bg-gray-50/50 mt-auto">
                    <div class="flex justify-between items-center mb-6">
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Toplam Tutar</span>
                        <span id="cart-total-price" class="text-3xl font-serif text-gray-900">₺0</span>
                    </div>
                    <button onclick="CartUI.proceedToCheckout()" class="w-full bg-gray-900 text-white font-bold uppercase tracking-[0.2em] text-[10px] py-6 rounded-xl hover:bg-aura-gold transition-all shadow-xl hover:shadow-aura-gold/20 flex items-center justify-center space-x-3">
                        <i class="ph ph-whatsapp-logo text-xl"></i>
                        <span>Siparişi Tamamla (WhatsApp)</span>
                    </button>
                    <p class="text-[9px] text-gray-400 text-center mt-4 uppercase tracking-[0.2em] font-black opacity-40">Talebiniz WhatsApp üzerinden yetkililerimize iletilecektir.</p>
                </div>
            </div>

            <style>
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
            </style>
        `;

        const container = document.createElement('div');
        container.id = 'cart-sidebar-container';
        container.innerHTML = html;
        document.body.appendChild(container);
    },

    toggle: (isOpen) => {
        let overlay = document.getElementById('cart-overlay');
        let sidebar = document.getElementById('cart-sidebar');
        
        if (!overlay || !sidebar) {
            CartUI.injectLayout();
            overlay = document.getElementById('cart-overlay');
            sidebar = document.getElementById('cart-sidebar');
        }
        
        if (isOpen) {
            overlay.style.pointerEvents = 'auto'; 
            overlay.style.opacity = '1'; 
            sidebar.style.transform = 'translateX(0)';
            document.body.style.overflow = 'hidden';
            CartUI.refresh(); 
        } else {
            overlay.style.pointerEvents = 'none';
            overlay.style.opacity = '0';
            sidebar.style.transform = 'translateX(100%)';
            document.body.style.overflow = '';
        }
    },

    refresh: () => {
        if (typeof ShopCore === 'undefined') return;
        
        const cart = ShopCore.getCart();
        const list = document.getElementById('cart-items-list');
        const countLabel = document.getElementById('cart-count-label');
        const totalPrice = document.getElementById('cart-total-price');

        // Update all counters in the document
        const counters = document.querySelectorAll('.cart-count');
        counters.forEach(c => c.innerText = cart.length);
        if (countLabel) countLabel.innerText = `${cart.length} Ürün`;

        if (!list) return;

        if (cart.length === 0) {
            list.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
                    <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                        <i class="ph ph-shopping-bag text-3xl"></i>
                    </div>
                    <div class="space-y-1">
                        <p class="text-sm text-gray-900 font-serif">Sepetiniz şu an boş.</p>
                        <p class="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Hemen alışverişe başlayın.</p>
                    </div>
                    <a href="theme2-products.html" class="inline-block bg-gray-900 text-white px-8 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-aura-gold transition-all">Koleksiyonu Keşfet</a>
                </div>
            `;
            if (totalPrice) totalPrice.innerText = '₺0';
            return;
        }

        list.innerHTML = cart.map((item, index) => {
            const displayPrice = item.totalPrice || (item.price * item.qty);
            return `
                <div class="flex items-start space-x-4 mb-6">
                    <div class="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        <img src="${item.image}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-grow">
                        <div class="flex justify-between items-start">
                            <h4 class="text-[11px] font-bold uppercase tracking-tight text-gray-900 line-clamp-1">${item.name}</h4>
                            <button onclick="ShopCore.removeFromCartByIndex(${index}); CartUI.refresh();" class="text-gray-300 hover:text-red-500 transition-colors">
                                <i class="ph ph-trash text-lg"></i>
                            </button>
                        </div>
                        <p class="text-[9px] text-gray-400 mt-1 uppercase font-bold">${item.config?.sku || ''}</p>
                        <div class="flex justify-between items-center mt-3">
                            <div class="flex items-center space-x-3 bg-gray-50 rounded-full px-2 py-1">
                                <button onclick="ShopCore.updateCartQtyByIndex(${index}, -1); CartUI.refresh();" class="text-gray-400 hover:text-gray-900"><i class="ph ph-minus text-[10px]"></i></button>
                                <span class="text-[10px] font-bold w-4 text-center">${item.qty}</span>
                                <button onclick="ShopCore.updateCartQtyByIndex(${index}, 1); CartUI.refresh();" class="text-gray-400 hover:text-gray-900"><i class="ph ph-plus text-[10px]"></i></button>
                            </div>
                            <span class="text-xs font-serif font-bold text-gray-900">${StoreLogic.formatCurrency(displayPrice)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (totalPrice) totalPrice.innerText = StoreLogic.formatCurrency(ShopCore.getCartTotal());
    },

    proceedToCheckout: () => {
        const cart = ShopCore.getCart();
        if (!cart.length) return;

        let message = `*YENİ PREMIUM SİPARİŞ TALEBİ*\n\n`;
        cart.forEach((item, idx) => {
            message += `${idx + 1}. *${item.name.toUpperCase()}*\n`;
            message += `   • Adet: ${item.qty}\n`;
            message += `   • Detay: ${item.config?.sku || 'Standart'}\n`;
            if (item.config?.customDimensions) message += `   • Ölçü: ${item.config.customDimensions}\n`;
            message += `   • Fiyat: ${StoreLogic.formatCurrency(item.totalPrice)}\n\n`;
        });
        message += `*TOPLAM TUTAR: ${StoreLogic.formatCurrency(ShopCore.getCartTotal())}*`;

        const encoded = encodeURIComponent(message);
        const settings = JSON.parse(localStorage.getItem('aura_theme_settings') || '{}');
        const activeTheme = settings.themes?.find(t => t.id === settings.activeThemeId);
        const whatsapp = activeTheme?.footer?.whatsapp 
            ? activeTheme.footer.whatsapp.replace(/\D/g, '') 
            : '905551234567';
            
        window.open(`https://wa.me/${whatsapp}?text=${encoded}`, '_blank');
    }
};

// Auto-run init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CartUI.init());
} else {
    setTimeout(CartUI.init, 50);
}
