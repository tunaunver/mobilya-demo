<?php
require_once 'api/db.php';

try {
    // Disable FK checks and truncate
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("TRUNCATE TABLE products");
    $pdo->exec("TRUNCATE TABLE categories");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    echo "Tables truncated.\n";

    // 1. Seed Categories
    $categories = [
        ['id' => 'cat_1', 'name' => 'Oturma Grupları', 'slug' => 'oturma-gruplari'],
        ['id' => 'cat_2', 'name' => 'Masalar', 'slug' => 'masalar'],
        ['id' => 'cat_3', 'name' => 'Aydınlatma', 'slug' => 'aydinlatma'],
        ['id' => 'cat_4', 'name' => 'Yatak Odası', 'slug' => 'yatak-odasi'],
        ['id' => 'cat_5', 'name' => 'Depolama', 'slug' => 'depolama'],
        ['id' => 'cat_6', 'name' => 'Aksesuarlar', 'slug' => 'aksesuarlar'],
        ['id' => 'cat_7', 'name' => 'Ofis', 'slug' => 'ofis']
    ];

    $catMap = [];
    foreach ($categories as $cat) {
        $stmt = $pdo->prepare("REPLACE INTO categories (id, name, slug) VALUES (?, ?, ?)");
        $stmt->execute([$cat['id'], $cat['name'], $cat['slug']]);
        $catMap[$cat['name']] = $cat['id'];
    }
    echo "Categories seeded.\n";

    // 2. Seed Simple Products
    $simpleRaw = file_get_contents('data/products.json');
    $simpleProducts = json_decode($simpleRaw, true);
    if (!$simpleProducts) echo "No simple products found in data/products.json\n";
    else {
        foreach ($simpleProducts as $p) {
            $id = 'p_' . ($p['id'] ?? uniqid());
            $catId = $catMap[$p['category']] ?? $catMap['Oturma Grupları']; // Fallback
            $images = json_encode([$p['image'] ?? '']);
            
            $stmt = $pdo->prepare("REPLACE INTO products (id, name, type, category_id, price, images, is_new, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id, 
                $p['name'], 
                'simple', 
                $catId, 
                $p['price'] ?? 0, 
                $images, 
                ($p['isNew'] ?? false) ? 1 : 0,
                $p['description'] ?? $p['desc'] ?? ''
            ]);
        }
        echo "Simple products seeded.\n";
    }

    // 3. Seed Configurator Products
    $configRaw = file_get_contents('data/configurator-model.json');
    $configProducts = json_decode($configRaw, true);
    if (!$configProducts) echo "No configurator products found in data/configurator-model.json\n";
    else {
        foreach ($configProducts as $p) {
            $id = $p['id'];
            $catId = $catMap[$p['category'] ?? ''] ?? $catMap['Yatak Odası']; // Fallback
            $images = json_encode($p['images'] ?? ["https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=800"]);
            
            $pricing_rules = json_encode([
                "pricePerCmWidth" => $p['pricePerCmWidth'] ?? 0,
                "pricePerCmHeight" => $p['pricePerCmHeight'] ?? 0,
                "pricePerCmDepth" => $p['pricePerCmDepth'] ?? 0
            ]);

            $sql = "REPLACE INTO products (
                id, name, type, category_id, price, images, dimensions, colors, materials, 
                modules, door_models, handles, partitions, pricing_rules, visual_type, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $id,
                $p['name'],
                'configurator',
                $catId,
                $p['basePrice'] ?? 0,
                $images,
                json_encode($p['dimensions'] ?? null),
                json_encode($p['colors'] ?? []),
                json_encode($p['materials'] ?? []),
                json_encode($p['modules'] ?? []),
                json_encode($p['doorModels'] ?? $p['door_models'] ?? []),
                json_encode($p['handles'] ?? []),
                json_encode($p['partitions'] ?? null),
                $pricing_rules,
                $p['visualType'] ?? $p['visual_type'] ?? null,
                $p['description'] ?? $p['desc'] ?? ''
            ]);
        }
        echo "Configurator products seeded.\n";
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
echo "Done!\n";
