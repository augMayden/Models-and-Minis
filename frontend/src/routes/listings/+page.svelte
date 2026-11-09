<script>
  let { data, form } = $props();

<<<<<<< HEAD
  /** @type {null | { _id: string, name: string, description: string, price: number, status: string, seller: string, sellerId: string, image?: string }} */
  let selectedListing = $state(null);

  let searchQuery = $state('');

  let filteredListings = $derived(
    data.listings.filter(listing =>
      listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

=======
>>>>>>> merge-conflicts
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

  <input 
    type="text"
    placeholder="Search listings..."
    bind:value={searchQuery}
  />
  

  {#if form?.message}
    <p class="notice">{form.message}</p>
  {/if}
  {#if data.imageWarning}
    <p class="error">{data.imageWarning}</p>
  {/if}
  {#if data.error}
    <p class="error">Error loading listings: {data.error}</p>
  {:else if data.listings.length === 0}
    <p>No listings found.</p>
  {:else}
<<<<<<< HEAD
    <ul>
      {#each filteredListings as listing (listing._id)}
        <li>
=======
    <div class="listings-grid">
      {#each data.listings as listing (listing._id)}
        <a href={`/listings/${listing._id}`} class="listing-card">
>>>>>>> merge-conflicts
          {#if listing.image}
            <div class="image-container">
              <img
                src={listing.image}
                alt={listing.name}
                class="listing-image"
              />
            </div>
          {:else}
            <div class="image-container placeholder">
              <span>No image</span>
            </div>
          {/if}

          <div class="card-content">
            <div>
              <h3 class="listing-name">{listing.name}</h3>
              <p class="listing-seller">Seller: {listing.seller || 'Unknown'}</p>
              {#if data.isAdmin && listing.status}
                <span class="status">{listing.status}</span>
              {/if}
            </div>
            
            <div class="listing-price">
              {money(listing.price)}
            </div>
          </div>
        </a>
      {/each}
<<<<<<< HEAD
    </ul>
  {/if}

  {#if selectedListing}
    <section>
      <h2>Listing details</h2>

      <p>Name: {selectedListing.name}</p>
      {#if selectedListing.image}
        <img
          src={selectedListing.image}
          alt={selectedListing.name}
          style="max-width: 240px; max-height: 240px; border-radius: 8px; margin: 0.5rem 0;"
        />
      {/if}
      <p>Description: {selectedListing.description}</p>
      <p>Price: {money(selectedListing.price)}</p>
      {#if data.isAdmin}
        <p>Status: {selectedListing.status}</p>
      {/if}
      <p>Seller: {selectedListing.seller}</p>
      <p>Listing ID: {selectedListing._id}</p>

      <div class="actions">
        {#if data.isBuyer && selectedListing.status === 'Active' && selectedListing.sellerId === data.viewerId}
          <p class="own-note">This is your own listing — it can't be added to your cart.</p>
        {:else if data.isBuyer && selectedListing.status === 'Active'}
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
=======
    </div>
>>>>>>> merge-conflicts
  {/if}
</main>

<style>
  header {
    padding: 1.5rem;
    background: #f1f5f9;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
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

  /* Grid Layout for Boxes */
  .listings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  /* Individual Card Styling */
  .listing-card {
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .listing-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .image-container {
    width: 100%;
    height: 160px;
    background: #f8fafc;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .image-container.placeholder {
    color: #94a3b8;
    font-size: 0.875rem;
  }

  .listing-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex-grow: 1;
  }

  .listing-name {
    margin: 0 0 0.25rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #0f172a;
  }

  .listing-seller {
    margin: 0 0 0.75rem 0;
    font-size: 0.85rem;
    color: #64748b;
  }

<<<<<<< HEAD
  .own-note {
    color: #64748b;
    font-style: italic;
    margin: 0;
  }

  ul {
    list-style: none;
    padding: 0;
=======
  .status {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    font-size: 0.75rem;
    background: #f1f5f9;
    color: #475569;
    border-radius: 4px;
    margin-bottom: 0.5rem;
>>>>>>> merge-conflicts
  }

  .listing-price {
    font-size: 1.1rem;
    font-weight: 700;
    color: #16a34a;
    margin-top: auto; /* Pushes the price to the bottom of the card */
  }
<<<<<<< HEAD

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

  input[type="text"] {
    width: 100%;
    max-width: 400px;
    padding: 0.5rem;
    margin: 0.75rem 0 1rem;
    border: 1px solid #415a7f;
    border-radius: 0.375rem;
    background: #f1f5f9;
    color: #475569;
  }
</style>
=======
</style>
>>>>>>> merge-conflicts
