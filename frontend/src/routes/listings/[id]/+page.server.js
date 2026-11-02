import { error, fail, redirect } from '@sveltejs/kit';

export const load = async ({ params, cookies, parent }) => {
  const { id } = params;
  const token = cookies.get('token');
  
  // Read and then clear the flash message cookie for image upload warnings
  const flash = cookies.get('listingFlash') || '';
  if (flash) {
    cookies.delete('listingFlash', { path: '/listings' });
  }

  try {
    const response = await fetch(`https://db.msuscb.duckdns.org/api/listings/${id}`);

    if (!response.ok) {
      throw error(response.status, 'Listing not found');
    }

    const listing = await response.json();
    
    const { user } = await parent();
    const role = user?.role ?? '';
    const isAdmin = role === 'Admin';
    const isBuyer = role === 'Buyer';
    const isSeller = role === 'Seller';

    console.log(isAdmin, isBuyer, isSeller);

    return {
      listing,
      flash,
      isAdmin,
      isBuyer,
      isSeller,
      token
    };

  } catch (err) {
    if (err.status) throw err;
    throw error(500, 'Failed to load listing details.');
  }
};

export const actions = {
  addToCart: async ({ request, cookies }) => {
    const token = cookies.get('token');
    if(!token) return fail(401, {error: 'You must be logged in to add to cart'})
    
    const data = await request.formData();
    const listingId = data.get('listingId');

    await fetch(`https://db.msuscb.duckdns.org/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ listingId })
    });
    return { message: 'Listing added to cart successfully!' };
  },

  remove: async ({ request, cookies }) => {
    const token = cookies.get('token');
    if(!token) return fail(401, {error: 'You must be logged in to remove from cart'})
    
    const data = await request.formData();
    const listingId = data.get('listingId');

    try {
      const response = await fetch(`https://db.msuscb.duckdns.org/api/cart`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return fail(400, {error: 'Failed to remove listing.'})
      }
    } catch {
      return fail(500);
    }
    
    throw redirect(303, '/listings');
  }

  
};