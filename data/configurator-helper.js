/**
 * Konfigurator Fiyat Hesaplama Örneği
 */
function calculateTotalPrice(product, config) {
    let total = product.basePrice;

    // Renk farkı
    const color = product.colors.find(c => c.id === config.colorId);
    if (color) total += color.priceModifier;

    // Malzeme farkı
    const material = product.materials.find(m => m.id === config.materialId);
    if (material) total += material.priceModifier;

    // Modül farkı
    config.selectedModules.forEach(moduleId => {
        const module = product.modules.find(m => m.id === moduleId);
        if (module) total += module.priceModifier;
    });

    // Boyut farkı (opsiyonel model)
    // Örn: default genişlikten her 10cm fazlası için +20 TL
    const widthDiff = config.dimensions.width - product.dimensions.width.default;
    if (widthDiff > 0) total += (widthDiff / 10) * 20;

    return total;
}

/**
 * Kural Kontrolü Örneği
 */
function checkRules(product, config) {
    const errors = [];
    
    product.rules.forEach(rule => {
        if (config.selectedModules.includes(rule.target)) {
            const currentVal = config.dimensions[rule.property];
            if (currentVal < rule.min) {
                errors.push(rule.errorMessage);
            }
        }
    });

    return { 
        isValid: errors.length === 0, 
        errors: errors 
    };
}

// Örnek kullanım:
const sampleConfig = {
    colorId: "oak",
    materialId: "mdf",
    dimensions: { width: 120, height: 210, depth: 40 }, // Hata vermeli (deep < 45)
    selectedModules: ["drawer", "door"]
};
