const pool = require('./db');
const { sendJson, cleanInput } = require('./auth');

module.exports = async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Get ads error:', err);
    return sendJson(res, { success: false, message: 'خطأ في تحميل الإعلانات' });
  }
};
