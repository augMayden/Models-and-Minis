const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: '' },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'US' },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    // Diagram's "accountType {Pending, Active, Banned}" = account lifecycle state
    accountType: {
      type: String,
      enum: ['Pending', 'Active', 'Banned'],
      default: 'Pending',
    },
    status: { type: String, default: 'active' },
    registerDate: { type: Date, default: Date.now },
    // role is the discriminator key for the User/Seller/Admin/Buyer hierarchy
    role: { type: String, required: true, enum: ['Seller', 'Admin', 'Buyer'] },
  },
  { timestamps: true, discriminatorKey: 'role', collection: 'users' }
);

// Never serialize the password hash, even when explicitly selected (e.g. login).
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

// --- password helpers ---
userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// login(credentials) : Boolean
userSchema.statics.login = async function (identifier, password) {
  const user = await this.findOne({
    $or: [{ email: String(identifier).toLowerCase() }, { username: identifier }],
  }).select('+passwordHash');
  if (!user) return null;
  const ok = await user.verifyPassword(password);
  return ok ? user : null;
};

// updateProfile(data) : Boolean
userSchema.methods.updateProfile = async function (data = {}) {
  const allowed = ['username', 'email'];
  allowed.forEach((k) => {
    if (data[k] !== undefined) this[k] = data[k];
  });
  if (data.address) this.shippingAddresses.push(data.address);
  await this.save();
  return true;
};

// resetPassword(email) : Boolean
userSchema.statics.resetPassword = async function (email) {
  const user = await this.findOne({ email: String(email).toLowerCase() });
  if (!user) return false;
  // TODO: generate reset token + send email. Stubbed for now.
  return true;
};

const User = mongoose.model('User', userSchema);

// ---------------- Seller ----------------
const sellerSchema = new mongoose.Schema({
  earnings: { type: Number, default: 0 },
  paymentMethod: { type: String, default: '' },
});

sellerSchema.methods.createListing = function (data) {
  return mongoose.model('Listing').create({ ...data, seller: this._id });
};

sellerSchema.methods.editListing = function (listingId, data) {
  return mongoose
    .model('Listing')
    .findOneAndUpdate({ _id: listingId, seller: this._id }, data, { new: true });
};

sellerSchema.methods.removeListing = function (listingId) {
  return mongoose
    .model('Listing')
    .findOneAndUpdate(
      { _id: listingId, seller: this._id },
      { status: 'Removed' },
      { new: true }
    );
};

sellerSchema.methods.viewOrders = function () {
  return mongoose.model('Order').find({ 'items.seller': this._id });
};

// resolveRefundForSeller(orderId, refundId) : RefundRequest
// Loads a refund request the seller is allowed to act on: it must belong
// to an order containing an item sold by THIS seller. Throws 404 otherwise.
sellerSchema.methods.resolveRefundForSeller = async function (refundId) {
  const RefundRequest = mongoose.model('RefundRequest');

  // Malformed ids would make findById throw a CastError (500); treat them
  // like any other not-found request.
  if (!mongoose.isValidObjectId(refundId)) {
    throw Object.assign(new Error('Refund request not found for your items'), { status: 404 });
  }

  const refund = await RefundRequest.findById(refundId).populate('order', 'buyer items.seller');
  const sellerIds = refund?.order?.items?.map((i) => String(i.seller)) ?? [];
  if (!refund || !sellerIds.includes(String(this._id))) {
    throw Object.assign(new Error('Refund request not found for your items'), { status: 404 });
  }
  return refund;
};

// decideRefund(refundId, decision, note, adminOrSeller) : RefundRequest
// Seller decision on a buyer's return: accept (approve) or escalate to an
// admin. Only Pending requests can be decided; already-escalated ones go to
// admin review, not back through the seller.
sellerSchema.methods.decideRefund = async function (refundId, decision, note = '') {
  const refund = await this.resolveRefundForSeller(refundId);

  if (refund.status !== 'Pending') {
    throw Object.assign(new Error(`This request was already ${refund.status === 'NeedsAdmin' ? 'escalated to an admin' : refund.status.toLowerCase()}`), {
      status: 409,
    });
  }

  if (decision === 'accept') {
    refund.approve();
  } else if (decision === 'escalate') {
    refund.escalate(note);
  } else {
    throw Object.assign(new Error('decision must be "accept" or "escalate"'), { status: 400 });
  }

  await refund.save();
  await mongoose.model('Notification').create({
    recipient: refund.order.buyer,
    recipientModel: 'Buyer',
    type: 'return',
    message:
      decision === 'accept'
        ? 'Your return request was accepted by the seller.'
        : 'Your return request was passed to an admin for review.',
  });
  return refund;
};

const Seller = User.discriminator('Seller', sellerSchema);

// ---------------- Admin ----------------
const adminSchema = new mongoose.Schema({
  adminLevel: { type: Number, default: 1 },
});

adminSchema.methods.approveAccount = (userId) =>
  User.findByIdAndUpdate(userId, { accountType: 'Active' }, { new: true });
adminSchema.methods.denyAccount = (userId) =>
  User.findByIdAndUpdate(userId, { accountType: 'Banned' }, { new: true });
adminSchema.methods.banAccount = (userId) =>
  User.findByIdAndUpdate(userId, { accountType: 'Banned' }, { new: true });
adminSchema.methods.approveListing = (listingId) =>
  mongoose.model('Listing').findByIdAndUpdate(listingId, { status: 'Active' }, { new: true });
adminSchema.methods.removeListing = (listingId) =>
  mongoose.model('Listing').findByIdAndUpdate(listingId, { status: 'Removed' }, { new: true });
adminSchema.methods.editListing = (listingId, data) =>
  mongoose.model('Listing').findByIdAndUpdate(listingId, data, { new: true });
adminSchema.methods.viewAccounts = () => User.find().lean();
adminSchema.methods.viewSiteOverview = async () => {
  const [users, listings, orders] = await Promise.all([
    User.countDocuments(),
    mongoose.model('Listing').countDocuments(),
    mongoose.model('Order').countDocuments(),
  ]);
  return { users, listings, orders };
};

const Admin = User.discriminator('Admin', adminSchema);

// ---------------- Buyer ----------------
const buyerSchema = new mongoose.Schema({
  shippingAddresses: { type: [addressSchema], default: [] },
  paymentMethods: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
});

buyerSchema.methods.addToCart = async function ({ listingId, quantity = 1 }) {
  const Listing = mongoose.model('Listing');
  const Cart = mongoose.model('Cart');
  const listing = await Listing.findById(listingId);
  if (!listing || !listing.isAvailable()) throw new Error('Listing unavailable');
  if (String(listing.seller) === String(this._id))
    throw new Error('You cannot purchase your own listing');


  let cart = await Cart.findOne({ buyer: this._id });
  if (!cart) cart = new Cart({ buyer: this._id, items: [] });

  const existing = cart.items.find((i) => String(i.listing) === String(listingId));
  if (existing) existing.quantity += quantity;
  else cart.items.push({ listing: listing._id, quantity, unitPrice: listing.price });

  cart.calculateTotal();
  await cart.save();
  return cart;
};

buyerSchema.methods.removeFromCart = async function (cartItemId) {
  const Cart = mongoose.model('Cart');
  const cart = await Cart.findOne({ buyer: this._id });
  if (!cart) return null;
  cart.items = cart.items.filter((i) => String(i._id) !== String(cartItemId));
  cart.calculateTotal();
  await cart.save();
  return cart;
};

buyerSchema.methods.viewOrders = function () {
  return mongoose.model('Order').find({ buyer: this._id });
};

buyerSchema.methods.requestRefund = function (orderId, reason) {
  return mongoose.model('RefundRequest').create({ order: orderId, reason });
};

buyerSchema.methods.compareListings = async function (listingIds = []) {
  return mongoose.model('Listing').find({ _id: { $in: listingIds } }).lean();
};

// How long after purchase an item may be returned to the seller.
const RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// checkout(paymentId) — minimal end-to-end cart -> order. Extend as needed.
buyerSchema.methods.checkout = async function (paymentId) {
  const Cart = mongoose.model('Cart');
  const Order = mongoose.model('Order');
  const Listing = mongoose.model('Listing');

  const cart = await Cart.findOne({ buyer: this._id }).populate('items.listing');
  if (!cart || cart.items.length === 0) throw new Error('Cart is empty');

  // Validate every line BEFORE mutating anything, so a rejected item (unavailable,
  // out of stock, or self-purchased) can't leave a half-processed checkout with
  // stock already decremented for earlier lines.
  const items = [];
  const earningsBySeller = new Map();
  for (const it of cart.items) {
    const listing = it.listing;
    if (!listing || !listing.isAvailable() || listing.stock < it.quantity)
      throw new Error(`Unavailable: ${listing ? listing.name : 'an item in your cart'}`);
    if (String(listing.seller) === String(this._id))
      throw new Error(`You cannot purchase your own listing: ${listing.name}`);
    items.push({
      listing: listing._id,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      seller: listing.seller,
    });
    const key = String(listing.seller);
    earningsBySeller.set(key, (earningsBySeller.get(key) ?? 0) + it.unitPrice * it.quantity);
  }

  for (const it of cart.items) {
    it.listing.stock -= it.quantity;
    await it.listing.save();
  }

  const order = await Order.create({
    buyer: this._id,
    items,
    total: cart.total,
    payment: paymentId,
  });

  // Credit seller earnings at checkout (pay-at-checkout model).
  for (const [sellerId, amount] of earningsBySeller) {
    await Seller.findByIdAndUpdate(sellerId, { $inc: { earnings: amount } });
  }

  cart.items = [];
  cart.calculateTotal();
  await cart.save();

  return order;
};

// requestReturn(orderId, orderItemId, reason) : RefundRequest
// Buyer asks to return one item from their own order to the seller.
// Rules: order must belong to this buyer, the item must be in it, the
// purchase must be within the 7-day return window, and each item can only
// have one open return. Creates a Pending RefundRequest for the seller to
// decide and notifies the buyer.
buyerSchema.methods.requestReturn = async function (orderId, orderItemId, reason = '') {
  const Order = mongoose.model('Order');
  const RefundRequest = mongoose.model('RefundRequest');

  const order = await Order.findOne({ _id: orderId, buyer: this._id });
  if (!order) {
    const exists = await Order.findById(orderId).select('_id');
    throw Object.assign(new Error(exists ? 'Forbidden' : 'Order not found'), {
      status: exists ? 403 : 404,
    });
  }

  const item = order.items.id(orderItemId);
  if (!item) throw Object.assign(new Error('Item not found in this order'), { status: 404 });

  const purchasedAt = order.createdAt || order._id.getTimestamp();
  if (Date.now() - purchasedAt.getTime() > RETURN_WINDOW_MS) {
    throw Object.assign(new Error('The 7-day return window for this order has passed'), {
      status: 409,
    });
  }

  const dup = await RefundRequest.findOne({ order: order._id, orderItem: item._id });
  if (dup) {
    throw Object.assign(new Error('A return has already been requested for this item'), {
      status: 409,
      returnRequestId: dup._id,
      returnStatus: dup.status,
    });
  }

  const refund = await RefundRequest.create({
    order: order._id,
    orderItem: item._id,
    reason: String(reason || 'No reason provided'),
  });

  let itemName = 'an item';
  try {
    await item.populate('listing', 'name');
    if (item.listing?.name) itemName = item.listing.name;
  } catch {
    /* notification only — fall back to generic label */
  }

  await mongoose.model('Notification').create({
    recipient: this._id,
    recipientModel: 'Buyer',
    type: 'return',
    message: `Return requested for "${itemName}" in order ${order._id}. Status: ${refund.status}.`,
  });

  return refund;
};

const Buyer = User.discriminator('Buyer', buyerSchema);

module.exports = { User, Seller, Admin, Buyer, addressSchema };