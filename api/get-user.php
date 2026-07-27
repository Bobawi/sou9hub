<?php
require_once 'db.php';

if (!isLoggedIn()) {
    sendJson(['success' => false, 'message' => 'غير مسجل الدخول']);
}

$user = getCurrentUser();
if ($user) {
    sendJson(['success' => true, 'user' => $user]);
} else {
    sendJson(['success' => false, 'message' => 'المستخدم غير موجود']);
}
?>
