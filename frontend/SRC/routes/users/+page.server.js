import { redirect } from '@sveltejs/kit';
import { onMount } from 'svelte';
import { getAccounts } from '#lib/Admin.js';
export async function load({ cookies, fetch }) {
    const token = cookies.get('token');
  
    if (!token) {
    throw redirect(303, '/login');
    }

    try {
        const response = await fetch('https://db.msuscb.duckdns.org/api/admin/accounts',
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {

            return {
                users: [],
                error: `Failed to load accounts: ${response.status}`
            };
        }

        const result = await response.json();

        return {

            users: Array.isArray(result) ? result : result.accounts ?? [],
            error: ''
        };

    } catch {
        return {
            users: [],
            error: 'Could not connect to the accounts API.'
        };
    }
}