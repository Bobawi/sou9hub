const pool = require('./db');
const { sendJson, requireAuth } = require('./auth');

module.exports = async (req, res) => {
  try {
    const user = requireAuth(req);

    const result = await pool.query(
      'SELECT ads.*, users.username FROM ads JOIN users ON ads.user_id = users.id WHERE ads.user_id = $1 ORDER BY ads.created_at DESC',
      [user.id]
    );

    return sendJson(res, { success: true, ads: result.rows });
  } catch (err) {
    return sendJson(res, { success: false, message: err.message || 'غير مسجل الدخول' });
  }
};
