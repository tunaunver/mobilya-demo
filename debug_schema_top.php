<?php
require_once 'api/db.php';
$stmt = $pdo->query("DESCRIBE products");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(array_slice($rows, 0, 10), JSON_PRETTY_PRINT);
?>
