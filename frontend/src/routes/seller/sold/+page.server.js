import { redirect, fail } from '@sveltejs/kit';
import { getOrders, getListingById, getUserById, getReturns, acceptRefund, escalateRefund } from '#lib/Admin.js';

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
 * @property {Array<{_id:string, order:string, orderItem:string, reason:string, status:string, decisionReason:string, createdAt:string}>} [refunds]
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

    // Refund requests for the seller's orders, grouped by order id so each
    // order card can show its "Review refund request" panel.
    /** @type {Map<string, Array<{_id:string, order:string, orderItem:string, reason:string, status:string, decisionReason:string, createdAt:string}>>} */
    const refundsByOrder = new Map();
    try {
      const refundList = (await getReturns(token)) ?? [];
      for (const r of Array.isArray(refundList) ? refundList : []) {
        const oid = String(r?.order ?? '');
        if (!oid) continue;
        const entry = {
          _id: String(r._id ?? ''),
          order: oid,
          orderItem: String(r?.orderItem ?? ''),
          reason: String(r?.reason ?? ''),
          status: String(r?.status ?? 'Pending'),
          decisionReason: String(r?.decisionReason ?? ''),
          createdAt: String(r?.createdAt ?? '')
        };
        const list = refundsByOrder.get(oid) ?? [];
        list.push(entry);
        refundsByOrder.set(oid, list);
      }
    } catch {
      /* non-fatal: page still renders, just without refund panels */
    }

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
          createdAt: String(order.createdAt ?? ''),
          refunds: refundsByOrder.get(String(order._id ?? '')) ?? []
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

export const actions = {
  /** Seller accepts a buyer's return request. */
  accept: async ({ request, cookies }) => {
    const token = cookies.get('token');
    if (!token) return fail(401, { message: 'You must be logged in.' });

    const form = await request.formData();
    const refundId = String(form.get('refundId') ?? '');
    if (!refundId) return fail(400, { message: 'Missing refund request.' });

    try {
      await acceptRefund(token, refundId);
      return { message: 'Return accepted.' };
    } catch (err) {
      return fail(400, {
        message: err instanceof Error ? err.message : 'Could not accept the return.'
      });
    }
  },

  /** Seller escalates a buyer's return request to an admin. */
  escalate: async ({ request, cookies }) => {
    const token = cookies.get('token');
    if (!token) return fail(401, { message: 'You must be logged in.' });

    const form = await request.formData();
    const refundId = String(form.get('refundId') ?? '');
    const note = String(form.get('note') ?? '').trim();
    if (!refundId) return fail(400, { message: 'Missing refund request.' });

    try {
      await escalateRefund(token, refundId, note);
      return { message: 'Sent to an admin for review.' };
    } catch (err) {
      return fail(400, {
        message: err instanceof Error ? err.message : 'Could not escalate the request.'
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