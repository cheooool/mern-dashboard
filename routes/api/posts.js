const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route    POST api/post
// @desc     Create a post
// @access   Private
router.post(
  '/',
  [
    auth,
    [
      check('text', '텍스트를 입력해주세요.')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const post = await newPost.save();

      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/post
// @desc     Get all post
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/post/:id
// @desc     Get post by id
// @access   Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        msg: '등록된 글을 찾을 수 없습니다.'
      });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        msg: '등록된 글을 찾을 수 없습니다.'
      });
    }
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/post/:id
// @desc     Delete post by id
// @access   Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        msg: '등록된 글을 찾을 수 없습니다.'
      });
    }

    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({
        msg: '권한이 없습니다.'
      });
    }

    await post.remove();

    res.json({
      msg: '글이 삭제되었습니다.'
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        msg: '등록된 글을 찾을 수 없습니다.'
      });
    }

    res.status(500).send('Server Error');
  }
});

// @route    PUT api/post/like/:id
// @desc     Like a post
// @access   Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // 이미 좋아요를 눌렀는지 체크
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({
        msg: '이미 이 글을 좋아합니다.'
      });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/post/unlike/:id
// @desc     Unlike a post
// @access   Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // 이미 좋아요를 눌렀는지 체크
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({
        msg: '아직 이 글을 좋아하지 않습니다.'
      });
    }

    const removeIndex = post.likes
      .map(item => item.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/post/comment/:id
// @desc     Comment on a post
// @access   Private
router.post(
  '/comment/:id',
  [
    auth,
    [
      check('text', '댓글을 입력해주세요.')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    DELETE api/post/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );

    // 댓글이 존재하는지 확인
    if (!comment) {
      return res.status(404).json({
        msg: '댓글을 찾을 수 없습니다.'
      });
    }

    // 권한 체크
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({
        msg: '권한이 없습니다.'
      });
    }

    const removeIndex = post.comments.map(item => item.id).indexOf(comment.id);

    post.comments.splice(removeIndex, 1);
    await post.save();

    res.json({
      msg: '댓글이 삭제되었습니다.'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
