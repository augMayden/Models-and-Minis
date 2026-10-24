import { redirect } from '@sveltejs/kit';
import { getListings, getAccounts } from '#lib/Admin.js';

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
export const load = async ({ cookies }) => {
  const token = cookies.get('token');

  if (!token) {
    throw redirect(303, '/login');
  }

  try {
    const [data, accountData] = await Promise.all([
      getListings(token),
      getAccounts(token)
    ]);

    /** @type {Listing[]} */
    const items = Array.isArray(data) ? data : (data?.items ?? []);
    const total = Array.isArray(data) ? items.length : (data?.total ?? items.length);

    const accounts = Array.isArray(accountData) ? accountData : (accountData?.accounts ?? []);
    /** @type {Map<string, string>} */
    const names = new Map();
    for (const a of accounts) {
      if (a?._id) names.set(String(a._id), String(a.username ?? a._id));
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

    return { listings, total, error: '' };
  } catch (err) {
    return {
      listings: [],
      total: 0,
      error: err instanceof Error ? err.message : 'Could not load listings.'
    };
  }
};
