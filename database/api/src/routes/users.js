const router = require('express').Router();
const { User, Buyer, Seller } = require('../models');
const { auth } = require('../middleware/auth');

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  const me = await User.findById(req.user._id).populate('paymentMethods');
  res.json(me);
});

// PATCH /api/users/me  { username?, email?, address? }
router.patch('/me', auth, async (req, res, next) => {
  try {
    await req.user.updateProfile(req.body);
    res.json(await User.findById(req.user._id));
  } catch (e) {
    next(e);
  }
});

// GET /api/users/:id  (public profile)
router.get('/:id', async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id).select('username role registerDate');
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json(u);
  } catch (e) {
    next(e);
  }
});

module.exports = router;