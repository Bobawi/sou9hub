const pool = require('./db');
const { sendJson, requireAuth } = require('./auth');

module.exports = async (req, res) => {
  try {
    const user = requireAuth(req);
    const userId = user.id;

    // إجمالي الإعلانات
    const totalAdsResult = await pool.query('SELECT COUNT(*) as total FROM ads WHERE user_id = $1', [userId]);
    const totalAds = parseInt(totalAdsResult.rows[0].total);

    // إجمالي المشاهدات
    const totalViewsResult = await pool.query('SELECT COALESCE(SUM(views), 0) as total FROM ads WHERE user_id = $1', [userId]);
    const totalViews = parseInt(totalViewsResult.rows[0].total);

    // الإعلانات المميزة
    const featuredResult = await pool.query('SELECT COUNT(*) as total FROM ads WHERE user_id = $1 AND is_featured = 1', [userId]);
    const featuredAds = parseInt(featuredResult.rows[0].total);

    // آخر نشاط
    const lastActivityResult = await pool.query('SELECT MAX(created_at) as last FROM ads WHERE user_id = $1', [userId]);
    const lastActivity = lastActivityResult.rows[0].last 
      ? new Date(lastActivityResult.rows[0].last).toLocaleDateString('ar-MA')
      : '-';

    return sendJson(res, {
      success: true,
      total_ads: totalAds,
      total_views: totalViews,
      featured_ads: featuredAds,
      last_activity: lastActivity
    });
  } catch (err) {
    return sendJson(res, { success: false, message: err.message || 'غير مسجل الدخول' });
  }
};
