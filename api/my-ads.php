<?php
require_once 'db.php';

if (!isLoggedIn()) {
    sendJson(['success' => false, 'message' => 'غير مسجل الدخول']);
}

$userId = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT ads.*, users.username FROM ads JOIN users ON ads.user_id = users.id WHERE ads.user_id = ? ORDER BY ads.created_at DESC");
$stmt->execute([$userId]);
$ads = $stmt->fetchAll();

sendJson(['success' => true, 'ads' => $ads]);
?>
