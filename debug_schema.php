<?php
require_once 'api/db.php';
$stmt = $pdo->query("DESCRIBE products");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
?>
