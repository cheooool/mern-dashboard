const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
  // 헤더로부터 토큰 가져오기
  const token = req.header('x-auth-token');

  // 토큰 없을 경우
  if (!token) {
    return res.status(401).json({
      msg: '승인이 거부되었습니다. 토큰이 없습니다.'
    });
  }

  // 토큰 확인
  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    req.user = decoded.user;

    next();
  } catch (err) {
    res.status(401).json({ msg: '토큰이 유효하지 않습니다. ' });
  }
};
