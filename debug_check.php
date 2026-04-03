<?php
require_once 'api/db.php';
$stmt = $pdo->query("SELECT id, name FROM categories");
$results = $stmt->fetchAll();
print_r($results);
?>
