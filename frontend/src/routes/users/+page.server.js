import { redirect } from '@sveltejs/kit';
import { getAccounts } from '#lib/Admin.js';

/**
 * @typedef {Object} Account
 * @property {string} [_id]
 * @property {string} [id]
 * @property {string} [username]
 * @property {string} [name]
 * @property {string} [email]
 * @property {string} [role]
 * @property {string} [accountType]
 */

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ cookies }) => {
  const token = cookies.get('token');

  if (!token) {
    throw redirect(303, '/login');
  }

  try {
    const data = await getAccounts(token);

    const accounts = Array.isArray(data) ? data : (data?.accounts ?? []);

    const users = accounts.map((/** @type {Account} */ u) => ({
      _id: String(u._id ?? u.id ?? ''),
      username: u.username ?? u.name ?? '(no username)',
      email: u.email ?? '',
      role: u.role ?? 'Unknown',
      accountType: u.accountType ?? 'Unknown'
    }));

    return { users, error: '' };
  } catch (err) {
    console.error('Error fetching users:', err);

    return {
      users: [],
      error: err instanceof Error ? err.message : 'Could not load user accounts.'
    };
  }
};
