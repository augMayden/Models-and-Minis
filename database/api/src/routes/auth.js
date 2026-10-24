const router = require('express').Router();
const { User, Seller, Buyer } = require('../models');
const { sign } = require('../middleware/auth');

// POST /api/auth/register  { role: 'Buyer'|'Seller', username, email, password }
router.post('/register', async (req, res, next) => {
  try {
    const { role = 'Buyer', username, email, password } = req.body;
    if (!['Buyer', 'Seller'].includes(role))
      return res.status(400).json({ error: 'role must be Buyer or Seller' });
    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email, password required' });

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) return res.status(409).json({ error: 'username or email taken' });

    const Model = role === 'Seller' ? Seller : Buyer;
    const user = new Model({ username, email, role });
    await user.setPassword(password);
    await user.save();
    res.status(201).json({ token: sign(user), user });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/login  { identifier, password }
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, email, username, password } = req.body;
    const id = identifier || email || username;
    if (!id || !password) return res.status(400).json({ error: 'identifier and password required' });
    const user = await User.login(id, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.accountType === 'Banned') return res.status(403).json({ error: 'Account banned' });
    res.json({ token: sign(user), user });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/forgot-password { email }
router.post('/forgot-password', async (req, res, next) => {
  try {
    await User.resetPassword(req.body.email);
    res.json({ ok: true }); // never reveal whether email exists
  } catch (e) {
    next(e);
  }
});

module.exports = router;