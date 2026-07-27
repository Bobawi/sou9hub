<?php
require_once 'db.php';

$limit = intval($_GET['limit'] ?? 20);
$featured = isset($_GET['featured']) && $_GET['featured'] === 'true';
$category = cleanInput($_GET['category'] ?? '');
$search = cleanInput($_GET['q'] ?? '');

$sql = "SELECT ads.*, users.username FROM ads JOIN users ON ads.user_id = users.id WHERE 1=1";
$params = [];

if ($featured) {
    $sql .= " AND ads.is_featured = 1";
}

if (!empty($category)) {
    $sql .= " AND ads.category = ?";
    $params[] = $category;
}

if (!empty($search)) {
    $sql .= " AND (ads.title ILIKE ? OR ads.description ILIKE ?)";
    $searchTerm = '%' . $search . '%';
    $params[] = $searchTerm;
    $params[] = $searchTerm;
}

$sql .= " ORDER BY ads.is_featured DESC, ads.created_at DESC LIMIT ?";
$params[] = $limit;

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$ads = $stmt->fetchAll();

sendJson(['success' => true, 'ads' => $ads]);
?>
