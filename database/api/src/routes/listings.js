const router = require('express').Router();
const { Listing } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/listings?q=&theme=&status=&min=&max=&page=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { q, theme, status = 'Active', min, max, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (theme) filter.theme = theme;
    if (min || max) filter.price = {};
    if (min) filter.price.$gte = Number(min);
    if (max) filter.price.$lte = Number(max);
    if (q) filter.$text = { $search: q };

    const perPage = Math.min(Number(limit) || 20, 100);
    const [items, total] = await Promise.all([
      Listing.find(filter)
        .sort({ creationDate: -1 })
        .skip((Number(page) - 1) * perPage)
        .limit(perPage)
        .populate('seller', 'username')
        .lean(),
      Listing.countDocuments(filter),
    ]);
    res.json({ total, page: Number(page), limit: perPage, items });
  } catch (e) {
    next(e);
  }
});

// GET /api/listings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'username');
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (e) {
    next(e);
  }
});

// POST /api/listings  (Seller)
router.post('/', auth, requireRole('Seller'), async (req, res, next) => {
  try {
    const listing = await req.user.createListing(req.body);
    res.status(201).json(listing);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/listings/:id  (Seller owns it, or Admin)
router.patch('/:id', auth, requireRole('Seller', 'Admin'), async (req, res, next) => {
  try {
    let listing;
    if (req.user.role === 'Admin') {
      listing = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    } else {
      listing = await req.user.editListing(req.params.id, req.body);
    }
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/listings/:id  (Seller owns it, or Admin) -> soft delete (status Removed)
router.delete('/:id', auth, requireRole('Seller', 'Admin'), async (req, res, next) => {
  try {
    const listing =
      req.user.role === 'Admin'
        ? await Listing.findByIdAndUpdate(req.params.id, { status: 'Removed' }, { new: true })
        : await req.user.removeListing(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (e) {
    next(e);
  }
});

module.exports = router;