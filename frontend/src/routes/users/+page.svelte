<script>
  /** @type {{ data: { users: Array<{ _id: string, username: string, email: string, role: string, accountType: string }>, error: string, isAdmin: boolean }, form: { message?: string } | null }} */
  let { data, form } = $props();

  /** @type {null | { _id: string, username: string, email: string, role: string, accountType: string }} */
  let selectedUser = $state(null);
</script>

<svelte:head>
  <title>Users</title>
  <meta name="description" content="Browse and manage user accounts" />
</svelte:head>

<header>
  <h1>Users</h1>
  <p>Welcome to the users page!</p>
</header>

<main>
  <h2>All users</h2>
  <p>Select a name to view that person's account.</p>

  {#if form?.message}
    <p class="notice">{form.message}</p>
  {/if}

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
          <span class="status">{user.accountType}</span>
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

      {#if data.isAdmin}
        <div class="actions">
          {#if selectedUser.accountType === 'Pending'}
            <form method="POST" action="?/approve">
              <input type="hidden" name="id" value={selectedUser._id} />
              <input type="hidden" name="username" value={selectedUser.username} />
              <button type="submit">Approve</button>
            </form>
            <form method="POST" action="?/deny">
              <input type="hidden" name="id" value={selectedUser._id} />
              <input type="hidden" name="username" value={selectedUser.username} />
              <button type="submit" class="danger">Deny</button>
            </form>
          {/if}

          {#if selectedUser.accountType !== 'Banned'}
            <form method="POST" action="?/ban">
              <input type="hidden" name="id" value={selectedUser._id} />
              <input type="hidden" name="username" value={selectedUser.username} />
              <button type="submit" class="danger">Ban</button>
            </form>
          {/if}
        </div>
      {/if}

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
