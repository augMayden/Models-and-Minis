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

// checkout(paymentId) — minimal end-to-end cart -> order. Extend as needed.
buyerSchema.methods.checkout = async function (paymentId) {
  const Cart = mongoose.model('Cart');
  const Order = mongoose.model('Order');
  const Listing = mongoose.model('Listing');

  const cart = await Cart.findOne({ buyer: this._id }).populate('items.listing');
  if (!cart || cart.items.length === 0) throw new Error('Cart is empty');

  const items = [];
  for (const it of cart.items) {
    const listing = it.listing;
    if (!listing.isAvailable() || listing.stock < it.quantity)
      throw new Error(`Unavailable: ${listing.name}`);
    items.push({
      listing: listing._id,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      seller: listing.seller,
    });
    listing.stock -= it.quantity;
    await listing.save();
  }

  const order = await Order.create({
    buyer: this._id,
    items,
    total: cart.total,
    payment: paymentId,
  });

  cart.items = [];
  cart.calculateTotal();
  await cart.save();

  return order;
};

const Buyer = User.discriminator('Buyer', buyerSchema);

module.exports = { User, Seller, Admin, Buyer, addressSchema };