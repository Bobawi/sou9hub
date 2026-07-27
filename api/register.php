<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['success' => false, 'message' => 'طريقة طلب غير صحيحة']);
}

$username = cleanInput($_POST['username'] ?? '');
$email = cleanInput($_POST['email'] ?? '');
$phone = cleanInput($_POST['phone'] ?? '');
$city = cleanInput($_POST['city'] ?? '');
$password = $_POST['password'] ?? '';

// التحقق من الحقول
if (empty($username) || empty($email) || empty($phone) || empty($password)) {
    sendJson(['success' => false, 'message' => 'جميع الحقول المطلوبة يجب ملؤها']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJson(['success' => false, 'message' => 'البريد الإلكتروني غير صحيح']);
}

if (strlen($password) < 6) {
    sendJson(['success' => false, 'message' => 'كلمة السر يجب أن تكون 6 أحرف على الأقل']);
}

// التحقق من عدم وجود البريد الإلكتروني مسبقاً
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    sendJson(['success' => false, 'message' => 'البريد الإلكتروني مسجل بالفعل']);
}

// تشفير كلمة السر
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// إدخال المستخدم (PostgreSQL)
$stmt = $pdo->prepare("INSERT INTO users (username, email, phone, city, password, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)");
$success = $stmt->execute([$username, $email, $phone, $city, $hashedPassword]);

if ($success) {
    sendJson(['success' => true, 'message' => 'تم إنشاء الحساب بنجاح']);
} else {
    sendJson(['success' => false, 'message' => 'حدث خطأ أثناء إنشاء الحساب']);
}
?>
