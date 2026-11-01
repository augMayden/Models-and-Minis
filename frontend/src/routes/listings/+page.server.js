import { redirect, fail } from '@sveltejs/kit';
import {
  getListings,
  getPublicListings,
  getAccounts,
  removeListing,
  addToCart
} from '#lib/Admin.js';

/**
 * @typedef {Object} Listing
 * @property {string} [_id]
 * @property {string} [name]
 * @property {string} [description]
 * @property {number} [price]
 * @property {string} [status]
 * @property {string | { _id?: string, username?: string }} [seller]
 */

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ cookies, parent }) => {
  const token = cookies.get('token');

  if (!token) {
    throw redirect(303, '/login');
  }

  const { user } = await parent();
  const role = user?.role ?? '';
  const isAdmin = role === 'Admin';
  const isBuyer = role === 'Buyer';

  try {
    /** @type {Listing[]} */
    let items = [];
    let total = 0;

    if (isAdmin) {
      const data = await getListings(token);
      items = Array.isArray(data) ? data : (data?.items ?? []);
      total = Array.isArray(data) ? items.length : (data?.total ?? items.length);
    } else {
      const data = await getPublicListings(token);
      items = Array.isArray(data) ? data : (data?.items ?? []);
      total = Array.isArray(data) ? items.length : (data?.total ?? items.length);
    }

    /** @type {Map<string, string>} */
    const names = new Map();

    if (isAdmin) {
      try {
        const accountData = await getAccounts(token);
        const accounts = Array.isArray(accountData)
          ? accountData
          : (accountData?.accounts ?? []);

        for (const a of accounts) {
          if (a?._id) names.set(String(a._id), String(a.username ?? a._id));
        }
      } catch {
        /* non-fatal */
      }
    }

    const listings = items.map((/** @type {Listing} */ l) => {
      let seller = 'Unknown seller';

      if (typeof l.seller === 'string') {
        seller = names.get(l.seller) ?? l.seller;
      } else if (l.seller) {
        seller = l.seller.username ?? names.get(String(l.seller._id)) ?? 'Unknown seller';
      }

      return {
        _id: String(l._id ?? ''),
        name: l.name ?? '(untitled)',
        description: l.description ?? '',
        price: l.price ?? 0,
        status: l.status ?? 'Unknown',
        seller
      };
    });

    return { listings, total, isAdmin, isBuyer, error: '' };
  } catch (err) {
    return {
      listings: [],
      total: 0,
      isAdmin,
      isBuyer,
      error: err instanceof Error ? err.message : 'Could not load listings.'
    };
  }
};

export const actions = {
  remove: async ({ request, cookies }) => {
    const token = cookies.get('token');
    if (!token) return fail(401, { message: 'You must be logged in.' });

    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    const name = String(form.get('name') ?? 'that listing');

    if (!id) return fail(400, { message: 'Missing listing ID.' });

    try {
      const result = await removeListing(token, id);
      if (!result) return fail(404, { message: 'No matching listing found.' });
      return { message: `"${name}" was removed.` };
    } catch (err) {
      return fail(400, {
        message: err instanceof Error ? err.message : 'Could not remove that listing.'
      });
    }
  },

  addToCart: async ({ request, cookies }) => {
    const token = cookies.get('token');
    if (!token) return fail(401, { message: 'You must be logged in.' });

    const form = await request.formData();
    const listingId = String(form.get('listingId') ?? '');
    const name = String(form.get('name') ?? 'item');

    if (!listingId) return fail(400, { message: 'Missing listing ID.' });

    try {
      await addToCart(token, listingId, 1);
      return { message: `"${name}" added to your cart.` };
    } catch (err) {
      return fail(400, {
        message: err instanceof Error ? err.message : 'Could not add that item to your cart.'
      });
    }
  }
};
