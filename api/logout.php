<?php
require_once 'db.php';

// تسجيل الخروج
session_destroy();
header('Location: ../login.html');
exit;
?>
