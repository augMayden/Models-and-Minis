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

  const { user } = await parent();
  const isAdmin = user?.role === 'Admin';

  try {
    const data = await getAccounts(token);
    const accounts = Array.isArray(data) ? data : (data?.accounts ?? []);

    const users = accounts.map((/** @type {Account} */ u) => ({
      _id: String(u._id ?? ''),
      username: u.username ?? '(no username)',
      email: u.email ?? '',
      role: u.role ?? 'Unknown',
      accountType: u.accountType ?? 'Unknown'
    }));

    return { users, error: '', isAdmin };
  } catch (err) {
    return {
      users: [],
      error: err instanceof Error ? err.message : 'Could not load user accounts.',
      isAdmin
    };
  }
};

/**
 * @param {'approve'|'deny'|'ban'} kind
 * @param {Request} request
 * @param {import('@sveltejs/kit').Cookies} cookies
 */
async function handle(kind, request, cookies) {
  const token = cookies.get('token');

  if (!token) {
    return fail(401, { message: 'You must be logged in.' });
  }

  const form = await request.formData();
  const id = String(form.get('id') ?? '');
  const username = String(form.get('username') ?? 'that account');

  if (!id) {
    return fail(400, { message: 'Missing account ID.' });
  }

  try {
    if (kind === 'approve') {
      await approveAccount(token, id);
    } else if (kind === 'deny') {
      await denyAccount(token, id);
    } else {
      await banAccount(token, id);
    }

    const verb = kind === 'approve' ? 'approved' : kind === 'deny' ? 'denied' : 'banned';
    return { message: `${username} was ${verb}.` };
  } catch (err) {
    return fail(400, {
      message: err instanceof Error ? err.message : `Could not ${kind} that account.`
    });
  }
}

export const actions = {
  approve: ({ request, cookies }) => handle('approve', request, cookies),
  deny: ({ request, cookies }) => handle('deny', request, cookies),
  ban: ({ request, cookies }) => handle('ban', request, cookies)
};
