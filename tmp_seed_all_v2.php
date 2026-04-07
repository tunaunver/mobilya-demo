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

    // 4. Seed Theme Settings
    $pdo->exec("TRUNCATE TABLE theme_settings");
    $themeSettings = [
        'activeThemeId' => 'theme-default',
        'themes' => [
            [
                'id' => 'theme-default',
                'name' => 'Varsayılan Tema',
                'layout' => 'theme1',
                'hero' => ['slides' => []],
                'catSectionTitle' => 'Özel Kategoriler',
                'story' => [
                    'imgBase64' => '',
                    'subtitle' => 'Felsefemiz',
                    'title' => 'Ruha hitap eden tasarım.',
                    'desc' => 'Mekanınızın özünüzü yansıtması gerektiğine inanıyoruz.'
                ],
                'categories' => [
                    ['id' => "cat-1", 'imgBase64' => '', 'title' => 'Oturma', 'link' => 'products.html?category=seating', 'active' => true],
                    ['id' => "cat-2", 'imgBase64' => '', 'title' => 'Masalar', 'link' => 'products.html?category=tables', 'active' => true],
                    ['id' => "cat-3", 'imgBase64' => '', 'title' => 'Aydınlatma', 'link' => 'products.html?category=lighting', 'active' => true],
                    ['id' => "cat-4", 'imgBase64' => '', 'title' => 'Yatak Odası', 'link' => 'products.html?category=bedroom', 'active' => true],
                    ['id' => "cat-5", 'imgBase64' => '', 'title' => 'Depolama', 'link' => 'products.html?category=storage', 'active' => true],
                    ['id' => "cat-6", 'imgBase64' => '', 'title' => 'Aksesuarlar', 'link' => 'products.html?category=accessories', 'active' => true],
                    ['id' => "cat-7", 'imgBase64' => '', 'title' => 'Dış Mekan', 'link' => 'products.html?category=outdoor', 'active' => true],
                    ['id' => "cat-8", 'imgBase64' => '', 'title' => 'Ofis', 'link' => 'products.html?category=office', 'active' => true]
                ],
                'galSectionTitle' => 'Proje Galerisi',
                'galSectionDesc' => 'AURA mobilyalarının mekanları nasıl dönüştürdüğünü görün.',
                'galCardTitle' => 'Mekanınızı Tasarlayın',
                'galCardDesc' => 'Hayallerinizdeki evi yaratmak için bizimle iletişime geçin.',
                'about' => [
                    'heroImg' => 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=2000',
                    'heroTitle' => 'Hikayemiz',
                    'heroSubtitle' => 'Tasarım aracılığıyla huzur yaratmak.',
                    'philQuote' => '"Etrafımızı saran nesnelerin iç huzurumuzu derinden etkilediğine inanıyoruz."',
                    'philDesc' => 'Modern yaşamın karmaşasından uzak, dingin ve anlamlı alanlar yaratıyoruz.',
                    'craftTitle' => 'Sürdürülebilir İşçilik',
                    'craftDesc1' => "AURA'nın her bir mobilya parçası hayata sorumlu şekilde tedarik edilen malzemelerle başlar.",
                    'craftDesc2' => 'Usta zanaatkarlarımız, zamana meydan okuyan doğrama tekniklerini kullanıyor.',
                    'craftImg' => 'https://images.unsplash.com/photo-1596079890744-c1a0462d0975?auto=format&fit=crop&q=80&w=1000'
                ],
                'gallery' => [
                    ['id' => 'gal-1', 'imgBase64' => '', 'text' => 'Modern Salon'],
                    ['id' => 'gal-2', 'imgBase64' => '', 'text' => 'Yemek Odası'],
                    ['id' => 'gal-3', 'imgBase64' => '', 'text' => 'Yatak Odası'],
                    ['id' => 'gal-4', 'imgBase64' => '', 'text' => 'Mutfak Detay'],
                    ['id' => 'gal-5', 'imgBase64' => '', 'text' => 'Çalışma Köşesi']
                ],
                'footer' => [
                    'address' => 'Nişantaşı, İstanbul',
                    'email' => 'info@auramobilya.com',
                    'phone' => '+90 555 123 45 67',
                    'whatsapp' => '905551234567',
                    'footerDesc' => 'Modern mobilya tasarımında öncü marka.'
                ],
                'productFeatures' => [
                    ['icon' => 'ph-ruler', 'text' => 'Özel ölçülerde üretim imkanı mevcuttur.'],
                    ['icon' => 'ph-truck', 'text' => '14 iş günü teslimat.'],
                    ['icon' => 'ph-shield-check', 'text' => '2 yıl garanti.']
                ]
            ],
            [
                'id' => 'theme-premium',
                'name' => 'Premium Demo (Whatsapp)',
                'layout' => 'theme2',
                'hero' => ['slides' => []],
                'catSectionTitle' => 'ÖNE ÇIKANLAR',
                'story' => [
                    'imgBase64' => '',
                    'subtitle' => 'HAKKIMIZDA',
                    'title' => 'Tasarımda Mükemmellik',
                    'desc' => 'Aura Mobilya olarak, her parçada estetik ve konforu birleştiriyoruz.'
                ],
                'categories' => [
                    ['id' => 'cat-1', 'imgBase64' => '', 'title' => 'Lüks Kanepeler', 'link' => 'theme2-products.html', 'active' => true],
                    ['id' => 'cat-2', 'imgBase64' => '', 'title' => 'Ahşap Masalar', 'link' => 'theme2-products.html', 'active' => true]
                ],
                'galSectionTitle' => 'GALERİ',
                'galSectionDesc' => 'Minimalist yaşam alanlarımızdan kareler.',
                'footer' => [
                    'address' => 'Nişantaşı, İstanbul',
                    'email' => 'info@auramobilya.com',
                    'phone' => '+90 555 123 45 67',
                    'whatsapp' => '905551234567',
                    'footerDesc' => 'Premium mobilyalar.'
                ],
                'productFeatures' => [
                    ['icon' => 'ph-ruler', 'text' => 'Özel ölçülerde üretim imkanı mevcuttur.'],
                    ['icon' => 'ph-truck', 'text' => '14 iş günü teslimat.'],
                    ['icon' => 'ph-shield-check', 'text' => '2 yıl garanti.']
                ]
            ]
        ]
    ];

    $stmt = $pdo->prepare("REPLACE INTO theme_settings (id, active_theme_id, themes) VALUES (?, ?, ?)");
    $stmt->execute(['aura_theme_settings', $themeSettings['activeThemeId'], json_encode($themeSettings['themes'])]);
    echo "Theme settings seeded.\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
echo "Done!\n";
