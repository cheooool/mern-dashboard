const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');

// @route    POST api/users
// @desc     유저 생성
// @access   Public
router.post(
  '/',
  [
    check('name', '이름을 입력해주세요.')
      .not()
      .isEmpty(),
    check('email', '올바른 이메일을 입력해주세요.').isEmail(),
    check('password', '비밀번호를 6자이상 입력해주세요.').isLength({ min: 6 })
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    res.send('Users route');
  }
);

module.exports = router;
