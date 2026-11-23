const router = require('express').Router();
const { Order, Notification } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

// POST /api/orders/checkout  { paymentId? }
router.post('/checkout', auth, requireRole('Buyer'), async (req, res, next) => {
  try {
    const order = await req.user.checkout(req.body.paymentId);
    await Notification.create({
      recipient: req.user._id,
      recipientModel: 'Buyer',
      type: 'order',
      message: `Order ${order._id} placed ($${order.total}).`,
    });
    res.status(201).json(order);
  } catch (e) {
    if (/own listing/i.test(e.message)) e.status = 403;
    next(e);
  }
});

// GET /api/orders  (Buyer: own orders; Seller: orders containing their items)
router.get('/', auth, async (req, res, next) => {
  try {
    if (req.user.role === 'Buyer') return res.json(await req.user.viewOrders());
    if (req.user.role === 'Seller') return res.json(await req.user.viewOrders());
    return res.status(403).json({ error: 'Forbidden' });
  } catch (e) {
    next(e);
  }
});

// POST /api/orders/:id/items/:itemId/return  { reason? }  (Buyer, own order, within 7 days)
// The buyer notification is created inside Buyer.requestReturn().
router.post('/:id/items/:itemId/return', auth, requireRole('Buyer'), async (req, res, next) => {
  try {
    const refund = await req.user.requestReturn(
      req.params.id,
      req.params.itemId,
      typeof req.body?.reason === 'string' ? req.body.reason : ''
    );
    res.status(201).json(refund);
  } catch (e) {
    next(e);
  }
});

// GET /api/orders/returns — refund requests for the caller
// (Buyer: own; Seller: for orders containing their items; Admin: all)
router.get('/returns', auth, async (req, res, next) => {
  try {
    const { RefundRequest } = require('../models');
    if (req.user.role === 'Buyer') {
      const ownOrders = await Order.find({ buyer: req.user._id }).select('_id');
      return res.json(
        await RefundRequest.find({ order: { $in: ownOrders.map((o) => o._id) } })
      );
    }
    if (req.user.role === 'Seller') {
      const orders = await Order.find({ 'items.seller': req.user._id }).select('_id');
      return res.json(await RefundRequest.find({ order: { $in: orders.map((o) => o._id) } }));
    }
    return res.json(await RefundRequest.find({}));
  } catch (e) {
    next(e);
  }
});

// POST /api/orders/refunds/:refundId/accept  (Seller: accept a buyer's return)
router.post('/refunds/:refundId/accept', auth, requireRole('Seller'), async (req, res, next) => {
  try {
    const refund = await req.user.decideRefund(req.params.refundId, 'accept');
    res.json(refund);
  } catch (e) {
    next(e);
  }
});

// POST /api/orders/refunds/:refundId/escalate  { note? }  (Seller: hand to an admin)
router.post('/refunds/:refundId/escalate', auth, requireRole('Seller'), async (req, res, next) => {
  try {
    const note = typeof req.body?.note === 'string' ? req.body.note : '';
    const refund = await req.user.decideRefund(req.params.refundId, 'escalate', note);
    res.json(refund);
  } catch (e) {
    next(e);
  }
});

// GET /api/orders/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.listing');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const isOwner = String(order.buyer) === String(req.user._id);
    const isAdmin = req.user.role === 'Admin';
    const isSeller = req.user.role === 'Seller' && order.items.some((i) => String(i.seller) === String(req.user._id));
    if (!isOwner && !isAdmin && !isSeller) return res.status(403).json({ error: 'Forbidden' });
    res.json(order);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/orders/:id  { fulfillmentState }  (Seller/Admin)
router.patch('/:id', auth, requireRole('Seller', 'Admin'), async (req, res, next) => {
  try {
    const allowed = ['Open', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const { fulfillmentState, shippingInfo } = req.body;
    const update = {};
    if (fulfillmentState) {
      if (!allowed.includes(fulfillmentState))
        return res.status(400).json({ error: 'invalid fulfillmentState' });
      update.fulfillmentState = fulfillmentState;
    }
    if (shippingInfo !== undefined) update.shippingInfo = shippingInfo;
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (e) {
    next(e);
  }
});

module.exports = router;