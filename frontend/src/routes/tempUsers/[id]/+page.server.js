import { error, fail, redirect } from '@sveltejs/kit';
import { approveAccount, denyAccount, banAccount } from '#lib/Admin.js';

export const load = async ({ params, cookies, parent }) => {
  const { id } = params;
  const token = cookies.get('token');
  
  // Read and then clear the flash message cookie for image upload warnings
  const flash = cookies.get('userFlash') || '';
  if (flash) {
    cookies.delete('userFlash', { path: '/users' });
  }

  try {
    const response = await fetch(`https://db.msuscb.duckdns.org/api/users/${id}`);

    if (!response.ok) {
      throw error(response.status, 'User not found');
    }

    const user = await response.json();
    
    const { user: currentUser } = await parent();
    const role = currentUser?.role ?? '';
    const isAdmin = role === 'Admin';
    const isBuyer = role === 'Buyer';
    const isSeller = role === 'Seller';
    
    return {
      user,
      flash,
      isAdmin,
      isBuyer,
      isSeller,
      token
    };

  } catch (err) {
    if (err.status) throw err;
    throw error(500, 'Failed to load user details.');
  }
};

export const actions = {

  ban: async ({ request, cookies }) => {
    const token = cookies.get('token');
    if(!token) return fail(401, {error: 'You must be logged in to ban user'})
    
    const data = await request.formData();
    const userId = data.get('userId');

    try {

      const response = await fetch(`https://db.msuscb.duckdns.org/api/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // 2. Pass the soft-delete payload so the API knows to change the status
        body: JSON.stringify({ status: 'banned' })
      });

      if (!response.ok) {
        // Tip: parsing response text/json here could help you see the exact database error
        return fail(400, {error: 'Failed to ban user.'})
      }
    } catch {
      return fail(500);
    }
    
    throw redirect(303, '/users');
  }

  
};