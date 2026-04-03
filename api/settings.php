<?php
/**
 * api/settings.php
 * CRUD operations for theme settings
 */

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM theme_settings LIMIT 1");
        $settings = $stmt->fetch();
        if ($settings) {
            $settings['themes'] = json_decode($settings['themes'], true);
            echo json_encode($settings);
        } else {
            // Return empty or default
            echo json_encode(["active_theme_id" => "theme-default", "themes" => []]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid data"]);
            break;
        }

        $id = 'aura_theme_settings';
        $active_theme_id = $data['activeThemeId'] ?? 'theme-default';
        $themes = json_encode($data['themes'] ?? []);

        $sql = "REPLACE INTO theme_settings (id, active_theme_id, themes) VALUES (?, ?, ?)";
        
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id, $active_theme_id, $themes]);
            echo json_encode(["success" => true]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Save failed", "details" => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}
