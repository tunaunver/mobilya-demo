<?php
require_once 'api/db.php';
$stmt = $pdo->query("SELECT id, name, category_id, stock, type FROM products");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
?>
