const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // 從請求頭獲取 token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '未提供認證令牌' });
    }

    // 驗證 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('認證失敗:', error);
    res.status(401).json({ message: '認證失敗' });
  }
}; 