import { redirect, fail } from '@sveltejs/kit';
import { getCart, addToCart, removeCartItem } from '#lib/Admin.js';

/**
 * @typedef {Object} CartItem
 * @property {string} [_id]
 * @property {number} [quantity]
 * @property {number} [unitPrice]
 * @property {{ _id?: string, name?: string, price?: number }} [listing]
 */

/**
 * @typedef {Object} Cart
 * @property {CartItem[]} [items]
 * @property {number} [total]
 */

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ cookies, parent }) => {
  const token = cookies.get('token');

  if (!token) {
    throw redirect(303, '/login');
  }

  const { user } = await parent();
  const isBuyer = user?.role === 'Buyer';

  if (!isBuyer) {
    return { items: [], total: 0, isBuyer: false, error: '' };
  }

  try {
    /** @type {Cart} */
    const cart = (await getCart(token)) ?? { items: [], total: 0 };

    const items = (cart.items ?? []).map((/** @type {CartItem} */ i) => ({
      _id: String(i._id ?? ''),
      name: i.listing?.name ?? '(unavailable)',
      price: i.unitPrice ?? i.listing?.price ?? 0,
      quantity: i.quantity ?? 1
    }));

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return { items, total, isBuyer: true, error: '' };
  } catch (err) {
    return {
      items: [],
      total: 0,
      isBuyer: true,
      error: err instanceof Error ? err.message : 'Could not load your cart.'
    };
  }
};

export const actions = {
  remove: async ({ request, cookies }) => {
    const token = cookies.get('token');
    if (!token) return fail(401, { message: 'You must be logged in.' });

    const form = await request.formData();
    const id = String(form.get('cartItemId') ?? '');

    if (!id) return fail(400, { message: 'Missing cart item ID.' });

    try {
      await removeCartItem(token, id);
      return { message: 'Item removed from your cart.' };
    } catch (err) {
      return fail(400, {
        message: err instanceof Error ? err.message : 'Could not remove that item.'
      });
    }
  },

  add: async ({ request, cookies }) => {
    const token = cookies.get('token');
    if (!token) return fail(401, { message: 'You must be logged in.' });

    const form = await request.formData();
    const listingId = String(form.get('listingId') ?? '');

    if (!listingId) return fail(400, { message: 'Missing listing ID.' });

    try {
      await addToCart(token, listingId, 1);
      return { message: 'Added to your cart.' };
    } catch (err) {
      return fail(400, {
        message: err instanceof Error ? err.message : 'Could not add that item.'
      });
    }
  }
};
