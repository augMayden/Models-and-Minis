import { redirect, fail } from '@sveltejs/kit';
import { getOrders, getListingById, requestReturn } from '#lib/Admin.js';

// How long after purchase the Return button stays visible. Must match the
// API's RETURN_WINDOW_MS (database/api/src/models/User.js).
const RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * @typedef {Object} OrderItem
 * @property {string} [_id]
 * @property {{ _id?: string, name?: string, price?: number }} [listing]
 * @property {number} [quantity]
 * @property {number} [unitPrice]
 */

/**
 * @typedef {Object} Order
 * @property {string} [_id]
 * @property {OrderItem[]} [items]
 * @property {number} [total]
 * @property {string} [fulfillmentState]
 * @property {string} [shippingInfo]
 * @property {string} [createdAt]
 * @property {boolean} [returnable]
 * @property {boolean} [cancelled]
 */

/**
 * @param {unknown} d
 * @returns {d is Record<string, unknown>}
 */
function isObject(d) {
  return typeof d === 'object' && d !== null;
}

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ cookies, parent }) => {
  const token = cookies.get('token');

  if (!token) {
    throw redirect(303, '/login');
  }

  const { user } = await parent();
  const isBuyer = user?.role === 'Buyer';

  if (!isBuyer) {
    return { orders: [], isBuyer: false, error: '' };
  }

  try {
    /** @type {Order[] | null} */
    const raw = (await getOrders(token)) ?? [];

    const orders = await Promise.all(
      /** @type {Order[]} */ (raw).filter(isObject).map(async (order) => {
        const items = await Promise.all(
          (Array.isArray(order.items) ? order.items : []).map(async (item) => {
            const listingId = String(item?.listing ?? '');
            let name = '';
            if (listingId) {
              try {
                const listing = await getListingById(token, listingId);
                name = String(listing?.name ?? '');
              } catch {
                name = '';
              }
            }
            return {
              _id: String(item?._id ?? ''),
              listingId,
              name: name || '(unavailable)',
              price: Number(item?.unitPrice ?? item?.listing?.price ?? 0),
              quantity: Number(item?.quantity ?? 1)
            };
          })
        );

        return {
          _id: String(order._id ?? ''),
          items,
          total: Number(order.total ?? 0),
          fulfillmentState: String(order.fulfillmentState ?? 'Open'),
          shippingInfo: String(order.shippingInfo ?? ''),
          createdAt: String(order.createdAt ?? ''),
          returnable:
            !Number.isNaN(Date.parse(String(order.createdAt ?? ''))) &&
            Date.now() - Date.parse(String(order.createdAt)) <= RETURN_WINDOW_MS &&
            String(order.fulfillmentState ?? '') !== 'Cancelled',
          cancelled: String(order.fulfillmentState ?? '') === 'Cancelled'
        };
      })
    );

    orders.sort(byNewestFirst);

    return { orders, isBuyer: true, error: '' };
  } catch (err) {
    return {
      orders: [],
      isBuyer: false,
      error: err instanceof Error ? err.message : 'Could not load your orders.'
    };
  }
};

export const actions = {
  /** Buyer asks to return one item from one of their orders. */
  return: async ({ request, cookies }) => {
    const token = cookies.get('token');
    if (!token) return fail(401, { message: 'You must be logged in.' });

    const form = await request.formData();
    const orderId = String(form.get('orderId') ?? '');
    const itemId = String(form.get('itemId') ?? '');
    const reason = String(form.get('reason') ?? '').trim();

    if (!orderId || !itemId) return fail(400, { message: 'Missing order or item.' });

    try {
      await requestReturn(token, orderId, itemId, reason);
      return { message: 'Return requested — the seller will review it.' };
    } catch (err) {
      return fail(400, {
        message: err instanceof Error ? err.message : 'Could not request the return.'
      });
    }
  }
};

/**
 * Sorts orders newest-first by creation date so a fresh purchase appears on top.
 * @param {Order} a
 * @param {Order} b
 */
function byNewestFirst(a, b) {
  const ta = Date.parse(String(a.createdAt ?? '')) || 0;
  const tb = Date.parse(String(b.createdAt ?? '')) || 0;
  return tb - ta;
}
