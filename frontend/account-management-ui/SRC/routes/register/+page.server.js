import { fail, redirect } from '@sveltejs/kit';

export const actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        const username = data.get('username');
        const email = data.get('email');
        const password = data.get('password');
        const confirmPassword = data.get('confirm-password');
        const accountTypes = data.getAll('accountType');
        
        if (accountTypes.length === 0) {
        return fail(400, { username, email, accountTypes, error: 'Please select at least one account type.' });
        }

        if (!username || !email || !password || !confirmPassword) {
            return fail(400, { username, email, incorrect: true, error: 'All fields are required.' });
        }

        if (password !== confirmPassword) {
            return fail(400, {username, email, incorrect: true, error: 'Passwords do not match' });
        }

        // Perform registration logic here (e.g., save to database)
        throw redirect(303, '/');
    }
};