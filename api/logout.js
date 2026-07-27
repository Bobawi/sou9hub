const { sendJson } = require('./auth');

module.exports = async (req, res) => {
  // مع Vercel/JWT، مجرد نرسل رسالة نجاح
  // الكلينت كيمسح التوكن من localStorage
  return sendJson(res, { success: true, message: 'تم تسجيل الخروج بنجاح' });
};
