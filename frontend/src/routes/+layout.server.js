// @ts-nocheck
import { redirect } from '@sveltejs/kit';

export const load = async ({ cookies, fetch, url }) => {
  const token = cookies.get('token');

  if (!token) {
    return { user: null };
  }

  try {
    const response = await fetch('https://db.msuscb.duckdns.org/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const user = await response.json();

      console.log('Fetched current user:', user);

      // Check if the user is pending approval
      const isPending = 
        user.status?.toLowerCase() === 'pending' || 
        user.accountType?.toLowerCase() === 'pending';

      if (isPending) {
        // Define paths pending users are allowed to visit
        const allowedPaths = ['/', '/account', '/logout'];
        const isAllowed = allowedPaths.some(path => url.pathname.startsWith(path));

        // If they try to access anything else, lock them to their account page
        if (!isAllowed) {
          throw redirect(303, '/account');
        }
      }

      return { user };
    }
  } catch (err) {
    // If it's a SvelteKit redirect (status 300-308 or has a location), rethrow it!
    if (err && (err.status >= 300 && err.status < 400 || err.location)) {
      throw err;
    }

    console.error('Failed to fetch current user session:', err);
  }

  return { user: null };
};