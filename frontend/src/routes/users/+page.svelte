<script>
  /** @type {{ data: { users: Array<{ _id: string, username: string, email: string, role: string, accountType: string }>, error: string } }} */
  let { data } = $props();

  /** @type {null | { _id: string, username: string, email: string, role: string, accountType: string }} */
  let selectedUser = $state(null);
</script>

<svelte:head>
  <title>Users</title>
  <meta name="description" content="Browse user accounts" />
</svelte:head>

<header>
  <h1>Users</h1>
  <p>Welcome to the users page!</p>
</header>

<main>
  <h2>All users</h2>
  <p>Select a name to view that person's account.</p>

  {#if data.error}
    <p class="error">Error loading accounts: {data.error}</p>
  {:else if data.users.length === 0}
    <p>No user accounts found.</p>
  {:else}
    <ul>
      {#each data.users as user (user._id)}
        <li>
          <button onclick={() => (selectedUser = user)}>
            {user.username}
          </button>
          — {user.email}
        </li>
      {/each}
    </ul>
  {/if}

  {#if selectedUser}
    <section>
      <h2>Account details</h2>

      <p>Name: {selectedUser.username}</p>
      <p>Email: {selectedUser.email}</p>
      <p>Role: {selectedUser.role}</p>
      <p>Account status: {selectedUser.accountType}</p>
      <p>User ID: {selectedUser._id}</p>

      <button onclick={() => (selectedUser = null)}>Close Details</button>
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
