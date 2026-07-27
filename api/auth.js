const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'souqhub_secret_key_2026_morocco';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function requireAuth(req) {
  const user = verifyToken(req);
  if (!user) {
    throw new Error('غير مسجل الدخول');
  }
  return user;
}

function sendJson(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).json(data);
}

function cleanInput(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

module.exports = { generateToken, verifyToken, requireAuth, sendJson, cleanInput };
