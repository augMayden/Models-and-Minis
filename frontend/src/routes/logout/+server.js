import { redirect } from '@sveltejs/kit';

export const POST = async ({ cookies }) => {
  // Clear the auth cookie (must match the path it was set with)
  cookies.delete('token', { path: '/' });

  // Redirect the user back to the home page
  throw redirect(303, '/');
};