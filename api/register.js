const bcrypt = require('bcryptjs');
const pool = require('./db');
const { sendJson, cleanInput } = require('./auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, { success: false, message: 'طريقة طلب غير صحيحة' }, 405);
  }

  try {
    const { username, email, phone, city, password } = req.body || {};
    
    const cleanUsername = cleanInput(username);
    const cleanEmail = cleanInput(email);
    const cleanPhone = cleanInput(phone);
    const cleanCity = cleanInput(city || '');

    if (!cleanUsername || !cleanEmail || !cleanPhone || !password) {
      return sendJson(res, { success: false, message: 'جميع الحقول المطلوبة يجب ملؤها' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return sendJson(res, { success: false, message: 'البريد الإلكتروني غير صحيح' });
    }

    if (password.length < 6) {
      return sendJson(res, { success: false, message: 'كلمة السر يجب أن تكون 6 أحرف على الأقل' });
    }

    // التحقق من عدم وجود البريد الإلكتروني
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existingUser.rows.length > 0) {
      return sendJson(res, { success: false, message: 'البريد الإلكتروني مسجل بالفعل' });
    }

    // تشفير كلمة السر
    const hashedPassword = await bcrypt.hash(password, 10);

    // إدخال المستخدم
    const result = await pool.query(
      'INSERT INTO users (username, email, phone, city, password, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id',
      [cleanUsername, cleanEmail, cleanPhone, cleanCity, hashedPassword]
    );

    return sendJson(res, { success: true, message: 'تم إنشاء الحساب بنجاح' });
  } catch (err) {
    console.error('Register error:', err);
    return sendJson(res, { success: false, message: 'حدث خطأ أثناء إنشاء الحساب' });
  }
};
