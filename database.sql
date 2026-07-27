-- =============== قاعدة بيانات سوقي - PostgreSQL (Neon) ===============
-- أول سوق مغربي للإعلانات المبوبة

-- =============== جدول المستخدمين ===============
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    city VARCHAR(100) DEFAULT '',
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============== جدول الإعلانات ===============
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

-- =============== فهارس للبحث السريع ===============
CREATE INDEX IF NOT EXISTS idx_ads_category ON ads(category);
CREATE INDEX IF NOT EXISTS idx_ads_featured ON ads(is_featured);
CREATE INDEX IF NOT EXISTS idx_ads_created ON ads(created_at);
CREATE INDEX IF NOT EXISTS idx_ads_user ON ads(user_id);
