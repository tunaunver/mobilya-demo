<?php
require_once 'api/db.php';
$stmt = $pdo->query("SELECT id, name, visual_type, pricing_rules FROM products WHERE type = 'configurator'");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
?>
