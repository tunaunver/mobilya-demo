/**
 * Advanced Furniture Configurator Engine
 * Robust state management for partitions, countable modules, and more.
 */

window.createConfigurator = function(product) {
    const defaultData = (window.FurnitureData && product.visualType) ? window.FurnitureData[product.visualType] : { defaultPartitions: 1 };
    
    // Initial State structure with safety defaults
    let state = {
        width: product.dimensions?.width?.default || 200,
        height: product.dimensions?.height?.default || 210,
        depth: product.dimensions?.depth?.default || 60,
        selectedColor: (product.colors && product.colors.length > 0) ? product.colors[0].id : null,
        selectedMaterial: (product.materials && product.materials.length > 0) ? product.materials[0].id : null,
        partitionCount: defaultData.defaultPartitions || 1,
        handlesEnabled: product.handlesEnabled ?? true,
        selectedModules: {}, 
        rotation: -25, 
        errors: []
    };

    // Callback listeners
    let listeners = [];

    /**
     * Internal: Notify all subscribers of state changes
     */
    const notify = () => {
        const summary = getSummary();
        listeners.forEach(cb => cb(summary));
    };

    /**
     * Updates width, height or depth
     */
    const updateDimension = (type, value) => {
        const dim = product.dimensions[type];
        if (!dim) return;
        const val = parseInt(value);
        state[type] = Math.min(Math.max(val, dim.min), dim.max);
        notify();
    };

    /**
     * Updates Number of Partitions (Columns)
     */
    const updatePartitionCount = (count) => {
        const val = parseInt(count);
        const minP = product.partitions?.min || 1;
        const maxP = product.partitions?.max || 5;
        state.partitionCount = Math.min(Math.max(val, minP), maxP);
        
        // Cleanup selection for non-existent partitions
        Object.keys(state.selectedModules).forEach(key => {
            if (key.startsWith('partition_')) {
                const pNum = parseInt(key.split('_')[1]);
                if (pNum > state.partitionCount) delete state.selectedModules[key];
            }
        });
        
        notify();
    };

    /**
     * Color selection
     */
    const selectColor = (colorId) => {
        state.selectedColor = colorId;
        notify();
    };

    /**
     * Material selection
     */
    const selectMaterial = (materialId) => {
        state.selectedMaterial = materialId;
        notify();
    };

    /**
     * Module Selection for a category (e.g. 'partition_1', 'kapak')
     */
    const selectModuleType = (moduleId, category, subType = 'id') => {
        if (!state.selectedModules[category]) {
            state.selectedModules[category] = { id: null, shelfCount: 0, drawerCount: 0, doorModel: 'none' };
        }

        const key = subType === 'door' ? 'doorModel' : 'id';
        state.selectedModules[category][key] = moduleId;
        notify();
    };

    /**
     * Updates count of sub-modules (Shelf or Drawer) within a category/partition
     */
    const updateModuleCount = (category, delta, type = 'shelf') => {
        if (!state.selectedModules[category]) {
            state.selectedModules[category] = { id: null, shelfCount: 0, drawerCount: 0, doorModel: 'none' };
        }

        const data = state.selectedModules[category];
        const isHanger = data.id === 'hanger';
        
        // Physical dimensions from product/defaults
        const hangerH = product.hangerHeight || 100;
        const shelfH = product.shelfHeight || 30;
        const drawerH = product.drawerHeight || 20;

        const availableHeight = state.height - (isHanger ? hangerH : 0);
        
        if (type === 'shelf') {
            const current = data.shelfCount || 0;
            const otherHeight = (data.drawerCount || 0) * drawerH;
            const maxShelves = Math.floor((availableHeight - otherHeight) / shelfH);
            data.shelfCount = Math.min(Math.max(0, current + delta), maxShelves);
        } else {
            const current = data.drawerCount || 0;
            const otherHeight = (data.shelfCount || 0) * shelfH;
            const maxDrawers = Math.floor((availableHeight - otherHeight) / drawerH);
            data.drawerCount = Math.min(Math.max(0, current + delta), maxDrawers);
        }
        
        notify();
    };

    /**
     * Updates viewing angle (rotation)
     */
    const updateRotation = (angle) => {
        state.rotation = parseInt(angle);
        notify();
    };

    /**
     * Toggles handles on/off
     */
    const toggleHandles = (enabled) => {
        state.handlesEnabled = !!enabled;
        notify();
    };

    /**
     * Pricing Calculation
     */
    const calculatePrice = () => {
        let total = product.basePrice || 0;
        
        // Linear Dimension Impact
        if (product.pricePerCmWidth) {
            total += (state.width * product.pricePerCmWidth);
            total += (state.height * product.pricePerCmHeight || 0);
            total += (state.depth * product.pricePerCmDepth || 0);
        } else {
            // Fallback to legacy volume factor
            const dimFactor = (state.width * state.height * state.depth) / (product.dimensions.width.default * product.dimensions.height.default * product.dimensions.depth.default);
            total *= (0.7 + (0.3 * dimFactor));
        }

        // Variation Modifiers
        const color = product.colors.find(c => c.id === state.selectedColor);
        if (color) total += color.priceModifier || 0;

        const material = product.materials.find(m => m.id === state.selectedMaterial);
        if (material) total += material.priceModifier || 0;

        // Partition Price Impact
        if (product.pricePerPartition && state.partitionCount > 1) {
            total += (state.partitionCount - 1) * product.pricePerPartition;
        }

        // Modules Impact
        Object.entries(state.selectedModules).forEach(([cat, data]) => {
            // Partition Modules (Shelf/Drawer Counters)
            const shelfMod = product.modules.find(m => m.id === 'shelf');
            const drawerMod = product.modules.find(m => m.id === 'drawer');
            const hangerMod = product.modules.find(m => m.id === 'hanger');
            
            if (shelfMod) total += (data.shelfCount || 0) * shelfMod.priceModifier;
            if (drawerMod) total += (data.drawerCount || 0) * drawerMod.priceModifier;
            if (data.id === 'hanger' && hangerMod) total += hangerMod.priceModifier;

            // Per-Partition Door Models
            if (data.doorModel && data.doorModel !== 'none') {
                const doorMod = (product.doorModels || []).find(dm => dm.id === data.doorModel);
                if (doorMod) total += doorMod.priceModifier;
            }
        });

        // Global Handle Price (Simplified)
        if (state.handlesEnabled) {
            const hPrice = product.handlesPrice || 50; 
            total += (hPrice * state.partitionCount);
        }

        return Math.round(total);
    };

    /**
     * Unique SKU Generator
     */
    const generateSKU = () => {
        const color = product.colors.find(c => c.id === state.selectedColor);
        const mat = product.materials.find(m => m.id === state.selectedMaterial);
        
        let skuParts = [
            product.id,
            `W${state.width}`,
            `H${state.height}`,
            color ? color.id.substring(0,2).toUpperCase() : 'XX',
            `P${state.partitionCount}`
        ];

        return skuParts.join('-').toUpperCase();
    };

    /**
     * Summary Object for UI and Preview
     */
    const getSummary = () => {
        const totalPrice = calculatePrice();
        const sku = generateSKU();
        
        return {
            configuration: { ...state },
            totalPrice,
            sku,
            color: product.colors.find(c => c.id === state.selectedColor),
            material: product.materials.find(m => m.id === state.selectedMaterial),
            timestamp: Date.now()
        };
    };

    // Public API
    return {
        updateDimension,
        updatePartitionCount,
        selectColor,
        selectMaterial,
        selectModuleType,
        updateModuleCount,
        updateRotation,
        toggleHandles,
        getSummary,
        onUpdate: (cb) => { listeners.push(cb); },
    };
};
