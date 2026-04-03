const CartUI = {
    init: () => {
        CartUI.injectLayout();
        CartUI.refresh();
        
        // Listen for internal cart updates
        window.addEventListener('cartUpdated', () => {
            CartUI.refresh();
        });

        // Global click listener for toggling
        document.addEventListener('click', (e) => {
            if (e.target.closest('#cart-toggle-btn') || e.target.closest('.cart-toggle-btn')) {
                CartUI.toggle(true);
            }
            if (e.target.closest('#close-cart-btn') || e.target.id === 'cart-overlay') {
                CartUI.toggle(false);
            }
        });
    },

    injectLayout: () => {
        if (document.getElementById('cart-sidebar-container')) return;

        const html = `
            <!-- Floating Cart Trigger (if needed, or use header icons) -->
            
            <!-- Cart Sidebar Overlay -->
            <div id="cart-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] opacity-0 pointer-events-none transition-opacity duration-500"></div>

            <!-- Cart Sidebar -->
            <div id="cart-sidebar" class="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white z-[101] translate-x-full transition-transform duration-500 shadow-2xl flex flex-col">
                <div class="p-6 md:p-8 flex justify-between items-center border-b border-gray-100">
                    <div>
                        <h2 class="text-2xl font-serif text-gray-900">Alışveriş Sepetim</h2>
                        <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1" id="cart-count-label">0 Ürün</p>
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
                        <span class="text-sm font-bold text-gray-400 uppercase tracking-widest">Toplam Tutar</span>
                        <span id="cart-total-price" class="text-3xl font-serif text-gray-900">₺0.00</span>
                    </div>
                    <button onclick="CartUI.proceedToCheckout()" class="w-full bg-gray-900 text-white font-bold uppercase tracking-[0.2em] text-xs py-5 rounded-xl hover:bg-aura-gold transition-all shadow-lg hover:shadow-aura-gold/20">
                        Siparişi Tamamla (WhatsApp)
                    </button>
                    <p class="text-[10px] text-gray-400 text-center mt-4">KDV Dahildir. Nakliye ve montaj ücretsizdir.</p>
                </div>
            </div>

            <style>
                #cart-sidebar { box-shadow: -20px 0 50px rgba(0,0,0,0.1); }
                .cart-item-img { transition: transform 0.5s ease; }
                .cart-item:hover .cart-item-img { transform: scale(1.05); }
            </style>
        `;

        const container = document.createElement('div');
        container.id = 'cart-sidebar-container';
        container.innerHTML = html;
        document.body.appendChild(container);
    },

    toggle: (isOpen) => {
        const overlay = document.getElementById('cart-overlay');
        const sidebar = document.getElementById('cart-sidebar');
        
        if (isOpen) {
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            sidebar.classList.remove('translate-x-full');
            document.body.style.overflow = 'hidden';
        } else {
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

        // Update all counters in the document (Header icons etc)
        const counters = document.querySelectorAll('.cart-count');
        counters.forEach(c => c.innerText = cart.length);
        if (countLabel) countLabel.innerText = `${cart.length} Ürün`;

        if (!list) return;

        if (cart.length === 0) {
            list.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                    <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                        <i class="ph ph-shopping-bag text-3xl"></i>
                    </div>
                    <p class="text-sm text-gray-500">Sepetiniz şu an boş.</p>
                    <a href="theme2-products.html" class="text-[10px] font-bold uppercase tracking-widest text-aura-gold border-b border-aura-gold pb-1">Alışverişe Başla</a>
                </div>
            `;
            totalPrice.innerText = '₺0.00';
            return;
        }

        list.innerHTML = cart.map((item, index) => {
            const itemKey = item.config?.sku ? `${item.id}-${item.config.sku}` : item.id;
            const cartUID = `item-${index}`; // Unique ID for this specific row
            
            return `
                <div class="cart-item group flex items-center space-x-4 border-b border-gray-50 pb-6 last:border-b-0 last:pb-0">
                    <div class="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                        <img src="${item.image}" class="cart-item-img w-full h-full object-cover">
                        ${item.type === 'configurator' ? `<div class="absolute top-1 right-1 bg-blue-600 text-white text-[6px] font-black px-1 rounded uppercase">Özel</div>` : ''}
                    </div>
                    <div class="flex-grow">
                        <div class="flex justify-between items-start">
                            <h3 class="text-[12px] font-bold text-gray-900 uppercase tracking-tighter leading-tight">${item.name}</h3>
                            <button onclick="ShopCore.removeFromCartByIndex(${index})" class="text-gray-300 hover:text-red-500 transition-colors">
                                <i class="ph ph-trash text-lg"></i>
                            </button>
                        </div>
                        
                        ${item.config?.sku ? `
                            <p class="text-[9px] font-mono text-gray-400 mt-1 uppercase tracking-widest bg-gray-50 inline-block px-1.5 py-0.5 rounded border border-gray-100">${item.config.sku}</p>
                        ` : ''}
                        
                        ${item.config?.customDimensions ? `
                            <p class="text-[8px] text-gray-500 mt-1 font-bold"><i class="ph ph-ruler-light mr-1"></i>${item.config.customDimensions}</p>
                        ` : ''}
                        
                        <div class="flex justify-between items-center mt-3">
                            <div class="flex items-center bg-gray-50 rounded-full px-2 py-1 scale-90 -ml-2">
                                 <button onclick="ShopCore.updateCartQtyByIndex(${index}, -1)" class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-900"><i class="ph ph-minus text-xs"></i></button>
                                 <span class="w-8 text-center text-xs font-bold">${item.qty}</span>
                                 <button onclick="ShopCore.updateCartQtyByIndex(${index}, 1)" class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-900"><i class="ph ph-plus text-xs"></i></button>
                            </div>
                            <span class="text-sm font-bold text-gray-900">${StoreLogic.formatCurrency(item.totalPrice)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        totalPrice.innerText = StoreLogic.formatCurrency(ShopCore.getCartTotal());
    },

    proceedToCheckout: () => {
        const cart = ShopCore.getCart();
        if (cart.length === 0) return;

        let message = `*Yeni Sipariş Talebi*\n\n`;
        cart.forEach((item, idx) => {
            message += `${idx + 1}. *${item.name}* (${item.type === 'modular' ? 'Modüler' : 'Standart'})\n`;
            message += `   Adet: ${item.qty}\n`;
            message += `   Birim Fiyat: ${StoreLogic.formatCurrency(item.totalPrice)}\n`;
            if (item.type === 'modular' && item.config) {
                message += `   _Konfigürasyon:_\n`;
                item.config.modules.forEach(m => {
                    message += `   - ${m.name} (x${m.qty})\n`;
                });
            }
            message += `\n`;
        });
        message += `*Toplam Tutar: ${StoreLogic.formatCurrency(ShopCore.getCartTotal())}*`;

        const encoded = encodeURIComponent(message);
        // Get WhatsApp number from theme settings if possible
        const settings = StoreLogic.getActiveTheme();
        const whatsapp = settings && settings.footer && settings.footer.whatsapp 
            ? settings.footer.whatsapp.replace(/\D/g, '') 
            : '905551234567';
            
        window.open(`https://wa.me/${whatsapp}?text=${encoded}`, '_blank');
    }
};

// Auto-init
document.addEventListener('DOMContentLoaded', CartUI.init);
