import { redirect } from '@sveltejs/kit';
import { getListings, getPublicListings, getAccounts } from '#lib/Admin.js';

/**
 * @typedef {Object} Listing
 * @property {string} [_id]
 * @property {string} [name]
 * @property {string} [description]
 * @property {number} [price]
 * @property {string} [status]
 * @property {string | { _id?: string, username?: string }} [seller]
 */

/**
 * @typedef {Object} Account
 * @property {string} [_id]
 * @property {string} [username]
 */

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ cookies, parent }) => {
  const token = cookies.get('token');

  if (!token) {
    throw redirect(303, '/login');
  }

  const { user } = await parent();
  const isAdmin = user?.role === 'Admin';

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
        /* non-fatal: fall back to raw seller ids */
      }
    }

    const listings = items.map((/** @type {Listing} */ l) => {
      let seller = 'Unknown seller';

      if (typeof l.seller === 'string') {
        seller = names.get(l.seller) ?? l.seller;
      } else if (l.seller) {
        seller =
          l.seller.username ??
          names.get(String(l.seller._id)) ??
          'Unknown seller';
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

    return { listings, total, isAdmin, error: '' };
  } catch (err) {
    return {
      listings: [],
      total: 0,
      isAdmin,
      error: err instanceof Error ? err.message : 'Could not load listings.'
    };
  }
};
