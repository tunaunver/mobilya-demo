<?php
/**
 * api/auth.php
 * Authentication and profile management (replacing Supabase Auth)
 */

require_once 'db.php';

session_start();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get current user profile
        if (isset($_SESSION['user_id'])) {
            $stmt = $pdo->prepare("SELECT id, email, full_name, role FROM profiles WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            echo json_encode($stmt->fetch());
        } else if (isset($_GET['all'])) { // For admin view
            $stmt = $pdo->query("SELECT id, email, full_name, role FROM profiles");
            echo json_encode($stmt->fetchAll());
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $_GET['action'] ?? 'login';

        if ($action === 'register') {
            $id = $data['id'] ?? 'u' . time();
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '123456';
            $full_name = $data['full_name'] ?? '';
            $role = $data['role'] ?? 'user';
            
            $hash = password_hash($password, PASSWORD_DEFAULT);

            $sql = "INSERT INTO profiles (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)";
            try {
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$id, $email, $hash, $full_name, $role]);
                echo json_encode(["success" => true, "id" => $id]);
            } catch (\PDOException $e) {
                http_response_code(400);
                echo json_encode(["error" => "Registration failed", "details" => $e->getMessage()]);
            }
        } else if ($action === 'login') {
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';

            $stmt = $pdo->prepare("SELECT * FROM profiles WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['role'] = $user['role'];
                unset($user['password_hash']);
                echo json_encode(["success" => true, "user" => $user]);
            } else {
                http_response_code(401);
                echo json_encode(["error" => "Invalid credentials"]);
            }
        } else if ($action === 'logout') {
            session_destroy();
            echo json_encode(["success" => true]);
        }
        break;

    case 'DELETE':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("DELETE FROM profiles WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            echo json_encode(["success" => true]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}
