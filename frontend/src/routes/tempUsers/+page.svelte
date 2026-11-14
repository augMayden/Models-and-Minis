<script>
  let { data, form } = $props();

  /** @type {null | { _id: string, name: string, description: string, price: number, status: string, seller: string, sellerId: string, image?: string }} */
  let selectedListing = $state(null);

  let searchQuery = $state('');

  let filteredListings = $derived(
    data.listings.filter(listing =>
      listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

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
    <div class="listings-grid">
      {#each data.listings as listing (listing._id)}
        <a href={`/listings/${listing._id}`} class="listing-card">
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
    </div>
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

  .status {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    font-size: 0.75rem;
    background: #f1f5f9;
    color: #475569;
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }

  .listing-price {
    font-size: 1.1rem;
    font-weight: 700;
    color: #16a34a;
    margin-top: auto; /* Pushes the price to the bottom of the card */
  }
</style>
