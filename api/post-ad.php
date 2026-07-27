<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['success' => false, 'message' => 'طريقة طلب غير صحيحة']);
}

if (!isLoggedIn()) {
    sendJson(['success' => false, 'message' => 'يجب تسجيل الدخول أولاً']);
}

$title = cleanInput($_POST['title'] ?? '');
$category = cleanInput($_POST['category'] ?? '');
$price = floatval($_POST['price'] ?? 0);
$description = cleanInput($_POST['description'] ?? '');
$city = cleanInput($_POST['city'] ?? '');
$phone = cleanInput($_POST['phone'] ?? '');
$userId = $_SESSION['user_id'];

// التحقق من الحقول
if (empty($title) || empty($category) || empty($description) || empty($phone)) {
    sendJson(['success' => false, 'message' => 'جميع الحقول المطلوبة يجب ملؤها']);
}

if ($price < 0) {
    sendJson(['success' => false, 'message' => 'السعر غير صحيح']);
}

// معالجة الصورة
$imagePath = null;
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $fileInfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($fileInfo, $_FILES['image']['tmp_name']);
    finfo_close($fileInfo);

    if (!in_array($mimeType, $allowedTypes)) {
        sendJson(['success' => false, 'message' => 'نوع الصورة غير مسموح به (JPG, PNG, GIF فقط)']);
    }

    $maxSize = 5 * 1024 * 1024; // 5 MB
    if ($_FILES['image']['size'] > $maxSize) {
        sendJson(['success' => false, 'message' => 'حجم الصورة كبير جداً (الحد الأقصى 5MB)']);
    }

    $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $imageName = generateImageName($extension);
    $uploadPath = '../uploads/' . $imageName;

    if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadPath)) {
        $imagePath = 'uploads/' . $imageName;
    } else {
        sendJson(['success' => false, 'message' => 'حدث خطأ أثناء رفع الصورة']);
    }
}

// إدخال الإعلان (PostgreSQL)
$stmt = $pdo->prepare("INSERT INTO ads (user_id, title, category, price, description, city, phone, image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)");
$success = $stmt->execute([$userId, $title, $category, $price, $description, $city, $phone, $imagePath]);

if ($success) {
    $adId = $pdo->lastInsertId('ads_id_seq');
    sendJson(['success' => true, 'message' => 'تم نشر الإعلان بنجاح', 'ad_id' => $adId]);
} else {
    sendJson(['success' => false, 'message' => 'حدث خطأ أثناء نشر الإعلان']);
}
?>
