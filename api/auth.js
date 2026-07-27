const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'souqhub_secret_key_2026_morocco';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function requireAuth(req) {
  const user = verifyToken(req);
  if (!user) throw new Error('غير مسجل الدخول');
  return user;
}

function sendJson(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).json(data);
}

function cleanInput(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

// =============== الملف الرئيسي ===============
module.exports = async (req, res) => {
  const action = req.query.action || '';
  
  try {
    switch (action) {
      // ----- تسجيل مستخدم جديد -----
      case 'register':
        if (req.method !== 'POST') return sendJson(res, { success: false, message: 'طريقة طلب غير صحيحة' }, 405);
        return await handleRegister(req, res);
      
      // ----- تسجيل الدخول -----
      case 'login':
        if (req.method !== 'POST') return sendJson(res, { success: false, message: 'طريقة طلب غير صحيحة' }, 405);
        return await handleLogin(req, res);
      
      // ----- تسجيل الخروج -----
      case 'logout':
        return sendJson(res, { success: true, message: 'تم تسجيل الخروج بنجاح' });
      
      // ----- جلب المستخدم الحالي -----
      case 'get-user':
        return await handleGetUser(req, res);
      
      default:
        return sendJson(res, { success: false, message: 'إجراء غير معروف' }, 404);
    }
  } catch (err) {
    console.error('Auth error:', err);
    return sendJson(res, { success: false, message: err.message || 'حدث خطأ' });
  }
};

// ----- Register -----
async function handleRegister(req, res) {
  const { username, email, phone, city, password } = req.body || {};
  
  const cleanUsername = cleanInput(username);
  const cleanEmail = cleanInput(email);
  const cleanPhone = cleanInput(phone);
  const cleanCity = cleanInput(city || '');

  if (!cleanUsername || !cleanEmail || !cleanPhone || !password)
    return sendJson(res, { success: false, message: 'جميع الحقول المطلوبة يجب ملؤها' });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
    return sendJson(res, { success: false, message: 'البريد الإلكتروني غير صحيح' });

  if (password.length < 6)
    return sendJson(res, { success: false, message: 'كلمة السر يجب أن تكون 6 أحرف على الأقل' });

  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
  if (existingUser.rows.length > 0)
    return sendJson(res, { success: false, message: 'البريد الإلكتروني مسجل بالفعل' });

  const hashedPassword = await bcrypt.hash(password, 10);

  await pool.query(
    'INSERT INTO users (username, email, phone, city, password, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id',
    [cleanUsername, cleanEmail, cleanPhone, cleanCity, hashedPassword]
  );

  return sendJson(res, { success: true, message: 'تم إنشاء الحساب بنجاح' });
}

// ----- Login -----
async function handleLogin(req, res) {
  const { email, password } = req.body || {};
  const cleanEmail = cleanInput(email);

  if (!cleanEmail || !password)
    return sendJson(res, { success: false, message: 'يرجى ملء جميع الحقول' });

  const result = await pool.query('SELECT id, username, email, password FROM users WHERE email = $1', [cleanEmail]);

  if (result.rows.length === 0)
    return sendJson(res, { success: false, message: 'البريد الإلكتروني أو كلمة السر غير صحيحة' });

  const user = result.rows[0];
  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword)
    return sendJson(res, { success: false, message: 'البريد الإلكتروني أو كلمة السر غير صحيحة' });

  const token = generateToken(user);

  return sendJson(res, {
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    token,
    user: { id: user.id, username: user.username, email: user.email }
  });
}

// ----- Get User -----
async function handleGetUser(req, res) {
  const user = requireAuth(req);

  const result = await pool.query('SELECT id, username, email, phone, city FROM users WHERE id = $1', [user.id]);

  if (result.rows.length === 0)
    return sendJson(res, { success: false, message: 'المستخدم غير موجود' });

  return sendJson(res, { success: true, user: result.rows[0] });
}
