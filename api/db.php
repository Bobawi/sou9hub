<?php
// =============== إعدادات قاعدة بيانات PostgreSQL (Neon + Render) ===============
// دعم متغيرات البيئة للـ Hosting
$dbUrl = getenv('DATABASE_URL');
$dbUser = getenv('DATABASE_USER') ?: 'neondb_owner';
$dbPass = getenv('DATABASE_PASS') ?: 'npg_ELk4CqWteRd8';

if ($dbUrl) {
    // Render.com format
    $parsedUrl = parse_url($dbUrl);
    $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s;sslmode=require',
        $parsedUrl['host'],
        $parsedUrl['port'] ?? '5432',
        ltrim($parsedUrl['path'], '/')
    );
    $dbUser = $parsedUrl['user'] ?? $dbUser;
    $dbPass = $parsedUrl['pass'] ?? $dbPass;
} else {
    // Neon direct connection
    $dsn = 'pgsql:host=ep-aged-surf-as9gk1d4.c-4.eu-central-1.aws.neon.tech;dbname=neondb;sslmode=require';
}

// الاتصال بقاعدة البيانات
try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // إنشاء الجداول إذا لم تكن موجودة
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            phone VARCHAR(20) NOT NULL,
            city VARCHAR(100) DEFAULT '',
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS ads (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(50) NOT NULL,
            price DECIMAL(12,2) NOT NULL DEFAULT 0,
            description TEXT DEFAULT '',
            city VARCHAR(100) DEFAULT '',
            phone VARCHAR(20) DEFAULT '',
            image VARCHAR(255) DEFAULT NULL,
            is_featured INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ");
} catch(PDOException $e) {
    die(json_encode(['success' => false, 'message' => 'خطأ في الاتصال بقاعدة البيانات']));
}

// =============== بدء الجلسة ===============
session_start();

// =============== دوال مساعدة ===============

// دالة التحقق من تسجيل الدخول
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

// دالة جلب المستخدم الحالي
function getCurrentUser() {
    global $pdo;
    if (!isLoggedIn()) return null;
    
    $stmt = $pdo->prepare("SELECT id, username, email, phone, city FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch();
}

// دالة تنظيف النصوص
function cleanInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// دالة إنشاء اسم فريد للصورة
function generateImageName($extension) {
    return uniqid() . '_' . time() . '.' . $extension;
}

// إرسال النتيجة بصيغة JSON
function sendJson($data) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}
?>
