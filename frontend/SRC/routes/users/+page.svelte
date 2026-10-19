<!-- src/routes/+page.svelte -->
<script lang="ts">
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
    let selectedUser = $state<User | null>(null);
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
    
</script>

<svelte:head>
    <title>Users</title>
    <meta name="description" content="Browse user accounts" />
</svelte:head>

<header>
    <h1>Users</h1>
    <p>{message}</p>
</header>

<main>
    <h2>All users</h2>
    <p>Select a name to view that person’s account.</p>

    {#if loading}
        <p>Loading users...</p>
    {:else if error}
        <p>Error loading accounts: {error}</p>
    {:else if users.length === 0}
        <p>No user accounts found.</p>
    {:else}
        <ul>
            {#each users as user}
                <li>
                    <button onclick={() => selectedUser = user}>
                        {user.name}
                    </button>
                -   {user.email}
                </li>
            {/each}
        </ul>
    {/if}

    {#if selectedUser}
        <section>
            <h2>Account details</h2>

            <p>Name: {selectedUser.name}</p>
            <p>Email: {selectedUser.email}</p>
            <p>Role: {selectedUser.role}</p>
            <p>User ID: {selectedUser.id}</p>

            <button onclick={() => selectedUser = null}>
                Close Details
            </button>
        </section>
    {/if}
</main>

<style>
    header {
        padding: 1.5rem;
        background: #f1f5f9;
        border-radius: 0.5rem;
    }

    h1 {
        margin: 0;
    }

    p {
        color: #475569;
    }
</style>
