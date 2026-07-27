<?php
require_once 'db.php';

if (!isLoggedIn()) {
    sendJson(['success' => false, 'message' => 'غير مسجل الدخول']);
}

$adId = intval($_GET['id'] ?? 0);

if ($adId <= 0) {
    sendJson(['success' => false, 'message' => 'الإعلان غير موجود']);
}

// التحقق من أن الإعلان يخص المستخدم
$stmt = $pdo->prepare("SELECT id, image FROM ads WHERE id = ? AND user_id = ?");
$stmt->execute([$adId, $_SESSION['user_id']]);
$ad = $stmt->fetch();

if (!$ad) {
    sendJson(['success' => false, 'message' => 'لا يمكنك حذف هذا الإعلان']);
}

// حذف الصورة إذا كانت موجودة
if ($ad['image'] && file_exists('../' . $ad['image'])) {
    unlink('../' . $ad['image']);
}

// حذف الإعلان
$stmt = $pdo->prepare("DELETE FROM ads WHERE id = ? AND user_id = ?");
$stmt->execute([$adId, $_SESSION['user_id']]);

header('Location: ../dashboard.html');
exit;
?>
