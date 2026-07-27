const pool = require('./db');
const { sendJson } = require('./auth');

module.exports = async (req, res) => {
  try {
    const adId = parseInt(req.query.id);

    if (!adId || adId <= 0) {
      return sendJson(res, { success: false, message: 'الإعلان غير موجود' });
    }

    // زيادة عدد المشاهدات
    await pool.query('UPDATE ads SET views = views + 1 WHERE id = $1', [adId]);

    // جلب الإعلان
    const result = await pool.query(
      'SELECT ads.*, users.username, users.email FROM ads JOIN users ON ads.user_id = users.id WHERE ads.id = $1',
      [adId]
    );

    if (result.rows.length === 0) {
      return sendJson(res, { success: false, message: 'الإعلان غير موجود' });
    }

    return sendJson(res, { success: true, ad: result.rows[0] });
  } catch (err) {
    console.error('Get ad error:', err);
    return sendJson(res, { success: false, message: 'خطأ في تحميل الإعلان' });
  }
};
