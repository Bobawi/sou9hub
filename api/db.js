const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ELk4CqWteRd8@ep-aged-surf-as9gk1d4.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// إنشاء الجداول إذا لم تكن موجودة
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL,
        city VARCHAR(100) DEFAULT '',
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS ads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        price DECIMAL(12,2) NOT NULL DEFAULT 0,
        description TEXT DEFAULT '',
        city VARCHAR(100) DEFAULT '',
        phone VARCHAR(20) DEFAULT '',
        image VARCHAR(255) DEFAULT NULL,
        is_featured INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Database tables ready');
  } catch (err) {
    console.error('❌ Database init error:', err);
  } finally {
    client.release();
  }
}

initDatabase();

module.exports = pool;
