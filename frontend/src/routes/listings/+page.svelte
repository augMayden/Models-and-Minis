<script>
  /** @type {{ data: { listings: Array<{ _id: string, username: string, description: string, itemName: string, price: string }>, error: string } }} */
  let { data } = $props();

  /** @type {null | { _id: string, username: string, description: string, itemName: string, price: string }} */
  let selectedListing = $state(null);
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

  {#if data.error}
    <p class="error">Error loading listings: {data.error}</p>
  {:else if data.listings.length === 0}
    <p>No listings found.</p>
  {:else}
    <ul>
      {#each data.listings as listing (listing._id)}
        <li>
          <button onclick={() => (selectedListing = listing)}>
            {listing.username}
          </button>
          — {listing.itemName}
        </li>
      {/each}
    </ul>
  {/if}

  {#if selectedListing}
    <section>
      <h2>Listing details</h2>

      <p>Name: {selectedListing.username}</p>
      <p>Description: {selectedListing.description}</p>
      <p>Item Name: {selectedListing.itemName}</p>
      <p>Price: {selectedListing.price}</p>
      <p>Listings ID: {selectedListing._id}</p>

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
</style>
