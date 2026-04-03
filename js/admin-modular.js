/**
 * admin-modular.js
 * Handles the "Main Product + Sub-Products" (Modular) UI in the admin panel.
 */

window.AdminModular = (() => {
    let moduleContainer = null;
    let addBtn = null;

    const createModuleRow = (data = {}) => {
        const row = document.createElement('div');
        row.className = "module-row grid grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 relative group";
        
        row.innerHTML = `
            <div class="col-span-12 md:col-span-1">
                <div class="w-12 h-12 rounded-lg bg-white border border-gray-200 overflow-hidden flex items-center justify-center relative group/img">
                    <img class="m-preview w-full h-full object-cover ${data.image ? '' : 'hidden'}" src="${data.image || ''}">
                    <i class="ph ph-image text-gray-300 text-xl ${data.image ? 'hidden' : ''}"></i>
                    <input type="file" class="m-file-input absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
                </div>
            </div>
            <div class="col-span-12 md:col-span-4">
                <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Modül Adı</label>
                <input type="text" class="m-name w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm" value="${data.name || ''}" placeholder="Örn: Sol Kol">
            </div>
            <div class="col-span-6 md:col-span-2">
                <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Fiyat (₺)</label>
                <input type="number" class="m-price w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm" value="${data.price || ''}" placeholder="0">
            </div>
            <div class="col-span-6 md:col-span-2">
                <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Stok</label>
                <input type="number" class="m-stock w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm" value="${data.stock || ''}" placeholder="0">
            </div>
            <div class="col-span-12 md:col-span-3 flex items-center space-x-2">
                <button type="button" class="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center space-x-1" onclick="this.closest('.module-row').querySelector('.m-file-input').click()">
                    <i class="ph ph-camera"></i>
                    <span>Resim Ekle</span>
                </button>
                <div class="flex-grow"></div>
                <button type="button" onclick="this.closest('.module-row').remove()" class="text-red-400 hover:text-red-600 p-2">
                    <i class="ph ph-trash text-xl"></i>
                </button>
            </div>
        `;

        // Handle file input
        const fileInput = row.querySelector('.m-file-input');
        const preview = row.querySelector('.m-preview');
        const icon = row.querySelector('.ph-image');

        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(re) {
                    preview.src = re.target.result;
                    preview.classList.remove('hidden');
                    icon.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        });

        return row;
    };

    return {
        init: (containerId, addBtnId) => {
            const container = document.getElementById(containerId);
            const btn = document.getElementById(addBtnId);
            
            // Set for renderModules use
            moduleContainer = container;
            
            if (btn && container) {
                // Use a named function so we can remove it if already added
                const handleAddClick = () => {
                    const row = createModuleRow();
                    container.appendChild(row);
                };

                if (btn._modularInit) {
                    btn.removeEventListener('click', btn._modularInit);
                }
                
                btn.addEventListener('click', handleAddClick);
                btn._modularInit = handleAddClick;
            }
        },

        renderModules: (modules = []) => {
            if (!moduleContainer) return;
            moduleContainer.innerHTML = '';
            if (modules && modules.length > 0) {
                modules.forEach(m => {
                    moduleContainer.appendChild(createModuleRow(m));
                });
            } else {
                // Add one empty row by default
                moduleContainer.appendChild(createModuleRow());
            }
        },

        getModulesData: () => {
            if (!moduleContainer) return [];
            const rows = moduleContainer.querySelectorAll('.module-row');
            const data = [];
            rows.forEach(row => {
                const name = row.querySelector('.m-name').value;
                const price = parseFloat(row.querySelector('.m-price').value) || 0;
                const stock = parseInt(row.querySelector('.m-stock').value) || 0;
                const previewImg = row.querySelector('.m-preview');
                const image = previewImg.classList.contains('hidden') ? '' : previewImg.src;

                if (name) {
                    data.push({
                        id: 'm' + Date.now() + Math.random().toString(36).substr(2, 5),
                        name,
                        price,
                        stock,
                        image
                    });
                }
            });
            return data;
        }
    };
})();
