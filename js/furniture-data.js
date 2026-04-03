/**
 * Furniture Visual Metadata & Rules
 * Defines how different types of furniture are partitioned and labeled.
 */
window.FurnitureData = {
    wardrobe: {
        labels: { width: 'Genişlik', height: 'Yükseklik', depth: 'Derinlik' },
        moduleCategories: ['partition_1', 'partition_2', 'partition_3', 'kapak', 'kulp'],
        countableCategories: ['partition_1', 'partition_2', 'partition_3'],
        dynamicPartitions: true, // Allows changing number of partitions
        defaultPartitions: 2
    },
    shelf: {
        labels: { width: 'Genişlik', height: 'Yükseklik', depth: 'Derinlik' },
        moduleCategories: ['shelf_unit'],
        countableCategories: ['shelf_unit'],
        dynamicPartitions: false,
        defaultPartitions: 1
    },
    drawer_unit: {
        labels: { width: 'Genişlik', height: 'Yükseklik', depth: 'Derinlik' },
        moduleCategories: ['drawers'],
        countableCategories: ['drawers'],
        dynamicPartitions: false,
        defaultPartitions: 1
    }
};
