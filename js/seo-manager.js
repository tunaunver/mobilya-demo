/**
 * AURA SEO Manager
 * Handles dynamic meta tag injection, JSON-LD structured data,
 * and SEO-related DOM updates.
 */

const SEO_Manager = {
    settings: {
        SITE_TITLE_KEY: 'aura_seo_settings',
        PRODUCT_KEY: 'aura_products',
        CATEGORY_KEY: 'aura_categories'
    },

    init() {
        const globalSettings = this.getGlobalSettings();
        const pageData = this.resolvePageData();
        this.applySEO(globalSettings, pageData);
        this.injectAnalytics(globalSettings.gaId);
    },

    getGlobalSettings() {
        const stored = localStorage.getItem(this.settings.SITE_TITLE_KEY);
        const defaults = {
            siteTitle: 'AURA | Modern & Minimalist Mobilya',
            metaDescription: 'AURA mobilya koleksiyonu ile yaşam alanlarınızı minimalist ve modern bir dokunuşla tasarlayın.',
            metaKeywords: 'mobilya, tasarım, minimalist, modern, aura',
            ogTitle: 'AURA Mobilya',
            ogDescription: 'Modern Tasarım Mobilyalar',
            ogImage: '',
            twitterCard: 'summary_large_image',
            gaId: '',
            gscTag: ''
        };
        return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    },

    resolvePageData() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        const categoryName = urlParams.get('category');
        const slug = urlParams.get('slug');

        // Product Detail Page
        if (productId || (window.location.pathname.includes('detail') && slug)) {
            const products = JSON.parse(localStorage.getItem(this.settings.PRODUCT_KEY) || '[]');
            const product = products.find(p => p.id === productId || p.slug === slug);
            if (product) {
                return {
                    type: 'product',
                    title: product.seoTitle || product.name,
                    description: product.seoDescription || `${product.name} - AURA Modern Mobilya`,
                    image: product.images && product.images[0] ? product.images[0] : '',
                    slug: product.slug,
                    data: product
                };
            }
        }

        // Category Page
        if (categoryName || (window.location.pathname.includes('products') && categoryName)) {
            const categories = JSON.parse(localStorage.getItem(this.settings.CATEGORY_KEY) || '[]');
            const category = categories.find(c => (typeof c === 'string' ? c : c.name) === categoryName);
            if (category && typeof category === 'object') {
                return {
                    type: 'category',
                    title: category.seoTitle || category.name,
                    description: category.seoDescription || `${category.name} Kategorisi - AURA`,
                    slug: category.slug,
                    data: category
                };
            }
        }

        return { type: 'general' };
    },

    applySEO(global, page) {
        // 1. Title
        let finalTitle = global.siteTitle;
        if (page.type === 'product' || page.type === 'category') {
            finalTitle = `${page.title} | ${global.siteTitle.split('|')[0].trim()}`;
        }
        document.title = finalTitle;

        // 2. Meta Tags
        this.setMeta('description', page.description || global.metaDescription);
        this.setMeta('keywords', global.metaKeywords);
        
        // 3. Open Graph
        this.setMeta('og:title', page.title || global.ogTitle, 'property');
        this.setMeta('og:description', page.description || global.ogDescription, 'property');
        this.setMeta('og:image', page.image || global.ogImage, 'property');
        this.setMeta('og:url', window.location.href, 'property');
        this.setMeta('og:type', page.type === 'product' ? 'product' : 'website', 'property');

        // 4. Twitter
        this.setMeta('twitter:card', global.twitterCard);
        this.setMeta('twitter:title', page.title || global.ogTitle);
        this.setMeta('twitter:description', page.description || global.ogDescription);
        this.setMeta('twitter:image', page.image || global.ogImage);

        // 5. Canonical
        this.setCanonical();

        // 6. JSON-LD
        if (page.type === 'product') {
            this.injectProductSchema(page.data);
        } else if (page.type === 'category') {
            this.injectBreadcrumbSchema(page.data);
        }

        // 7. GSC Verification
        if (global.gscTag) {
            this.setMeta('google-site-verification', global.gscTag);
        }
    },

    setMeta(name, content, attr = 'name') {
        if (!content) return;
        let el = document.querySelector(`meta[${attr}="${name}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, name);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    },

    setCanonical() {
        let el = document.querySelector('link[rel="canonical"]');
        if (!el) {
            el = document.createElement('link');
            el.setAttribute('rel', 'canonical');
            document.head.appendChild(el);
        }
        el.setAttribute('href', window.location.href.split('?')[0]);
    },

    injectProductSchema(product) {
        const schema = {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": product.images || [],
            "description": product.seoDescription || product.name,
            "sku": product.id,
            "offers": {
                "@type": "Offer",
                "url": window.location.href,
                "priceCurrency": "TRY",
                "price": product.price,
                "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
        };
        this.injectJSONLD(schema, 'product-schema');
    },

    injectBreadcrumbSchema(category) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [{
                "@type": "ListItem",
                "position": 1,
                "name": "Ana Sayfa",
                "item": window.location.origin + "/index.html"
            }, {
                "@type": "ListItem",
                "position": 2,
                "name": category.name,
                "item": window.location.href
            }]
        };
        this.injectJSONLD(schema, 'breadcrumb-schema');
    },

    injectJSONLD(data, id) {
        let el = document.getElementById(id);
        if (el) el.remove();
        el = document.createElement('script');
        el.id = id;
        el.type = 'application/ld+json';
        el.text = JSON.stringify(data);
        document.head.appendChild(el);
    },

    injectAnalytics(gaId) {
        if (!gaId || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;
        
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', gaId);
    }
};

// Auto-init on DOM load
document.addEventListener('DOMContentLoaded', () => SEO_Manager.init());
