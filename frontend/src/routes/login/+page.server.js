import { fail, redirect } from '@sveltejs/kit'

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get('email');
        const password = data.get('password');


        if (!email || !password) {
            return fail(400, { email, error: 'Email and password are required' });
        }

        try {
            const response = await fetch('https://db.msuscb.duckdns.org/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    identifier: email,
                    password
                })
            });

            const result = await response.json();

            if(!response.ok) {
                return fail(400, {
                    email,
                    error: result.error || 'Invalid email or password'
                 });
            }

            cookies.set('token', result.token, {
                path: '/',
                httpOnly: true,
                secure: import.meta.env.PROD,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24
            });

        } catch (error) {
            console.error('Backend connecntion error:', error);
            return fail(500, {
                email,
                error: "oopsies, something went wrong!"});
        }

        throw redirect(303, '/');
    }
};