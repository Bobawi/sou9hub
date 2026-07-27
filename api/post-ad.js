const pool = require('./db');
const { sendJson, cleanInput, requireAuth } = require('./auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, { success: false, message: 'طريقة طلب غير صحيحة' }, 405);
  }

  try {
    const user = requireAuth(req);
    
    const { title, category, price, description, city, phone } = req.body || {};
    
    const cleanTitle = cleanInput(title || '');
    const cleanCategory = cleanInput(category || '');
    const cleanPrice = parseFloat(price || 0);
    const cleanDescription = cleanInput(description || '');
    const cleanCity = cleanInput(city || '');
    const cleanPhone = cleanInput(phone || '');

    if (!cleanTitle || !cleanCategory || !cleanDescription || !cleanPhone) {
      return sendJson(res, { success: false, message: 'جميع الحقول المطلوبة يجب ملؤها' });
    }

    if (cleanPrice < 0) {
      return sendJson(res, { success: false, message: 'السعر غير صحيح' });
    }

    // إدخال الإعلان
    const result = await pool.query(
      'INSERT INTO ads (user_id, title, category, price, description, city, phone, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP) RETURNING id',
      [user.id, cleanTitle, cleanCategory, cleanPrice, cleanDescription, cleanCity, cleanPhone]
    );

    return sendJson(res, {
      success: true,
      message: 'تم نشر الإعلان بنجاح',
      ad_id: result.rows[0].id
    });
  } catch (err) {
    console.error('Post ad error:', err);
    return sendJson(res, { success: false, message: err.message || 'حدث خطأ أثناء نشر الإعلان' });
  }
};
