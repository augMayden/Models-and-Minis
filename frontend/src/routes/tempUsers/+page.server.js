import { redirect, fail } from '@sveltejs/kit';
import { getAccounts, approveAccount, denyAccount, banAccount } from '#lib/Admin.js';

/**
 * @typedef {Object} Account
 * @property {string} [_id]
 * @property {string} [username]
 * @property {string} [email]
 * @property {string} [role]
 * @property {string} [accountType]
 */

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ cookies, parent }) => {
  const token = cookies.get('token');

  if (!token) {
    throw redirect(303, '/login');
  }

  // One-shot flash from the create-listing action (e.g. photo-upload warning)
  const imageWarning = cookies.get('userFlash') ?? '';
  if (imageWarning) cookies.delete('userFlash', { path: '/users' });

  const { user } = await parent();
  const role = user?.role ?? '';
  const isAdmin = role === 'Admin';

  try {
    /** @type {Account[]} */
    let items = [];
    let total = 0;

    if (isAdmin) {
      const data = await getAccounts(token);
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

    const users = items.map((/** @type {Account} */ l) => {
      let seller = 'Unknown seller';
      /** @type {string} */
      let sellerId = '';

      if (typeof l.seller === 'string') {
        sellerId = l.seller;
        seller = names.get(l.seller) ?? l.seller;
      } else if (l.seller) {
        sellerId = String(l.seller._id ?? '');
        seller = l.seller.username ?? names.get(String(l.seller._id)) ?? 'Unknown seller';
      }

      return {
        _id: String(l._id ?? ''),
        name: l.name ?? '(untitled)',
        description: l.description ?? '',
        price: l.price ?? 0,
        status: l.status ?? 'Unknown',
        seller,
        sellerId,
        image: l.image ?? ''
      };
    });

    return {
      users,
      total,
      isAdmin,
      viewerId: user?._id ? String(user._id) : '',
      error: '',
      imageWarning
    };
  } catch (err) {
    return {
      users: [],
      total: 0,
      isAdmin,
      viewerId: user?._id ? String(user._id) : '',
      error: err instanceof Error ? err.message : 'Could not load users.',
      imageWarning
    };
  }
};

export const actions = {
  ban: async ({ request, cookies }) => {
    const token = cookies.get('token');
    if (!token) return fail(401, { message: 'You must be logged in.' });

    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    const name = String(form.get('name') ?? 'that user');

    if (!id) return fail(400, { message: 'Missing user ID.' });

    try {
      const result = await banAccount(token, id);
      if (!result) return fail(404, { message: 'No matching user found.' });
      return { message: `"${name}" was banned.` };
    } catch (err) {
      return fail(400, {
        message: err instanceof Error ? err.message : 'Could not ban that user.'
      });
    }
  },
};
