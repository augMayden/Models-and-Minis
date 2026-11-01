/**
 * Marketplace database seeder.
 *
 *   node scripts/seed.js            # idempotent: ensure demo data exists (no data loss)
 *   node scripts/seed.js --reset    # wipe the database first, then seed fresh
 *
 * Re-running without --reset upserts known records (users by email, listings by
 * seller+name) and skips collections that already have data, so it is safe to
 * run whenever the DB is empty OR partially populated.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const {
  User,
  Seller,
  Admin,
  Buyer,
  Listing,
  Cart,
  Order,
  Payment,
  RefundRequest,
  Notification,
} = require('../src/models');

const RESET = process.argv.includes('--reset');

let created = 0;
let updated = 0;

// ---------------------------------------------------------------- users
async function upsertUser(Model, { username, email, password, role, extra = {} }) {
  let user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    updated++;
    return user;
  }
  user = new Model({ username, email, role, accountType: 'Active', ...extra });
  await user.setPassword(password);
  await user.save();
  created++;
  return user;
}

// ------------------------------------------------------------- listings
async function upsertListing(seller, data) {
  let listing = await Listing.findOne({ seller: seller._id, name: data.name });
  if (listing) {
    updated++;
    return listing;
  }
  listing = await Listing.create({ seller: seller._id, ...data });
  created++;
  return listing;
}

// ------------------------------------------------------------- payments
async function upsertPayment(owner, ownerModel, data) {
  let pm = await Payment.findOne({ owner: owner._id, token: data.token });
  if (pm) {
    updated++;
    return pm;
  }
  pm = await Payment.create({ owner: owner._id, ownerModel, ...data });
  created++;
  return pm;
}

// ------------------------------------------------------------------ main
(async () => {
  await connectDB();

  if (RESET) {
    await mongoose.connection.db.dropDatabase();
    console.log('[seed] --reset: database dropped');
  }

  // ---- Admin ----
  const admin = await upsertUser(Admin, {
    username: 'admin',
    email: 'admin@marketplace.test',
    password: 'admin1234',
    role: 'Admin',
    extra: { adminLevel: 3 },
  });

  // ---- Sellers ----
  const seller = await upsertUser(Seller, {
    username: 'pixelparlor',
    email: 'seller@marketplace.test',
    password: 'seller1234',
    role: 'Seller',
    extra: { earnings: 0, paymentMethod: 'stripe' },
  });
  const seller2 = await upsertUser(Seller, {
    username: 'retroelectronics',
    email: 'seller2@marketplace.test',
    password: 'seller1234',
    role: 'Seller',
    extra: { earnings: 0, paymentMethod: 'paypal' },
  });
  const seller3 = await upsertUser(Seller, {
    username: 'craftcorner',
    email: 'seller3@marketplace.test',
    password: 'seller1234',
    role: 'Seller',
    extra: { earnings: 0, paymentMethod: 'stripe' },
  });

  // ---- Buyers ----
  const buyer = await upsertUser(Buyer, {
    username: 'victor',
    email: 'buyer@marketplace.test',
    password: 'buyer1234',
    role: 'Buyer',
    extra: {
      shippingAddresses: [
        { label: 'Home', line1: '123 Elm St', city: 'Starkville', state: 'MS', postalCode: '39759', country: 'US' },
      ],
    },
  });
  const buyer2 = await upsertUser(Buyer, {
    username: 'alex',
    email: 'buyer2@marketplace.test',
    password: 'buyer1234',
    role: 'Buyer',
    extra: {
      shippingAddresses: [
        { label: 'Work', line1: '500 Main Ave', city: 'Jackson', state: 'MS', postalCode: '39201', country: 'US' },
      ],
    },
  });

  // ---- Payments ----
  const pm1 = await upsertPayment(buyer, 'Buyer', { methodType: 'card', token: 'tok_demo_123', isDefault: true });
  const pm2 = await upsertPayment(buyer2, 'Buyer', { methodType: 'card', token: 'tok_demo_456', isDefault: true });
  for (const [b, pm] of [[buyer, pm1], [buyer2, pm2]]) {
    if (!b.paymentMethods.map(String).includes(String(pm._id))) {
      b.paymentMethods.push(pm._id);
      await b.save();
    }
  }

  // ---- Listings ----
  const listingDefs = [
    [seller, { name: 'Vintage Typewriter', price: 89.99, stock: 3, theme: 'vintage', scale: '1:1', description: 'Working 1970s typewriter.', status: 'Active' }],
    [seller, { name: 'Handmade Ceramic Mug', price: 18.5, stock: 25, theme: 'kitchen', scale: '1:1', description: 'Speckled glaze, dishwasher safe.', status: 'Active' }],
    [seller, { name: 'Retro Arcade Poster', price: 12.0, stock: 100, theme: 'decor', scale: 'A2', description: '80s arcade art print.', status: 'Active' }],
    [seller, { name: 'Mechanical Keyboard Kit', price: 64.0, stock: 0, theme: 'tech', scale: '65%', description: 'Hot-swap PCB, no keycaps.', status: 'Active' }],
    [seller, { name: 'Draft Lamp (Pending)', price: 40.0, stock: 5, theme: 'decor', scale: '1:2', description: 'Awaiting admin approval.', status: 'Pending' }],
    [seller2, { name: 'Sealed NES Cartridge', price: 240.0, stock: 1, theme: 'gaming', scale: '1:1', description: 'Unopened, collector grade.', status: 'Active' }],
    [seller2, { name: 'Sony Walkman WM-EX', price: 75.0, stock: 4, theme: 'audio', scale: '1:1', description: 'Refurbished, belt replaced.', status: 'Active' }],
    [seller2, { name: 'CRT Monitor 17"', price: 130.0, stock: 2, theme: 'retro', scale: '17in', description: 'For retro gaming rigs.', status: 'Active' }],
    [seller3, { name: 'Hand-Knit Wool Scarf', price: 32.0, stock: 12, theme: 'apparel', scale: 'one-size', description: 'Merino wool, oatmeal.', status: 'Active' }],
    [seller3, { name: 'Pour-Over Coffee Set', price: 45.0, stock: 8, theme: 'kitchen', scale: '500ml', description: 'Glass carafe + dripper.', status: 'Active' }],
    [seller3, { name: 'Leather Journal A5', price: 28.0, stock: 20, theme: 'stationery', scale: 'A5', description: 'Full-grain, refillable.', status: 'Active' }],
    [seller3, { name: 'Discontinued Candle', price: 22.0, stock: 0, theme: 'home', scale: '8oz', description: 'Removed from catalog.', status: 'Removed' }],
  ];
  const listings = [];
  for (const [s, def] of listingDefs) listings.push(await upsertListing(s, def));

  // ---- Orders (only if none exist; build via real cart+checkout flow) ----
  const existingOrders = await Order.countDocuments();
  let seededOrders = [];
  if (existingOrders === 0) {
    const plans = [
      { account: buyer, items: [[0, 1], [1, 2]] }, // typewriter x1, mug x2
      { account: buyer2, items: [[5, 1], [6, 1]] }, // NES x1, walkman x1
      { account: buyer, items: [[9, 1]] }, // pour-over set
    ];
    for (const plan of plans) {
      await Cart.deleteOne({ buyer: plan.account._id });
      for (const [idx, qty] of plan.items) {
        await plan.account.addToCart({ listingId: listings[idx]._id, quantity: qty });
      }
      const order = await plan.account.checkout(plan.account.paymentMethods[0]);
      seededOrders.push(order);
      created++;
    }
    // mark a couple progressed
    if (seededOrders[1]) {
      seededOrders[1].fulfillmentState = 'Shipped';
      seededOrders[1].shippingInfo = 'USPS 9400 1000 0000';
      await seededOrders[1].save();
    }
  } else {
    console.log(`[seed] ${existingOrders} order(s) already present — skipping order/cart seeding`);
  }

  // ---- Refund request (one pending, on the first seeded order) ----
  const refundCount = await RefundRequest.countDocuments();
  if (refundCount === 0 && seededOrders[0]) {
    const o = seededOrders[0];
    await RefundRequest.create({
      order: o._id,
      orderItem: o.items[0]?._id,
      reason: 'Item arrived with cosmetic damage.',
    });
    created++;
  }

  // ---- Notifications ----
  const notifCount = await Notification.countDocuments();
  if (notifCount === 0) {
    await Notification.insertMany([
      { recipient: buyer._id, recipientModel: 'Buyer', type: 'order', message: 'Your order has been placed.' },
      { recipient: seller._id, recipientModel: 'Seller', type: 'listing', message: 'A listing is pending approval.' },
      { recipient: admin._id, recipientModel: 'Admin', type: 'system', message: 'Welcome, admin.' },
    ]);
    created += 3;
  }

  // ---- summary ----
  const counts = {
    users: await User.countDocuments(),
    listings: await Listing.countDocuments(),
    orders: await Order.countDocuments(),
    carts: await Cart.countDocuments(),
    payments: await Payment.countDocuments(),
    refundRequests: await RefundRequest.countDocuments(),
    notifications: await Notification.countDocuments(),
  };

  console.log('\n[seed] done');
  console.log(`  created: ${created}, updated/skipped: ${updated}`);
  console.log('  current counts:', JSON.stringify(counts));
  console.log('\n  demo accounts:');
  console.log('    admin   admin@marketplace.test   / admin1234');
  console.log('    seller  seller@marketplace.test  / seller1234');
  console.log('    seller2 seller2@marketplace.test / seller1234');
  console.log('    seller3 seller3@marketplace.test / seller1234');
  console.log('    buyer   buyer@marketplace.test   / buyer1234');
  console.log('    buyer2  buyer2@marketplace.test  / buyer1234');

  await mongoose.disconnect();
})().catch((e) => {
  console.error('[seed] failed:', e);
  process.exit(1);
});