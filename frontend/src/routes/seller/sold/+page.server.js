import { redirect } from '@sveltejs/kit';
import { getOrders, getListingById, getUserById } from '#lib/Admin.js';

/**
 * @typedef {Object} Buyer
 * @property {string} [_id]
 * @property {string} [name]
 * @property {string} [username]
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} [_id]
 * @property {string | { _id?: string, name?: string, price?: number }} [listing]
 * @property {number} [quantity]
 * @property {number} [unitPrice]
 */

/**
 * @typedef {Object} Order
 * @property {string} [_id]
 * @property {string | Buyer} [buyer]
 * @property {string | Buyer} [user]
 * @property {OrderItem[]} [items]
 * @property {number} [total]
 * @property {string} [fulfillmentState]
 * @property {string} [shippingInfo]
 * @property {string} [createdAt]
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
  const isSeller = user?.role === 'Seller';

  if (!isSeller) {
    return { orders: [], isSeller: false, error: '' };
  }

  try {
    /** @type {Order[] | null} */
    const raw = (await getOrders(token)) ?? [];

    const orders = await Promise.all(
      /** @type {Order[]} */ (raw).filter(isObject).map(async (order) => {
        // Resolve buyer name (supports populated object or ID string on order.buyer / order.user)
        const rawBuyer = order.buyer ?? order.user;
        let buyerName = 'Unknown Buyer';

        if (isObject(rawBuyer)) {
          buyerName = String(rawBuyer.name ?? rawBuyer.username ?? 'Unknown Buyer');
        } else if (typeof rawBuyer === 'string' && rawBuyer) {
          try {
            const fetchedUser = await getUserById(token, rawBuyer);
            buyerName = isObject(fetchedUser)
              ? String(fetchedUser.name ?? fetchedUser.username ?? `User #${rawBuyer.slice(-6)}`)
              : `User #${rawBuyer.slice(-6)}`;
          } catch {
            buyerName = `User #${rawBuyer.slice(-6)}`;
          }
        }

        const items = await Promise.all(
          (Array.isArray(order.items) ? order.items : []).map(async (item) => {
            const listingId = isObject(item?.listing)
              ? String(item.listing._id ?? '')
              : String(item?.listing ?? '');

            let name = isObject(item?.listing) ? String(item.listing.name ?? '') : '';
            if (!name && listingId) {
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
              price: Number(item?.unitPrice ?? (isObject(item?.listing) ? item.listing.price : 0) ?? 0),
              quantity: Number(item?.quantity ?? 1)
            };
          })
        );

        return {
          _id: String(order._id ?? ''),
          buyerName,
          items,
          total: Number(order.total ?? 0),
          fulfillmentState: String(order.fulfillmentState ?? 'Open'),
          shippingInfo: String(order.shippingInfo ?? ''),
          createdAt: String(order.createdAt ?? '')
        };
      })
    );

    orders.sort(byNewestFirst);

    return { orders, isSeller: true, error: '' };
  } catch (err) {
    return {
      orders: [],
      isSeller: false,
      error: err instanceof Error ? err.message : 'Could not load your sales.'
    };
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