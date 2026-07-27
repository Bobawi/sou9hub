const bcrypt = require('bcryptjs');
const pool = require('./db');
const { sendJson, cleanInput, generateToken } = require('./auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, { success: false, message: 'طريقة طلب غير صحيحة' }, 405);
  }

  try {
    const { email, password } = req.body || {};
    const cleanEmail = cleanInput(email);

    if (!cleanEmail || !password) {
      return sendJson(res, { success: false, message: 'يرجى ملء جميع الحقول' });
    }

    // جلب المستخدم
    const result = await pool.query(
      'SELECT id, username, email, password FROM users WHERE email = $1',
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return sendJson(res, { success: false, message: 'البريد الإلكتروني أو كلمة السر غير صحيحة' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return sendJson(res, { success: false, message: 'البريد الإلكتروني أو كلمة السر غير صحيحة' });
    }

    // إنشاء التوكن
    const token = generateToken(user);

    return sendJson(res, {
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    return sendJson(res, { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' });
  }
};
