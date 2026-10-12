import { fail, redirect } from '@sveltejs/kit'

export const actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        const email = data.get('email');
        const password = data.get('password');

        if (!email || !password) {
            return fail(400, { email, incorrect: true });
        }

        // Replace this with your actual authentication logic
        if (email === 'test@example.com' && password === 'password') {
            throw redirect(303, '/');
        }

        return fail(400, { email, incorrect: true });
    }
};