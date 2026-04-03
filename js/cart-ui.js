window.CartUI = {
    init: () => {
        CartUI.injectLayout();
        CartUI.refresh();
        
        // Listen for internal cart updates
        window.addEventListener('cartUpdated', () => {
            CartUI.refresh();
        });

        // Event delegation at document level for robust triggering
        document.body.addEventListener('click', (e) => {
            // Find if click was on a toggle button or inside one
            const toggleBtn = e.target.closest('#cart-toggle-btn') || e.target.closest('.cart-toggle-btn');
            if (toggleBtn) {
                e.preventDefault();
                CartUI.toggle(true);
            }

            // Find if click was on a close button or the overlay
            const closeBtn = e.target.closest('#close-cart-btn');
            if (closeBtn || e.target.id === 'cart-overlay') {
                CartUI.toggle(false);
            }
        });
    },

    injectLayout: () => {
        if (document.getElementById('cart-sidebar-container')) return;

        const html = `
            <!-- Cart Sidebar Overlay -->
            <div id="cart-overlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-500" style="z-index: 99998 !important;"></div>

            <!-- Cart Sidebar -->
            <div id="cart-sidebar" class="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white translate-x-full transition-transform duration-500 shadow-2xl flex flex-col" style="z-index: 99999 !important; box-shadow: -20px 0 50px rgba(0,0,0,0.15);">
                <div class="p-6 md:p-8 flex justify-between items-center border-b border-gray-100">
                    <div>
                        <h2 class="text-2xl font-serif text-gray-900 uppercase tracking-widest">Alışveriş Sepetim</h2>
                        <p class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mt-1" id="cart-count-label">0 Ürün</p>
                    </div>
                    <button id="close-cart-btn" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <i class="ph ph-x text-xl"></i>
                    </button>
                </div>

                <div id="cart-items-list" class="flex-grow overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
                    <!-- Items injected here -->
                </div>

                <div class="p-6 md:p-8 border-t border-gray-100 bg-gray-50/50">
                    <div class="flex justify-between items-center mb-6">
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Toplam Tutar</span>
                        <span id="cart-total-price" class="text-3xl font-serif text-gray-900">₺0.00</span>
                    </div>
                    <button onclick="CartUI.proceedToCheckout()" class="w-full bg-gray-900 text-white font-bold uppercase tracking-[0.2em] text-[10px] py-6 rounded-xl hover:bg-aura-gold transition-all shadow-xl hover:shadow-aura-gold/20 flex items-center justify-center space-x-3">
                        <i class="ph ph-whatsapp-logo text-xl"></i>
                        <span>Siparişi Tamamla (WhatsApp)</span>
                    </button>
                    <p class="text-[9px] text-gray-400 text-center mt-4 uppercase tracking-[0.2em] font-black opacity-40">Kaydetmek için sepetinize ekleyebilirsiniz.</p>
                </div>
            </div>

            <style>
                .cart-item-img { transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
                .cart-item:hover .cart-item-img { transform: scale(1.08); }
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
        
        // Ensure layout is present
        if (!overlay || !sidebar) {
            CartUI.injectLayout();
            overlay = document.getElementById('cart-overlay');
            sidebar = document.getElementById('cart-sidebar');
        }
        
        if (isOpen) {
            console.log("[CartUI] Opening Sidebar...");
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            sidebar.classList.remove('translate-x-full');
            document.body.style.overflow = 'hidden';
            CartUI.refresh(); 
        } else {
            console.log("[CartUI] Closing Sidebar...");
            overlay.classList.add('opacity-0', 'pointer-events-none');
            sidebar.classList.add('translate-x-full');
            document.body.style.overflow = '';
        }
    },

    refresh: () => {
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
                    <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                        <i class="ph ph-shopping-bag text-4xl"></i>
                    </div>
                    <div class="space-y-2">
                        <p class="text-sm text-gray-900 font-serif">Sepetiniz şu an boş.</p>
                        <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Hemen alışverişe başlayın.</p>
                    </div>
                    <a href="products.html" class="inline-block bg-gray-900 text-white px-8 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-aura-gold transition-all">Koleksiyonu Keşfet</a>
                </div>
            `;
            if (totalPrice) totalPrice.innerText = StoreLogic.formatCurrency(0);
            return;
        }

        list.innerHTML = cart.map((item, index) => {
            return `
                <div class="cart-item group flex items-start space-x-5 py-2">
                    <div class="w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 relative border border-gray-100/50">
                        <img src="${item.image}" class="cart-item-img w-full h-full object-cover">
                        ${item.type === 'configurator' ? `<div class="absolute top-2 left-2 bg-aura-dark text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Özel</div>` : ''}
                    </div>
                    <div class="flex-grow pt-1">
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="text-[11px] font-black text-gray-900 uppercase tracking-tight leading-tight max-w-[150px]">${item.name}</h3>
                            <button onclick="ShopCore.removeFromCartByIndex(${index})" class="text-gray-300 hover:text-red-500 transition-colors p-1">
                                <i class="ph ph-trash text-lg"></i>
                            </button>
                        </div>
                        
                        ${item.config?.sku ? `
                            <p class="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">${item.config.sku}</p>
                        ` : ''}
                        
                        ${item.config?.customDimensions ? `
                            <div class="flex items-center space-x-1.5 text-gray-500 mb-3">
                                <i class="ph ph-ruler text-[10px]"></i>
                                <span class="text-[9px] font-bold uppercase tracking-tighter">${item.config.customDimensions}</span>
                            </div>
                        ` : ''}
                        
                        <div class="flex justify-between items-center mt-auto">
                            <div class="flex items-center bg-gray-50 rounded-full p-0.5 border border-gray-100">
                                 <button onclick="ShopCore.updateCartQtyByIndex(${index}, -1)" class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-aura-dark transition-colors"><i class="ph ph-minus text-[10px]"></i></button>
                                 <span class="w-6 text-center text-[10px] font-black">${item.qty}</span>
                                 <button onclick="ShopCore.updateCartQtyByIndex(${index}, 1)" class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-aura-dark transition-colors"><i class="ph ph-plus text-[10px]"></i></button>
                            </div>
                            <span class="text-sm font-serif text-gray-900 font-bold">${StoreLogic.formatCurrency(item.totalPrice)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (totalPrice) totalPrice.innerText = StoreLogic.formatCurrency(ShopCore.getCartTotal());
    },

    proceedToCheckout: () => {
        const cart = ShopCore.getCart();
        if (cart.length === 0) return;

        let message = `*YENİ SİPARİŞ TALEBİ (AURA PREMIUM)*\n\n`;
        cart.forEach((item, idx) => {
            message += `${idx + 1}. *${item.name.toUpperCase()}*\n`;
            message += `   • Adet: ${item.qty}\n`;
            message += `   • Fiyat: ${StoreLogic.formatCurrency(item.totalPrice)}\n`;
            
            if (item.config) {
                if (item.config.sku) message += `   • SKU: ${item.config.sku}\n`;
                if (item.config.customDimensions) message += `   • Ölçü: ${item.config.customDimensions}\n`;
                
                if (item.type === 'configurator' && item.config.details) {
                    const d = item.config.details;
                    const pCount = d.partitionCount || 0;
                    message += `   • Konfigürasyon: ${pCount} Bölme, Özel Ölçü Üretim\n`;
                }
            }
            message += `\n`;
        });
        message += `-------------------\n`;
        message += `*TOPLAM TUTAR: ${StoreLogic.formatCurrency(ShopCore.getCartTotal())}*`;

        const encoded = encodeURIComponent(message);
        const settings = StoreLogic.getActiveTheme();
        const whatsapp = settings?.footer?.whatsapp 
            ? settings.footer.whatsapp.replace(/\D/g, '') 
            : '905551234567';
            
        window.open(`https://wa.me/${whatsapp}?text=${encoded}`, '_blank');
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', CartUI.init);
} else {
    CartUI.init();
}
