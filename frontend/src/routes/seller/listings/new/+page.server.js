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
    const image = data.get('image'); // File or null

    if (!title || !description || !price) {
      return fail(400, { title, description, price, category, error: 'Title, description, and price are required.' });
    }

    let listingID;
    let imageWarning = '';

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

      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch {
        result = { message: 'Invalid response from server' };
      }

      if (!response.ok) {
        return fail(400, {
          title,
          description,
          price,
          category,
          error: result.message || result.error || 'Failed to create listing.'
        });
      }

      listingID = result._id || result.id;

      if(!listingID) {
        return fail(500, {error: 'Listing created, but no ID was returned.' });
      }

      // Forward the photo (if any) to the image-upload endpoint.
      // Non-fatal: the listing already exists, so failing hard here would make
      // the user resubmit and create a duplicate. Report and redirect instead.
      if (image && typeof image === 'object' && image.size > 0) {
        const imgForm = new FormData();
        imgForm.append('image', image, image.name);
        const imgRes = await fetch(`https://db.msuscb.duckdns.org/api/listings/${listingID}/image`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: imgForm
        });
        if (!imgRes.ok) {
          const imgErr = await imgRes.json().catch(() => ({}));
          imageWarning = `Listing published, but the photo upload failed${imgErr.error ? `: ${imgErr.error}` : '.'}`;
        }
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

    cookies.set('listingFlash', imageWarning, { path: '/listings', maxAge: 10 });
    throw redirect(303, `/listings`);
  }
};