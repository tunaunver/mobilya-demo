<?php
require_once 'api/db.php';
$stmt = $pdo->query("SELECT id, name FROM categories");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
?>
