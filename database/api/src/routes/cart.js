const router = require('express').Router();
const { Cart, Listing } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/cart
router.get('/', auth, requireRole('Buyer'), async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ buyer: req.user._id }).populate('items.listing');
    res.json(cart || { buyer: req.user._id, items: [], total: 0 });
  } catch (e) {
    next(e);
  }
});

// POST /api/cart/items  { listingId, quantity }
router.post('/items', auth, requireRole('Buyer'), async (req, res, next) => {
  try {
    const { listingId, quantity = 1 } = req.body;
    // Reject self-purchase up front with a clean 403.
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (String(listing.seller) === String(req.user._id))
      return res.status(403).json({ error: 'You cannot purchase your own listing' });
    const cart = await req.user.addToCart({ listingId, quantity: Number(quantity) });
    res.status(201).json(await cart.populate('items.listing'));
  } catch (e) {
    next(e);
  }
});

// DELETE /api/cart/items/:cartItemId
router.delete('/items/:cartItemId', auth, requireRole('Buyer'), async (req, res, next) => {
  try {
    const cart = await req.user.removeFromCart(req.params.cartItemId);
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    res.json(await cart.populate('items.listing'));
  } catch (e) {
    next(e);
  }
});

// DELETE /api/cart  (clear)
router.delete('/', auth, requireRole('Buyer'), async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ buyer: req.user._id });
    if (!cart) return res.json({ items: [], total: 0 });
    cart.items = [];
    cart.calculateTotal();
    await cart.save();
    res.json(cart);
  } catch (e) {
    next(e);
  }
});

module.exports = router;