<!-- src/routes/+page.svelte -->
 <script lang="ts">
    type User = {
        id: number;
        name: string;
        email: string;
        role: string;
    };

    type PageData = {
        users: User[];
        error: string;
    };

    let { data }: { data: PageData } = $props();

    let message = 'Welcome to the users page!';
    let users = $derived(data.users);
    let selectedUser: User | null = $state(null);
    let loading = $state(true);
    let error = $derived(data.error);
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
