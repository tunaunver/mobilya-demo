/**
 * js/nav-auth.js
 * Dynamically updates the navbar based on authentication state.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial Check
    const user = await AuthManager.getUser();
    // Initial update
    updateNavbar(user);
    
    // Retry a few times in case of dynamic rendering or slow DOM
    let retries = 0;
    const interval = setInterval(() => {
        const authSection = document.getElementById('nav-auth-section');
        if (authSection || retries > 10) {
            clearInterval(interval);
        } else {
            updateNavbar(user);
            retries++;
        }
    }, 200);

    // 2. Listen for changes
    AuthManager.onAuthStateChange((event, session) => {
        updateNavbar(session?.user || null);
    });
});

function updateNavbar(user) {
    // Try to find Theme 1's existing user icon link (title="Üye Girişi" or ph-user icon)
    let authSection = document.getElementById('nav-auth-section');
    
    if (!authSection) {
        // Look for Theme 1 static user link
        // Selector 1: title attribute
        // Selector 2: specific SVG path for user (Theme 1 style)
        // Selector 3: Phosphor icon (Theme 2 style)
        const theme1UserLink = document.querySelector('a[title="Üye Girişi"]') || 
                               Array.from(document.querySelectorAll('a[href="#"] svg path')).find(p => p.getAttribute('d').includes('M16 7'))?.closest('a') ||
                               document.querySelector('a[href="#"] .ph-user')?.parentElement;
        
        if (theme1UserLink) {
            authSection = document.createElement('div');
            authSection.id = 'nav-auth-section';
            authSection.className = theme1UserLink.className + " flex items-center";
            theme1UserLink.parentNode.replaceChild(authSection, theme1UserLink);
        } else {
            // Theme 2 or fallback logic
            const desktopNav = document.querySelector('.hidden.md\\:flex.items-center') || 
                              document.querySelector('.flex.items-center.space-x-6') ||
                              document.querySelector('.hidden.md\\:ml-10.md\\:flex');
            
            if (!desktopNav) return;

            authSection = document.createElement('div');
            authSection.id = 'nav-auth-section';
            authSection.className = 'flex items-center space-x-4 mr-4';
            
            const cartBtn = document.getElementById('cart-toggle-btn') || 
                          desktopNav.querySelector('button') || 
                          desktopNav.querySelector('a[href*="cart"]');
            
            if (cartBtn) {
                desktopNav.insertBefore(authSection, cartBtn);
            } else {
                desktopNav.appendChild(authSection);
            }
        }
    }

    if (user) {
        const initials = user.email.substring(0, 2).toUpperCase();
        authSection.innerHTML = `
            <div class="relative group">
                <button class="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded-full transition-all">
                    <div class="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm group-hover:bg-aura-gold transition-colors">
                        ${initials}
                    </div>
                    <i class="ph ph-caret-down text-[10px] text-gray-400"></i>
                </button>
                <div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] transform translate-y-2 group-hover:translate-y-0">
                    <div class="px-4 py-2 border-b border-gray-50 mb-1">
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hesabım</p>
                        <p class="text-xs text-gray-900 truncate">${user.email}</p>
                    </div>
                    <a href="profile.html" class="block px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">Profil Bilgileri</a>
                    <a href="orders.html" class="block px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">Siparişlerim</a>
                    <button onclick="AuthManager.signOut()" class="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors mt-1 border-t border-gray-50">Çıkış Yap</button>
                </div>
            </div>
        `;
    } else {
        authSection.innerHTML = `
            <a href="login.html" class="relative group p-2 flex items-center justify-center transition-transform hover:scale-110" title="Giriş Yap">
                <i class="ph ph-user text-xl text-gray-900"></i>
            </a>
        `;
    }
}
