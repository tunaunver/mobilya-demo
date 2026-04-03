
        // ═══════════════════════════════════════════════════════════════
        //  LIGHTBOX LOGIC
        // ═══════════════════════════════════════════════════════════════
        function openLightbox(src) {
            const modal = document.getElementById('lightbox-modal');
            const img = document.getElementById('lightbox-img');
            img.src = src;
            modal.classList.remove('opacity-0', 'pointer-events-none');
            document.body.classList.add('modal-active');
            setTimeout(() => img.classList.replace('scale-95', 'scale-100'), 10);
        }

        function closeLightbox() {
            const modal = document.getElementById('lightbox-modal');
            const img = document.getElementById('lightbox-img');
            img.classList.replace('scale-100', 'scale-95');
            modal.classList.add('opacity-0', 'pointer-events-none');
            document.body.classList.remove('modal-active');
        }

        // ═══════════════════════════════════════════════════════════════
        //  GLOBAL TOAST NOTIFICATION
        // ═══════════════════════════════════════════════════════════════
        function showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            const bgColor = type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700';
            const icon = type === 'success' ? 'ph-check-circle' : 'ph-warning-circle';

            toast.className = `flex items-center gap-2 px-4 py-3 border rounded-lg shadow-lg pointer-events-auto transform transition-all duration-300 translate-y-full opacity-0 ${bgColor}`;
            toast.innerHTML = `<i class="ph ${icon} text-lg"></i> <span class="text-sm font-medium">${message}</span>`;

            container.appendChild(toast);

            // Animate in
            requestAnimationFrame(() => {
                toast.classList.remove('translate-y-full', 'opacity-0');
                toast.classList.add('translate-y-0', 'opacity-100');
            });

            // Animate out and remove
            setTimeout(() => {
                toast.classList.remove('translate-y-0', 'opacity-100');
                toast.classList.add('translate-y-full', 'opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // ═══════════════════════════════════════════════════════════════
        //  CATEGORY STORE & LOGIC
        // ═══════════════════════════════════════════════════════════════
        const CATEGORY_STORE_KEY = 'aura_categories';
        const DEFAULT_CATEGORIES = [
            { name: 'Oturma Grupları', seoTitle: '', seoDescription: '', slug: 'oturma-gruplari' },
            { name: 'Masalar', seoTitle: '', seoDescription: '', slug: 'masalar' },
            { name: 'Aydınlatma', seoTitle: '', seoDescription: '', slug: 'aydinlatma' },
            { name: 'Aksesuarlar', seoTitle: '', seoDescription: '', slug: 'aksesuarlar' }
        ];

        function getCategories() {
            const stored = localStorage.getItem(CATEGORY_STORE_KEY);
            let cats = stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
            // Migration / normalization to include IDs and structural integrity
            let modified = false;
            const updated = cats.map(cat => {
                let obj = typeof cat === 'string' ? { name: cat } : { ...cat };
                if (!obj.id) {
                    obj.id = 'cat_' + Math.random().toString(36).substr(2, 9);
                    modified = true;
                }
                if (obj.parentId === undefined) {
                    obj.parentId = null;
                    modified = true;
                }
                if (!obj.slug) {
                    obj.slug = obj.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
                    modified = true;
                }
                return obj;
            });
            if (modified) {
                localStorage.setItem(CATEGORY_STORE_KEY, JSON.stringify(updated));
            }
            return updated;
        }

        function getCategoryTree(categories, parentId = null, level = 0) {
            let result = [];
            categories.filter(c => c.parentId === parentId).forEach(c => {
                result.push({ ...c, level });
                const children = getCategoryTree(categories, c.id, level + 1);
                result.push(...children);
            });
            return result;
        }

        function saveCategories(categories) {
            localStorage.setItem(CATEGORY_STORE_KEY, JSON.stringify(categories));
            renderCategoryList();
            renderCategoryDropdowns();
        }

        function renderCategoryList() {
            const tbody = document.getElementById('categories-table-body');
            if (!tbody) return;
            const categories = getCategories();
            const tree = getCategoryTree(categories);

            if (!tree.length) {
                tbody.innerHTML = `<tr><td colspan="2" class="px-6 py-4 text-center text-gray-500">Hiç kategori bulunmuyor.</td></tr>`;
                return;
            }

            tbody.innerHTML = tree.map((cat, index) => {
                const indent = '&nbsp;'.repeat(cat.level * 6);
                const prefix = cat.level > 0 ? '<span class="text-gray-300 mr-2">└─</span>' : '';
                return `
                <tr>
                    <td class="px-6 py-4">
                        <div class="flex items-center">
                            <span class="text-gray-400 font-mono text-[10px] mr-4 w-4">${index + 1}</span>
                            <div style="margin-left: ${cat.level * 24}px" class="flex flex-col">
                                <div class="font-bold text-gray-900 flex items-center">
                                    ${prefix}${cat.name}
                                    ${cat.level === 0 ? '<span class="ml-2 px-1.5 py-0.5 bg-gray-100 text-[8px] rounded text-gray-400 uppercase tracking-tighter">Ana</span>' : ''}
                                </div>
                                <div class="text-[10px] text-gray-400 font-mono">/${cat.slug}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="openEditCategoryModal('${cat.id}')" class="text-gray-400 hover:text-gray-900 transition-colors mr-3" title="Düzenle">
                            <i class="ph ph-sliders text-lg"></i>
                        </button>
                        <button onclick="deleteCategory('${cat.id}')" class="text-gray-400 hover:text-red-600 transition-colors" title="Sil">
                            <i class="ph ph-trash text-lg"></i>
                        </button>
                    </td>
                </tr>
            `}).join('');
        }

        function renderCategoryDropdowns() {
            const categories = getCategories();
            const tree = getCategoryTree(categories);

            const buildOptions = (withEmpty = false, emptyLabel = "Seçiniz") => {
                let html = withEmpty ? `<option value="">${emptyLabel}</option>` : '';
                tree.forEach(cat => {
                    const prefix = '— '.repeat(cat.level);
                    html += `<option value="${cat.name}">${prefix}${cat.name}</option>`;
                });
                return html;
            };

            const buildIdOptions = (withEmpty = false, emptyLabel = "Seçiniz") => {
                let html = withEmpty ? `<option value="">${emptyLabel}</option>` : '';
                tree.forEach(cat => {
                    const prefix = '— '.repeat(cat.level);
                    html += `<option value="${cat.id}">${prefix}${cat.name}</option>`;
                });
                return html;
            };

            const filterCat = document.getElementById('product-filter-cat');
            if (filterCat) filterCat.innerHTML = buildOptions(true, "Tüm Kategoriler");

            const newCat = document.getElementById('new-category');
            if (newCat) newCat.innerHTML = buildOptions(true, "Seçiniz");

            const editCat = document.getElementById('edit-category');
            if (editCat) editCat.innerHTML = buildOptions();

            // New Parent dropdowns
            const newParent = document.getElementById('new-category-parent');
            if (newParent) newParent.innerHTML = buildIdOptions(true, "Yok (Ana Kategori)");

            const editParent = document.getElementById('edit-category-parent');
            if (editParent) editParent.innerHTML = buildIdOptions(true, "Yok (Ana Kategori)");
        }

        function openEditCategoryModal(id) {
            const categories = getCategories();
            const cat = categories.find(c => c.id === id);
            if (!cat) return;

            document.getElementById('edit-category-id').value = cat.id;
            document.getElementById('edit-category-name').value = cat.name;
            document.getElementById('edit-category-slug').value = cat.slug || '';
            document.getElementById('edit-category-parent').value = cat.parentId || '';
            document.getElementById('edit-category-seo-title').value = cat.seoTitle || '';
            document.getElementById('edit-category-seo-desc').value = cat.seoDescription || '';

            // Prevent assigning self or children as parent (to prevent loops)
            const parentSelect = document.getElementById('edit-category-parent');
            const getDescendants = (cats, pid) => {
                let res = [];
                cats.filter(c => c.parentId === pid).forEach(c => {
                    res.push(c.id);
                    res.push(...getDescendants(cats, c.id));
                });
                return res;
            };
            const illegalIds = [cat.id, ...getDescendants(categories, cat.id)];

            Array.from(parentSelect.options).forEach(opt => {
                opt.disabled = illegalIds.includes(opt.value);
            });

            const modal = document.getElementById('edit-category-modal');
            modal.classList.remove('pointer-events-none', 'opacity-0');
            modal.querySelector('.modal-content').classList.remove('scale-95');
        }

        function closeEditCategoryModal() {
            const modal = document.getElementById('edit-category-modal');
            modal.classList.add('pointer-events-none', 'opacity-0');
            modal.querySelector('.modal-content').classList.add('scale-95');
        }

        document.getElementById('edit-category-form')?.addEventListener('submit', function (e) {
            e.preventDefault();
            const id = document.getElementById('edit-category-id').value;
            const newName = document.getElementById('edit-category-name').value.trim();
            const newParentId = document.getElementById('edit-category-parent').value;
            const newSlug = document.getElementById('edit-category-slug').value.trim();
            const newSeoTitle = document.getElementById('edit-category-seo-title').value.trim();
            const newSeoDesc = document.getElementById('edit-category-seo-desc').value.trim();

            let categories = getCategories();
            const catIndex = categories.findIndex(c => c.id === id);
            if (catIndex === -1) return;

            const oldName = categories[catIndex].name;

            if (newName !== oldName && categories.some(c => c.name === newName)) {
                alert('Bu kategori adı zaten mevcut.');
                return;
            }

            // Sync products if name changed
            if (newName !== oldName) {
                let products = getProducts() || [];
                let productsChanged = false;
                products.forEach(p => {
                    if (p.category === oldName) {
                        p.category = newName;
                        productsChanged = true;
                    }
                });
                if (productsChanged) saveProducts(products);
            }

            categories[catIndex] = {
                ...categories[catIndex],
                name: newName,
                parentId: newParentId || null,
                slug: newSlug || newName.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, ''),
                seoTitle: newSeoTitle,
                seoDescription: newSeoDesc
            };

            saveCategories(categories);
            closeEditCategoryModal();
            showToast('Kategori başarıyla güncellendi.');
        });

        function deleteCategory(id) {
            let categories = getCategories();
            const cat = categories.find(c => c.id === id);
            if (!cat) return;

            const children = categories.filter(c => c.parentId === id);
            if (children.length > 0) {
                alert(`Bu kategori silinemez çünkü ${children.length} alt kategorisi bulunmaktadır. Önce alt kategorileri silin veya başka bir kategoriye taşıyın.`);
                return;
            }

            const products = getProducts() || [];
            const usedBy = products.filter(p => p.category === cat.name);

            if (usedBy.length > 0) {
                alert(`Bu kategori silinemez çünkü ${usedBy.length} ürün tarafından kullanılmaktadır.`);
                return;
            }

            if (!confirm(`"${cat.name}" kategorisini silmek istediğinizden emin misiniz?`)) return;

            categories = categories.filter(c => c.id !== id);
            saveCategories(categories);
        }

        document.getElementById('add-category-form')?.addEventListener('submit', function (e) {
            e.preventDefault();
            const nameInput = document.getElementById('new-category-name');
            const parentInput = document.getElementById('new-category-parent');
            const titleInput = document.getElementById('new-category-seo-title');
            const slugInput = document.getElementById('new-category-slug');
            const descInput = document.getElementById('new-category-seo-desc');

            const newName = nameInput.value.trim();
            if (!newName) return;

            const categories = getCategories();
            if (categories.some(c => c.name === newName)) {
                alert('Bu kategori zaten mevcut.');
                return;
            }

            const newCat = {
                id: 'cat_' + Math.random().toString(36).substr(2, 9),
                name: newName,
                parentId: parentInput.value || null,
                seoTitle: titleInput.value.trim(),
                slug: slugInput.value.trim() || newName.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, ''),
                seoDescription: descInput.value.trim()
            };

            categories.push(newCat);
            saveCategories(categories);
            
            // Reset
            nameInput.value = '';
            parentInput.value = '';
            titleInput.value = '';
            slugInput.value = '';
            descInput.value = '';
            
            showToast('Kategori başarıyla eklendi.');
        });

        // Initialize Categories on load
        document.addEventListener('DOMContentLoaded', () => {
            if (!localStorage.getItem(CATEGORY_STORE_KEY)) {
                saveCategories(DEFAULT_CATEGORIES);
            } else {
                renderCategoryList();
                renderCategoryDropdowns();
            }
        });


        // ═══════════════════════════════════════════════════════════════
        //  DATA STORE  –  localStorage key: 'aura_products'
        // ═══════════════════════════════════════════════════════════════
        const STORE_KEY = 'aura_products';

        const SEED_PRODUCTS = [
            { id: "1", name: "Nosh Sandalye", category: "Oturma Grupları", price: 450.00, stock: 12, images: ["https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=600"], isNew: true },
            { id: "2", name: "Meşe Yemek Masası", category: "Masalar", price: 1200.00, stock: 5, images: ["https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=600"], isNew: false },
            { id: "3", name: "Bulut Koltuk", category: "Oturma Grupları", price: 2450.00, stock: 0, images: ["https://images.unsplash.com/photo-1507133750070-4ed3b22e17e6?auto=format&fit=crop&q=80&w=600"], isNew: false },
            { id: "4", name: "Pirinç Zemin Lambası", category: "Aydınlatma", price: 320.00, stock: 15, images: ["https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=600"], isNew: false },
            { id: "5", name: "Ceviz Konsol", category: "Masalar", price: 1850.00, stock: 2, images: ["https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&q=80&w=600"], isNew: false },
            { id: "6", name: "Bar Taburesi", category: "Oturma Grupları", price: 280.00, stock: 20, images: ["https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&q=80&w=600"], isNew: false }
        ];

        function getProducts() {
            return ShopCore.getProducts();
        }

        function saveProducts(products) {
            ShopCore.saveProducts(products);
        }

        function nextId(products) {
            if (!products.length) return '1';
            const max = Math.max(...products.map(p => parseInt(p.id) || 0));
            return String(max + 1);
        }

        // Seed from JSON on first load (or if localStorage is empty)
        async function seedFromJson() {
            if (getProducts()) return; // already seeded
            try {
                const res = await fetch('data/products.json');
                if (res.ok) {
                    saveProducts(await res.json());
                } else {
                    saveProducts(SEED_PRODUCTS);
                }
            } catch {
                saveProducts(SEED_PRODUCTS);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        //  TAB NAVIGATION & UNSAVED CHANGES
        // ═══════════════════════════════════════════════════════════════
        const navItems = document.querySelectorAll('.nav-item[data-target]');
        const views = document.querySelectorAll('.view-section');
        const pageTitle = document.getElementById('page-title');

        let hasUnsavedChanges = false;

        function markAsChanged() {
            hasUnsavedChanges = true;
        }

        function markAsSaved() {
            hasUnsavedChanges = false;
        }

        function switchTab(targetId) {
            // If there are unsaved changes, show the custom modal
            if (hasUnsavedChanges) {
                showUnsavedModal(targetId);
                return;
            }

            navItems.forEach(item => {
                item.classList.toggle('active', item.dataset.target === targetId);
                if (item.dataset.target === targetId) pageTitle.textContent = item.textContent.trim();
            });
            views.forEach(v => v.classList.toggle('hidden', v.id !== 'view-' + targetId));

            // Refresh product table whenever the products tab is opened
            if (targetId === 'products') renderProductTable();
            if (targetId === 'orders') renderOrderTable();
            if (targetId === 'seo') populateSeoForm();
            if (targetId === 'users') renderUsersTable();
            if (targetId === 'blog') renderBlogTable();
        }

        // ═══════════════════════════════════════════════════════════════
        //  USER MANAGEMENT (LOCAL MYSQL PROFILES)
        // ═══════════════════════════════════════════════════════════════
        async function renderUsersTable() {
            const tbody = document.getElementById('users-table-body');
            if (!tbody) return;
            tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-10 text-center text-gray-400">Yükleniyor...</td></tr>`;

            try {
                // Fetch from profiles table via local API
                const profiles = await AuthManager.getProfiles();
                
                if (!profiles || profiles.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-10 text-center text-gray-400">Kayıtlı kullanıcı bulunmuyor.</td></tr>`;
                    return;
                }

                tbody.innerHTML = profiles.map(u => `
                    <tr>
                        <td class="px-6 py-4">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                                    ${u.email ? u.email.substring(0, 2).toUpperCase() : '??'}
                                </div>
                                <div>
                                    <p class="text-sm font-bold text-gray-900">${u.email || 'Email Yok'}</p>
                                    <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">ID: ${(u.id || '').substring(0, 8)}...</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-xs text-gray-500">
                            ${u.created_at ? new Date(u.created_at).toLocaleString('tr-TR') : 'Bilinmiyor'}
                        </td>
                        <td class="px-6 py-4 text-right">
                            <button onclick="handleUserIntervention('${u.id}')" class="text-gray-400 hover:text-gray-900 transition-colors mr-3" title="Müdahale Et">
                                <i class="ph ph-hand-pointing text-lg"></i>
                            </button>
                            <button onclick="deleteUser('${u.id}')" class="text-gray-400 hover:text-red-600 transition-colors" title="Sil">
                                <i class="ph ph-trash text-lg"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            } catch (err) {
                console.error("Users load error", err);
                tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-10 text-center text-red-400">Hata: ${err.message}</td></tr>`;
            }
        }

        async function deleteUser(id) {
            if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;
            
            try {
                const { error } = await AuthManager.deleteProfile(id);
                if (error) throw error;
                showToast('Kullanıcı profil kaydı silindi.');
                renderUsersTable();
            } catch (err) {
                alert("Hata: " + err.message);
            }
        }

        function handleUserIntervention(id) {
            alert(`Kullanıcı (#${id.substring(0,8)}) için müdahale arayüzü yakında eklenecektir.`);
        }

        // ═══════════════════════════════════════════════════════════════
        //  BLOG MANAGEMENT
        // ═══════════════════════════════════════════════════════════════
        const BLOG_STORE_KEY = 'aura_blog_posts';

        function getBlogPosts() {
            const stored = localStorage.getItem(BLOG_STORE_KEY);
            return stored ? JSON.parse(stored) : [];
        }

        function saveBlogPosts(posts) {
            localStorage.setItem(BLOG_STORE_KEY, JSON.stringify(posts));
            renderBlogTable();
        }

        function renderBlogTable() {
            const tbody = document.getElementById('blog-table-body');
            if (!tbody) return;
            const posts = getBlogPosts();

            if (!posts.length) {
                tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-10 text-center text-gray-400">Henüz blog yazısı bulunmuyor.</td></tr>`;
                return;
            }

            tbody.innerHTML = posts.map(p => `
                <tr>
                    <td class="px-6 py-4 text-sm font-bold text-gray-900">${p.title}</td>
                    <td class="px-6 py-4 text-xs text-gray-500">${new Date(p.date).toLocaleDateString('tr-TR')}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 ${p.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'} rounded-full text-[10px] font-bold uppercase tracking-widest">
                            ${p.status === 'published' ? 'Yayında' : 'Taslak'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="openBlogModal('${p.id}')" class="text-gray-400 hover:text-gray-900 transition-colors mr-3">
                            <i class="ph ph-article text-lg"></i>
                        </button>
                        <button onclick="deleteBlogPost('${p.id}')" class="text-gray-400 hover:text-red-600 transition-colors">
                            <i class="ph ph-trash text-lg"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        function openBlogModal(id = null) {
            const modal = document.getElementById('blog-modal');
            const form = document.getElementById('blog-form');
            form.reset();
            document.getElementById('blog-id').value = '';
            document.getElementById('blog-modal-title').innerText = 'Yeni Blog Yazısı';

            if (id) {
                const posts = getBlogPosts();
                const post = posts.find(p => p.id === id);
                if (post) {
                    document.getElementById('blog-id').value = post.id;
                    document.getElementById('blog-title').value = post.title;
                    document.getElementById('blog-summary').value = post.summary || '';
                    document.getElementById('blog-content').value = post.content || '';
                    document.getElementById('blog-image').value = post.image || '';
                    document.getElementById('blog-status').value = post.status || 'published';
                    document.getElementById('blog-modal-title').innerText = 'Yazıyı Düzenle';
                }
            }

            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.querySelector('.modal-content').classList.remove('scale-95');
        }

        function closeBlogModal() {
            const modal = document.getElementById('blog-modal');
            modal.classList.add('opacity-0', 'pointer-events-none');
            modal.querySelector('.modal-content').classList.add('scale-95');
        }

        document.getElementById('blog-form')?.addEventListener('submit', e => {
            e.preventDefault();
            const id = document.getElementById('blog-id').value;
            const title = document.getElementById('blog-title').value;
            const summary = document.getElementById('blog-summary').value;
            const content = document.getElementById('blog-content').value;
            const image = document.getElementById('blog-image').value;
            const status = document.getElementById('blog-status').value;

            const posts = getBlogPosts();
            if (id) {
                const idx = posts.findIndex(p => p.id === id);
                if (idx > -1) {
                    posts[idx] = { ...posts[idx], title, summary, content, image, status, updatedAt: new Date().toISOString() };
                }
            } else {
                posts.push({
                    id: 'blog_' + Date.now(),
                    title, summary, content, image, status,
                    date: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            saveBlogPosts(posts);
            closeBlogModal();
            showToast('Blog yazısı kaydedildi.');
        });

        function deleteBlogPost(id) {
            if (!confirm('Bu yazıyı silmek istediğinizden emin misiniz?')) return;
            const posts = getBlogPosts().filter(p => p.id !== id);
            saveBlogPosts(posts);
            showToast('Blog yazısı silindi.');
        }

        // ═══════════════════════════════════════════════════════════════
        //  SEO SETTINGS LOGIC
        // ═══════════════════════════════════════════════════════════════
        const SEO_STORE_KEY = 'aura_seo_settings';
        
        const DEFAULT_SEO_SETTINGS = {
            siteTitle: 'AURA | Modern & Minimalist Mobilya Tasarımı',
            metaDescription: 'AURA, modern ve minimalist mobilya tasarımlarıyla yaşam alanlarınıza ruh katar. Kaliteli işçilik ve zamansız estetik.',
            metaKeywords: 'mobilya, modern tasarım, minimalist mobilya, lüks mobilya, istanbul mobilya',
            favicon: '',
            ogTitle: 'AURA Mobilya',
            ogDescription: 'Modern ve Minimalist Mobilya Tasarımı',
            ogImage: '',
            twitterCard: 'summary_large_image',
            gaId: '',
            gscTag: ''
        };

        function getSeoSettings() {
            const stored = localStorage.getItem(SEO_STORE_KEY);
            return stored ? { ...DEFAULT_SEO_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SEO_SETTINGS;
        }

        function saveSeoSettings(settings) {
            localStorage.setItem(SEO_STORE_KEY, JSON.stringify(settings));
        }

        function populateSeoForm() {
            const s = getSeoSettings();
            document.getElementById('seo-site-title').value = s.siteTitle || '';
            document.getElementById('seo-meta-desc').value = s.metaDescription || '';
            document.getElementById('seo-meta-keywords').value = s.metaKeywords || '';
            document.getElementById('seo-favicon').value = s.favicon || '';
            document.getElementById('seo-og-title').value = s.ogTitle || '';
            document.getElementById('seo-twitter-card').value = s.twitterCard || 'summary_large_image';
            document.getElementById('seo-og-desc').value = s.ogDescription || '';
            document.getElementById('seo-og-image').value = s.ogImage || '';
            document.getElementById('seo-ga-id').value = s.gaId || '';
            document.getElementById('seo-gsc-tag').value = s.gscTag || '';
        }

        document.getElementById('seo-settings-form')?.addEventListener('submit', e => {
            e.preventDefault();
            const settings = {
                siteTitle: document.getElementById('seo-site-title').value,
                metaDescription: document.getElementById('seo-meta-desc').value,
                metaKeywords: document.getElementById('seo-meta-keywords').value,
                favicon: document.getElementById('seo-favicon').value,
                ogTitle: document.getElementById('seo-og-title').value,
                twitterCard: document.getElementById('seo-twitter-card').value,
                ogDescription: document.getElementById('seo-og-desc').value,
                ogImage: document.getElementById('seo-og-image').value,
                gaId: document.getElementById('seo-ga-id').value,
                gscTag: document.getElementById('seo-gsc-tag').value
            };
            saveSeoSettings(settings);
            showToast('SEO ayarları kaydedildi.');
        });
        
        document.getElementById('seo-og-input')?.addEventListener('change', async e => {
            if (e.target.files && e.target.files[0]) {
                const b64 = await fileToBase64(e.target.files[0]);
                document.getElementById('seo-og-image').value = b64;
                e.target.value = '';
            }
        });

        // Placeholder for future implementation
        function generateSitemap() {
            const products = getProducts() || [];
            const categories = getCategories();
            
            let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
            
            // Static pages
            xml += `  <url><loc>${window.location.origin}/index.html</loc><priority>1.0</priority></url>\n`;
            xml += `  <url><loc>${window.location.origin}/products.html</loc><priority>0.8</priority></url>\n`;
            
            // Categories
            categories.forEach(cat => {
                xml += `  <url><loc>${window.location.origin}/products.html?category=${encodeURIComponent(cat.name)}</loc><priority>0.7</priority></url>\n`;
            });
            
            // Products
            products.forEach(p => {
                const slug = p.slug || p.id;
                xml += `  <url><loc>${window.location.origin}/product-detail.html?id=${p.id}&amp;slug=${slug}</loc><priority>0.6</priority></url>\n`;
            });
            
            xml += `</urlset>`;
            
            downloadFile('sitemap.xml', xml);
        }

        function generateRobots() {
            const txt = `User-agent: *\nAllow: /\nSitemap: ${window.location.origin}/sitemap.xml`;
            downloadFile('robots.txt', txt);
        }

        function downloadFile(filename, content) {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }

        window.addEventListener('beforeunload', (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        navItems.forEach(item => item.addEventListener('click', e => {
            e.preventDefault();
            switchTab(item.dataset.target);
        }));

        // ═══════════════════════════════════════════════════════════════
        //  ORDER STORE & LOGIC
        // ═══════════════════════════════════════════════════════════════
        const ORDER_STORE_KEY = 'aura_orders';

        function getOrders() {
            const stored = localStorage.getItem(ORDER_STORE_KEY);
            return stored ? JSON.parse(stored) : [];
        }

        function saveOrders(orders) {
            localStorage.setItem(ORDER_STORE_KEY, JSON.stringify(orders));
        }

        function renderOrderTable() {
            const tbody = document.getElementById('admin-orders-table');
            const searchVal = (document.getElementById('order-search').value || '').toLowerCase();
            const filterStatus = document.getElementById('order-filter-status').value;

            let orders = getOrders();

            if (filterStatus) orders = orders.filter(o => o.status === filterStatus);
            if (searchVal) orders = orders.filter(o => o.customer.toLowerCase().includes(searchVal) || o.id.toLowerCase().includes(searchVal));

            if (!orders.length) {
                tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-10 text-center text-gray-400">Sipariş bulunamadı.</td></tr>`;
                return;
            }

            tbody.innerHTML = orders.map(o => {
                let statusColor = 'gray';
                if (o.status === 'Hazırlanıyor') statusColor = 'yellow';
                else if (o.status === 'Kargoda') statusColor = 'blue';
                else if (o.status === 'Tamamlandı') statusColor = 'green';
                else if (o.status === 'İptal Edildi') statusColor = 'red';

                return `
            <tr>
                <td class="px-6 py-4 font-medium text-gray-900">${o.id}</td>
                <td class="px-6 py-4">${o.customer}</td>
                <td class="px-6 py-4 text-gray-500">${new Date(o.date).toLocaleDateString('tr-TR')}</td>
                <td class="px-6 py-4 font-medium">₺${o.total.toFixed(2)}</td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 bg-${statusColor}-50 text-${statusColor}-700 rounded-full text-xs font-medium border border-${statusColor}-200">${o.status}</span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick="viewOrderDetail('${o.id}')" class="text-blue-600 hover:underline font-medium text-xs mr-3">Detay</button>
                    <select onchange="updateOrderStatus('${o.id}', this.value)" class="text-xs border border-gray-200 rounded p-1 bg-white focus:outline-none">
                        <option value="Hazırlanıyor" ${o.status === 'Hazırlanıyor' ? 'selected' : ''}>Hazırlanıyor</option>
                        <option value="Kargoda" ${o.status === 'Kargoda' ? 'selected' : ''}>Kargoda</option>
                        <option value="Tamamlandı" ${o.status === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option>
                        <option value="İptal Edildi" ${o.status === 'İptal Edildi' ? 'selected' : ''}>İptal</option>
                    </select>
                </td>
            </tr>
        `;
            }).join('');
        }

        function viewOrderDetail(id) {
            const orders = getOrders();
            const order = orders.find(o => o.id === id);
            if (!order) return;

            document.getElementById('order-detail-id').textContent = order.id;
            const content = document.getElementById('order-detail-content');

            content.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Müşteri Bilgileri</h4>
                <div class="space-y-2 text-sm">
                    <p><span class="text-gray-500">Ad Soyad:</span> ${order.customer}</p>
                    <p><span class="text-gray-500">Telefon:</span> ${order.contact.phone}</p>
                    <p><span class="text-gray-500">E-posta:</span> ${order.contact.email}</p>
                    <p><span class="text-gray-500">Adres:</span> ${order.contact.address}</p>
                </div>
            </div>
            <div>
                <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Sipariş Özeti</h4>
                <div class="space-y-2 text-sm">
                    <p><span class="text-gray-500">Tarih:</span> ${new Date(order.date).toLocaleDateString('tr-TR')}</p>
                    <p><span class="text-gray-500">Toplam Tutar:</span> <span class="font-bold text-gray-900 text-lg">₺${order.total.toFixed(2)}</span></p>
                    <p><span class="text-gray-500">Durum:</span> ${order.status}</p>
                </div>
            </div>
        </div>
        
        <div>
            <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Ürünler</h4>
            <div class="border border-gray-100 rounded-xl overflow-hidden">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                        <tr>
                            <th class="px-4 py-3">Ürün Adı</th>
                            <th class="px-4 py-3">Adet</th>
                            <th class="px-4 py-3">Fiyat</th>
                            <th class="px-4 py-3 text-right">Toplam</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${order.items.map(item => `
                            <tr>
                                <td class="px-4 py-3 font-medium text-gray-900">${item.name}</td>
                                <td class="px-4 py-3">${item.quantity}</td>
                                <td class="px-4 py-3">₺${item.price.toFixed(2)}</td>
                                <td class="px-4 py-3 text-right font-bold">₺${(item.quantity * item.price).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

            const modal = document.getElementById('order-detail-modal');
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.querySelector('.modal-content').classList.remove('scale-95');
            modal.querySelector('.modal-content').classList.add('scale-100');
            document.body.classList.add('modal-active');
        }

        function closeOrderDetailModal() {
            const modal = document.getElementById('order-detail-modal');
            modal.classList.add('opacity-0', 'pointer-events-none');
            modal.querySelector('.modal-content').classList.add('scale-95');
            modal.querySelector('.modal-content').classList.remove('scale-100');
            document.body.classList.remove('modal-active');
        }

        function updateOrderStatus(id, newStatus) {
            const orders = getOrders();
            const idx = orders.findIndex(o => o.id === id);
            if (idx > -1) {
                orders[idx].status = newStatus;
                saveOrders(orders);
                renderOrderTable();
                renderDashboard(); // Synchronize dashboard
                showToast(`Sipariş #${id} durumu "${newStatus}" olarak güncellendi.`);
            }
        }

        function renderDashboard() {
            const orders = getOrders();
            const products = getProducts() || [];
            const categories = getCategories();

            // 1. Summary Cards
            const totalSales = orders
                .filter(o => o.status === 'Tamamlandı')
                .reduce((sum, o) => sum + o.total, 0);

            const salesEl = document.getElementById('dash-total-sales');
            if (salesEl) salesEl.textContent = `₺${totalSales.toLocaleString('tr-TR')}`;

            const ordersEl = document.getElementById('dash-total-orders');
            if (ordersEl) ordersEl.textContent = orders.length;

            const productsEl = document.getElementById('dash-product-count');
            if (productsEl) productsEl.textContent = products.length;

            const catsEl = document.getElementById('dash-category-count');
            if (catsEl) catsEl.textContent = categories.length;

            // 2. Recent Orders Table
            const dashTbody = document.getElementById('dash-orders-table');
            if (!dashTbody) return;

            if (!orders.length) {
                dashTbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">Henüz sipariş yok.</td></tr>`;
                return;
            }

            // Show last 5 orders
            const recentOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

            dashTbody.innerHTML = recentOrders.map(o => {
                let statusColor = 'gray';
                if (o.status === 'Hazırlanıyor') statusColor = 'yellow';
                else if (o.status === 'Kargoda') statusColor = 'blue';
                else if (o.status === 'Tamamlandı') statusColor = 'green';
                else if (o.status === 'İptal Edildi') statusColor = 'red';

                return `
            <tr>
                <td class="px-6 py-4 font-medium text-gray-900">${o.id}</td>
                <td class="px-6 py-4">${o.customer}</td>
                <td class="px-6 py-4 text-gray-500">${new Date(o.date).toLocaleDateString('tr-TR')}</td>
                <td class="px-6 py-4 font-medium">₺${o.total.toFixed(2)}</td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 bg-${statusColor}-50 text-${statusColor}-700 rounded-full text-xs font-medium border border-${statusColor}-200">${o.status}</span>
                </td>
            </tr>
        `;
            }).join('');
        }

        document.getElementById('order-search')?.addEventListener('input', renderOrderTable);
        document.getElementById('order-filter-status')?.addEventListener('change', renderOrderTable);

        // ═══════════════════════════════════════════════════════════════
        //  PRODUCT TABLE
        // ═══════════════════════════════════════════════════════════════
        function resetProductFilters() {
            document.getElementById('product-search').value = '';
            document.getElementById('product-filter-cat').value = '';
            renderProductTable();
        }

        function renderProductTable() {
            const tbody = document.getElementById('admin-products-table');
            const searchVal = (document.getElementById('product-search').value || '').toLowerCase();
            const filterCat = document.getElementById('product-filter-cat').value;
            const filterStatus = document.getElementById('product-filter-status');
            const filterBadges = document.getElementById('filter-badges');

            let products = getProducts() || [];

            // Update UI feedback
            if (searchVal || filterCat) {
                filterStatus.classList.remove('hidden');
                filterStatus.classList.add('flex');
                let badges = '';
                if (searchVal) {
                    badges += `<span class="px-2 py-1 bg-white text-gray-700 rounded-md text-[10px] font-bold border border-gray-200 flex items-center gap-1.5 shadow-sm">
                        <i class="ph ph-magnifying-glass text-gray-400"></i> "${searchVal}"
                    </span>`;
                }
                if (filterCat) {
                    badges += `<span class="px-2 py-1 bg-white text-gray-700 rounded-md text-[10px] font-bold border border-gray-200 flex items-center gap-1.5 shadow-sm">
                        <i class="ph ph-tag text-gray-400"></i> ${filterCat}
                    </span>`;
                }
                filterBadges.innerHTML = badges;
            } else {
                filterStatus.classList.add('hidden');
                filterStatus.classList.remove('flex');
            }

            if (filterCat) products = products.filter(p => p.category === filterCat);
            if (searchVal) products = products.filter(p => p.name.toLowerCase().includes(searchVal));

            if (!products.length) {
                tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-gray-400">Ürün bulunamadı.</td></tr>`;
                return;
            }

            tbody.innerHTML = products.map(p => {
                const typeBadge = p.type === 'modular'
                    ? `<span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase border border-blue-100 ml-2">Modüler</span>`
                    : `<span class="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-[10px] font-bold uppercase border border-gray-100 ml-2">Standart</span>`;

                const priceDisplay = `₺${parseFloat(p.price || 0).toFixed(2)}${p.type === 'modular' ? '<br><span class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">+ Modüller</span>' : ''}`;

                const stockBadge = p.stock <= 0
                    ? `<span class="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-200">Tükendi</span>`
                    : `<span class="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">${p.stock} Stokta</span>`;

                return `
            <tr class="hover:bg-gray-50/50 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="relative group cursor-pointer h-10 w-10 flex-shrink-0" onclick="openLightbox('${p.images[0] || 'https://via.placeholder.com/600'}')">
                            <img class="h-full w-full rounded-md object-cover border border-gray-100" src="${p.images[0] || 'https://via.placeholder.com/150'}" alt="">
                            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                                <i class="ph ph-magnifying-glass text-white text-xs"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-bold text-gray-900 flex items-center">${p.name}</div>
                            <div class="flex items-center mt-0.5">${typeBadge}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 uppercase font-medium tracking-tighter">${p.category}</td>
                <td class="px-6 py-4 text-sm font-bold text-gray-900">${priceDisplay}</td>
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">${p.stock} Adet</td>
                <td class="px-6 py-4">
                    ${stockBadge}
                </td>
                <td class="px-6 py-4 text-right text-sm font-medium">
                    <button onclick="editProduct('${p.id}')" class="text-gray-400 hover:text-gray-900 mr-3" title="Düzenle">
                        <i class="ph ph-pencil-simple text-lg"></i>
                    </button>
                    <button onclick="deleteProduct('${p.id}')" class="text-gray-400 hover:text-red-600 transition-colors" title="Sil">
                        <i class="ph ph-trash text-lg"></i>
                    </button>
                </td>
            </tr>
        `;
            }).join('');

            // Update dashboard product count
            const countEl = document.getElementById('dash-product-count');
            if (countEl) countEl.textContent = (getProducts() || []).length;
        }

        function deleteProduct(id) {
            if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
            ShopCore.deleteProduct(id);
            showToast('Ürün silindi.', 'error');
            renderProductTable();
        }

        function editProduct(id) {
            const products = getProducts() || [];
            const p = products.find(prod => prod.id === id);
            if (!p) return;

            // Fill basic fields
            document.getElementById('edit-product-id').value = p.id;
            document.getElementById('edit-name').value = p.name;
            document.getElementById('edit-category').value = p.category;
            document.getElementById('edit-type').value = p.type || 'simple';
            document.getElementById('edit-price').value = p.price || 0;
            document.getElementById('edit-stock').value = p.stock || 0;

            // Toggle modular view
            const modConfig = document.getElementById('edit-modular-fields');

            if (p.type === 'modular') {
                modConfig.classList.remove('hidden');
                AdminModular.init('edit-module-rows-container', 'edit-add-module-row-btn');
                AdminModular.renderModules(p.modules || []);
            } else {
                modConfig.classList.add('hidden');
            }

            renderImageGallery('edit-images-container', p.images || []);

            // Description
            document.getElementById('edit-description').value = p.desc || '';

            // SEO Fields
            document.getElementById('edit-seo-title').value = p.seoTitle || '';
            document.getElementById('edit-seo-description').value = p.seoDescription || '';
            document.getElementById('edit-seo-slug').value = p.slug || '';

            const modal = document.getElementById('edit-modal');
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.querySelector('.modal-content').classList.remove('scale-95');
            modal.querySelector('.modal-content').classList.add('scale-100');
            document.body.classList.add('modal-active');
        }

        function closeEditModal() {
            const modal = document.getElementById('edit-modal');
            modal.classList.add('opacity-0', 'pointer-events-none');
            modal.querySelector('.modal-content').classList.add('scale-95');
            modal.querySelector('.modal-content').classList.remove('scale-100');
            document.body.classList.remove('modal-active');
        }


        // Live search & filter
        document.getElementById('product-search').addEventListener('input', renderProductTable);
        document.getElementById('product-filter-cat').addEventListener('change', renderProductTable);

        // ═══════════════════════════════════════════════════════════════
        //  MULTI-IMAGE LOGIC
        // ═══════════════════════════════════════════════════════════════

        let currentAddImages = [];
        let currentEditImages = [];

        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }

        let draggedItemIndex = null;
        let draggedFromContainer = null;

        function handleDragStart(e, containerId, idx) {
            draggedItemIndex = idx;
            draggedFromContainer = containerId;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => {
                if (e.target.classList) e.target.classList.add('opacity-40');
            }, 0);
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        }

        function handleDragEnter(e) {
            e.preventDefault();
            e.currentTarget.classList.add('border-gray-900');
            e.currentTarget.classList.remove('border-transparent');
        }

        function handleDragLeave(e) {
            e.currentTarget.classList.remove('border-gray-900');
            e.currentTarget.classList.add('border-transparent');
        }

        function handleDragEnd(e, containerId) {
            if (e.target.classList) e.target.classList.remove('opacity-40');
            const container = document.getElementById(containerId);
            if (container) {
                container.querySelectorAll('[draggable="true"]').forEach(el => {
                    el.classList.remove('border-gray-900');
                    el.classList.add('border-transparent');
                });
            }
            draggedItemIndex = null;
            draggedFromContainer = null;
        }

        function handleDrop(e, containerId, idx) {
            e.preventDefault();
            e.currentTarget.classList.remove('border-gray-900');
            e.currentTarget.classList.add('border-transparent');

            if (draggedFromContainer !== containerId || draggedItemIndex === null) return;
            if (draggedItemIndex === idx) return;

            let targetArray;
            if (containerId === 'new-images-container') targetArray = currentAddImages;
            else if (containerId === 'edit-images-container') targetArray = currentEditImages;
            else if (containerId === 'hero-images-container') {
                targetArray = currentHeroSlides;
                const [reorderedItem] = targetArray.splice(draggedItemIndex, 1);
                targetArray.splice(idx, 0, reorderedItem);
                selectedHeroSlideIndex = idx; // Follow the moved slide
                renderHeroImageGallery(targetArray);
                markAsChanged();
                draggedItemIndex = null;
                draggedFromContainer = null;
                return;
            }

            if (!targetArray) return;

            // Move item in array
            const movedItem = targetArray.splice(draggedItemIndex, 1)[0];
            targetArray.splice(idx, 0, movedItem);
            markAsChanged();

            renderImageGallery(containerId, targetArray);

            draggedItemIndex = null;
            draggedFromContainer = null;
        }

        function renderImageGallery(containerId, imagesArray) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = imagesArray.map((img, idx) => `
        <div class="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent group cursor-move transition-all duration-200 hover:shadow-md bg-gray-100"
             draggable="true" 
             ondragstart="handleDragStart(event, '${containerId}', ${idx})" 
             ondragover="handleDragOver(event)" 
             ondragenter="handleDragEnter(event)" 
             ondragleave="handleDragLeave(event)" 
             ondrop="handleDrop(event, '${containerId}', ${idx})"
             ondragend="handleDragEnd(event, '${containerId}')">
             
            <img src="${img}" class="w-full h-full object-cover pointer-events-none">
            
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <button type="button" onclick="openLightbox('${img}')" class="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm border border-white/30" title="Büyüt">
                    <i class="ph ph-magnifying-glass-plus text-sm"></i>
                </button>
                <button type="button" onclick="removeImage('${containerId}', ${idx})" class="p-1.5 bg-white text-red-600 rounded-full shadow-sm hover:bg-gray-100" title="Sil">
                    <i class="ph ph-trash text-sm"></i>
                </button>
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm text-[10px] text-white py-1px pb-0.5 text-center font-medium pointer-events-none tracking-widest uppercase">${idx === 0 ? 'Kapak' : idx + 1}</div>
        </div>
    `).join('');

            // Add empty slots if less than 8
            for (let i = imagesArray.length; i < 8; i++) {
                container.innerHTML += `<div class="aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-center text-gray-300"><i class="ph ph-image text-xl"></i></div>`;
            }
        }

        function removeImage(containerId, idx) {
            markAsChanged();
            if (containerId === 'new-images-container') {
                currentAddImages.splice(idx, 1);
                renderImageGallery('new-images-container', currentAddImages);
            } else if (containerId === 'edit-images-container') {
                currentEditImages.splice(idx, 1);
                renderImageGallery('edit-images-container', currentEditImages);
            } else if (containerId === 'hero-images-container') {
                currentHeroImages.splice(idx, 1);
                renderHeroImageGallery(currentHeroImages);
            }
        }

        // Global Image Input Handlers
        document.getElementById('new-images-input').addEventListener('change', async function (e) {
            const files = Array.from(e.target.files);
            for (const file of files) {
                if (currentAddImages.length >= 8) break;
                const b64 = await fileToBase64(file);
                currentAddImages.push(b64);
                markAsChanged();
            }
            renderImageGallery('new-images-container', currentAddImages);
            e.target.value = '';
        });

        document.getElementById('edit-images-input').addEventListener('change', async function (e) {
            const files = Array.from(e.target.files);
            for (const file of files) {
                if (currentEditImages.length >= 8) break;
                const b64 = await fileToBase64(file);
                currentEditImages.push(b64);
                markAsChanged();
            }
            renderImageGallery('edit-images-container', currentEditImages);
            e.target.value = '';
        });

        // FORM SUBMISSIONS
        document.getElementById('add-product-form').addEventListener('submit', async e => {
            e.preventDefault();
            const type = document.getElementById('new-type').value;
            const modules = type === 'modular' ? AdminModular.getModulesData() : [];

            const productData = {
                name: document.getElementById('new-name').value,
                desc: document.getElementById('new-description').value,
                category: document.getElementById('new-category').value,
                type: type,
                price: parseFloat(document.getElementById('new-price').value) || 0,
                stock: parseInt(document.getElementById('new-stock').value) || 0,
                images: currentAddImages,
                isNew: document.getElementById('new-isnew').checked,
                modules: modules,
                // SEO Fields
                seoTitle: document.getElementById('new-seo-title').value,
                seoDescription: document.getElementById('new-seo-description').value,
                slug: document.getElementById('new-seo-slug').value || document.getElementById('new-name').value.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')
            };

            ShopCore.saveProduct(productData);
            showToast('Ürün başarıyla eklendi.');

            // Reset Everything
            document.getElementById('add-product-form').reset();
            currentAddImages = [];
            renderImageGallery('new-images-container', []);

            // Reset Modular UI if open
            document.getElementById('add-modular-fields').classList.add('hidden');
            document.getElementById('add-module-rows-container').innerHTML = '';

            switchTab('products');
            renderProductTable();
        });

        document.getElementById('edit-product-form').addEventListener('submit', e => {
            e.preventDefault();
            const type = document.getElementById('edit-type').value;
            const modules = type === 'modular' ? AdminModular.getModulesData() : [];

            const productData = {
                id: document.getElementById('edit-product-id').value,
                name: document.getElementById('edit-name').value,
                desc: document.getElementById('edit-description').value,
                category: document.getElementById('edit-category').value,
                type: type,
                price: parseFloat(document.getElementById('edit-price').value) || 0,
                stock: parseInt(document.getElementById('edit-stock').value) || 0,
                images: currentEditImages,
                modules: modules,
                // SEO Fields
                seoTitle: document.getElementById('edit-seo-title').value,
                seoDescription: document.getElementById('edit-seo-description').value,
                slug: document.getElementById('edit-seo-slug').value
            };

            ShopCore.saveProduct(productData);
            showToast('Ürün başarıyla güncellendi.');
            closeEditModal();
            renderProductTable();
        });

        // Modular Type Toggle Listeners
        document.getElementById('new-type').addEventListener('change', function () {
            const modConfig = document.getElementById('add-modular-fields');

            if (this.value === 'modular') {
                modConfig.classList.remove('hidden');
                AdminModular.init('add-module-rows-container', 'add-module-row-btn');
                AdminModular.renderModules([]);
            } else {
                modConfig.classList.add('hidden');
            }
        });

        document.getElementById('edit-type').addEventListener('change', function () {
            const modConfig = document.getElementById('edit-modular-fields');

            if (this.value === 'modular') {
                modConfig.classList.remove('hidden');
                AdminModular.init('edit-module-rows-container', 'edit-add-module-row-btn');
            } else {
                modConfig.classList.add('hidden');
            }
        });

        // Hero Multi-Image Handling
        let currentHeroSlides = [];
        let selectedHeroSlideIndex = 0;

        function renderHeroImageGallery(slidesArray) {
            const container = document.getElementById('hero-images-container');
            if (!container) return;

            container.innerHTML = slidesArray.map((slide, idx) => `
        <div onclick="selectHeroSlide(${idx})" 
             class="relative aspect-video rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer group ${selectedHeroSlideIndex === idx ? 'border-gray-900 ring-2 ring-gray-900/10 scale-[1.02]' : 'border-transparent bg-gray-100 hover:border-gray-300'}"
             draggable="true" 
             ondragstart="handleDragStart(event, 'hero-images-container', ${idx})" 
             ondragover="handleDragOver(event)" 
             ondragenter="handleDragEnter(event)" 
             ondragleave="handleDragLeave(event)" 
             ondrop="handleDrop(event, 'hero-images-container', ${idx})"
             ondragend="handleDragEnd(event, 'hero-images-container')">
             
            <img src="${slide.img}" class="w-full h-full object-cover pointer-events-none">
            
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <button type="button" onclick="event.stopPropagation(); openLightbox('${slide.img}')" class="p-1 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm border border-white/30" title="Büyüt">
                    <i class="ph ph-magnifying-glass-plus text-xs"></i>
                </button>
                <button type="button" onclick="event.stopPropagation(); removeHeroSlide(${idx})" class="p-1 bg-white text-red-600 rounded-full shadow-sm hover:bg-gray-100" title="Sil">
                    <i class="ph ph-trash text-xs"></i>
                </button>
            </div>
            <div class="absolute bottom-0 left-0 right-0 ${selectedHeroSlideIndex === idx ? 'bg-gray-900' : 'bg-black/50'} backdrop-blur-sm text-[9px] text-white py-0.5 text-center font-medium pointer-events-none tracking-widest uppercase">${idx + 1}</div>
        </div>
    `).join('');

            // Add empty slots if less than 10
            for (let i = slidesArray.length; i < 10; i++) {
                container.innerHTML += `<div class="aspect-video rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-center text-gray-300"><i class="ph ph-image text-lg"></i></div>`;
            }

            updateSlideEditorUI();
        }

        function selectHeroSlide(idx) {
            selectedHeroSlideIndex = idx;
            renderHeroImageGallery(currentHeroSlides);
        }

        function updateSlideEditorUI() {
            const editor = document.getElementById('hero-slide-content-editor');
            const label = document.getElementById('editing-slide-label');

            if (currentHeroSlides.length === 0) {
                if (editor) editor.classList.add('opacity-40', 'pointer-events-none');
                if (label) label.innerText = 'Görsel Yok';
                return;
            }

            if (editor) editor.classList.remove('opacity-40', 'pointer-events-none');
            if (label) label.innerText = `Slayt ${selectedHeroSlideIndex + 1}`;

            const slide = currentHeroSlides[selectedHeroSlideIndex];
            document.getElementById('hero-subtitle').value = slide.subtitle || '';
            document.getElementById('hero-title').value = slide.title || '';
            document.getElementById('hero-desc').value = slide.desc || '';
            document.getElementById('hero-btn-text').value = slide.btnText || '';
            document.getElementById('hero-btn-link').value = slide.btnLink || '';
        }

        function updateCurrentHeroSlideData() {
            if (currentHeroSlides.length === 0) return;

            const slide = currentHeroSlides[selectedHeroSlideIndex];
            slide.subtitle = document.getElementById('hero-subtitle').value;
            slide.title = document.getElementById('hero-title').value;
            slide.desc = document.getElementById('hero-desc').value;
            slide.btnText = document.getElementById('hero-btn-text').value;
            slide.btnLink = document.getElementById('hero-btn-link').value;
        }

        function removeHeroSlide(idx) {
            if (!confirm('Bu slaytı silmek istediğinize emin misiniz?')) return;
            currentHeroSlides.splice(idx, 1);
            if (selectedHeroSlideIndex >= currentHeroSlides.length) {
                selectedHeroSlideIndex = Math.max(0, currentHeroSlides.length - 1);
            }
            renderHeroImageGallery(currentHeroSlides);
        }

        document.getElementById('hero-images-input').addEventListener('change', async function (e) {
            const files = Array.from(e.target.files);
            for (const file of files) {
                if (currentHeroSlides.length >= 10) break;
                const b64 = await fileToBase64(file);
                currentHeroSlides.push({
                    img: b64,
                    subtitle: '',
                    title: '',
                    desc: '',
                    btnText: '',
                    btnLink: ''
                });
                markAsChanged();
            }
            selectedHeroSlideIndex = currentHeroSlides.length - 1; // Auto select newest
            renderHeroImageGallery(currentHeroSlides);
            e.target.value = '';
        });

        // ═══════════════════════════════════════════════════════════════
        //  THEME & CONTENT SETTINGS LOGIC
        // ═══════════════════════════════════════════════════════════════
        const THEME_STORE_KEY = 'aura_theme_settings';

        const DEFAULT_THEME_SETTINGS = {
            activeThemeId: 'theme-default',
            themes: [
                {
                    id: 'theme-default',
                    name: 'Varsayılan Tema',
                    layout: 'theme1', // New property for selecting layout
                    hero: {
                        slides: []
                    },
                    catSectionTitle: 'Özel Kategoriler',
                    story: {
                        imgBase64: '',
                        subtitle: 'Felsefemiz',
                        title: 'Ruha hitap eden tasarım.',
                        desc: 'Mekanınızın özünüzü yansıtması gerektiğine inanıyoruz. Parçalarımız, sürdürülebilir malzemeler ve zamansız tasarım ilkeleri kullanılarak titiz bir detay odaklılıkla üretilmektedir. Bu sadece mobilya değil; günlük deneyimlerinizin bir kürasyonudur.'
                    },
                    categories: [
                        { id: "cat-1", imgBase64: '', title: 'Oturma', link: 'products.html?category=seating', active: true },
                        { id: "cat-2", imgBase64: '', title: 'Masalar', link: 'products.html?category=tables', active: true },
                        { id: "cat-3", imgBase64: '', title: 'Aydınlatma', link: 'products.html?category=lighting', active: true },
                        { id: "cat-4", imgBase64: '', title: 'Yatak Odası', link: 'products.html?category=bedroom', active: true },
                        { id: "cat-5", imgBase64: '', title: 'Depolama', link: 'products.html?category=storage', active: true },
                        { id: "cat-6", imgBase64: '', title: 'Aksesuarlar', link: 'products.html?category=accessories', active: true },
                        { id: "cat-7", imgBase64: '', title: 'Dış Mekan', link: 'products.html?category=outdoor', active: true },
                        { id: "cat-8", imgBase64: '', title: 'Ofis', link: 'products.html?category=office', active: true }
                    ],
                    galSectionTitle: 'Proje Galerisi',
                    galSectionDesc: 'AURA mobilyalarının mekanları nasıl dönüştürdüğünü görün. Minimalist yaklaşımımızla tasarlanmış gerçek iç mekanları keşfedin.',
                    galCardTitle: 'Mekanınızı Tasarlayın',
                    galCardDesc: 'Hayallerinizdeki evi yaratmak için bizimle iletişime geçin.',
                    about: {
                        heroImg: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=2000',
                        heroTitle: 'Hikayemiz',
                        heroSubtitle: 'Tasarım aracılığıyla huzur yaratmak.',
                        philQuote: '"Etrafımızı saran nesnelerin iç huzurumuzu derinden etkilediğine inanıyoruz."',
                        philDesc: '2026 yılında kurulan AURA, gereksiz olanı atıp temele odaklanma arzusundan doğdu. Hızlı tüketim mobilyalarıyla dolup taşan bir dünya gördük ve buna bir çare bulmak istedik: Anlamlı tasarlanmış, nesiller boyu dayanacak şekilde üretilmiş ve her mekanı yüceltecek sessiz bir güzelliğe sahip parçalar. \n\nTasarım dilimiz minimalizm kökenlidir, ancak asla sıcaklık veya konfordan ödün vermez. Geleneksel işçiliği modern üretim teknikleriyle birleştirerek, sanat ile fayda arasındaki köprüyü kuran mobilyalar yaratıyoruz.',
                        craftTitle: 'Sürdürülebilir İşçilik',
                        craftDesc1: "AURA'nın her bir mobilya parçası hayata sorumlu şekilde tedarik edilen malzemelerle başlar. Çevresel ayak izimizin tasarımlarımız kadar minimal kalmasını sağlamak için doğrudan sürdürülebilir ormanlar ve etik tedarikçilerle ortaklık kuruyoruz.",
                        craftDesc2: 'Usta zanaatkarlarımız, hassas mühendisliğin yanı sıra zamana meydan okuyan doğrama tekniklerini kullanıyor. Bu titiz yaklaşım, bir AURA parçasının yalnızca ilk gün güzel kalmasını değil, zaman geçtikçe daha da seçkinleşmesini garanti eder.',
                        craftImg: 'https://images.unsplash.com/photo-1596079890744-c1a0462d0975?auto=format&fit=crop&q=80&w=1000'
                    },
                    gallery: [
                        { id: 'gal-1', imgBase64: '', text: 'Modern Salon' },
                        { id: 'gal-2', imgBase64: '', text: 'Yemek Odası' },
                        { id: 'gal-3', imgBase64: '', text: 'Yatak Odası' },
                        { id: 'gal-4', imgBase64: '', text: 'Mutfak Detay' },
                        { id: 'gal-5', imgBase64: '', text: 'Çalışma Köşesi' }
                    ],
                    footer: {
                        address: 'Nişantaşı, İstanbul',
                        email: 'info@auramobilya.com',
                        phone: '+90 555 123 45 67',
                        whatsapp: '905551234567',
                        footerDesc: 'Modern mobilya tasarımında öncü marka. Kalite ve estetiği bir arada sunuyoruz.'
                    },
                    contactPage: {
                        title: 'İletişim',
                        desc: 'Bize ulaşın, hayalinizdeki mekanı birlikte tasarlayalım.',
                        hours: 'Pazartesi - Cuma: 09:00 - 18:00',
                        waTitle: 'WhatsApp Destek',
                        waDesc: 'Mobilya uzmanlarımıza WhatsApp üzerinden ulaşın.'
                    }
                },
                {
                    id: 'theme-premium',
                    name: 'Premium Demo (Whatsapp)',
                    layout: 'theme2',
                    hero: {
                        slides: []
                    },
                    catSectionTitle: 'ÖNE ÇIKANLAR',
                    story: {
                        imgBase64: '',
                        subtitle: 'HAKKIMIZDA',
                        title: 'Tasarımda Mükemmellik',
                        desc: 'Aura Mobilya olarak, her parçada estetik ve konforu birleştiriyoruz.'
                    },
                    categories: [
                        { id: 'cat-1', imgBase64: '', title: 'Lüks Kanepeler', link: 'theme2-products.html', active: true },
                        { id: 'cat-2', imgBase64: '', title: 'Ahşap Masalar', link: 'theme2-products.html', active: true },
                        { id: 'cat-3', imgBase64: '', title: 'Aksesuar', link: 'theme2-products.html', active: true },
                        { id: 'cat-4', imgBase64: '', title: 'Yatak Odası', link: 'theme2-products.html', active: true },
                        { id: 'cat-5', imgBase64: '', title: 'Depolama', link: 'theme2-products.html', active: true },
                        { id: 'cat-6', imgBase64: '', title: 'Aksesuarlar', link: 'theme2-products.html', active: true },
                        { id: 'cat-7', imgBase64: '', title: 'Dış Mekan', link: 'theme2-products.html', active: true },
                        { id: 'cat-8', imgBase64: '', title: 'Ofis', link: 'theme2-products.html', active: true }
                    ],
                    galSectionTitle: 'GALERİ',
                    galSectionDesc: 'Minimalist yaşam alanlarımızdan kareler.',
                    galCardTitle: 'İLHAMINIZ BİZİZ',
                    galCardDesc: 'Yaşam alanınızı birlikte kurgulayalayım.',
                    t2NewSeasonLabel: 'Seçilmiş Parçalar',
                    t2NewSeasonTitle: 'Yeni Sezon',
                    t2SignatureLabel: 'Öne Çıkanlar',
                    t2SignatureTitle: 'İmza Koleksiyon',
                    about: {
                        heroImg: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=2000',
                        heroTitle: 'AURA FELSEFESİ',
                        heroSubtitle: 'Sadelik ve Zerafet',
                        philQuote: '"Az olanın çok olduğuna inanıyoruz."',
                        philDesc: 'Modern yaşamın karmaşasından uzak, dingin ve anlamlı alanlar yaratıyoruz. \n\nHer bir parça, sizin için özenle tasarlanır.',
                        craftTitle: 'Premium İşçilik',
                        craftDesc1: 'En yüksek kalitede malzemelerle, ustalıkla üretilen koleksiyonlarımız.',
                        craftDesc2: 'Zamansız parçalar, nesiller boyu sizinle.',
                        craftImg: 'https://images.unsplash.com/photo-1596079890744-c1a0462d0975?auto=format&fit=crop&q=80&w=1000'
                    },
                    gallery: [
                        { id: 'gal-1', imgBase64: '', text: 'Modern Salon' },
                        { id: 'gal-2', imgBase64: '', text: 'Yemek Odası' },
                        { id: 'gal-3', imgBase64: '', text: 'Yatak Odası' },
                        { id: 'gal-4', imgBase64: '', text: 'Mutfak Detay' },
                        { id: 'gal-5', imgBase64: '', text: 'Çalışma Köşesi' }
                    ],
                    footer: {
                        address: 'Nişantaşı, İstanbul',
                        email: 'info@auramobilya.com',
                        phone: '+90 555 123 45 67',
                        whatsapp: '905551234567',
                        footerDesc: 'Premium mobilyalarla yaşam alanlarınıza değer katıyoruz. Tasarımın saflığı ve kalitenin buluşma noktası.'
                    },
                    contactPage: {
                        title: 'Bize Ulaşın',
                        desc: 'Projeleriniz, özel ölçü talepleriniz ve siparişleriniz için mağazamızı ziyaret edebilir veya satış asistanlarımızla anında görüşebilirsiniz.',
                        hours: 'Pazartesi - Cuma: 09:00 - 19:00\nCumartesi: 10:00 - 18:00\nPazar: Kapalı',
                        waTitle: 'Anında Destek',
                        waDesc: 'Vakit kaybetmek yerine, satış temsilcimize WhatsApp üzerinden dilediğiniz zaman ulaşın. Fotoğraf, çizim veya ölçülerinizi hızlıca paylaşın.'
                    },
                    t2NewSeasonProducts: [],
                    t2SignatureProducts: []
                }
            ]
        };

        // ═══════════════════════════════════════════════════════════════
        //  PRODUCT PICKER FOR THEME 2
        // ═══════════════════════════════════════════════════════════════
        let t2SelectedState = {
            t2NewSeasonProducts: [],
            t2SignatureProducts: []
        };

        // Open Picker Modal
        function openT2ProductSelector(key) {
            const modal = document.getElementById('t2-product-selector-modal');
            const container = document.getElementById('t2-selector-grid');
            const title = document.getElementById('t2-selector-title');

            title.innerText = key === 't2NewSeasonProducts' ? 'Yeni Sezon Ürünlerini Seç' : 'İmza Koleksiyon Ürünlerini Seç';
            modal.dataset.key = key;

            // Render all products with current selection state
            const products = getProducts() || [];
            const selectedIds = t2SelectedState[key];

            container.innerHTML = products.map(p => {
                const isSelected = selectedIds.includes(p.id);
                const img = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/150';
                return `
            <div data-id="${p.id}" onclick="toggleT2ModalProduct(this)" 
                 class="relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group ${isSelected ? 'border-gray-900 ring-4 ring-gray-900/10' : 'border-gray-100'}">
                <img src="${img}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-black/40 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity flex items-center justify-center">
                    <div class="w-8 h-8 rounded-full ${isSelected ? 'bg-gray-900' : 'bg-white/50'} flex items-center justify-center shadow-lg">
                        <i class="ph ph-check text-base ${isSelected ? 'text-white' : 'text-gray-900'}"></i>
                    </div>
                </div>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p class="text-[10px] text-white font-medium truncate">${p.name}</p>
                </div>
            </div>
        `;
            }).join('');

            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        function closeT2ProductSelector() {
            const modal = document.getElementById('t2-product-selector-modal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }

        function toggleT2ModalProduct(el) {
            el.classList.toggle('border-gray-900');
            el.classList.toggle('ring-4');
            el.classList.toggle('ring-gray-900/10');
            el.classList.toggle('border-gray-100');

            const checkBg = el.querySelector('.ph-check').parentElement;
            const checkIcon = el.querySelector('.ph-check');

            if (el.classList.contains('border-gray-900')) {
                checkBg.classList.replace('bg-white/50', 'bg-gray-900');
                checkIcon.classList.replace('text-gray-900', 'text-white');
            } else {
                checkBg.classList.replace('bg-gray-900', 'bg-white/50');
                checkIcon.classList.replace('text-white', 'text-gray-900');
            }
        }

        function confirmT2Selection() {
            const modal = document.getElementById('t2-product-selector-modal');
            const key = modal.dataset.key;
            const container = document.getElementById('t2-selector-grid');
            const selected = Array.from(container.querySelectorAll('.border-gray-900')).map(el => el.dataset.id);

            if (selected.length > 16) {
                showToast(`Maksimum 16 ürün seçebilirsiniz. Şu an ${selected.length} ürün seçili.`, 'error');
                return;
            }

            t2SelectedState[key] = selected;
            markAsChanged();
            renderT2SelectedList(key);
            closeT2ProductSelector();
        }

        function renderT2SelectedList(key) {
            const containerId = key === 't2NewSeasonProducts' ? 't2-newseason-selected-list' : 't2-signature-selected-list';
            const container = document.getElementById(containerId);
            if (!container) return;

            const selectedIds = t2SelectedState[key];
            const products = getProducts() || [];
            const selectedProducts = products.filter(p => selectedIds.includes(p.id));

            if (selectedProducts.length === 0) {
                container.innerHTML = '<p class="text-xs text-gray-400 w-full text-center py-2">Henüz ürün seçilmedi.</p>';
                return;
            }

            container.innerHTML = selectedProducts.map(p => `
        <div class="flex items-center bg-white border border-gray-200 pl-2 pr-3 py-1.5 rounded-lg group hover:border-gray-400 transition-colors">
            <img src="${(p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/50'}" class="w-6 h-6 rounded object-cover mr-2">
            <span class="text-xs font-medium text-gray-700 mr-2">${p.name}</span>
            <button type="button" onclick="removeT2Product('${key}', '${p.id}')" class="text-gray-400 hover:text-red-500 transition-colors">
                <i class="ph ph-x-circle"></i>
            </button>
        </div>
    `).join('');
        }

        function removeT2Product(key, id) {
            t2SelectedState[key] = t2SelectedState[key].filter(pid => pid !== id);
            markAsChanged();
            renderT2SelectedList(key);
        }

        // Override or replace old functions to avoid conflicts
        function renderT2ProductPicker(containerId, selectedIds) {
            // This is now handled by renderT2SelectedList and the modal
            const key = containerId === 't2-newseason-products-picker' ? 't2NewSeasonProducts' : 't2SignatureProducts';
            t2SelectedState[key] = selectedIds;
            renderT2SelectedList(key);
        }

        let currentThemeSettings = null;

        function renderThemePresets() {
            const container = document.getElementById('theme-presets-container');
            if (!container || !currentThemeSettings) return;

            container.innerHTML = currentThemeSettings.themes.map(t => {
                const isActive = t.id === currentThemeSettings.activeThemeId;
                const borderClass = isActive ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' : 'border-gray-200 bg-white hover:border-gray-400';
                const iconClass = isActive ? 'text-gray-900' : 'text-gray-400';

                return `
            <div data-theme-id="${t.id}" onclick="selectThemePreset('${t.id}')" class="min-w-[160px] cursor-pointer rounded-xl border-2 p-4 transition-all flex flex-col items-center justify-center text-center snap-start relative ${borderClass}">
                <i class="ph ph-palette text-2xl mb-2 ${iconClass}"></i>
                <span class="font-medium text-sm text-gray-900 truncate w-full">${t.name}</span>
                ${isActive ? '<span class="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Düzenleniyor</span>' : ''}
                
                ${!isActive && t.id !== 'theme-default' ? `
                    <button type="button" onclick="deleteThemePreset(event, '${t.id}')" class="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                        <i class="ph ph-trash"></i>
                    </button>
                ` : ''}
            </div>
        `;
            }).join('');
        }

        function selectThemePreset(themeId) {
            if (!currentThemeSettings) return;

            // Add visual "closing" effect
            const formFields = document.getElementById('theme-form-fields');
            if (formFields) {
                formFields.classList.add('opacity-0');
                formFields.classList.remove('opacity-100');

                setTimeout(() => {
                    currentThemeSettings.activeThemeId = themeId;
                    markAsChanged();
                    renderThemePresets();
                    populateFormWithActiveTheme();

                    // "Open" effect
                    setTimeout(() => {
                        formFields.classList.remove('opacity-0');
                        formFields.classList.add('opacity-100');
                    }, 50);

                }, 300); // Wait for fade out
            } else {
                currentThemeSettings.activeThemeId = themeId;
                markAsChanged();
                renderThemePresets();
                populateFormWithActiveTheme();
            }
        }

        function createNewThemePreset() {
            const name = prompt('Yeni tema için bir isim girin (örn: Kış Kampanyası):');
            if (!name || name.trim() === '') return;

            const newId = 'theme-' + Date.now();
            // Copy default as a base
            const baseTheme = JSON.parse(JSON.stringify(DEFAULT_THEME_SETTINGS.themes[0]));
            baseTheme.id = newId;
            baseTheme.name = name.trim();

            currentThemeSettings.themes.push(baseTheme);
            currentThemeSettings.activeThemeId = newId; // switch to new
            markAsChanged();
            markAsChanged();

            // Save to localstorage immediately so it persists
            localStorage.setItem(THEME_STORE_KEY, JSON.stringify(currentThemeSettings));

            renderThemePresets();
            populateFormWithActiveTheme();
        }

        function deleteThemePreset(e, themeId) {
            e.stopPropagation(); // prevent triggering select
            if (!confirm('Bu temayı silmek istediğinize emin misiniz?')) return;

            currentThemeSettings.themes = currentThemeSettings.themes.filter(t => t.id !== themeId);
            markAsChanged();

            // If we deleted the active theme, fallback to default
            if (currentThemeSettings.activeThemeId === themeId) {
                currentThemeSettings.activeThemeId = 'theme-default';
            }

            localStorage.setItem(THEME_STORE_KEY, JSON.stringify(currentThemeSettings));
            renderThemePresets();
            populateFormWithActiveTheme();
        }

        function loadThemeSettings() {
            const stored = localStorage.getItem(THEME_STORE_KEY);
            currentThemeSettings = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(DEFAULT_THEME_SETTINGS));

            // Handle migrations from old single-object format to the new multi-theme format
            if (!currentThemeSettings.themes) {
                // Wrap the old object into the new array structure
                const migratedSettings = JSON.parse(JSON.stringify(DEFAULT_THEME_SETTINGS));
                migratedSettings.themes[0].hero = currentThemeSettings.hero || migratedSettings.themes[0].hero;
                migratedSettings.themes[0].story = currentThemeSettings.story || migratedSettings.themes[0].story;
                currentThemeSettings = migratedSettings;
                localStorage.setItem(THEME_STORE_KEY, JSON.stringify(currentThemeSettings));
            }

            // Handle migration: Ensure "theme-premium" exists for existing users
            const hasPremium = currentThemeSettings.themes.find(t => t.id === 'theme-premium');
            const premiumDefault = DEFAULT_THEME_SETTINGS.themes.find(t => t.id === 'theme-premium');

            if (!hasPremium) {
                if (premiumDefault) {
                    currentThemeSettings.themes.push(JSON.parse(JSON.stringify(premiumDefault)));
                    localStorage.setItem(THEME_STORE_KEY, JSON.stringify(currentThemeSettings));
                }
            } else {
                // Patch: If user already got theme-premium from earlier version but categories are blank, update them
                if (hasPremium.categories && hasPremium.categories.length > 0 && !hasPremium.categories[0].imgBase64) {
                    hasPremium.categories = JSON.parse(JSON.stringify(premiumDefault.categories));
                    localStorage.setItem(THEME_STORE_KEY, JSON.stringify(currentThemeSettings));
                }
            }

            // Migration patch for footer, categories, gallery if missing or incomplete
            currentThemeSettings.themes.forEach(t => {
                const def = DEFAULT_THEME_SETTINGS.themes.find(dt => dt.id === t.id) || DEFAULT_THEME_SETTINGS.themes[0];

                if (!t.footer) {
                    t.footer = JSON.parse(JSON.stringify(def.footer));
                }

                if (!t.categories || t.categories.length < 8) {
                    const existing = t.categories || [];
                    t.categories = JSON.parse(JSON.stringify(def.categories));
                    // Keep existing ones if possible
                    existing.forEach((cat, idx) => {
                        if (t.categories[idx]) t.categories[idx] = cat;
                    });
                }

                // Ensure 'active' property exists for all categories
                t.categories.forEach(cat => {
                    if (cat.active === undefined) cat.active = true;
                });

                if (!t.gallery || t.gallery.length < 5) {
                    const existing = t.gallery || [];
                    t.gallery = JSON.parse(JSON.stringify(def.gallery));
                    existing.forEach((gal, idx) => {
                        if (t.gallery[idx]) t.gallery[idx] = gal;
                    });
                }

                // Patch new section title fields if missing
                if (t.catSectionTitle === undefined) t.catSectionTitle = def.catSectionTitle || 'Özel Kategoriler';
                if (t.galSectionTitle === undefined) t.galSectionTitle = def.galSectionTitle || 'Proje Galerisi';
                if (t.galSectionDesc === undefined) t.galSectionDesc = def.galSectionDesc || '';
                if (t.galCardTitle === undefined) t.galCardTitle = def.galCardTitle || '';
                if (t.galCardDesc === undefined) t.galCardDesc = def.galCardDesc || '';
                if (t.t2NewSeasonProducts === undefined) t.t2NewSeasonProducts = def.t2NewSeasonProducts || [];
                if (t.t2SignatureProducts === undefined) t.t2SignatureProducts = def.t2SignatureProducts || [];
                if (t.about === undefined) {
                    t.about = JSON.parse(JSON.stringify(def.about || {}));
                } else {
                    // Internal about migration
                    if (t.about.philDesc === undefined) {
                        t.about.philDesc = (t.about.philDesc1 || '') + '\n\n' + (t.about.philDesc2 || '');
                        delete t.about.philDesc1;
                        delete t.about.philDesc2;
                    }
                }

                // Migration for Hero Slides (Base64/Array to Slide Objects)
                if (t.hero && !t.hero.slides) {
                    const oldImages = t.hero.images || (t.hero.imgBase64 ? [t.hero.imgBase64] : []);
                    t.hero.slides = oldImages.map(img => ({
                        img: img,
                        subtitle: t.hero.subtitle || '',
                        title: t.hero.title || '',
                        desc: t.hero.desc || '',
                        btnText: t.hero.btnText || '',
                        btnLink: t.hero.btnLink || ''
                    }));
                    delete t.hero.images;
                    delete t.hero.imgBase64;
                    delete t.hero.subtitle;
                    delete t.hero.title;
                    delete t.hero.desc;
                    delete t.hero.btnText;
                    delete t.hero.btnLink;
                }
            });

            localStorage.setItem(THEME_STORE_KEY, JSON.stringify(currentThemeSettings));
            renderThemePresets();
            populateFormWithActiveTheme();
        }

        function populateFormWithActiveTheme() {
            if (!currentThemeSettings) return;
            const activeTheme = currentThemeSettings.themes.find(t => t.id === currentThemeSettings.activeThemeId);
            if (!activeTheme) return;

            // Set layout select and trigger logic
            const layout = activeTheme.layout || 'theme1';
            handleLayoutChange(layout); // Syncs UI hiding and siteLinkBtn href

            // Hero
            currentHeroSlides = JSON.parse(JSON.stringify(activeTheme.hero.slides || []));
            selectedHeroSlideIndex = 0;
            renderHeroImageGallery(currentHeroSlides);

            // Story
            document.getElementById('story-img-preview').src = activeTheme.story.imgBase64;
            document.getElementById('story-img-b64').value = activeTheme.story.imgBase64;
            document.getElementById('story-subtitle').value = activeTheme.story.subtitle;
            document.getElementById('story-title').value = activeTheme.story.title;
            document.getElementById('story-desc').value = activeTheme.story.desc;

            // Section Titles
            if (document.getElementById('cat-section-title')) document.getElementById('cat-section-title').value = activeTheme.catSectionTitle || '';
            if (document.getElementById('gal-section-title')) document.getElementById('gal-section-title').value = activeTheme.galSectionTitle || '';
            if (document.getElementById('gal-section-desc')) document.getElementById('gal-section-desc').value = activeTheme.galSectionDesc || '';
            if (document.getElementById('gal-card-title')) document.getElementById('gal-card-title').value = activeTheme.galCardTitle || '';
            if (document.getElementById('gal-card-desc')) document.getElementById('gal-card-desc').value = activeTheme.galCardDesc || '';

            // T2 Ürün Vitrin Başlıkları
            if (document.getElementById('t2-newseason-title')) document.getElementById('t2-newseason-title').value = activeTheme.t2NewSeasonTitle || 'Yeni Sezon';
            if (document.getElementById('t2-signature-title')) document.getElementById('t2-signature-title').value = activeTheme.t2SignatureTitle || 'İmza Koleksiyon';

            // T2 Product Pickers
            renderT2ProductPicker('t2-newseason-products-picker', activeTheme.t2NewSeasonProducts || []);
            renderT2ProductPicker('t2-signature-products-picker', activeTheme.t2SignatureProducts || []);

            // Build About UI
            if (activeTheme.about) {
                const a = activeTheme.about;
                if (document.getElementById('about-hero-preview')) document.getElementById('about-hero-preview').src = a.heroImg || '';
                if (document.getElementById('about-hero-b64')) document.getElementById('about-hero-b64').value = a.heroImg.startsWith('data:') ? a.heroImg : '';
                if (document.getElementById('about-hero-title')) document.getElementById('about-hero-title').value = a.heroTitle || '';
                if (document.getElementById('about-hero-subtitle')) document.getElementById('about-hero-subtitle').value = a.heroSubtitle || '';
                if (document.getElementById('about-phil-quote')) document.getElementById('about-phil-quote').value = a.philQuote || '';
                if (document.getElementById('about-phil-desc')) document.getElementById('about-phil-desc').value = a.philDesc || '';
                if (document.getElementById('about-craft-preview')) document.getElementById('about-craft-preview').src = a.craftImg || '';
                if (document.getElementById('about-craft-b64')) document.getElementById('about-craft-b64').value = a.craftImg.startsWith('data:') ? a.craftImg : '';
                if (document.getElementById('about-craft-title')) document.getElementById('about-craft-title').value = a.craftTitle || '';
                if (document.getElementById('about-craft-desc1')) document.getElementById('about-craft-desc1').value = a.craftDesc1 || '';
                if (document.getElementById('about-craft-desc2')) document.getElementById('about-craft-desc2').value = a.craftDesc2 || '';
            }

            // Build Categories UI
            const catsContainer = document.getElementById('theme-categories-container');
            catsContainer.innerHTML = '';
            (activeTheme.categories || []).forEach((cat, idx) => {
                const isActive = cat.active !== false;
                catsContainer.innerHTML += `
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 relative ${!isActive ? 'opacity-60 grayscale-[0.5]' : ''}">
                <div class="flex items-center justify-between mb-3">
                    <span class="bg-gray-200 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">Kategori ${idx + 1}</span>
                    <label class="flex items-center cursor-pointer group">
                        <span class="mr-2 text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-green-600' : 'text-gray-400'}">${isActive ? 'Aktif' : 'Pasif'}</span>
                        <div class="relative">
                            <input type="checkbox" id="cat-active-${idx}" class="sr-only peer" ${isActive ? 'checked' : ''} onchange="this.closest('.rounded-xl').classList.toggle('opacity-60'); this.previousElementSibling.innerText = this.checked ? 'Aktif' : 'Pasif'; this.previousElementSibling.classList.toggle('text-green-600'); this.previousElementSibling.classList.toggle('text-gray-400')">
                            <div class="block bg-gray-200 w-8 h-5 rounded-full shadow-inner peer-checked:bg-gray-900 transition-colors"></div>
                            <div class="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-3"></div>
                        </div>
                    </label>
                </div>
                <label class="block text-xs font-medium text-gray-500 mb-2">Görsel (Önerilen: Kare)</label>
                <div class="relative group rounded-xl overflow-hidden border border-gray-200 mb-4 h-32 md:h-40">
                    <img id="cat-preview-${idx}" src="${cat.imgBase64 || 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=400'}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Preview">
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                        <button type="button" onclick="openLightbox(document.getElementById('cat-preview-${idx}').src)" class="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm border border-white/30" title="Büyüt">
                            <i class="ph ph-magnifying-glass-plus text-lg"></i>
                        </button>
                        <button type="button" onclick="document.getElementById('cat-input-${idx}').click()" class="p-2 bg-white text-gray-900 hover:bg-gray-100 rounded-full shadow-lg" title="Değiştir">
                            <i class="ph ph-camera text-lg"></i>
                        </button>
                    </div>
                    <input type="file" id="cat-input-${idx}" accept="image/*" class="hidden" onchange="handleSingleImageUpload(event, 'cat-preview-${idx}', 'cat-b64-${idx}')">
                </div>
                <input type="hidden" id="cat-b64-${idx}" value="${cat.imgBase64 || ''}">
                <label class="block text-xs font-medium text-gray-500 mb-1">Başlık</label>
                <input id="cat-title-${idx}" type="text" class="w-full border border-gray-200 rounded px-3 py-2 text-sm mb-3" value="${cat.title || ''}">
                <label class="block text-xs font-medium text-gray-500 mb-1">Link</label>
                <input id="cat-link-${idx}" type="text" class="w-full border border-gray-200 rounded px-3 py-2 text-sm" value="${cat.link || ''}">
            </div>
        `;
            });

            // Build Gallery UI
            const galContainer = document.getElementById('theme-gallery-container');
            galContainer.innerHTML = '';
            (activeTheme.gallery || []).forEach((gal, idx) => {
                galContainer.innerHTML += `
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 relative">
                <span class="absolute top-2 right-2 bg-gray-200 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">G${idx + 1}</span>
                <label class="block text-xs font-medium text-gray-500 mb-2">Görsel</label>
                <div class="relative group rounded-xl overflow-hidden border border-gray-200 mb-4 h-32 md:h-40">
                    <img id="gal-preview-${idx}" src="${gal.imgBase64 || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=400'}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Preview">
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                        <button type="button" onclick="openLightbox(document.getElementById('gal-preview-${idx}').src)" class="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm border border-white/30" title="Büyüt">
                            <i class="ph ph-magnifying-glass-plus text-lg"></i>
                        </button>
                        <button type="button" onclick="document.getElementById('gal-input-${idx}').click()" class="p-2 bg-white text-gray-900 hover:bg-gray-100 rounded-full shadow-lg" title="Değiştir">
                            <i class="ph ph-camera text-lg"></i>
                        </button>
                    </div>
                    <input type="file" id="gal-input-${idx}" accept="image/*" class="hidden" onchange="handleSingleImageUpload(event, 'gal-preview-${idx}', 'gal-b64-${idx}')">
                </div>
                <input type="hidden" id="gal-b64-${idx}" value="${gal.imgBase64 || ''}">
                <label class="block text-xs font-medium text-gray-500 mb-1">Fare Üzerindeyken (Hover) Yazı</label>
                <input id="gal-text-${idx}" type="text" class="w-full border border-gray-200 rounded px-3 py-2 text-sm" value="${gal.text || ''}">
            </div>
        `;
            });

            const footer = activeTheme.footer || { address: '', email: '', phone: '', whatsapp: '', footerDesc: '' };
            document.getElementById('footer-address').value = footer.address || '';
            document.getElementById('footer-email').value = footer.email || '';
            document.getElementById('footer-phone').value = footer.phone || '';
            document.getElementById('footer-whatsapp').value = footer.whatsapp || '';
            if (document.getElementById('footer-desc')) {
                document.getElementById('footer-desc').value = footer.footerDesc || '';
            }

            // T2 Contact Fields
            if (activeTheme.contactPage) {
                const cp = activeTheme.contactPage;
                if (document.getElementById('contact-page-title-input')) document.getElementById('contact-page-title-input').value = cp.title || '';
                if (document.getElementById('contact-page-desc-input')) document.getElementById('contact-page-desc-input').value = cp.desc || '';
                if (document.getElementById('contact-hours-input')) document.getElementById('contact-hours-input').value = cp.hours || '';
                if (document.getElementById('contact-wa-title-input')) document.getElementById('contact-wa-title-input').value = cp.waTitle || '';
                if (document.getElementById('contact-wa-desc-input')) document.getElementById('contact-wa-desc-input').value = cp.waDesc || '';
            }

            // Reset to first tab
            switchThemeTab('hero');
        }

        function switchThemeTab(tabName) {
            // Buttons
            document.querySelectorAll('.theme-tab-btn').forEach(btn => {
                if (btn.getAttribute('data-tab') === tabName) {
                    btn.classList.add('bg-gray-900', 'text-white', 'shadow-lg', 'shadow-gray-200');
                    btn.classList.remove('text-gray-500', 'hover:text-gray-900', 'hover:bg-white/60');
                } else {
                    btn.classList.remove('bg-gray-900', 'text-white', 'shadow-lg', 'shadow-gray-200');
                    btn.classList.add('text-gray-500', 'hover:text-gray-900', 'hover:bg-white/60');
                }
            });
            // Contents
            document.querySelectorAll('.theme-tab-content').forEach(content => {
                if (content.id === `tab-content-${tabName}`) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        }

        function handleLayoutChange(val) {
            if (!currentThemeSettings) return;

            // Toggle Form visibility rules
            const isTheme1 = val !== 'theme2';
            const sStory = document.getElementById('section-story');
            const sCats = document.getElementById('section-cats');
            const sGal = document.getElementById('section-gallery');
            const sAbout = document.getElementById('section-about');
            const sT2 = document.getElementById('section-t2-sections');

            // Theme 2 uses Hero, T2-product-sections, and Categories.
            // Theme 1 uses Hero, Story, Categories, Gallery, About.
            if (sStory) sStory.style.display = isTheme1 ? 'block' : 'none';
            if (sCats) sCats.style.display = 'block'; // Used by both themes
            if (sGal) sGal.style.display = isTheme1 ? 'block' : 'none';
            if (sAbout) sAbout.style.display = isTheme1 ? 'block' : 'none';
            if (sT2) sT2.style.display = isTheme1 ? 'none' : 'block';

            // T2 Contact Section (inside Footer tab)
            const sT2Contact = document.getElementById('section-t2-contact');
            if (sT2Contact) sT2Contact.style.display = isTheme1 ? 'none' : 'block';

            // Hide "Kurumsal" tab if Theme 2 is selected (About page is Theme 1 only, Contact fields are in Footer tab)
            const corporateTabBtn = document.querySelector('.theme-tab-btn[data-tab="corporate"]');
            if (corporateTabBtn) {
                if (!isTheme1) {
                    // Theme 2: About section is hidden. If only about is in corporate, hide tab.
                    // Actually let's keep it visible if we want contact settings there, 
                    // but currently contact settings for T2 are in Footer tab.
                    corporateTabBtn.style.display = 'none';
                } else {
                    corporateTabBtn.style.display = 'block';
                }
            }
        }

        // Handle Single Image Uploads for Theme Settings
        async function handleSingleImageUpload(event, previewElId, hiddenB64Id) {
            const input = event.target;
            if (!input.files || input.files.length === 0) return;
            const file = input.files[0];
            const b64 = await fileToBase64(file);
            document.getElementById(previewElId).src = b64;
            document.getElementById(hiddenB64Id).value = b64;
            markAsChanged();
            input.value = ''; // reset
        }

        document.getElementById('story-img-input').addEventListener('change', (e) => handleSingleImageUpload(e, 'story-img-preview', 'story-img-b64'));

        // Prevent Enter key from submitting the form, especially in textareas
        document.getElementById('theme-settings-form').addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                // If it's a textarea, let the default newline behavior happen
                if (e.target.tagName === 'TEXTAREA') {
                    return;
                }
                // If it's a standard input, prevent form submit
                e.preventDefault();
            }
        });

        document.getElementById('theme-settings-form').addEventListener('submit', e => {
            e.preventDefault();
            if (!currentThemeSettings) return;

            markAsSaved();

            const activeIndex = currentThemeSettings.themes.findIndex(t => t.id === currentThemeSettings.activeThemeId);
            if (activeIndex === -1) return;

            // Build updated theme object
            const updatedTheme = {
                ...currentThemeSettings.themes[activeIndex],
                hero: {
                    slides: JSON.parse(JSON.stringify(currentHeroSlides))
                },
                story: {
                    imgBase64: document.getElementById('story-img-b64').value,
                    subtitle: document.getElementById('story-subtitle').value,
                    title: document.getElementById('story-title').value,
                    desc: document.getElementById('story-desc').value
                },
                catSectionTitle: document.getElementById('cat-section-title')?.value || '',
                galSectionTitle: document.getElementById('gal-section-title')?.value || '',
                galSectionDesc: document.getElementById('gal-section-desc')?.value || '',
                galCardTitle: document.getElementById('gal-card-title')?.value || '',
                galCardDesc: document.getElementById('gal-card-desc')?.value || '',
                t2NewSeasonTitle: document.getElementById('t2-newseason-title')?.value || 'Yeni Sezon',
                t2SignatureTitle: document.getElementById('t2-signature-title')?.value || 'İmza Koleksiyon',
                about: {
                    heroImg: document.getElementById('about-hero-b64').value || document.getElementById('about-hero-preview').src,
                    heroTitle: document.getElementById('about-hero-title').value,
                    heroSubtitle: document.getElementById('about-hero-subtitle').value,
                    philQuote: document.getElementById('about-phil-quote').value,
                    philDesc: document.getElementById('about-phil-desc').value,
                    craftTitle: document.getElementById('about-craft-title').value,
                    craftDesc1: document.getElementById('about-craft-desc1').value,
                    craftDesc2: document.getElementById('about-craft-desc2').value,
                    craftImg: document.getElementById('about-craft-b64').value || document.getElementById('about-craft-preview').src
                },
                footer: {
                    address: document.getElementById('footer-address').value,
                    email: document.getElementById('footer-email').value,
                    phone: document.getElementById('footer-phone').value,
                    whatsapp: document.getElementById('footer-whatsapp').value,
                    footerDesc: document.getElementById('footer-desc')?.value || ''
                },
                contactPage: {
                    title: document.getElementById('contact-page-title-input')?.value || '',
                    desc: document.getElementById('contact-page-desc-input')?.value || '',
                    hours: document.getElementById('contact-hours-input')?.value || '',
                    waTitle: document.getElementById('contact-wa-title-input')?.value || '',
                    waDesc: document.getElementById('contact-wa-desc-input')?.value || ''
                },
                t2NewSeasonProducts: [...t2SelectedState.t2NewSeasonProducts],
                t2SignatureProducts: [...t2SelectedState.t2SignatureProducts],
                categories: [],
                gallery: []
            };

            // Collect Categories
            for (let i = 0; i < 8; i++) {
                let b64 = document.getElementById(`cat-b64-${i}`)?.value || '';
                // If it's a placeholder URL and not a base64, we can treat it as empty to fallback to theme default
                if (b64.startsWith('http')) b64 = '';

                updatedTheme.categories.push({
                    id: `cat-${i + 1}`,
                    imgBase64: b64,
                    title: document.getElementById(`cat-title-${i}`)?.value || '',
                    link: document.getElementById(`cat-link-${i}`)?.value || '',
                    active: document.getElementById(`cat-active-${i}`)?.checked ?? true
                });
            }

            // Collect Gallery
            for (let i = 0; i < 5; i++) {
                let b64 = document.getElementById(`gal-b64-${i}`)?.value || '';
                if (b64.startsWith('http')) b64 = '';

                updatedTheme.gallery.push({
                    id: `gal-${i + 1}`,
                    imgBase64: b64,
                    text: document.getElementById(`gal-text-${i}`)?.value || ''
                });
            }

            currentThemeSettings.themes[activeIndex] = updatedTheme;
            localStorage.setItem(THEME_STORE_KEY, JSON.stringify(currentThemeSettings));
            updateSiteLinkButton(); // Update live link since we saved
            showToast('Tema ayarları başarıyla kaydedildi!');
        });

        function updateSiteLinkButton() {
            const stored = localStorage.getItem(THEME_STORE_KEY);
            if (!stored) return;
            const settings = JSON.parse(stored);
            const activeTheme = settings.themes.find(t => t.id === settings.activeThemeId);

            const siteLinkBtn = document.getElementById('go-to-site-btn');
            if (siteLinkBtn && activeTheme) {
                siteLinkBtn.href = activeTheme.layout === 'theme2' ? 'theme2-index.html' : 'index.html';
            }
        }

        // ═══════════════════════════════════════════════════════════════
        //  INIT
        // ═══════════════════════════════════════════════════════════════
        // MONITOR FORMS FOR UNSAVED CHANGES
        ['theme-settings-form', 'add-product-form', 'edit-product-form'].forEach(id => {
            const form = document.getElementById(id);
            if (form) {
                form.addEventListener('input', markAsChanged);
                form.addEventListener('change', markAsChanged);
            }
        });

        // Seed from JSON on first load (or if localStorage is empty)
        document.addEventListener('DOMContentLoaded', async () => {
            await seedFromJson();
            renderDashboard();
            renderProductTable();
            loadThemeSettings(); // Load theme settings into form on init
            updateSiteLinkButton();
        });

        let pendingTargetId = null;

        function showUnsavedModal(targetId) {
            pendingTargetId = targetId;
            const modal = document.getElementById('unsaved-changes-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        }

        function closeUnsavedModal() {
            const modal = document.getElementById('unsaved-changes-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
            pendingTargetId = null;
        }

        async function handleUnsavedSave() {
            const activeView = document.querySelector('.nav-item.active')?.dataset.target;

            if (activeView === 'settings') {
                document.getElementById('theme-settings-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            } else if (activeView === 'add-product') {
                document.getElementById('add-product-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            } else if (activeView === 'edit-product') {
                document.getElementById('edit-product-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }

            closeUnsavedModal();
            // switchTab will be called if hasUnsavedChanges becomes false
            if (!hasUnsavedChanges && pendingTargetId) {
                switchTab(pendingTargetId);
            }
        }

        function handleUnsavedDiscard() {
            discardAllChanges();
            const target = pendingTargetId;
            closeUnsavedModal();
            if (target) switchTab(target);
        }

        function discardAllChanges() {
            markAsSaved();
            // 1. Reset Theme Settings
            loadThemeSettings();

            // 2. Reset Add Product State
            document.getElementById('add-product-form')?.reset();
            currentAddImages = [];
            renderImageGallery('new-images-container', []);

            // 3. Reset Edit Product State
            document.getElementById('edit-product-form')?.reset();
            currentEditImages = [];
            editingProductId = null;
            renderImageGallery('edit-images-container', []);
        }
    