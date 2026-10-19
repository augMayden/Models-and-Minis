import { redirect } from '@sveltejs/kit';
import { onMount } from 'svelte';
import { getAccounts } from '#lib/Admin.js';
export const load = async ({ cookies }) => {
    const token = cookies.get('token');
  
    if (!token) {
    throw redirect(303, '/login');
    }
    return {};
    };

type User = {
    id: number;
    name: string;
    email: string;
    role: string;
};

let message = 'Welcome to the users page!';
let users = $state<User[]>([]);
let selectedUser = $state<User || null>(null);
let loading = $state(true);
let error = $state('');

onMount(async () => {
    try {
        const token = '';

        const data = await getAccounts(token);
        console.log('Accounts returned by API:', data);

        users = Array.isArray(data)
        ? data
        : data.accounts ?? [];
    } catch (err) {
        console.error('Error fetching users:', err);       
        error = err instanceof Error ? err.message : 'Could not load user accounts.';
    } finally {
        loading = false;
    }
    });
export const load = async ({ cookies, fetch }) => {

    const token = cookies.get('token');

    if (!token) {
        return {
            users: [],
            error: 'Please log in before viewing user accounts.'
        };
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

    } catch (err) {
        return {
            users: [],
            error: 'Could not connect to the accounts API.'
        };
    }
}