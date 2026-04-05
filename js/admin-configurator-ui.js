/**
 * admin-configurator-ui.js
 * Handles the Configurator Settings UI in the admin panel.
 */

window.AdminConfiguratorUI = (() => {
    
    const syncProductTypeFields = (prefix, val) => {
        // Hide all special fields first
        document.getElementById(`${prefix}-modular-fields`)?.classList.add('hidden');
        document.getElementById(`${prefix}-configurator-fields`)?.classList.add('hidden');
        
        // Show relevant
        if (val === 'modular') {
            document.getElementById(`${prefix}-modular-fields`)?.classList.remove('hidden');
            // Initialize Modular UI
            if (window.AdminModular) {
                AdminModular.init(`${prefix}-module-rows-container`, `${prefix}-add-module-row-btn`);
            }
        } else if (val === 'configurator') {
            document.getElementById(`${prefix}-configurator-fields`)?.classList.remove('hidden');
            // Initialize door model section visibility
            handleDoorsToggle(prefix);
        }
    };

    // Toggle Logic
    const initToggles = () => {
        const typeSelects = ['new-type', 'edit-type'];
        typeSelects.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('change', (e) => {
                const prefix = id.split('-')[0]; // 'new' or 'edit'
                const val = e.target.value;
                syncProductTypeFields(prefix, val);
            });
        });

        // Door System Toggles
        ['c', 'e'].forEach(prefix => {
            const el = document.getElementById(`${prefix}-doors-enabled`);
            if (el) {
                el.addEventListener('change', () => handleDoorsToggle(prefix));
            }
        });
    };

    const handleDoorsToggle = (prefix) => {
        const isEnabled = document.getElementById(`${prefix}-doors-enabled`)?.checked;
        const section = document.getElementById(`${prefix}-door-models-section`);
        if (section) {
            if (isEnabled) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        }
    };

    const addRow = (type, prefix = 'c', data = {}) => {
        const container = document.getElementById(`${prefix}-${type}s-list`);
        if (!container) return;

        if (type === 'door') {
            const count = container.querySelectorAll('.group').length;
            // Sadece kullanıcı manuel tıkladığında (data boşsa) limit kontrolü yap
            const isManualAdd = !data || Object.keys(data).length === 0;
            if (isManualAdd && count >= 2) {
                alert('Maksimum 2 kapak modeli ekleyebilirsiniz.');
                return;
            }
        }

        const row = document.createElement('div');
        row.className = "group relative bg-gray-50/50 p-4 rounded-xl border border-gray-100 hover:border-aura-gold/30 hover:bg-white transition-all shadow-sm mb-3";
        
        let innerHTML = '';
        
        if (type === 'color') {
            innerHTML = `
                <div class="grid grid-cols-12 gap-3 items-end">
                    <div class="col-span-3">
                        <label class="text-[9px] font-bold text-gray-400 uppercase mb-1 block px-1">ID (Slug)</label>
                        <input type="text" class="c-id w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:border-aura-gold outline-none" placeholder="beyaz" value="${data.id || ''}">
                    </div>
                    <div class="col-span-4">
                        <label class="text-[9px] font-bold text-gray-400 uppercase mb-1 block px-1">Renk Adı</label>
                        <input type="text" class="c-name w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:border-aura-gold outline-none" placeholder="Parlak Beyaz" value="${data.name || ''}">
                    </div>
                    <div class="col-span-2">
                        <label class="text-[9px] font-bold text-gray-400 uppercase mb-1 block px-1">HEX</label>
                        <div class="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                            <input type="color" class="c-hex w-6 h-6 border-0 bg-transparent cursor-pointer" value="${data.hex || '#ffffff'}">
                            <input type="text" class="c-hex-text w-full text-[10px] border-0 p-0 outline-none uppercase" value="${data.hex || '#ffffff'}" oninput="this.previousElementSibling.value = this.value">
                        </div>
                    </div>
                    <div class="col-span-2">
                        <label class="text-[9px] font-bold text-gray-400 uppercase mb-1 block px-1">Fiyat (+₺)</label>
                        <input type="number" class="c-price w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:border-aura-gold outline-none" placeholder="0" value="${data.priceModifier || 0}">
                    </div>
                    <div class="col-span-1 flex justify-end pb-1">
                        <button type="button" onclick="this.closest('.group').remove()" class="text-gray-300 hover:text-red-500 transition-colors p-2">
                            <i class="ph ph-trash text-lg"></i>
                        </button>
                    </div>
                </div>
            `;
        } else if (type === 'material') {
            innerHTML = `
                <div class="grid grid-cols-12 gap-3 items-end">
                    <div class="col-span-4">
                        <label class="text-[9px] font-bold text-gray-400 uppercase mb-1 block px-1">ID (Slug)</label>
                        <input type="text" class="c-id w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:border-aura-gold outline-none" placeholder="mat-mdf" value="${data.id || ''}">
                    </div>
                    <div class="col-span-5">
                        <label class="text-[9px] font-bold text-gray-400 uppercase mb-1 block px-1">Malzeme Adı</label>
                        <input type="text" class="c-name w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:border-aura-gold outline-none" placeholder="Mat Lake MDF" value="${data.name || ''}">
                    </div>
                    <div class="col-span-2">
                        <label class="text-[9px] font-bold text-gray-400 uppercase mb-1 block px-1">Fiyat (+₺)</label>
                        <input type="number" class="c-price w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:border-aura-gold outline-none" placeholder="0" value="${data.priceModifier || 0}">
                    </div>
                    <div class="col-span-1 flex justify-end pb-1">
                        <button type="button" onclick="this.closest('.group').remove()" class="text-gray-300 hover:text-red-500 transition-colors p-2">
                            <i class="ph ph-trash text-lg"></i>
                        </button>
                    </div>
                </div>
            `;
        } else if (type === 'module') {
            innerHTML = `
                <div class="grid grid-cols-12 gap-3 items-end">
                    <div class="col-span-4">
                        <label class="text-[9px] font-bold text-gray-400 uppercase mb-1 block px-1">ID (drawer, shelf, door...)</label>
                        <input type="text" class="c-id w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:border-aura-gold outline-none" placeholder="shelf" value="${data.id || ''}">
                    </div>
                    <div class="col-span-5">
                        <label class="text-[9px] font-bold text-gray-400 uppercase mb-1 block px-1">Modül Adı</label>
                        <input type="text" class="c-name w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:border-aura-gold outline-none" placeholder="Açık Raf" value="${data.name || ''}">
                    </div>
                    <div class="col-span-2">
                        <label class="text-[9px] font-bold text-gray-400 uppercase mb-1 block px-1">Fiyat (+₺)</label>
                        <input type="number" class="c-price w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:border-aura-gold outline-none" placeholder="0" value="${data.priceModifier || 0}">
                    </div>
                    <div class="col-span-1 flex justify-end pb-1">
                        <button type="button" onclick="this.closest('.group').remove()" class="text-gray-300 hover:text-red-500 transition-colors p-2">
                            <i class="ph ph-trash text-lg"></i>
                        </button>
                    </div>
                </div>
            `;
        } else if (type === 'door' || type === 'handle' || type === 'rule') {
            // Door/Handle are fixed UI. Rule is removed.
            return;
        }
        
        row.innerHTML = innerHTML;
        container.appendChild(row);
    };

    const getData = (prefix = 'c') => {
        const config = {
            visualType: document.getElementById(`${prefix}-visual-type`)?.value || 'wardrobe',
            partitions: {
                min: parseInt(document.getElementById(`${prefix}-part-min`)?.value) || 1,
                max: parseInt(document.getElementById(`${prefix}-part-max`)?.value) || 4
            },
            basePrice: parseFloat(document.getElementById(`${prefix}-price-base`)?.value) || 0,
            pricePerCmWidth: parseFloat(document.getElementById(`${prefix}-price-w`)?.value) || 0,
            pricePerCmHeight: parseFloat(document.getElementById(`${prefix}-price-h`)?.value) || 0,
            pricePerCmDepth: parseFloat(document.getElementById(`${prefix}-price-d`)?.value) || 0,
            pricePerPartition: parseFloat(document.getElementById(`${prefix}-price-partition`)?.value) || 0,
            
            // Layout Rules
            hangerHeight: parseInt(document.getElementById(`${prefix}-hanger-height`)?.value) || 100,
            shelfHeight: parseInt(document.getElementById(`${prefix}-shelf-height`)?.value) || 30,
            drawerHeight: parseInt(document.getElementById(`${prefix}-drawer-height`)?.value) || 20,

            dimensions: {
                width: { 
                    min: parseInt(document.getElementById(`${prefix}-w-min`)?.value) || 0,
                    max: parseInt(document.getElementById(`${prefix}-w-max`)?.value) || 0,
                    default: parseInt(document.getElementById(`${prefix}-w-def`)?.value) || 0
                },
                height: { 
                    min: parseInt(document.getElementById(`${prefix}-h-min`)?.value) || 0,
                    max: parseInt(document.getElementById(`${prefix}-h-max`)?.value) || 0,
                    default: parseInt(document.getElementById(`${prefix}-h-def`)?.value) || 0
                },
                depth: { 
                    min: parseInt(document.getElementById(`${prefix}-d-min`)?.value) || 0,
                    max: parseInt(document.getElementById(`${prefix}-d-max`)?.value) || 0,
                    default: parseInt(document.getElementById(`${prefix}-d-def`)?.value) || 0
                }
            },
            doorsEnabled: document.getElementById(`${prefix}-doors-enabled`)?.checked ?? false,
            handlesEnabled: document.getElementById(`${prefix}-handles-enabled`)?.checked ?? false,
            handlesPrice: parseFloat(document.getElementById(`${prefix}-handles-price`)?.value) || 0,
            colors: [],
            materials: [],
            modules: [],
            doorModels: [],
            rules: []
        };

        // Collect colors
        document.querySelectorAll(`#${prefix}-colors-list .group`).forEach(row => {
            const idEl = row.querySelector('.c-id');
            const nameEl = row.querySelector('.c-name');
            if (nameEl && nameEl.value) {
                config.colors.push({
                    id: idEl.value || nameEl.value.toLowerCase().replace(/\s+/g, '-'),
                    name: nameEl.value,
                    hex: row.querySelector('.c-hex').value,
                    priceModifier: parseFloat(row.querySelector('.c-price').value) || 0
                });
            }
        });

        // Collect materials
        document.querySelectorAll(`#${prefix}-materials-list .group`).forEach(row => {
            const idEl = row.querySelector('.c-id');
            const nameEl = row.querySelector('.c-name');
            if (nameEl && nameEl.value) {
                config.materials.push({
                    id: idEl.value || nameEl.value.toLowerCase().replace(/\s+/g, '-'),
                    name: nameEl.value,
                    priceModifier: parseFloat(row.querySelector('.c-price').value) || 0
                });
            }
        });

        // Collect modules
        document.querySelectorAll(`#${prefix}-modules-list .group`).forEach(row => {
            const idEl = row.querySelector('.c-id');
            const nameEl = row.querySelector('.c-name');
            if (nameEl && nameEl.value) {
                config.modules.push({
                    id: idEl.value || nameEl.value.toLowerCase().replace(/\s+/g, '-'),
                    name: nameEl.value,
                    priceModifier: parseFloat(row.querySelector('.c-price').value) || 0
                });
            }
        });

        // Collect fixed door models (Toggles) - Only if master switch is ON
        if (config.doorsEnabled) {
            const plainEnabled = document.getElementById(`${prefix}-door-plain-enabled`)?.checked;
            const mirroredEnabled = document.getElementById(`${prefix}-door-mirrored-enabled`)?.checked;
            
            if (plainEnabled) {
                config.doorModels.push({ 
                    id: 'plain', 
                    name: 'Düz Kapak', 
                    priceModifier: parseFloat(document.getElementById(`${prefix}-door-plain-price`)?.value) || 0 
                });
            }
            if (mirroredEnabled) {
                config.doorModels.push({ 
                    id: 'mirrored', 
                    name: 'Aynalı Kapak', 
                    priceModifier: parseFloat(document.getElementById(`${prefix}-door-mirrored-price`)?.value) || 0 
                });
            }
        }

        // Handles are now a fixed toggle + price - Only if master switch is ON
        config.handles = config.handlesEnabled ? [{ id: 'standard', name: 'Standart Kulp', priceModifier: config.handlesPrice }] : [];

        // Rules are removed from UI
        config.rules = [];

        return config;
    };

    return { initToggles, addRow, getData, handleDoorsToggle, syncProductTypeFields };
})();

// Auto-init on script load
document.addEventListener('DOMContentLoaded', () => {
    AdminConfiguratorUI.initToggles();
});
