<script>
  /** @type {{ data: { listings: Array<{ _id: string, name: string, description: string, price: number, status: string, seller: string }>, total: number, isAdmin: boolean, isBuyer: boolean, error: string }, form: { message?: string } | null }} */
  let { data, form } = $props();

  /** @type {null | { _id: string, name: string, description: string, price: number, status: string, seller: string }} */
  let selectedListing = $state(null);

  /** @param {number} n */
  const money = (n) => `$${Number(n ?? 0).toFixed(2)}`;
</script>

<svelte:head>
  <title>Listings</title>
  <meta name="description" content="Browse listings" />
</svelte:head>

<header>
  <h1>Listings</h1>
  <p>Welcome to the listings page!</p>
</header>

<main>
  <h2>All listings</h2>
  <p>Select a listing to view its details.</p>

  {#if form?.message}
    <p class="notice">{form.message}</p>
  {/if}

  {#if data.error}
    <p class="error">Error loading listings: {data.error}</p>
  {:else if data.listings.length === 0}
    <p>No listings found.</p>
  {:else}
    <ul>
      {#each data.listings as listing (listing._id)}
        <li>
          <button onclick={() => (selectedListing = listing)}>
            {listing.name}
          </button>
          — {money(listing.price)}
          {#if data.isAdmin}
            <span class="status">{listing.status}</span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  {#if selectedListing}
    <section>
      <h2>Listing details</h2>

      <p>Name: {selectedListing.name}</p>
      <p>Description: {selectedListing.description}</p>
      <p>Price: {money(selectedListing.price)}</p>
      {#if data.isAdmin}
        <p>Status: {selectedListing.status}</p>
      {/if}
      <p>Seller: {selectedListing.seller}</p>
      <p>Listing ID: {selectedListing._id}</p>

      <div class="actions">
        {#if data.isBuyer && selectedListing.status === 'Active'}
          <form method="POST" action="?/addToCart">
            <input type="hidden" name="listingId" value={selectedListing._id} />
            <input type="hidden" name="name" value={selectedListing.name} />
            <button type="submit">Add to Cart</button>
          </form>
        {/if}

        {#if data.isAdmin && selectedListing.status !== 'Removed'}
          <form method="POST" action="?/remove">
            <input type="hidden" name="id" value={selectedListing._id} />
            <input type="hidden" name="name" value={selectedListing.name} />
            <button type="submit" class="danger">Remove Listing</button>
          </form>
        {/if}
      </div>

      <button onclick={() => (selectedListing = null)}>Close Details</button>
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

  .error {
    color: #b91c1c;
  }

  .notice {
    color: #166534;
  }

  .status {
    margin-left: 0.5rem;
    font-size: 0.85rem;
    color: #64748b;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    padding: 0.25rem 0;
  }

  section {
    margin-top: 1.5rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .actions form {
    margin: 0;
  }

  .danger {
    color: #b91c1c;
  }
</style>
