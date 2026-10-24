import { redirect } from '@sveltejs/kit';

export const load = async ({ cookies }) => {
  const token = cookies.get('token');
  
  if (!token) {
    throw redirect(303, '/login');
  }

  try {
    // Call your teammate's backend API with the auth token
    const response = await fetch('https://db.msuscb.duckdns.org/api/cart', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Backend Response Status:', response.status);

    if (response.ok) {
      const cartDoc = await response.json();

      const items = cartDoc.items || [];

      return { cart: items }; // Passes data.cart to the page
    }
  } catch (err) {
    console.error('Failed to fetch cart:', err);
  }

  return { cart: []};
};