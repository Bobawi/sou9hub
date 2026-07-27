const pool = require('./db');
const { sendJson, requireAuth } = require('./auth');

module.exports = async (req, res) => {
  try {
    const user = requireAuth(req);
    
    const result = await pool.query(
      'SELECT id, username, email, phone, city FROM users WHERE id = $1',
      [user.id]
    );

    if (result.rows.length === 0) {
      return sendJson(res, { success: false, message: 'المستخدم غير موجود' });
    }

    return sendJson(res, { success: true, user: result.rows[0] });
  } catch (err) {
    return sendJson(res, { success: false, message: err.message || 'غير مسجل الدخول' });
  }
};
