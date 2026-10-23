<script lang="ts">
    type listing = {
        item_id: number;
        name: string;
        description: string;
        price: number;
    };

    type PageData = {
        listings: listing[];
        error: string;
    };

    let { data }: { data: PageData } = $props();

    let message = 'Welcome to the listings page!';
    let listings = $derived(data.listings);
    let selectedListing: listing | null = $state(null);
    let loading = $state(true);
    let error = $derived(data.error);
</script>

<svelte:head>
    <title>Listings</title>
    <meta name="description" content="Browse listings" />
</svelte:head>

<header>
    <h1>Listings</h1>
    <p>{message}</p>
</header>

<main>
    <h2>All listings</h2>
    <p>Select a listing to view its details.</p>

    {#if loading}
        <p>Loading listings...</p>
    {:else if error}
        <p>Error loading listings: {error}</p>
    {:else if listings.length === 0}
        <p>No listings found.</p>
    {:else}
        <ul>
            {#each listings as listing}
                <li>
                    <button onclick={() => selectedListing = listing}>
                        {listing.name}
                    </button>
                -   {listing.description}
                </li>
            {/each}
        </ul>
    {/if}

    {#if selectedListing}
        <section>
            <h2>Account details</h2>

            <p>Name: {selectedListing.name}</p>
            <p>Description: {selectedListing.description}</p>
            <p>Price: ${selectedListing.price.toFixed(2)}</p>
            <p>Item ID: {selectedListing.item_id}</p>

            <button onclick={() => selectedListing = null}>
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
