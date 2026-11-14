<script>
  let { data, form } = $props();

  /** @type {null | { _id: string, name: string, email: string, status: string}} */
  let selecteduser = $state(null);

  let searchQuery = $state('');

  let filteredUsers = $derived(
    data.users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  /** @param {number} n */
  const money = (n) => `$${Number(n ?? 0).toFixed(2)}`;
</script>

<svelte:head>
  <title>Users</title>
  <meta name="description" content="Browse Users" />
</svelte:head>

<header>
  <h1>Users</h1>
  <p>Welcome to the users page!</p>
</header>

<main>
  <h2>All Users</h2>
  <p>Select a user to view their details.</p>

  <input 
    type="text"
    placeholder="Search users..."
    bind:value={searchQuery}
  />
  

  {#if form?.message}
    <p class="notice">{form.message}</p>
  {/if}
  {#if data.imageWarning}
    <p class="error">{data.imageWarning}</p>
  {/if}
  {#if data.error}
    <p class="error">Error loading accounts: {data.error}</p>
  {:else if data.users.length === 0}
    <p>No users found.</p>
  {:else}
    <div class="users-grid">
      {#each data.users as user (user._id)}
        <a href={`/users/${user._id}`} class="users-card">
          {#if user.image}
            <div class="image-container">
              <img
                src={user.image}
                alt={user.name}
                class="users-image"
              />
            </div>
          {:else}
            <div class="image-container placeholder">
              <span>No image</span>
            </div>
          {/if}

          <div class="card-content">
            <div>
              <h3 class="users-name">{user.name}</h3>
              <p class="users-seller">Email: {user.email || 'Unknown'}</p>
              {#if data.isAdmin && user.status}
                <span class="status">{user.status}</span>
              {/if}
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
  .users-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  /* Individual Card Styling */
  .users-card {
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

  .users-card:hover {
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

  .users-image {
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

  .users-name {
    margin: 0 0 0.25rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #0f172a;
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

</style>
