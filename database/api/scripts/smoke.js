/**
 * End-to-end smoke test hitting the running API.
 * Usage: API_URL=http://127.0.0.1:4000 node scripts/smoke.js
 */
const BASE = process.env.API_URL || 'http://127.0.0.1:4000';

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

const log = (label, ok, extra = '') =>
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? '  -> ' + extra : ''}`);

(async () => {
  let pass = 0, fail = 0;
  const check = (label, cond, extra) => (cond ? (pass++, log(label, true, extra)) : (fail++, log(label, false, extra)));

  const h = await call('GET', '/health');
  check('health', h.status === 200 && h.data.status === 'ok');

  const buyerLogin = await call('POST', '/api/auth/login', { body: { identifier: 'buyer@marketplace.test', password: 'buyer1234' } });
  check('buyer login', buyerLogin.status === 200 && !!buyerLogin.data.token);
  const buyerTok = buyerLogin.data.token;

  const sellerLogin = await call('POST', '/api/auth/login', { body: { identifier: 'seller@marketplace.test', password: 'seller1234' } });
  check('seller login', sellerLogin.status === 200 && !!sellerLogin.data.token);
  const sellerTok = sellerLogin.data.token;

  const adminLogin = await call('POST', '/api/auth/login', { body: { identifier: 'admin@marketplace.test', password: 'admin1234' } });
  check('admin login', adminLogin.status === 200 && !!adminLogin.data.token);
  const adminTok = adminLogin.data.token;

  const badLogin = await call('POST', '/api/auth/login', { body: { identifier: 'buyer@marketplace.test', password: 'wrong' } });
  check('bad login rejected', badLogin.status === 401);

  const listings = await call('GET', '/api/listings?status=Active');
  check('list active listings', listings.status === 200 && listings.data.total >= 3, `total=${listings.data.total}`);
  const firstListing = listings.data.items[0];

  const search = await call('GET', '/api/listings?q=typewriter');
  check('text search', search.status === 200 && search.data.items.length >= 1);

  // seller creates a listing
  const created = await call('POST', '/api/listings', {
    token: sellerTok,
    body: { name: 'Smoke Test Widget', price: 9.99, stock: 7, theme: 'test', description: 'from smoke test' },
  });
  check('seller create listing', created.status === 201 && created.data._id);

  // admin approves it
  const approved = await call('POST', `/api/admin/listings/${created.data._id}/approve`, { token: adminTok });
  check('admin approve listing', approved.status === 200 && approved.data.status === 'Active');

  // buyer adds to cart
  const added = await call('POST', '/api/cart/items', { token: buyerTok, body: { listingId: firstListing._id, quantity: 2 } });
  check('add to cart', added.status === 201 && added.data.items.length >= 1, `total=${added.data.total}`);

  // buyer cannot access admin
  const forbidden = await call('GET', '/api/admin/overview', { token: buyerTok });
  check('buyer blocked from admin', forbidden.status === 403);

  // checkout
  const checkout = await call('POST', '/api/orders/checkout', { token: buyerTok, body: {} });
  check('checkout', checkout.status === 201 && checkout.data._id, `order=${checkout.data._id}`);

  // cart now empty
  const cartAfter = await call('GET', '/api/cart', { token: buyerTok });
  check('cart cleared after checkout', cartAfter.status === 200 && cartAfter.data.items.length === 0);

  // seller sees order
  const sellerOrders = await call('GET', '/api/orders', { token: sellerTok });
  check('seller sees orders', sellerOrders.status === 200 && Array.isArray(sellerOrders.data));

  // admin overview
  const overview = await call('GET', '/api/admin/overview', { token: adminTok });
  check('admin overview', overview.status === 200 && typeof overview.data.users === 'number', JSON.stringify(overview.data));

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();