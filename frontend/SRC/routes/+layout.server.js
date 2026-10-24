export const load = async ({ cookies, fetch }) => {
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
      return { user };
    }
  } catch (err) {
    console.error('Failed to fetch current user session:', err);
  }

  return { user: null };
};