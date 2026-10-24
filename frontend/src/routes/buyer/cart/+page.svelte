<script>
  /** @type {{ data: { items: Array<{ _id: string, name: string, price: number, quantity: number }>, total: number, isBuyer: boolean, error: string }, form: { message?: string } | null }} */
  let { data, form } = $props();

  /** @param {number} n */
  const money = (n) => `$${Number(n ?? 0).toFixed(2)}`;
</script>

<svelte:head>
  <title>Cart</title>
  <meta name="description" content="Your shopping cart" />
</svelte:head>

<header>
  <h1>Your Cart</h1>
</header>

<main>
  {#if form?.message}
    <p class="notice">{form.message}</p>
  {/if}

  {#if !data.isBuyer}
    <p>Only buyer accounts have a cart. <a href="/listings">Browse listings</a></p>
  {:else if data.error}
    <p class="error">Error loading your cart: {data.error}</p>
  {:else if data.items.length === 0}
    <p>Your cart is empty. <a href="/listings">Browse listings</a></p>
  {:else}
    <ul>
      {#each data.items as item (item._id)}
        <li>
          <span class="name">{item.name}</span>
          <span class="qty">× {item.quantity}</span>
          <span class="price">{money(item.price)}</span>
          <span class="line">{money(item.price * item.quantity)}</span>

          <form method="POST" action="?/remove">
            <input type="hidden" name="cartItemId" value={item._id} />
            <button type="submit" class="danger">Remove</button>
          </form>
        </li>
      {/each}
    </ul>

    <p class="total">Total: <strong>{money(data.total)}</strong></p>
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

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e2e8f0;
  }

  .name {
    flex: 1;
    font-weight: 600;
  }

  .qty {
    color: #64748b;
  }

  .line {
    min-width: 6rem;
    text-align: right;
  }

  li form {
    margin: 0;
  }

  .danger {
    color: #b91c1c;
  }

  .total {
    margin-top: 1rem;
    font-size: 1.1rem;
  }
</style>
