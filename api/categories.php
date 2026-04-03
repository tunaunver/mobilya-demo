<?php
/**
 * api/categories.php
 * CRUD operations for categories
 */

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM categories ORDER BY name ASC");
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['id'])) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid data"]);
            break;
        }

        $sql = "REPLACE INTO categories (id, name, parent_id, img_base64, seo_title, seo_description, slug) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['id'],
                $data['name'],
                $data['parent_id'] ?? null,
                $data['img_base64'] ?? null,
                $data['seo_title'] ?? null,
                $data['seo_description'] ?? null,
                $data['slug'] ?? null
            ]);
            echo json_encode(["success" => true]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Save failed", "details" => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
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
