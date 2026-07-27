const pool = require('./db');
const { sendJson, cleanInput, requireAuth } = require('./auth');

module.exports = async (req, res) => {
  const action = req.query.action || '';
  
  try {
    switch (action) {
      case 'get-ads':
        return await handleGetAds(req, res);
      case 'get-ad':
        return await handleGetAd(req, res);
      case 'my-ads':
        return await handleMyAds(req, res);
      case 'user-stats':
        return await handleUserStats(req, res);
      case 'post-ad':
        if (req.method !== 'POST') return sendJson(res, { success: false, message: 'طريقة طلب غير صحيحة' }, 405);
        return await handlePostAd(req, res);
      case 'delete-ad':
        return await handleDeleteAd(req, res);
      case 'feature-ad':
        return await handleFeatureAd(req, res);
      default:
        return sendJson(res, { success: false, message: 'إجراء غير معروف' }, 404);
    }
  } catch (err) {
    console.error('Ads error:', err.message);
    return sendJson(res, { success: false, message: err.message || 'حدث خطأ' });
  }
};

// ----- Get All Ads -----
async function handleGetAds(req, res) {
  const limit = parseInt(req.query.limit) || 20;
  const featured = req.query.featured === 'true';
  const category = cleanInput(req.query.category || '');
  const search = cleanInput(req.query.q || '');

  let sql = 'SELECT ads.*, users.username FROM ads JOIN users ON ads.user_id = users.id WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (featured) {
    sql += ` AND ads.is_featured = 1`;
  }

  if (category) {
    sql += ` AND ads.category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  if (search) {
    sql += ` AND (ads.title ILIKE $${paramIndex} OR ads.description ILIKE $${paramIndex + 1})`;
    const term = `%${search}%`;
    params.push(term, term);
    paramIndex += 2;
  }

  sql += ` ORDER BY ads.is_featured DESC, ads.created_at DESC LIMIT $${paramIndex}`;
  params.push(limit);

  const result = await pool.query(sql, params);
  return sendJson(res, { success: true, ads: result.rows });
}

// ----- Get Single Ad -----
async function handleGetAd(req, res) {
  const adId = parseInt(req.query.id);

  if (!adId || adId <= 0)
    return sendJson(res, { success: false, message: 'الإعلان غير موجود' });

  await pool.query('UPDATE ads SET views = views + 1 WHERE id = $1', [adId]);

  const result = await pool.query(
    'SELECT ads.*, users.username, users.email FROM ads JOIN users ON ads.user_id = users.id WHERE ads.id = $1',
    [adId]
  );

  if (result.rows.length === 0)
    return sendJson(res, { success: false, message: 'الإعلان غير موجود' });

  return sendJson(res, { success: true, ad: result.rows[0] });
}

// ----- My Ads -----
async function handleMyAds(req, res) {
  const user = requireAuth(req);

  const result = await pool.query(
    'SELECT ads.*, users.username FROM ads JOIN users ON ads.user_id = users.id WHERE ads.user_id = $1 ORDER BY ads.created_at DESC',
    [user.id]
  );

  return sendJson(res, { success: true, ads: result.rows });
}

// ----- User Stats -----
async function handleUserStats(req, res) {
  const user = requireAuth(req);
  const userId = user.id;

  const totalAdsResult = await pool.query('SELECT COUNT(*) as total FROM ads WHERE user_id = $1', [userId]);
  const totalAds = parseInt(totalAdsResult.rows[0].total);

  const totalViewsResult = await pool.query('SELECT COALESCE(SUM(views), 0) as total FROM ads WHERE user_id = $1', [userId]);
  const totalViews = parseInt(totalViewsResult.rows[0].total);

  const featuredResult = await pool.query('SELECT COUNT(*) as total FROM ads WHERE user_id = $1 AND is_featured = 1', [userId]);
  const featuredAds = parseInt(featuredResult.rows[0].total);

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
}

// ----- Post Ad -----
async function handlePostAd(req, res) {
  const user = requireAuth(req);

  const { title, category, price, description, city, phone } = req.body || {};

  const cleanTitle = cleanInput(title || '');
  const cleanCategory = cleanInput(category || '');
  const cleanPrice = parseFloat(price || 0);
  const cleanDescription = cleanInput(description || '');
  const cleanCity = cleanInput(city || '');
  const cleanPhone = cleanInput(phone || '');

  if (!cleanTitle || !cleanCategory || !cleanDescription || !cleanPhone)
    return sendJson(res, { success: false, message: 'جميع الحقول المطلوبة يجب ملؤها' });

  if (cleanPrice < 0)
    return sendJson(res, { success: false, message: 'السعر غير صحيح' });

  const result = await pool.query(
    'INSERT INTO ads (user_id, title, category, price, description, city, phone, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP) RETURNING id',
    [user.id, cleanTitle, cleanCategory, cleanPrice, cleanDescription, cleanCity, cleanPhone]
  );

  return sendJson(res, {
    success: true,
    message: 'تم نشر الإعلان بنجاح',
    ad_id: result.rows[0].id
  });
}

// ----- Delete Ad -----
async function handleDeleteAd(req, res) {
  const user = requireAuth(req);
  const adId = parseInt(req.query.id);

  if (!adId || adId <= 0)
    return sendJson(res, { success: false, message: 'الإعلان غير موجود' });

  const adResult = await pool.query('SELECT id FROM ads WHERE id = $1 AND user_id = $2', [adId, user.id]);
  if (adResult.rows.length === 0)
    return sendJson(res, { success: false, message: 'لا يمكنك حذف هذا الإعلان' });

  await pool.query('DELETE FROM ads WHERE id = $1 AND user_id = $2', [adId, user.id]);

  return sendJson(res, { success: true, message: 'تم حذف الإعلان بنجاح' });
}

// ----- Feature Ad -----
async function handleFeatureAd(req, res) {
  const user = requireAuth(req);
  const adId = parseInt(req.query.id);

  if (!adId || adId <= 0)
    return sendJson(res, { success: false, message: 'الإعلان غير موجود' });

  const adResult = await pool.query('SELECT id FROM ads WHERE id = $1 AND user_id = $2', [adId, user.id]);
  if (adResult.rows.length === 0)
    return sendJson(res, { success: false, message: 'لا يمكنك تمييز هذا الإعلان' });

  await pool.query('UPDATE ads SET is_featured = 1 WHERE id = $1 AND user_id = $2', [adId, user.id]);

  return sendJson(res, { success: true, message: 'تم تمييز الإعلان بنجاح' });
}
