<?php
/**
 * api/migrate.php
 * Script to migrate data from Supabase to MySQL
 */

require_once 'db.php';

// GET handler for Full Supabase Migration
$supabase_url = "https://nnweywzddgtwrnwjnssx.supabase.co/rest/v1";
$supabase_key = "sb_publishable_t7Nnnb8fZOAw8hx8bkggnw_gpNmuqLP";

function fetchSupabase($table) {
    global $supabase_url, $supabase_key;
    $ch = curl_init("$supabase_url/$table?select=*");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "apikey: $supabase_key",
        "Authorization: Bearer $supabase_key"
    ]);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if($response === false) echo "CURL Error: " . curl_error($ch) . "\n";
    // echo "HTTP Code: $http_code\nResponse: $response\n"; 
    curl_close($ch);
    
    if ($http_code !== 200) return null;
    return json_decode($response, true);
}

$results = [
    "profiles" => 0,
    "categories" => 0,
    "products" => 0,
    "orders" => 0,
    "theme_settings" => 0
];

// 1. Migrate Profiles
$profiles = fetchSupabase('profiles');
if (is_array($profiles)) {
    foreach ($profiles as $p) {
        $stmt = $pdo->prepare("REPLACE INTO profiles (id, email, full_name, role) VALUES (?, ?, ?, ?)");
        $stmt->execute([$p['id'], $p['email'], $p['full_name'] ?? '', $p['role'] ?? 'user']);
        $results['profiles']++;
    }
}

// 2. Migrate Categories
$categories = fetchSupabase('categories');
if (is_array($categories)) {
    foreach ($categories as $c) {
        $stmt = $pdo->prepare("REPLACE INTO categories (id, name, parent_id, img_base64, seo_title, seo_description, slug) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $c['id'], 
            $c['name'], 
            $c['parent_id'] ?? $c['parentId'] ?? null, 
            $c['img_base64'] ?? $c['imgBase64'] ?? null,
            $c['seo_title'] ?? $c['seoTitle'] ?? null,
            $c['seo_description'] ?? $c['seoDescription'] ?? null,
            $c['slug'] ?? null
        ]);
        $results['categories']++;
    }
}

// 3. Migrate Products
$products = fetchSupabase('products');
if (is_array($products)) {
    foreach ($products as $p) {
        $sql = "REPLACE INTO products (
            id, name, type, category_id, price, stock, images, description, 
            is_new, dimensions, colors, materials, modules, door_models, 
            handles, partitions, pricing_rules, visual_type, seo_title, 
            seo_description, slug
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $p['id'],
            $p['name'],
            $p['type'] ?? 'simple',
            $p['category_id'] ?? $p['category'] ?? null,
            $p['price'] ?? 0,
            $p['stock'] ?? 0,
            is_array($p['images']) ? json_encode($p['images']) : ($p['images'] ?? '[]'),
            $p['description'] ?? $p['desc'] ?? '',
            ($p['is_new'] ?? $p['isNew'] ?? false) ? 1 : 0,
            isset($p['dimensions']) ? json_encode($p['dimensions']) : null,
            isset($p['colors']) ? json_encode($p['colors']) : null,
            isset($p['materials']) ? json_encode($p['materials']) : null,
            isset($p['modules']) ? json_encode($p['modules']) : null,
            isset($p['door_models']) ? json_encode($p['door_models']) : null,
            isset($p['handles']) ? json_encode($p['handles']) : null,
            isset($p['partitions']) ? json_encode($p['partitions']) : null,
            isset($p['pricing_rules']) ? json_encode($p['pricing_rules']) : null,
            $p['visual_type'] ?? $p['visualType'] ?? null,
            $p['seo_title'] ?? $p['seoTitle'] ?? null,
            $p['seo_description'] ?? $p['seoDescription'] ?? null,
            $p['slug'] ?? null
        ]);
        $results['products']++;
    }
}

// 4. Migrate Orders
$orders = fetchSupabase('orders');
if (is_array($orders)) {
    foreach ($orders as $o) {
        $stmt = $pdo->prepare("REPLACE INTO orders (id, customer_id, items, status, total_price, order_date) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $o['id'],
            $o['customer_id'] ?? $o['customerId'] ?? null,
            is_array($o['items']) ? json_encode($o['items']) : ($o['items'] ?? '[]'),
            $o['status'] ?? 'Hazırlanıyor',
            $o['total_price'] ?? $o['totalPrice'] ?? $o['total'] ?? 0,
            $o['order_date'] ?? $o['date'] ?? date('Y-m-d H:i:s')
        ]);
        $results['orders']++;
    }
}

// 5. Migrate Theme Settings
$settings = fetchSupabase('theme_settings');
if (is_array($settings)) {
    foreach ($settings as $s) {
        $stmt = $pdo->prepare("REPLACE INTO theme_settings (id, active_theme_id, themes) VALUES (?, ?, ?)");
        $stmt->execute([
            $s['id'],
            $s['active_theme_id'] ?? $s['activeThemeId'] ?? 'theme-default',
            is_array($s['themes']) ? json_encode($s['themes']) : $s['themes']
        ]);
        $results['theme_settings']++;
    }
}

echo json_encode([
    "success" => true,
    "message" => "Full Supabase Migration complete",
    "results" => $results
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
