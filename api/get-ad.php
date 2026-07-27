<?php
require_once 'db.php';

$adId = intval($_GET['id'] ?? 0);

if ($adId <= 0) {
    sendJson(['success' => false, 'message' => 'الإعلان غير موجود']);
}

// زيادة عدد المشاهدات
$stmt = $pdo->prepare("UPDATE ads SET views = views + 1 WHERE id = ?");
$stmt->execute([$adId]);

// جلب الإعلان
$stmt = $pdo->prepare("SELECT ads.*, users.username, users.email FROM ads JOIN users ON ads.user_id = users.id WHERE ads.id = ?");
$stmt->execute([$adId]);
$ad = $stmt->fetch();

if ($ad) {
    sendJson(['success' => true, 'ad' => $ad]);
} else {
    sendJson(['success' => false, 'message' => 'الإعلان غير موجود']);
}
?>
