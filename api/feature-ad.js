const pool = require('./db');
const { sendJson, requireAuth } = require('./auth');

module.exports = async (req, res) => {
  try {
    const user = requireAuth(req);
    const adId = parseInt(req.query.id);

    if (!adId || adId <= 0) {
      return sendJson(res, { success: false, message: 'الإعلان غير موجود' });
    }

    // التحقق من أن الإعلان يخص المستخدم
    const adResult = await pool.query('SELECT id FROM ads WHERE id = $1 AND user_id = $2', [adId, user.id]);
    if (adResult.rows.length === 0) {
      return sendJson(res, { success: false, message: 'لا يمكنك تمييز هذا الإعلان' });
    }

    // تمييز الإعلان
    await pool.query('UPDATE ads SET is_featured = 1 WHERE id = $1 AND user_id = $2', [adId, user.id]);

    return sendJson(res, { success: true, message: 'تم تمييز الإعلان بنجاح' });
  } catch (err) {
    console.error('Feature ad error:', err);
    return sendJson(res, { success: false, message: 'خطأ في تمييز الإعلان' });
  }
};
