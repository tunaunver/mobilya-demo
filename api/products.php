<?php
/**
 * api/products.php
 * CRUD operations for products
 */

require_once 'db.php';
error_reporting(E_ALL);
ini_set('display_errors', 1);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $product = $stmt->fetch();
            if ($product) {
                // Decode JSON fields
                $jsonFields = ['images', 'dimensions', 'colors', 'materials', 'modules', 'door_models', 'handles', 'partitions', 'pricing_rules'];
                foreach ($jsonFields as $field) {
                    if (isset($product[$field])) $product[$field] = json_decode($product[$field], true);
                }
                echo json_encode($product);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Product not found"]);
            }
        } else {
            $stmt = $pdo->query("SELECT * FROM products ORDER BY created_at DESC");
            $products = $stmt->fetchAll();
            $jsonFields = ['images', 'dimensions', 'colors', 'materials', 'modules', 'door_models', 'handles', 'partitions', 'pricing_rules'];
            foreach ($products as &$p) {
                foreach ($jsonFields as $field) {
                    if (isset($p[$field])) $p[$field] = json_decode($p[$field], true);
                }
            }
            echo json_encode($products);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid data"]);
            break;
        }

        $id = $data['id'] ?? 'p' . time();
        $name = $data['name'] ?? 'Adsız Ürün';
        $type = $data['type'] ?? 'simple';
        $category_id = (!empty($data['category'])) ? $data['category'] : null;
        $price = $data['price'] ?? 0;
        $stock = $data['stock'] ?? 0;
        $description = $data['desc'] ?? '';
        $is_new = ($data['isNew'] ?? false) ? 1 : 0;
        $visual_type = $data['visualType'] ?? null;
        $seo_title = $data['seoTitle'] ?? '';
        $seo_description = $data['seoDescription'] ?? '';
        $slug = $data['slug'] ?? '';

        // JSON fields
        $images = json_encode($data['images'] ?? []);
        $dimensions = json_encode($data['dimensions'] ?? null);
        $colors = json_encode($data['colors'] ?? []);
        $materials = json_encode($data['materials'] ?? []);
        $modules = json_encode($data['modules'] ?? []);
        $door_models = json_encode($data['doorModels'] ?? []);
        $handles = json_encode($data['handles'] ?? []);
        $partitions = json_encode($data['partitions'] ?? null);
        $pricing_rules = json_encode([
            "pricePerCmWidth" => $data['pricePerCmWidth'] ?? 0,
            "pricePerCmHeight" => $data['pricePerCmHeight'] ?? 0,
            "pricePerCmDepth" => $data['pricePerCmDepth'] ?? 0
        ]);

        $sql = "REPLACE INTO products (id, name, type, category_id, price, stock, images, description, is_new, dimensions, colors, materials, modules, door_models, handles, partitions, pricing_rules, visual_type, seo_title, seo_description, slug) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id, $name, $type, $category_id, $price, $stock, $images, $description, $is_new, $dimensions, $colors, $materials, $modules, $door_models, $handles, $partitions, $pricing_rules, $visual_type, $seo_title, $seo_description, $slug]);
            echo json_encode(["success" => true, "id" => $id]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Save failed", "details" => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            echo json_encode(["success" => true]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID required"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}
