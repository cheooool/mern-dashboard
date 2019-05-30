const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator/check');

const User = require('../../models/User');

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
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // 유저가 존재할 경우
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ error: [{ msg: '이미 존재하는 사용자입니다.' }] });
      }

      // 이메일 기반으로 gravatar 가져오기
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      });

      // 비밀번호 암호화
      user = new User({
        name,
        email,
        avatar,
        password
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // jwt 반환

      res.send('Users Register');
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
