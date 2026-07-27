<?php
require_once 'db.php';

if (!isLoggedIn()) {
    sendJson(['success' => false, 'message' => 'غير مسجل الدخول']);
}

$userId = $_SESSION['user_id'];

// إجمالي الإعلانات
$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM ads WHERE user_id = ?");
$stmt->execute([$userId]);
$totalAds = $stmt->fetch()['total'];

// إجمالي المشاهدات
$stmt = $pdo->prepare("SELECT COALESCE(SUM(views), 0) as total FROM ads WHERE user_id = ?");
$stmt->execute([$userId]);
$totalViews = $stmt->fetch()['total'];

// الإعلانات المميزة
$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM ads WHERE user_id = ? AND is_featured = 1");
$stmt->execute([$userId]);
$featuredAds = $stmt->fetch()['total'];

// آخر نشاط
$stmt = $pdo->prepare("SELECT MAX(created_at) as last FROM ads WHERE user_id = ?");
$stmt->execute([$userId]);
$lastActivity = $stmt->fetch()['last'];
$lastActivity = $lastActivity ? date('Y-m-d H:i', strtotime($lastActivity)) : '-';

sendJson([
    'success' => true,
    'total_ads' => $totalAds,
    'total_views' => $totalViews,
    'featured_ads' => $featuredAds,
    'last_activity' => $lastActivity
]);
?>
