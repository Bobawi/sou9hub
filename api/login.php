<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['success' => false, 'message' => 'طريقة طلب غير صحيحة']);
}

$email = cleanInput($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (empty($email) || empty($password)) {
    sendJson(['success' => false, 'message' => 'يرجى ملء جميع الحقول']);
}

// جلب المستخدم من قاعدة البيانات
$stmt = $pdo->prepare("SELECT id, username, email, password FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    sendJson(['success' => false, 'message' => 'البريد الإلكتروني أو كلمة السر غير صحيحة']);
}

// التحقق من كلمة السر
if (password_verify($password, $user['password'])) {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    sendJson(['success' => true, 'message' => 'تم تسجيل الدخول بنجاح']);
} else {
    sendJson(['success' => false, 'message' => 'البريد الإلكتروني أو كلمة السر غير صحيحة']);
}
?>
