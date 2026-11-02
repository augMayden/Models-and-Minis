<!-- src/routes/listings/[id]/+page.svelte -->
<script>
  let { data, form } = $props();
  const { listing, flash, isAdmin, isBuyer, isSeller } = data;

  /** @param {number} n*/
  const money = (n) => `$${Number(n ?? 0).toFixed(2)}`
</script>

<svelte:head>
  <title>{listing.name || listing.title} | Listings</title>
</svelte:head>

<main class="container mx-auto p-6 max-w-2xl">
  <!-- Show image warning flash message if present -->
  {#if flash}
    <div class="bg-amber-100 border border-amber-400 text-amber-700 px-4 py-3 rounded mb-4" role="alert">
      <span>{flash}</span>
    </div>
  {/if}

  {#if form?.message}
    <div class="notice">{form.message}</div>
  {/if}

  {#if form?.error}
    <div class="error">{form.error}</div>
  {/if}

  <section class="details-card">
    <h1>{listing.name || listing.title}</h1>
    
    {#if listing.image}
      <img
        src={listing.image}
        alt={listing.name || listing.title}
        class="listing-image"
      />
    {/if}

    <p class="price">Price: {money(listing.price)}</p>
    
    {#if listing.category}
      <span class="category-badge">{listing.category}</span>
    {/if}

    <p class="description">Description: {listing.description}</p>
    
    {#if isAdmin}
      <p>Status: {listing.status}</p>
    {/if}
    
    <p>Seller: {listing.seller.username}</p>
    <p class="id-text">Listing ID: {listing._id}</p>

    <div class="actions">
      {#if isBuyer && listing.status === 'Active'}
        <form method="POST" action="?/addToCart">
          <input type="hidden" name="listingId" value={listing._id} />
          <button type="submit">Add to Cart</button>
        </form>
      {/if}

      {#if isAdmin && listing.status !== 'Removed'}
        <form method="POST" action="?/remove">
          <input type="hidden" name="id" value={listing._id} />
          <button type="submit" class="danger">Remove Listing</button>
        </form>
      {/if}
    </div>

    <p class="back-link">
      <a href="/listings">&larr; Back to all listings</a>
    </p>
  </section>
</main>

<style>
  .details-card {
    margin-top: 1.5rem;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    background: #fff;
  }

  h1 {
    margin-top: 0;
    font-size: 2rem;
  }

  .price {
    font-size: 1.25rem;
    font-weight: 600;
    color: #16a34a;
  }

  .listing-image {
    max-width: 100%;
    max-height: 300px;
    border-radius: 8px;
    margin: 1rem 0;
    object-fit: cover;
  }

  .category-badge {
    display: inline-block;
    background: #f1f5f9;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    color: #475569;
    margin-bottom: 1rem;
  }

  .description {
    white-space: pre-line;
    color: #334155;
    margin-bottom: 1rem;
  }

  .id-text {
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    margin: 1.5rem 0;
  }

  .actions form {
    margin: 0;
  }

  .danger {
    background-color: #fee2e2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .notice {
    color: #166534;
    background: #f0fdf4;
    padding: 0.75rem;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
  }

  .error {
    color: #b91c1c;
    background: #fef2f2;
    padding: 0.75rem;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
  }

  .back-link {
    margin-top: 2rem;
  }
</style>