import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ cookies }) => {
  const token = cookies.get('token');
  if (!token) {
    throw redirect(303, '/login');
  }
  return {};
};

export const actions = {
  default: async ({ request, cookies }) => {
    const token = cookies.get('token');

    if (!token) {
      return fail(401, { error: 'You must be logged in to create a listing.' });
    }

    const data = await request.formData();
    const title = data.get('title');
    const description = data.get('description');
    const price = data.get('price');
    const category = data.get('category');

    if (!title || !description || !price) {
      return fail(400, { title, description, price, category, error: 'Title, description, and price are required.' });
    }

    try {
      const response = await fetch('https://db.msuscb.duckdns.org/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Pass the JWT cookie to authorize the seller
        },
        body: JSON.stringify({
          name: title,
          description,
          price: Number(price),
          category
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return fail(400, {
          title,
          description,
          price,
          category,
          error: result.message || result.error || 'Failed to create listing.'
        });
      }

      const listingID = result._id || result.id;

      if(!listingID) {
        return fail(500, {error: 'Listing created, but no ID was returned.' });
      }
      
    } catch (err) {

      console.error('Listing creation error:', err);
      return fail(500, {
        title,
        description,
        price,
        category,
        error: 'Unable to connect to the server.'
      });
    }

    throw redirect(303, `/seller/listings/${listingID}`);
  }
};