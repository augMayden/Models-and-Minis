const router = require('express').Router();
const { User, Listing } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth, requireRole('Admin'));

// GET /api/admin/overview
router.get('/overview', async (req, res, next) => {
  try {
    res.json(await req.user.viewSiteOverview());
  } catch (e) {
    next(e);
  }
});

// GET /api/admin/accounts
router.get('/accounts', async (req, res, next) => {
  try {
    res.json(await User.find().lean());
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/accounts/:id/approve | /deny | /ban
router.post('/accounts/:id/approve', async (req, res, next) => {
  try {
    res.json(await req.user.approveAccount(req.params.id));
  } catch (e) {
    next(e);
  }
});
router.post('/accounts/:id/deny', async (req, res, next) => {
  try {
    res.json(await req.user.denyAccount(req.params.id));
  } catch (e) {
    next(e);
  }
});
router.post('/accounts/:id/ban', async (req, res, next) => {
  try {
    res.json(await req.user.banAccount(req.params.id));
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/listings/:id/approve
router.post('/listings/:id/approve', async (req, res, next) => {
  try {
    res.json(await req.user.approveListing(req.params.id));
  } catch (e) {
    next(e);
  }
});

// GET /api/admin/listings?status=
router.get('/listings', async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    res.json(await Listing.find(filter).lean());
  } catch (e) {
    next(e);
  }
});

module.exports = router;