import { fail, redirect } from '@sveltejs/kit';

export const actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        const username = data.get('username');
        const email = data.get('email');
        const password = data.get('password');
        const confirmPassword = data.get('confirm-password');
        const accountTypes = data.getAll('accountTypes');
        
        if (!username || !email || !password || !confirmPassword) {
            return fail(400, { username, email, accountTypes, error: 'All fields are required.' });
        }

        if (password !== confirmPassword) {
            return fail(400, { username, email, accountTypes, error: 'Passwords do not match.' });
        }

        if (accountTypes.length === 0) {
            return fail(400, { username, email, accountTypes, error: 'Please select at least one account type.' });
        }

        const payload = {
            username: username,
            email,
            password,
            roles: accountTypes
        };

        console.log('Sending registration payload:', JSON.stringify(payload, null, 2));

        try {
            const response = await fetch('https://db.msuscb.duckdns.org/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                return fail(400, { 
                username, 
                email, 
                accountTypes, 
                error: result.message || result.error || 'Registration failed.' 
                });
            }

        } catch (err) {
            console.error('Registration connection error:', err);
            return fail(500, { 
                username,
                email, 
                accountTypes, 
                error: 'oopsies, something went wrong!'
            });
        }

        // Perform registration logic here (e.g., save to database)
        throw redirect(303, '/');
    }
};