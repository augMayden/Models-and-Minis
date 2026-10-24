import { redirect } from '@sveltejs/kit';
import { getListings } from '#lib/Admin.js';

/**
 * @typedef {Object} Listing
 * @property {string} [_id]
 * @property {string} [name]
 * @property {string} [description]
 * @property {number} [price]
 * @property {string} [status]
 * @property {{ username?: string } | string} [seller]
 */

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ cookies }) => {
  const token = cookies.get('token');

  if (!token) {
    throw redirect(303, '/login');
  }

  try {
    const data = await getListings(token);

    // /api/listings is paginated: { total, page, limit, items }.
    // /api/admin/listings returns a bare array. Accept both.
    /** @type {Listing[]} */
    const items = Array.isArray(data) ? data : (data?.items ?? []);
    const total = Array.isArray(data) ? items.length : (data?.total ?? items.length);

    const listings = items.map((/** @type {Listing} */ l) => ({
      _id: String(l._id ?? ''),
      name: l.name ?? '(untitled)',
      description: l.description ?? '',
      price: l.price ?? 0,
      status: l.status ?? 'Unknown',
      seller:
        typeof l.seller === 'string'
          ? l.seller
          : (l.seller?.username ?? 'Unknown seller')
    }));

    return { listings, total, error: '' };
  } catch (err) {
    return {
      listings: [],
      total: 0,
      error: err instanceof Error ? err.message : 'Could not load listings.'
    };
  }
};
